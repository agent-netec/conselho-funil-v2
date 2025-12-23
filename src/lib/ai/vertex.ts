/**
 * Vertex AI Integration
 * 
 * Configuração para embeddings e geração de texto usando Vertex AI
 */

import { VertexAI, GenerativeModel, Part } from '@google-cloud/vertexai';

// Configuration
const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'conselho-de-funil';
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

let vertexAI: VertexAI | null = null;
let generativeModel: GenerativeModel | null = null;

/**
 * Initialize Vertex AI client
 */
export function getVertexAI(): VertexAI {
  if (!vertexAI) {
    vertexAI = new VertexAI({
      project: projectId,
      location: location,
    });
  }
  return vertexAI;
}

/**
 * Get Gemini model for text generation
 */
export function getGenerativeModel(modelName = 'gemini-2.0-flash-exp'): GenerativeModel {
  if (!generativeModel) {
    const vertex = getVertexAI();
    generativeModel = vertex.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        topP: 0.95,
        topK: 40,
      },
    });
  }
  return generativeModel;
}

/**
 * Generate embeddings using Vertex AI text-embedding-004
 * 
 * Note: text-embedding-004 returns 768-dimensional vectors
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const vertex = getVertexAI();
  
  try {
    // Use the preview endpoint for embeddings
    const embeddingModel = vertex.preview.getGenerativeModel({
      model: 'text-embedding-004',
    });

    const result = await embeddingModel.generateContent({
      contents: [{ role: 'user', parts: [{ text }] }],
    });

    // Extract embedding from response
    const embedding = (result.response as any).candidates?.[0]?.embedding?.values;
    
    if (embedding && Array.isArray(embedding)) {
      return embedding;
    }
    
    // Fallback: use hash-based embeddings for development
    console.warn('Using fallback embeddings - configure Vertex AI for production');
    return generateFallbackEmbedding(text);
  } catch (error) {
    console.error('Error generating embedding:', error);
    // Fallback for development without Vertex AI configured
    return generateFallbackEmbedding(text);
  }
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  
  // Process in batches of 5 to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchEmbeddings = await Promise.all(
      batch.map(text => generateEmbedding(text))
    );
    embeddings.push(...batchEmbeddings);
    
    // Small delay between batches
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return embeddings;
}

/**
 * Fallback embedding generator (for development without Vertex AI)
 * Creates consistent 768-dimensional vectors using hash-based approach
 */
function generateFallbackEmbedding(text: string): number[] {
  const vector = new Array(768).fill(0);
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, '');
  const words = normalized.split(/\s+/).filter(w => w.length > 2);
  
  // Create TF-like weights
  const wordCounts: Record<string, number> = {};
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  // Distribute words across vector dimensions
  Object.entries(wordCounts).forEach(([word, count]) => {
    const hash1 = hashString(word);
    const hash2 = hashString(word + '_secondary');
    const hash3 = hashString(word + '_tertiary');
    
    // Use multiple indices per word for better distribution
    const indices = [
      Math.abs(hash1) % 768,
      Math.abs(hash2) % 768,
      Math.abs(hash3) % 768,
    ];
    
    const weight = Math.log(1 + count) / Math.log(1 + words.length);
    indices.forEach(idx => {
      vector[idx] += weight * (1 + Math.random() * 0.1);
    });
  });
  
  // Add position-based features
  words.slice(0, 10).forEach((word, i) => {
    const idx = Math.abs(hashString(word + '_pos')) % 768;
    vector[idx] += (10 - i) * 0.05;
  });
  
  // Normalize to unit vector
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude > 0) {
    return vector.map(v => v / magnitude);
  }
  
  return vector;
}

/**
 * Simple string hash function
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return hash;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude > 0 ? dotProduct / magnitude : 0;
}

/**
 * Generate streaming response from the Council
 */
