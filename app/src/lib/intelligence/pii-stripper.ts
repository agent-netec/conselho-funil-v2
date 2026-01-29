/**
 * @fileoverview Utilitário para remoção de PII (Personally Identifiable Information)
 * de dados coletados de redes sociais e fontes externas.
 * @module lib/intelligence/pii-stripper
 */

/**
 * Regex para identificar padrões comuns de PII
 */
const PII_PATTERNS = {
  // E-mails (padrão básico)
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  
  // Telefones (padrão brasileiro e internacional simples)
  // Ex: (11) 99999-9999, +55 11 999999999, 11999999999
  phone: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,3}\)?[-.\s]?\d{4,5}[-.\s]?\d{4}/g,
  
  // CPF (Brasil)
  cpf: /\d{3}\.\d{3}\.\d{3}-\d{2}/g,
  
  // CNPJ (Brasil)
  cnpj: /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g,
};

/**
 * Lista de nomes comuns ou padrões de nomes para anonimização
 * Nota: Detecção de nomes reais em texto livre é complexa sem NLP pesado.
 * Usaremos uma abordagem baseada em heurísticas e substituição de handles.
 */
const HANDLE_PATTERN = /@[\w.]+/g;

/**
 * Remove informações sensíveis de uma string de texto.
 * 
 * @param text O texto bruto coletado
 * @param options Opções de limpeza
 * @returns Texto anonimizado
 */
export function stripPII(
  text: string,
  options: { 
    replaceWith?: string; 
    keepHandles?: boolean;
    anonymousPlaceholder?: string;
  } = {}
): string {
  if (!text) return '';

  const {
    replaceWith = '[REDACTED]',
    keepHandles = false,
    anonymousPlaceholder = '[ANONYMOUS]'
  } = options;

  let cleaned = text;

  // 1. Remover E-mails
  cleaned = cleaned.replace(PII_PATTERNS.email, replaceWith);

  // 2. Remover Telefones
  cleaned = cleaned.replace(PII_PATTERNS.phone, replaceWith);

  // 3. Remover Documentos (CPF/CNPJ)
  cleaned = cleaned.replace(PII_PATTERNS.cpf, replaceWith);
  cleaned = cleaned.replace(PII_PATTERNS.cnpj, replaceWith);

  // 4. Tratar Handles (@usuario)
  if (!keepHandles) {
    cleaned = cleaned.replace(HANDLE_PATTERN, anonymousPlaceholder);
  }

  return cleaned;
}

/**
 * Anonimiza um objeto SocialMention completo.
 * 
 * @param mention Objeto SocialMention original
 * @returns Objeto SocialMention anonimizado
 */
export function anonymizeSocialMention<T extends { content: string; author: { handle: string; id: string } }>(
  mention: T
): T {
  return {
    ...mention,
    content: stripPII(mention.content),
    author: {
      ...mention.author,
      handle: '[ANONYMOUS_USER]',
      // Mantemos o ID interno se for necessário para deduplicação, 
      // mas o handle público é removido.
    }
  };
}
