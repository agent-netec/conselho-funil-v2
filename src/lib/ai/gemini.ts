/**
 * Google Gemini API Integration
 * 
 * Alternativa ao Vertex AI que usa a API pública do Gemini
 * Requer apenas GOOGLE_AI_API_KEY no .env.local
 */

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
 * Generate a response using Gemini API
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
 * Generate streaming response using Gemini API
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
 * Generate Council response using Gemini
 */
export async function generateCouncilResponseWithGemini(
  query: string,
  context: string,
  systemPrompt?: string
): Promise<string> {
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

  const fullPrompt = `${systemPrompt || defaultSystemPrompt}

## Contexto da Base de Conhecimento
${context || 'Nenhum contexto específico encontrado. Responda com conhecimento geral.'}

## Pergunta do Usuário
${query}

## Resposta do Conselho`;

  return generateWithGemini(fullPrompt);
}

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured(): boolean {
  const apiKey = getGeminiApiKey();
  const configured = !!apiKey;
  if (!configured) {
    console.log('[Gemini] API Key not found. Checked: GOOGLE_AI_API_KEY, NEXT_PUBLIC_GOOGLE_AI_API_KEY');
  }
  return configured;
}

