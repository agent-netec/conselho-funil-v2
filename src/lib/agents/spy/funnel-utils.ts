import { PageType } from '@/types/competitors';

/**
 * @fileoverview Utilitários para análise e rastreamento de funis
 */

export class FunnelTrackerUtils {
  /**
   * Identifica o tipo de página baseado na URL
   */
  static identifyPageType(url: string): PageType {
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes('/checkout') || lowerUrl.includes('/pay') || lowerUrl.includes('/cart')) {
      return 'checkout';
    }
    if (lowerUrl.includes('/obrigado') || lowerUrl.includes('/thank-you') || lowerUrl.includes('/success') || lowerUrl.includes('/confirmacao')) {
      return 'thank_you';
    }
    if (lowerUrl.includes('/vsl') || lowerUrl.includes('/video') || lowerUrl.includes('/aula')) {
      return 'vsl';
    }
    if (lowerUrl.includes('/upsell') || lowerUrl.includes('/downsell') || lowerUrl.includes('/offer')) {
      return 'upsell';
    }
    if (lowerUrl.includes('/lp') || lowerUrl.includes('/landing') || lowerUrl.includes('/venda')) {
      return 'landing_page';
    }

    return 'other';
  }

  /**
   * Sanitiza a URL removendo query strings sensíveis ou tokens de rastreamento
   */
  static sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const paramsToRemove = [
        'token', 'auth', 'key', 'session', 'sid', 'uid', 'email', 'user', 'password', 'pass', 'secret',
        'fbclid', 'gclid', 'msclkid', 'utm_source', 'utm_medium', 
        'utm_campaign', 'utm_term', 'utm_content', 'aff', 'affiliate', 'ref'
      ];

      paramsToRemove.forEach(param => urlObj.searchParams.delete(param));
      
      // Remove trailing slash para consistência
      let sanitized = urlObj.toString();
      if (sanitized.endsWith('/') && urlObj.pathname !== '/') {
        sanitized = sanitized.slice(0, -1);
      }
      
      return sanitized;
    } catch (e) {
      return url;
    }
  }

  /**
   * Gera um path para o Firebase Storage seguindo o padrão do contrato
   */
  static generateStoragePath(brandId: string, competitorId: string, assetId: string): string {
    return `brands/${brandId}/competitors/${competitorId}/${assetId}.png`;
  }
}
