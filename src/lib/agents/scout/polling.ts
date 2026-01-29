import { ScoutAgent } from './scout-agent';
import { 
  getBrandKeywordsConfig, 
  createIntelligenceDocument,
  queryIntelligence 
} from '@/lib/firebase/intelligence';
import { ScoutCollectionResult } from '@/types/intelligence-agents';

/**
 * Orquestrador do processo de coleta (Polling).
 */
export async function runScoutPolling(brandId: string) {
  const scout = new ScoutAgent();
  
  // 1. Buscar keywords configuradas
  const config = await getBrandKeywordsConfig(brandId);
  if (!config || !config.keywords || config.keywords.length === 0) {
    console.log(`[Scout] Nenhuma keyword configurada para a marca ${brandId}`);
    return;
  }

  const activeKeywords = config.keywords.filter(k => k.active);
  const results: ScoutCollectionResult[] = [];

  // 2. Coletar de cada fonte para cada keyword
  for (const kw of activeKeywords) {
    // Google News
    if (config.settings.enabledSources.includes('google_news')) {
      const res = await scout.collectFromGoogleNews(brandId, kw.term);
      results.push(res);
    }

    // Reddit
    if (config.settings.enabledSources.includes('reddit')) {
      const res = await scout.collectFromReddit(brandId, kw.term);
      results.push(res);
    }

    // X (Twitter)
    if (config.settings.enabledSources.includes('twitter')) {
      const res = await scout.collectFromX(brandId, kw.term);
      results.push(res);
    }
    
    // RSS Feeds (se houver URLs específicas no futuro, aqui iteraríamos por elas)
  }

  // 3. Processar e salvar itens únicos
  let newItemsCount = 0;
  for (const res of results) {
    if (!res.success) continue;

    for (const item of res.items) {
      const textHash = ScoutAgent.generateTextHash(item.content.text);
      
      // Verificar duplicata no Firestore via textHash
      const existing = await queryIntelligence({
        brandId,
        limit: 1,
        textHash,
      });

      if (existing.documents.length > 0) continue;

      // Salvar novo documento
      try {
        await createIntelligenceDocument({
          ...item,
          content: {
            ...item.content,
            textHash,
          } as any
        });
        newItemsCount++;
      } catch (err) {
        console.error(`[Scout] Erro ao salvar item:`, err);
      }
    }
  }

  return {
    brandId,
    keywordsProcessed: activeKeywords.length,
    newItemsCount,
  };
}
