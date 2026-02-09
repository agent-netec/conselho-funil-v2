export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { stripPII } from '@/lib/intelligence/pii-stripper';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, increment, updateDoc } from 'firebase/firestore';
import { createApiError } from '@/lib/utils/api-response';

// Tipos básicos para a rota
interface MCPRequest {
  provider: 'bright_data' | 'exa' | 'firecrawl' | 'browser' | 'glimpse';
  tool: string;
  args: any;
  brandId?: string;
  userId?: string;
}

/**
 * Rota de Relay para execução de MCPs em produção.
 * Implementa Budget Lock, PII Stripping e Proxy para Workers.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as MCPRequest;
    const { provider, tool, args, brandId, userId } = body;

    // 1. Validação de Input
    if (!provider || !tool || !args) {
      return createApiError(400, 'Provider, tool and args are required');
    }

    // 2. Budget Lock (Controle de Custos)
    if (brandId) {
      const brandRef = doc(db, 'brands', brandId);
      const brandSnap = await getDoc(brandRef);
      
      if (brandSnap.exists()) {
        const brandData = brandSnap.data();
        const credits = brandData.credits ?? 0;
        
        // Custo estimado por operação (simplificado para o MVP)
        const operationCost = 1; 
        
        if (credits < operationCost) {
          return createApiError(402, 'Insufficient credits for this operation', { code: 'BUDGET_EXCEEDED' });
        }

        // Deduzir crédito (atômico)
        await updateDoc(brandRef, {
          credits: increment(-operationCost)
        });
      }
    }

    // 3. PII Stripping (Segurança)
    // Limpamos argumentos sensíveis antes de enviar para o worker
    const sanitizedArgs = JSON.parse(stripPII(JSON.stringify(args)));

    // 4. Proxy para o Worker (Cloud Run)
    // Em produção, cada provider tem seu próprio endpoint/worker
    const workerUrl = getWorkerUrl(provider);
    const apiKey = getApiKey(provider);

    if (!workerUrl || !apiKey) {
      return createApiError(500, `Worker or API Key for ${provider} not configured`);
    }

    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer \${apiKey}`,
        'X-MCP-Tool': tool
      },
      body: JSON.stringify(sanitizedArgs)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return createApiError(response.status, `Worker error: ${errorText}`);
    }

    const result = await response.json();

    // 5. PII Stripping no Resultado
    const sanitizedResult = JSON.parse(stripPII(JSON.stringify(result)));

    return NextResponse.json(sanitizedResult);

  } catch (error: any) {
    console.error('[MCP Relay Error]:', error);
    return createApiError(500, error.message || 'Internal Server Error');
  }
}

/**
 * Retorna a URL do worker baseada no provider.
 * As URLs devem ser configuradas via variáveis de ambiente.
 */
function getWorkerUrl(provider: string): string | undefined {
  const urls: Record<string, string | undefined> = {
    bright_data: process.env.BRIGHT_DATA_WORKER_URL,
    exa: process.env.EXA_WORKER_URL || 'https://api.exa.ai/search', // Exa pode ser chamado direto se não houver worker
    firecrawl: process.env.FIRECRAWL_WORKER_URL || 'https://api.firecrawl.dev/v0/scrape',
    browser: process.env.BROWSER_WORKER_URL,
    glimpse: process.env.GLIMPSE_WORKER_URL
  };
  return urls[provider];
}

/**
 * Retorna a API Key do Secret Manager (via Env Vars).
 */
function getApiKey(provider: string): string | undefined {
  const keys: Record<string, string | undefined> = {
    bright_data: process.env.BRIGHT_DATA_API_KEY,
    exa: process.env.EXA_API_KEY,
    firecrawl: process.env.FIRECRAWL_API_KEY,
    browser: process.env.BROWSER_API_KEY,
    glimpse: process.env.GLIMPSE_API_KEY
  };
  return keys[provider];
}
