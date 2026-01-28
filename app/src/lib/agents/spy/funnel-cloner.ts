import { MCPRouter } from '@/lib/mcp/router';
import { generateWithGemini } from '@/lib/ai/gemini';
import { createScopedData } from '@/lib/firebase/scoped-data';
import { Timestamp } from 'firebase/firestore';
import { ScopedData } from '@/types/scoped-data';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface para o Template de Funil Clonado (Contrato Athos)
 */
export interface ClonedFunnelTemplate extends ScopedData {
  id: string;
  scope: {
    level: 'funnel';
    brandId: string;
    funnelId: string;
  };
  name: string;
  originalUrl: string;
  structure: {
    pages: Array<{
      type: string;
      title: string;
      url: string;
      headlines: string[];
      ctas: string[];
      contentSummary: string;
    }>;
    flow: string[]; // Ordem das páginas
  };
  techniques: string[];
  copyElements: {
    primaryHook: string;
    mainPromise: string;
    scarcityElements: string[];
    socialProofTypes: string[];
  };
  clonedAt: Timestamp;
}

/**
 * Funnel Cloner MVP - Transforma URLs em templates estruturados
 */
export class FunnelCloner {
  private router: MCPRouter;

  constructor(router: MCPRouter) {
    this.router = router;
  }

  /**
   * Executa o processo completo de clonagem
   */
  async clone(brandId: string, funnelId: string, url: string, name: string): Promise<string> {
    const taskId = uuidv4();

    // 1. Full Scrape via Firecrawl
    const scrapeResult = await this.router.execute({
      id: taskId,
      type: 'full_scrape',
      brandId,
      input: {
        url,
        maxPages: 5,
        followLinks: true
      }
    });

    if (!scrapeResult.success || !scrapeResult.data) {
      throw new Error(`Scrape failed: ${scrapeResult.error?.message}`);
    }

    const pages = (scrapeResult.data as any).pages || [];

    // 2. Análise de Estrutura e Copy via AI (Gemini)
    const analysis = await this.analyzeFunnelStructure(pages);

    // 3. Montagem do Template
    const template: Omit<ClonedFunnelTemplate, 'id'> = {
      scope: {
        level: 'funnel',
        brandId,
        funnelId
      },
      inheritToChildren: false,
      name: name || analysis.suggestedName || `Clone: ${new URL(url).hostname}`,
      originalUrl: url,
      structure: analysis.structure,
      techniques: analysis.techniques,
      copyElements: analysis.copyElements,
      clonedAt: Timestamp.now()
    };

    // 4. Persistência com Escopo (Scoped: Funnel)
    const docId = await createScopedData<ClonedFunnelTemplate>(
      'cloned_templates',
      brandId,
      template,
      { syncToPinecone: true, dataType: 'funnel_template' }
    );

    return docId;
  }

  /**
   * Usa AI para processar o Markdown das páginas e extrair a arquitetura do funil
   */
  private async analyzeFunnelStructure(pages: any[]): Promise<any> {
    const pagesContext = pages.map(p => `
      URL: ${p.url}
      TITLE: ${p.title}
      CONTENT: ${p.markdown.substring(0, 3000)} // Truncar para caber no contexto
    `).join('\n---\n');

    const prompt = `
      Você é um Arquiteto de Funis de Vendas e Copywriter de Resposta Direta.
      Analise o conteúdo de um funil capturado e extraia sua estrutura lógica.

      CONTEÚDO CAPTURADO:
      ${pagesContext}

      TAREFAS:
      1. Identifique cada página (Optin, Sales Page, VSL, Checkout, Thank You, etc).
      2. Extraia as Headlines principais e CTAs de cada página.
      3. Identifique o fluxo (ordem das páginas).
      4. Identifique técnicas de persuasão (Escassez, Prova Social, Urgência, etc).
      5. Extraia elementos chave da copy (Gancho principal, Promessa central).

      FORMATO DE SAÍDA (JSON):
      {
        "suggestedName": "nome criativo para o funil",
        "structure": {
          "pages": [
            {
              "type": "tipo da página",
              "title": "título",
              "url": "url original",
              "headlines": ["headline 1", "headline 2"],
              "ctas": ["texto do botão 1"],
              "contentSummary": "resumo do que a página vende/faz"
            }
          ],
          "flow": ["url1", "url2"]
        },
        "techniques": ["técnica 1", "técnica 2"],
        "copyElements": {
          "primaryHook": "gancho principal",
          "mainPromise": "promessa central",
          "scarcityElements": ["ex: contador regressivo"],
          "socialProofTypes": ["ex: depoimentos em vídeo"]
        }
      }
    `;

    const response = await generateWithGemini(prompt, {
      model: 'gemini-2.0-flash-exp',
      temperature: 0.2,
      responseMimeType: 'application/json'
    });

    return JSON.parse(response);
  }
}
