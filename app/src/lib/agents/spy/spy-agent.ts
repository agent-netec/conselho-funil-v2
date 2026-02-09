import { SpyScanResult, CompetitorProfile, IntelligenceAsset } from '@/types/competitors';
import { TechStackDiscovery } from './tech-discovery';
import { FunnelTrackerUtils } from './funnel-utils';
import { Timestamp } from 'firebase/firestore';
import { uploadBufferToStorage } from '@/lib/firebase/storage-server';
import { createIntelligenceAsset } from '@/lib/firebase/intelligence';
import { v4 as uuidv4 } from 'uuid';

/**
 * @fileoverview Spy Agent - Responsável por orquestrar a espionagem ética
 */

export class SpyAgent {
  private static USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (NETECMT SpyAgent/1.0)';

  /**
   * Verifica se o acesso à URL é permitido pelo robots.txt
   */
  private static async isAllowedByRobots(url: string): Promise<boolean> {
    try {
      const urlObj = new URL(url);
      const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
      
      const response = await fetch(robotsUrl, {
        headers: { 'User-Agent': this.USER_AGENT },
      });

      if (!response.ok) {
        // Se não houver robots.txt ou erro no fetch, assumimos que é permitido (padrão web)
        return true;
      }

      const robotsTxt = await response.text();
      
      // Implementação simplificada de parser de robots.txt para evitar dependências pesadas
      // Em produção, usaríamos 'robots-parser'
      const lines = robotsTxt.split('\n');
      let currentUserAgentApplies = false;
      let isDisallowed = false;

      for (const line of lines) {
        const trimmed = line.trim().toLowerCase();
        if (trimmed.startsWith('user-agent:')) {
          const agent = trimmed.split(':')[1].trim();
          currentUserAgentApplies = agent === '*' || agent === 'netecmt spyagent' || agent === 'netecmt';
        } else if (currentUserAgentApplies && trimmed.startsWith('disallow:')) {
          const path = trimmed.split(':')[1].trim();
          if (path && urlObj.pathname.startsWith(path)) {
            isDisallowed = true;
          }
        } else if (currentUserAgentApplies && trimmed.startsWith('allow:')) {
          const path = trimmed.split(':')[1].trim();
          if (path && urlObj.pathname.startsWith(path)) {
            isDisallowed = false;
          }
        }
      }

      return !isDisallowed;
    } catch (error) {
      console.warn(`[SpyAgent] Error checking robots.txt for ${url}:`, error);
      return true; // Fallback permissivo
    }
  }

  /**
   * Executa um scan completo em uma URL de concorrente
   */
  static async scan(competitor: CompetitorProfile): Promise<SpyScanResult> {
    const startTime = Date.now();
    const url = competitor.websiteUrl;

    try {
      // 0. Ethical Guardrail: Robots.txt
      const allowed = await this.isAllowedByRobots(url);
      if (!allowed) {
        throw new Error(`Access denied by robots.txt for ${url}`);
      }

      // 1. Fetch da página
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.USER_AGENT,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      // 2. Descoberta de Tech Stack
      const techStack = TechStackDiscovery.discover(html, headers);

      // 3. Retorno do resultado
      return {
        competitorId: competitor.id,
        url: url,
        success: true,
        techStack: techStack,
        assetsFound: 0, 
        durationMs: Date.now() - startTime,
        scannedAt: Date.now(),
      };
    } catch (error) {
      console.error(`[SpyAgent] Error scanning ${url}:`, error);
      return {
        competitorId: competitor.id,
        url: url,
        success: false,
        techStack: {},
        assetsFound: 0,
        durationMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        scannedAt: Date.now(),
      };
    }
  }

  /**
   * Rastreia o funil de um concorrente e captura ativos (Screenshots)
   * Nota: Esta função requer Puppeteer rodando no servidor.
   */
  static async trackFunnel(competitor: CompetitorProfile): Promise<IntelligenceAsset[]> {
    const { default: puppeteer } = await import('puppeteer-core');
    const chromium = await import('@sparticuz/chromium-min');

    let browser;
    const assets: IntelligenceAsset[] = [];

    try {
      // 1. Configurar Browser (Headless)
      const chromiumModule = chromium.default as unknown as {
        args: string[];
        defaultViewport: { width: number; height: number };
        executablePath: () => Promise<string>;
        headless: boolean | 'new';
      };
      browser = await puppeteer.launch({
        args: chromiumModule.args,
        defaultViewport: chromiumModule.defaultViewport,
        executablePath: await chromiumModule.executablePath(),
        headless: chromiumModule.headless as boolean,
      });

      const page = await browser.newPage();
      await page.setUserAgent(this.USER_AGENT);

      // 0. Ethical Guardrail: Robots.txt (Redundante mas seguro)
      const allowed = await this.isAllowedByRobots(competitor.websiteUrl);
      if (!allowed) {
        throw new Error(`Access denied by robots.txt for ${competitor.websiteUrl}`);
      }

      // 1. Configurar Sanitização de PII (Ocultar elementos sensíveis antes do screenshot)
      await page.evaluateOnNewDocument(() => {
        window.addEventListener('DOMContentLoaded', () => {
          const style = document.createElement('style');
          style.innerHTML = `
            input[type="password"], 
            input[name*="card"], 
            input[name*="cvv"], 
            input[name*="email"], 
            input[name*="phone"],
            .user-profile, 
            .account-balance, 
            [data-pii] {
              filter: blur(10px) !important;
              opacity: 0.3 !important;
            }
          `;
          document.head.appendChild(style);
        });
      });

      // 2. Navegar e Capturar (Exemplo com a URL principal)
      // Em uma implementação real, aqui haveria um loop de descoberta de links
      const targetUrl = competitor.websiteUrl;
      await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      // 3. Gerar Screenshot
      const screenshotBuffer = await page.screenshot({ fullPage: true, type: 'png' }) as Buffer;

      // 4. Preparar Metadados e Upload
      const assetId = uuidv4();
      const storagePath = FunnelTrackerUtils.generateStoragePath(competitor.brandId, competitor.id, assetId);
      
      const publicUrl = await uploadBufferToStorage(screenshotBuffer, storagePath);

      const assetData: Omit<IntelligenceAsset, 'id'> = {
        brandId: competitor.brandId,
        competitorId: competitor.id,
        type: 'screenshot',
        url: FunnelTrackerUtils.sanitizeUrl(targetUrl),
        pageType: FunnelTrackerUtils.identifyPageType(targetUrl),
        capturedAt: Timestamp.now(),
        storagePath: storagePath,
        publicUrl: publicUrl,
        version: 1,
      };

      // 5. Salvar no Firestore
      const docId = await createIntelligenceAsset(competitor.brandId, competitor.id, assetData);
      
      assets.push({ id: docId, ...assetData });

      return assets;
    } catch (error) {
      console.error(`[SpyAgent] Error tracking funnel for ${competitor.websiteUrl}:`, error);
      throw error;
    } finally {
      if (browser) await browser.close();
    }
  }
}
