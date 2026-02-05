/**
 * Google Gemini API Integration
 * 
 * Alternativa ao Vertex AI que usa a API pública do Gemini
 * Requer apenas GOOGLE_AI_API_KEY no .env.local
 */

import { buildChatPrompt, buildStructuredChatPrompt } from './prompts';
import { buildPartyPrompt, PartyModeOptions } from './prompts/party-mode';
import { CouncilOutput } from '@/types';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

/** Modelo padrão: 2.0 estável na v1beta. Override via GEMINI_MODEL. */
export const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

/**
 * Get Gemini API Key - lê a variável de ambiente em tempo de execução
 */
function getGeminiApiKey(): string | undefined {
  // Acesso direto para garantir injeção no bundle cliente do Next.js
  const public_key = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
  const private_key = process.env.GOOGLE_AI_API_KEY;
  
  const key = public_key || private_key;
  
  if (!key && typeof window !== 'undefined') {
    console.error('❌ [Gemini] NEXT_PUBLIC_GOOGLE_AI_API_KEY não encontrada no bundle do navegador.');
  }
  
  return key;
}

import { AICostGuard } from './cost-guard';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

/**
 * Analisa uma imagem ou PDF usando o modelo multimodal do Gemini.
 * Perfeito para OCR estratégico e extração de insights visuais.
 * 
 * @param prompt - Instrução para a IA (ex: "Extraia o texto desta imagem").
 * @param fileBase64 - Dados do arquivo em base64.
 * @param mimeType - Tipo do arquivo (image/png, application/pdf, etc).
 */
export async function analyzeMultimodalWithGemini(
  prompt: string,
  fileBase64: string,
  mimeType: string,
  options: {
    model?: string;
    temperature?: number;
    userId?: string;
    brandId?: string;
    feature?: string;
  } = {}
): Promise<string> {
  const {
    model = DEFAULT_GEMINI_MODEL,
    temperature = 0.4, // Menor temperatura para OCR (mais preciso)
    userId = 'system',
    brandId,
    feature = 'multimodal_analysis'
  } = options;

  // Budget Check
  const hasBudget = await AICostGuard.checkBudget({ userId, brandId, model, feature });
  if (!hasBudget) throw new Error('Budget limit exceeded or no credits available.');

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
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: fileBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini Multimodal error: ${response.status} - ${error}`);
  }

  const data: GeminiResponse = await response.json();
  
  // Log usage
  if (data.usageMetadata) {
    await AICostGuard.logUsage(
      { userId, brandId, model, feature },
      { 
        inputTokens: data.usageMetadata.promptTokenCount, 
        outputTokens: data.usageMetadata.candidatesTokenCount 
      }
    );
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
    topP?: number;
    maxOutputTokens?: number;
    responseMimeType?: 'text/plain' | 'application/json';
    userId?: string;
    brandId?: string;
    feature?: string;
  } = {}
): Promise<string> {
  const {
    model = DEFAULT_GEMINI_MODEL,
    temperature = 0.7,
    maxOutputTokens = 4096,
    responseMimeType = 'text/plain',
    userId = 'system',
    brandId,
    feature = 'text_generation'
  } = options;

  // Budget Check
  const hasBudget = await AICostGuard.checkBudget({ userId, brandId, model, feature });
  if (!hasBudget) throw new Error('Budget limit exceeded or no credits available.');

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
          temperature: options.temperature ?? 0.7,
          maxOutputTokens,
          topP: options.topP ?? 0.95,
          topK: 40,
          responseMimeType,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }),
    });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data: GeminiResponse = await response.json();

  // Log usage
  if (data.usageMetadata) {
    await AICostGuard.logUsage(
      { userId, brandId, model, feature },
      { 
        inputTokens: data.usageMetadata.promptTokenCount, 
        outputTokens: data.usageMetadata.candidatesTokenCount 
      }
    );
  }

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
    topP?: number;
    maxOutputTokens?: number;
  } = {}
): AsyncGenerator<string> {
  const {
    model = DEFAULT_GEMINI_MODEL,
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
        temperature: options.temperature ?? 0.7,
        maxOutputTokens,
        topP: options.topP ?? 0.95,
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
 * @param model - Modelo opcional a ser usado (ex: gemini-2.0-flash). Padrão: GEMINI_MODEL ou gemini-2.0-flash.
 * @returns Uma promessa com a resposta gerada.
 */
export async function generateCouncilResponseWithGemini(
  query: string,
  context: string,
  systemPrompt?: string,
  model?: string
): Promise<string> {
  const fullPrompt = buildChatPrompt(query, context, systemPrompt);
  const response = await generateWithGemini(fullPrompt, { model });
  
  // US-1.5.3: Post-processing para garantir a tag [COUNCIL_OUTPUT]
  if (response.includes('{') && response.includes('}') && !response.includes('[COUNCIL_OUTPUT]:')) {
    // Se a IA gerou o JSON puro (comum em modelos menores ou instruções estritas), adicionamos o prefixo
    if (response.trim().startsWith('{') && response.trim().endsWith('}')) {
      return `[COUNCIL_OUTPUT]: ${response.trim()}`;
    }
  }
  
  return response;
}

/**
 * Gera uma resposta ESTRUTURADA (JSON) para o Conselho de Estrategistas.
 * Segue o contrato CouncilOutput v1.1.
 * 
 * @param query - A pergunta do usuário.
 * @param context - O contexto recuperado via RAG.
 * @param systemPrompt - Instruções específicas do sistema.
 * @returns Uma promessa com o objeto CouncilOutput.
 */
export async function generateStructuredCouncilResponseWithGemini(
  query: string,
  context: string,
  systemPrompt?: string
): Promise<CouncilOutput> {
  const fullPrompt = buildStructuredChatPrompt(query, context, systemPrompt);
  
  const responseText = await generateWithGemini(fullPrompt, {
    responseMimeType: 'application/json',
    temperature: 0.2, // Baixa temperatura para maior adesão ao esquema
  });

  try {
    // US-1.5.3: Limpeza do prefixo [COUNCIL_OUTPUT] se presente
    let jsonStr = responseText.trim();
    if (jsonStr.includes('[COUNCIL_OUTPUT]:')) {
      jsonStr = jsonStr.split('[COUNCIL_OUTPUT]:')[1].trim();
    }
    
    // Fallback para markdown se a IA ainda assim incluir
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }

    return JSON.parse(jsonStr.trim()) as CouncilOutput;
  } catch (error) {
    console.error('❌ [Gemini] Erro ao parsear resposta estruturada:', error);
    console.error('Resposta bruta:', responseText);
    throw new Error('Falha ao gerar resposta estruturada do conselho.');
  }
}

/**
 * Gera uma resposta para o modo Party (Múltiplos Agentes).
 */
export async function generatePartyResponseWithGemini(
  query: string,
  context: string,
  selectedAgentIds: string[],
  options?: PartyModeOptions
): Promise<string> {
  const fullPrompt = buildPartyPrompt(query, context, selectedAgentIds, options);
  return generateWithGemini(fullPrompt, {
    maxOutputTokens: 8192, // Mais tokens para debate longo
    temperature: 0.8, // Mais criatividade/debate
  });
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

