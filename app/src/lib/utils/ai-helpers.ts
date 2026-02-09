/**
 * Estima tokens de uma string (aproximação simples: 1 token ≈ 4 chars).
 * Centralizado para evitar duplicação (SIG-BNS-02).
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}
