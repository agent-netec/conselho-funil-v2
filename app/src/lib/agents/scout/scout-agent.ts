import Parser from 'rss-parser';
import crypto from 'crypto';
import { 
  ScoutCollectionResult, 
  ScoutSourceConfig, 
  ScoutError 
} from '@/types/intelligence-agents';
import { CreateIntelligenceInput, IntelligencePlatform } from '@/types/intelligence';

const parser = new Parser();

/**
 * Agente Scout responsável por coletar dados de fontes externas (RSS, Google News).
 */
export class ScoutAgent {
  /**
   * Coleta dados de um feed RSS.
   */
  async collectFromRss(
    brandId: string, 
    config: ScoutSourceConfig
  ): Promise<ScoutCollectionResult> {
    const startTime = Date.now();
    const items: CreateIntelligenceInput[] = [];
    const errors: ScoutError[] = [];

    try {
      const feed = await parser.parseURL(config.endpoint);
      
      for (const item of feed.items) {
        if (!item.content && !item.contentSnippet && !item.title) continue;

        const text = item.content || item.contentSnippet || '';
        const title = item.title || '';
        
        items.push({
          brandId,
          type: this.inferTypeFromPlatform(config.platform),
          source: {
            platform: config.platform,
            url: item.link,
            author: item.creator || item.author,
            fetchedVia: 'rss',
          },
          content: {
            title,
            text: text.substring(0, 5000), // Limite de segurança
            originalUrl: item.link,
            publishedAt: item.pubDate ? (new Date(item.pubDate) as any) : undefined,
          },
        });
      }

      return {
        brandId,
        source: config.platform,
        success: true,
        itemsCollected: items.length,
        itemsFiltered: 0,
        items,
        collectedAt: Date.now(),
        durationMs: Date.now() - startTime,
      };

    } catch (error: any) {
      return {
        brandId,
        source: config.platform,
        success: false,
        itemsCollected: 0,
        itemsFiltered: 0,
        items: [],
        errors: [{
          code: 'PARSE_ERROR',
          message: error.message || 'Erro ao processar feed RSS',
          retryable: true,
        }],
        collectedAt: Date.now(),
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Coleta dados do Google News via RSS.
   */
  async collectFromGoogleNews(
    brandId: string, 
    keyword: string
  ): Promise<ScoutCollectionResult> {
    const encodedKeyword = encodeURIComponent(keyword);
    const endpoint = `https://news.google.com/rss/search?q=${encodedKeyword}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
    
    const config: ScoutSourceConfig = {
      platform: 'google_news',
      enabled: true,
      endpoint,
      rateLimit: {
        requestsPerHour: 100,
        minIntervalMs: 1000,
      },
      parser: 'rss',
    };

    return this.collectFromRss(brandId, config);
  }

  /**
   * Coleta dados do Reddit via JSON API.
   */
  async collectFromReddit(
    brandId: string,
    keyword: string
  ): Promise<ScoutCollectionResult> {
    const startTime = Date.now();
    const encodedKeyword = encodeURIComponent(keyword);
    const endpoint = `https://www.reddit.com/search.json?q=${encodedKeyword}&sort=new&limit=25`;
    const items: CreateIntelligenceInput[] = [];

    try {
      const response = await fetch(endpoint, {
        headers: {
          'User-Agent': 'NETECMT-ScoutAgent/1.0.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      for (const child of data.data.children) {
        const post = child.data;
        if (!post.selftext && !post.title) continue;

        items.push({
          brandId,
          type: 'mention',
          source: {
            platform: 'reddit',
            url: `https://www.reddit.com${post.permalink}`,
            author: post.author,
            fetchedVia: 'api',
          },
          content: {
            title: post.title,
            text: (post.selftext || post.title).substring(0, 5000),
            originalUrl: `https://www.reddit.com${post.permalink}`,
            publishedAt: new Date(post.created_utc * 1000) as any,
          },
          metrics: {
            engagement: post.score,
            comments: post.num_comments,
          },
        });
      }

      return {
        brandId,
        source: 'reddit',
        success: true,
        itemsCollected: items.length,
        itemsFiltered: 0,
        items,
        collectedAt: Date.now(),
        durationMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        brandId,
        source: 'reddit',
        success: false,
        itemsCollected: 0,
        itemsFiltered: 0,
        items: [],
        errors: [{
          code: 'NETWORK_ERROR',
          message: error.message || 'Erro ao coletar do Reddit',
          retryable: true,
        }],
        collectedAt: Date.now(),
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Coleta dados do X (Twitter) via Nitter RSS.
   */
  async collectFromX(
    brandId: string,
    keyword: string
  ): Promise<ScoutCollectionResult> {
    // Usa instância pública do Nitter para RSS (contorna restrições da API oficial do X)
    const encodedKeyword = encodeURIComponent(keyword);
    const endpoint = `https://nitter.net/search/rss?q=${encodedKeyword}`;
    
    const config: ScoutSourceConfig = {
      platform: 'twitter',
      enabled: true,
      endpoint,
      rateLimit: {
        requestsPerHour: 60,
        minIntervalMs: 2000,
      },
      parser: 'rss',
    };

    const result = await this.collectFromRss(brandId, config);
    return {
      ...result,
      source: 'twitter',
    };
  }

  private inferTypeFromPlatform(platform: IntelligencePlatform): any {
    switch (platform) {
      case 'google_news': return 'news';
      case 'rss_feed': return 'mention';
      default: return 'mention';
    }
  }

  /**
   * Gera um hash SHA-256 para deduplicação.
   */
  static generateTextHash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }
}
