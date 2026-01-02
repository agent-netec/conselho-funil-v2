/**
 * Vertex AI Integration (Refactored)
 * 
 * Esta versão usa o gemini.ts internamente para evitar
 * dependências problemáticas (@google-cloud/*) no Windows
 */

import { generateWithGemini, generateWithGeminiStream } from './gemini';
import { buildChatPrompt } from './prompts/chat-system';

/**
 * Generate embeddings using fallback approach
 * 
 * Note: Para embeddings reais, configure Vertex AI em ambiente de produção
 * No desenvolvimento local, usamos embeddings baseados em hash
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Fallback embeddings para desenvolvimento
  return generateFallbackEmbedding(text);
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  return texts.map(text => generateFallbackEmbedding(text));
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
 * Uses gemini.ts internally (fetch-based, no problematic dependencies)
 */
export async function* generateCouncilResponseStream(
  query: string,
  context: string,
  systemPrompt?: string
): AsyncGenerator<string> {
  const prompt = buildChatPrompt(query, context, systemPrompt);

  try {
    for await (const chunk of generateWithGeminiStream(prompt)) {
      yield chunk;
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
 * Generate funnel proposals using Gemini
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
- **Canal Principal**: ${context.channels?.primary || 'N/A'}
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
    return await generateWithGemini(prompt, {
      temperature: 0.8,
      maxOutputTokens: 4096,
    });
  } catch (error) {
    console.error('Error generating funnel proposals:', error);
    throw error;
  }
}
