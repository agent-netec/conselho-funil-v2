/**
 * @fileoverview Tipos para dados com escopo hierárquico
 * @module types/scoped-data
 * @version 1.0.0
 */

/**
 * Níveis de escopo do sistema
 */
export type ScopeLevel = 'universal' | 'brand' | 'funnel' | 'campaign';

/**
 * Escopo de um dado - define visibilidade e isolamento
 */
export interface DataScope {
  /**
   * Nível do escopo
   */
  level: ScopeLevel;
  
  /**
   * ID da marca (obrigatório se level !== 'universal')
   */
  brandId?: string;
  
  /**
   * ID do funil (obrigatório se level === 'funnel' ou 'campaign')
   */
  funnelId?: string;
  
  /**
   * ID da campanha (obrigatório se level === 'campaign')
   */
  campaignId?: string;
}

/**
 * Interface base para todos os dados com escopo
 * TODAS as estruturas de dados do sistema DEVEM estender esta interface
 */
export interface ScopedData {
  /**
   * Escopo do dado - define onde ele é visível
   */
  scope: DataScope;
  
  /**
   * Se true, contextos filhos herdam este dado
   * Ex: Se true em nível 'brand', funis e campanhas desta marca verão o dado
   */
  inheritToChildren: boolean;
}

/**
 * Validador de escopo - usar antes de salvar qualquer dado
 */
export function validateScope(scope: DataScope): ValidationResult {
  const errors: string[] = [];
  
  // Nível universal não precisa de IDs
  if (scope.level === 'universal') {
    if (scope.brandId || scope.funnelId || scope.campaignId) {
      errors.push('Universal scope should not have brandId, funnelId, or campaignId');
    }
    return { valid: errors.length === 0, errors };
  }
  
  // Todos os outros níveis precisam de brandId
  if (!scope.brandId) {
    errors.push('brandId is required for non-universal scopes');
  }
  
  // Nível funnel precisa de funnelId
  if (scope.level === 'funnel' && !scope.funnelId) {
    errors.push('funnelId is required for funnel scope');
  }
  
  // Nível campaign precisa de funnelId E campaignId
  if (scope.level === 'campaign') {
    if (!scope.funnelId) {
      errors.push('funnelId is required for campaign scope');
    }
    if (!scope.campaignId) {
      errors.push('campaignId is required for campaign scope');
    }
  }
  
  return { valid: errors.length === 0, errors };
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Gera o nome do namespace Pinecone baseado no escopo
 */
export function scopeToNamespace(scope: DataScope): string {
  switch (scope.level) {
    case 'universal':
      return 'universal';
    case 'brand':
      return `brand_${scope.brandId}`;
    case 'funnel':
      return `context_${scope.brandId}_funnel_${scope.funnelId}`;
    case 'campaign':
      return `context_${scope.brandId}_campaign_${scope.campaignId}`;
    default:
      throw new Error(`Invalid scope level: ${scope.level}`);
  }
}

/**
 * Retorna lista de namespaces que um contexto pode acessar (para query)
 * Ordem: mais específico → mais geral
 */
export function getAccessibleNamespaces(
  brandId: string,
  funnelId?: string,
  campaignId?: string
): string[] {
  const namespaces: string[] = [];
  
  // Se tem campanha, adiciona namespace da campanha
  if (campaignId && funnelId) {
    namespaces.push(`context_${brandId}_campaign_${campaignId}`);
  }
  
  // Se tem funil, adiciona namespace do funil
  if (funnelId) {
    namespaces.push(`context_${brandId}_funnel_${funnelId}`);
  }
  
  // Sempre adiciona marca e universal
  namespaces.push(`brand_${brandId}`);
  namespaces.push('universal');
  
  return namespaces;
}
