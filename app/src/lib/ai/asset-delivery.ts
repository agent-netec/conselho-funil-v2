import { ragQuery, retrieveBenchmarks, formatContextForLLM } from './rag';
import { generateStructuredCouncilResponseWithGemini } from './gemini';
import { CouncilOutput } from '@/types';

/**
 * Motor de Inteligência para o Beta Launchpad (ST-1.5.3)
 * Gera recomendações estratégicas, benchmarks e ativos estruturados.
 * 
 * @param query - Pergunta do usuário ou objetivo da geração.
 * @param brandContext - Contexto opcional da marca.
 * @returns Promessa com o objeto estruturado CouncilOutput.
 */
export async function generateCouncilAssetDelivery(
  query: string,
  options: {
    brandContext?: string;
    funnelContext?: string;
    systemPrompt?: string;
  } = {}
): Promise<CouncilOutput> {
  console.log(`🚀 [AssetDelivery] Iniciando geração estruturada para: "${query}"`);

  // 1. Recuperação Híbrida (Conhecimento Geral + Benchmarks)
  const { context: generalContext } = await ragQuery(query, { topK: 8, minSimilarity: 0.25 });
  
  // Busca específica por benchmarks se a query parecer envolver métricas
  let benchmarkContext = '';
  if (query.toLowerCase().match(/cpc|roas|ctr|conversão|converso|custo|preço|preco|benchmark|métrica|metrica/)) {
    console.log(`📊 [AssetDelivery] Buscando benchmarks específicos...`);
    const benchmarkChunks = await retrieveBenchmarks(query, 5);
    benchmarkContext = `\n\n### DADOS DE MERCADO E BENCHMARKS (2026)\n${formatContextForLLM(benchmarkChunks)}`;
  }

  // 2. Montagem do Contexto Final
  let fullContext = generalContext + benchmarkContext;
  
  if (options.brandContext) {
    fullContext = `## CONTEXTO DA MARCA\n${options.brandContext}\n\n---\n\n${fullContext}`;
  }
  
  if (options.funnelContext) {
    fullContext = `## CONTEXTO DO FUNIL\n${options.funnelContext}\n\n---\n\n${fullContext}`;
  }

  // 3. Geração via Gemini com Saída Estruturada
  const result = await generateStructuredCouncilResponseWithGemini(
    query,
    fullContext,
    options.systemPrompt
  );

  console.log(`✅ [AssetDelivery] Geração concluída com sucesso.`);
  return result;
}
