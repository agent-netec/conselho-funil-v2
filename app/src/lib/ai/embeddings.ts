import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  doc, 
  getDoc, 
  setDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Get Gemini API Key - reads from environment variable at runtime
 */
function getGeminiApiKey(): string | undefined {
  // Acesso direto para garantir que o Next.js/Turbopack faça a injeção no cliente
  const public_key = (process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY ?? '').trim();
  const private_key = (process.env.GOOGLE_AI_API_KEY ?? '').trim();
  
  const key = public_key || private_key;
  
  if (!key && typeof window !== 'undefined') {
    console.error('❌ [Embeddings] NEXT_PUBLIC_GOOGLE_AI_API_KEY não encontrada no bundle do navegador. Verifique se o servidor foi reiniciado após editar o .env.local.');
  }
  
  return key;
}

/**
 * Simple hashing function for cache keys
 */
async function getCacheKey(text: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(text.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates an embedding for a given text using Gemini's text-embedding-004 model.
 * Includes a Firestore cache to reduce costs and latency.
 * 
 * @param text - The input text to embed.
 * @returns A promise that resolves to an array of numbers (768 dimensions).
 * @throws Error if the API key is missing or the request fails.
 */
/**
 * Calcula similaridade de cosseno entre dois vetores.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0) return 0;
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denominator = Math.sqrt(magA) * Math.sqrt(magB);
  if (denominator === 0) return 0;
  return dot / denominator;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  // Se preferir evitar o SDK (que vem falhando com API_KEY_INVALID), usamos o endpoint direto.
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY not configured for embeddings');
  }

  const startTime = Date.now();
  const cacheKey = await getCacheKey(text);
  
  // 1. Check Cache (Firestore)
  try {
    const cacheRef = doc(db, 'query_cache', cacheKey);
    const cacheSnap = await getDoc(cacheRef);
    
    if (cacheSnap.exists()) {
      const data = cacheSnap.data();
      const ttl = 30 * 24 * 60 * 60 * 1000; // 30 days
      const isExpired = (Timestamp.now().toMillis() - data.createdAt.toMillis()) > ttl;
      
      if (!isExpired) {
        console.log(`[Embeddings] Cache HIT for key: ${cacheKey.substring(0, 8)} (${Date.now() - startTime}ms)`);
        return data.embedding;
      }
    }
  } catch (cacheError) {
    console.warn('[Embeddings] Cache read error:', cacheError);
  }

  // 2. Cache MISS - Call API
  try {
    // RESOLUÇÃO DEFINITIVA (Dandara/Kai): 
    // 1. text-embedding-004 e embedding-001 via SDK (@google/generative-ai) estão retornando API_KEY_INVALID 
    //    mesmo com chaves válidas, possivelmente por depreciação ou conflito de headers do SDK.
    // 2. A chamada direta via fetch para 'gemini-embedding-001' ignorando o SDK funciona 100%.
    // 3. Mantemos o fetch direto como padrão para garantir estabilidade do RAG.
    
    console.log(`[Embeddings] Calling text-embedding-004 with dimensionality: 768`);
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text }] },
        outputDimensionality: 768,
      }),
    });

    if (!response.ok) {
      const errTxt = await response.text();
      throw new Error(`Embedding API failed: ${response.status} ${errTxt}`);
    }

    const result = await response.json();
    const embedding = result?.embedding?.values;
    if (!Array.isArray(embedding)) {
      throw new Error('Embedding API returned no values');
    }
    
    // 3. Save to Cache (Async)
    const cacheRef = doc(db, 'query_cache', cacheKey);
    setDoc(cacheRef, {
      query: text.substring(0, 500), // Store snippet for debugging
      embedding,
      createdAt: Timestamp.now(),
    }).catch(err => console.error('[Embeddings] Cache write error:', err));

    console.log(`[Embeddings] Cache MISS - API called (${Date.now() - startTime}ms)`);
    return embedding;
  } catch (error) {
    console.error('[Embeddings] Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generates embeddings for a batch of texts.
 * Handles partial cache hits to minimize API usage.
 * Includes TTL check (30 days).
 * 
 * @param texts - Array of strings to embed.
 * @returns A promise that resolves to an array of number arrays.
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const startTime = Date.now();
  const results: (number[] | null)[] = new Array(texts.length).fill(null);
  const missIndices: number[] = [];
  const missTexts: string[] = [];
  const ttl = 30 * 24 * 60 * 60 * 1000; // 30 days
  const nowMillis = Timestamp.now().toMillis();

  // 1. Check Cache for each text
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    const cacheKey = await getCacheKey(text);
    
    try {
      const cacheRef = doc(db, 'query_cache', cacheKey);
      const cacheSnap = await getDoc(cacheRef);
      
      if (cacheSnap.exists()) {
        const data = cacheSnap.data();
        const isExpired = (nowMillis - data.createdAt.toMillis()) > ttl;
        
        if (!isExpired) {
          results[i] = data.embedding;
          continue;
        }
      }
    } catch (err) {
      // Ignore cache errors and treat as miss
    }
    
    missIndices.push(i);
    missTexts.push(text);
  }

  if (missTexts.length === 0) {
    console.log(`[Embeddings] Batch Cache HIT (100%) - ${texts.length} items (${Date.now() - startTime}ms)`);
    return results as number[][];
  }

  // 2. Call API for MISSES
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY not configured for embeddings');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

  try {
    console.log(`[Embeddings] Batch Cache MISS - Calling API for ${missTexts.length}/${texts.length} items`);
    
    // Process in chunks of 90 (Google AI API limit is 100, we use 90 to be safe and avoid overhead issues)
    // ST-11.23 Hotfix: Avoid "at most 100 requests" error
    const BATCH_SIZE = 90;
    const newEmbeddings: number[][] = [];
    
    for (let i = 0; i < missTexts.length; i += BATCH_SIZE) {
      const batchTexts = missTexts.slice(i, i + BATCH_SIZE);
      console.log(`[Embeddings] Processing API sub-batch ${i / BATCH_SIZE + 1} (${batchTexts.length} items)`);
      
      // Switching to fetch to avoid SDK inconsistencies (Ref: generateEmbedding)
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          requests: batchTexts.map((text) => ({
            model: 'models/text-embedding-004',
            content: { parts: [{ text }] },
            outputDimensionality: 768
          })),
        }),
      });

      if (!response.ok) {
        const errTxt = await response.text();
        throw new Error(`Batch Embedding API failed: ${response.status} ${errTxt}`);
      }

      const batchResult = await response.json();
      
      if (!batchResult.embeddings || !Array.isArray(batchResult.embeddings)) {
        throw new Error('Batch Embedding API returned invalid format');
      }

      newEmbeddings.push(...batchResult.embeddings.map((e: any) => e.values));
    }
    
    // 3. Save new embeddings to Cache and update results
    for (let i = 0; i < missIndices.length; i++) {
      const originalIdx = missIndices[i];
      const embedding = newEmbeddings[i];
      const text = missTexts[i];
      results[originalIdx] = embedding;
      
      const cacheKey = await getCacheKey(text);
      const cacheRef = doc(db, 'query_cache', cacheKey);
      setDoc(cacheRef, {
        query: text.substring(0, 500),
        embedding,
        createdAt: Timestamp.now(),
      }).catch(err => console.error('[Embeddings] Cache write error:', err));
    }

    console.log(`[Embeddings] Batch completed (${Date.now() - startTime}ms)`);
    return results as number[][];
  } catch (error) {
    console.error('[Embeddings] Error generating batch embeddings:', error);
    throw error;
  }
}