export async function* generateCouncilResponseStream(
  query: string,
  context: string,
  systemPrompt?: string
): AsyncGenerator<string> {
  const model = getGenerativeModel();

  const defaultSystemPrompt = `Você é o Conselho de Funil, um sistema de inteligência para criação e avaliação de funis de marketing.

Você tem acesso ao conhecimento de 6 especialistas:
- **Russell Brunson**: Arquitetura de Funil, Value Ladder, sequências
- **Dan Kennedy**: Oferta & Copy, headlines, urgência
- **Frank Kern**: Psicologia & Comportamento, persuasão
- **Sam Ovens**: Aquisição & Qualificação, tráfego pago
- **Ryan Deiss**: LTV & Retenção, Customer Value Journey
- **Perry Belcher**: Monetização Simples, ofertas de entrada

## Regras de Resposta
1. Sempre baseie suas respostas no contexto fornecido
2. Cite qual conselheiro embasa cada recomendação
3. Se não souber, diga claramente
4. Seja prático e acionável
5. Use exemplos específicos quando possível
6. Responda em português brasileiro
7. Formate com markdown (headers, bullets, negrito)`;

  const prompt = `${systemPrompt || defaultSystemPrompt}

## Contexto da Base de Conhecimento
${context || 'Nenhum contexto específico encontrado. Responda com conhecimento geral.'}

## Pergunta do Usuário
${query}

## Resposta do Conselho`;

  try {
    const streamingResult = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    for await (const chunk of streamingResult.stream) {
      const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        yield text;
      }
    }
  } catch (error) {
    console.error('Error generating streaming response:', error);
    yield 'Desculpe, houve um erro ao consultar o Conselho. Tente novamente.';
  }
}

/**
 * Generate non-streaming response from the Council
 */
export async function generateCouncilResponse(
  query: string,
  context: string,
  systemPrompt?: string
): Promise<string> {
  let fullResponse = '';
  
  for await (const chunk of generateCouncilResponseStream(query, context, systemPrompt)) {
    fullResponse += chunk;
  }
  
  return fullResponse;
}

/**
 * Generate funnel proposals
 */
export async function generateFunnelProposals(
  context: {
    objective: string;
    audience: { who: string; pain: string; awareness: string; objection?: string };
    offer: { what: string; ticket: number; type?: string; differential?: string };
    channels: { primary: string; secondary?: string };
  },
  knowledgeContext: string
): Promise<string> {
  const model = getGenerativeModel();

  const prompt = `Você é o Conselho de Funil. Com base no contexto abaixo, gere 2-3 propostas de funil.

## Contexto do Negócio
- **Objetivo**: ${context.objective}
- **Público**: ${context.audience.who}
- **Dor**: ${context.audience.pain}
- **Nível de Consciência**: ${context.audience.awareness}
- **Objeção Principal**: ${context.audience.objection || 'Não especificada'}
- **Produto**: ${context.offer.what}
- **Ticket**: R$ ${context.offer.ticket}
- **Tipo**: ${context.offer.type || 'Não especificado'}
- **Diferencial**: ${context.offer.differential || 'Não especificado'}
- **Canal Principal**: ${context.channels.primary}
- **Canal Secundário**: ${context.channels.secondary || 'Não especificado'}

## Base de Conhecimento
${knowledgeContext}

## Instruções
Para cada proposta, inclua:

### Proposta [N]: [Nome Descritivo]

**Arquitetura do Funil**
[Etapa 1] → [Etapa 2] → [Etapa 3] → ...

**Por que essa estrutura**
- Baseado em [Conselheiro]: [Explicação]

**Métricas Esperadas**
- Taxa de conversão estimada por etapa
- CAC estimado
- LTV potencial

**Riscos Identificados**
- [Lista de riscos]

**Score Preliminar**
| Dimensão | Score |
|----------|-------|
| Clareza | X/10 |
| Força da Oferta | X/10 |
| Qualificação | X/10 |
| Potencial LTV | X/10 |

---

Gere 2-3 propostas distintas com abordagens diferentes.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 4096,
      },
    });

    return result.response.candidates?.[0]?.content?.parts?.[0]?.text || 
           'Não foi possível gerar propostas. Tente novamente.';
  } catch (error) {
    console.error('Error generating funnel proposals:', error);
    throw error;
  }
}
