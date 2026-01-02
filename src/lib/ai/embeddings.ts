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
  return process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
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
export async function generateEmbedding(text: string): Promise<number[]> {
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
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY not configured for embeddings');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

  try {
    const result = await model.embedContent(text);
    const embedding = result.embedding.values;
    
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
    const batchResult = await model.batchEmbedContents({
      requests: missTexts.map((text) => ({ content: { role: 'user', parts: [{ text }] } })),
    });
    
    const newEmbeddings = batchResult.embeddings.map((e) => e.values);
    
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

/**
 * Calculates the cosine similarity between two vectors.
 * Returns a value between -1 and 1, where 1 is identical.
 * 
 * @param vecA - First vector.
 * @param vecB - Second vector.
 * @returns Cosine similarity score.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }

  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);

  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dotProduct / (magA * magB);
}

