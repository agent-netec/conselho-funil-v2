/**
 * Text Input Sanitizer — RT-03 Compliance
 * Sprint 25 · S25-ST-07
 *
 * Sanitização obrigatória para todos os inputs de texto antes de processamento.
 * Usa TEXT_SANITIZATION_RULES e isSuspiciousInput() de text-analysis.ts.
 *
 * @contract arch-sprint-25-predictive-creative-engine.md § 5
 */

import { TEXT_SANITIZATION_RULES, isSuspiciousInput } from '@/types/text-analysis';

// ═══════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════

export interface SanitizeResult {
  valid: boolean;
  sanitized: string;
  error?: 'TEXT_TOO_LONG' | 'TEXT_TOO_SHORT' | 'SUSPICIOUS_INPUT';
  /** Número de caracteres removidos pela sanitização */
  charsRemoved: number;
}

// ═══════════════════════════════════════════════════════
// SANITIZER
// ═══════════════════════════════════════════════════════

/**
 * Sanitiza um input de texto conforme regras RT-03.
 *
 * Ordem de verificação:
 *  1. Comprimento máximo (50.000 chars)
 *  2. Comprimento mínimo (50 chars)
 *  3. Padrões suspeitos (blockedPatterns)
 *  4. Strip HTML tags (se habilitado)
 *  5. Normalização de whitespace
 *
 * @param text - Texto bruto fornecido pelo usuário
 * @returns SanitizeResult com status e texto limpo
 */
export function sanitizeTextInput(text: string): SanitizeResult {
  // 1. Comprimento máximo
  if (text.length > TEXT_SANITIZATION_RULES.maxLength) {
    return {
      valid: false,
      sanitized: '',
      error: 'TEXT_TOO_LONG',
      charsRemoved: 0,
    };
  }

  // 2. Comprimento mínimo
  if (text.length < TEXT_SANITIZATION_RULES.minLength) {
    return {
      valid: false,
      sanitized: '',
      error: 'TEXT_TOO_SHORT',
      charsRemoved: 0,
    };
  }

  // 3. Padrões suspeitos (RT-03: rejeição total)
  if (isSuspiciousInput(text)) {
    return {
      valid: false,
      sanitized: '',
      error: 'SUSPICIOUS_INPUT',
      charsRemoved: 0,
    };
  }

  // 4. Sanitização ativa
  let sanitized = text;
  const originalLength = sanitized.length;

  // Strip HTML tags se configurado
  if (TEXT_SANITIZATION_RULES.stripHtmlTags) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }

  // 5. Normalização de whitespace
  // Colapsar múltiplas quebras de linha em no máximo 2
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
  // Colapsar múltiplos espaços em 1
  sanitized = sanitized.replace(/[ \t]{2,}/g, ' ');
  // Trim
  sanitized = sanitized.trim();

  const charsRemoved = originalLength - sanitized.length;

  // Re-verificar mínimo após sanitização
  if (sanitized.length < TEXT_SANITIZATION_RULES.minLength) {
    return {
      valid: false,
      sanitized: '',
      error: 'TEXT_TOO_SHORT',
      charsRemoved,
    };
  }

  return {
    valid: true,
    sanitized,
    charsRemoved,
  };
}

// ═══════════════════════════════════════════════════════
// UTILITÁRIOS DE FORMATO
// ═══════════════════════════════════════════════════════

/**
 * Remove timestamps de formatos SRT/VTT, mantendo apenas o texto.
 *
 * SRT: "00:01:15,000 --> 00:01:18,000"
 * VTT: "00:01:15.000 --> 00:01:18.000"
 *
 * @param text - Texto em formato SRT ou VTT
 * @returns Texto limpo sem timestamps
 */
export function stripSubtitleTimestamps(text: string): string {
  // Remover header WEBVTT
  let cleaned = text.replace(/^WEBVTT\s*\n/i, '');

  // Remover blocos de timestamp SRT/VTT:
  // Linha com apenas número (index do cue)
  cleaned = cleaned.replace(/^\d+\s*$/gm, '');
  // Linhas de timestamp: "00:01:15,000 --> 00:01:18,000" ou "00:01:15.000 --> 00:01:18.000"
  cleaned = cleaned.replace(
    /\d{1,2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*\d{1,2}:\d{2}:\d{2}[.,]\d{3}.*$/gm,
    ''
  );
  // Remover tags de posicionamento VTT: <v Nome>, </v>, <c.classname>
  cleaned = cleaned.replace(/<\/?[vc][^>]*>/g, '');

  // Colapsar linhas vazias
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}
