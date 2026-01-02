/**
 * Google Gemini API Integration
 * 
 * Alternativa ao Vertex AI que usa a API pública do Gemini
 * Requer apenas GOOGLE_AI_API_KEY no .env.local
 */

import { buildChatPrompt } from './prompts/chat-system';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Get Gemini API Key - lê a variável de ambiente em tempo de execução
 */
function getGeminiApiKey(): string | undefined {
  return process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

/**
 * Gera uma resposta usando a API do Google Gemini.
 * 
 * @param prompt - O comando ou texto de entrada para o modelo.
 * @param options - Configurações opcionais (modelo, temperatura, tokens de saída).
 * @returns Uma promessa que resolve para o texto gerado.
 * @throws Erro se a chave da API não estiver configurada ou se a requisição falhar.
 * 
 * @example
 * ```ts
 * const text = await generateWithGemini("Escreva um título para um funil de quiz.");
 * ```
 */
export async function generateWithGemini(
  prompt: string,
  options: {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
  } = {}
): Promise<string> {
  const {
    model = 'gemini-2.0-flash-exp',
    temperature = 0.7,
    maxOutputTokens = 4096,
  } = options;

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY not configured');
  }

  const url = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature,
        maxOutputTokens,
        topP: 0.95,
        topK: 40,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data: GeminiResponse = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Gera uma resposta em streaming usando a API do Google Gemini.
 * 
 * @param prompt - O comando ou texto de entrada.
 * @param options - Configurações opcionais de geração.
 * @yields Pedaços de texto conforme são gerados pela API.
 */
export async function* generateWithGeminiStream(
  prompt: string,
  options: {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
  } = {}
): AsyncGenerator<string> {
  const {
    model = 'gemini-2.0-flash-exp',
    temperature = 0.7,
    maxOutputTokens = 4096,
  } = options;

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY not configured');
  }

  const url = `${GEMINI_BASE_URL}/models/${model}:streamGenerateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature,
        maxOutputTokens,
        topP: 0.95,
        topK: 40,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    
    // Parse JSON lines
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === '[' || trimmed === ']' || trimmed === ',') continue;
      
      try {
        // Remove leading comma if present
        const jsonStr = trimmed.startsWith(',') ? trimmed.slice(1) : trimmed;
        const data = JSON.parse(jsonStr);
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          yield text;
        }
      } catch {
        // Continue on parse errors
      }
    }
  }
}

/**
 * Gera uma resposta formatada para o Conselho de Estrategistas.
 * Utiliza um builder de prompt para combinar a consulta, o contexto RAG e as instruções do sistema.
 * 
 * @param query - A pergunta do usuário.
 * @param context - O contexto recuperado via RAG.
 * @param systemPrompt - Instruções específicas do sistema ou do conselheiro.
 * @returns Uma promessa com a resposta gerada.
 */
export async function generateCouncilResponseWithGemini(
  query: string,
  context: string,
  systemPrompt?: string
): Promise<string> {
  const fullPrompt = buildChatPrompt(query, context, systemPrompt);
  return generateWithGemini(fullPrompt);
}

/**
 * Verifica se as credenciais da API do Gemini estão configuradas corretamente.
 * 
 * @returns True se a chave da API estiver presente nas variáveis de ambiente.
 */
export function isGeminiConfigured(): boolean {
  const apiKey = getGeminiApiKey();
  const configured = !!apiKey;
  if (!configured) {
    console.log('[Gemini] API Key not found. Checked: GOOGLE_AI_API_KEY, NEXT_PUBLIC_GOOGLE_AI_API_KEY');
  }
  return configured;
}

