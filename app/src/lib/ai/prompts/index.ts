import { CHAT_SYSTEM_PROMPT, STRUCTURED_OUTPUT_INSTRUCTIONS, COPY_CHAT_SYSTEM_PROMPT, SOCIAL_CHAT_SYSTEM_PROMPT, ADS_CHAT_SYSTEM_PROMPT, enrichChatPromptWithBrain } from './chat-system';
import { DESIGN_CHAT_SYSTEM_PROMPT } from './design';
import { FUNNEL_GENERATION_PROMPT, FUNNEL_ADJUSTMENT_PROMPT, buildFunnelContextPrompt } from './funnel-generation';
import { SOCIAL_HOOKS_PROMPT, SOCIAL_STRUCTURE_PROMPT, SOCIAL_SCORECARD_PROMPT } from './social-generation';
import { buildCopyPrompt } from './copy-generation';
import { buildAdsGenerationPrompt } from './ads-generation';
import { PROACTIVE_VERDICT_SYSTEM_PROMPT, buildVerdictPrompt, parseVerdictOutput } from './verdict-prompt';
import type { VerdictOutput } from './verdict-prompt';

/**
 * Funções auxiliares para construção de prompts
 */

export function buildChatPrompt(
  query: string,
  context: string,
  systemPrompt?: string
): string {
  return `${systemPrompt || CHAT_SYSTEM_PROMPT}

## Contexto da Base de Conhecimento
${context || 'Nenhum contexto específico encontrado. Responda com conhecimento geral de mercado 2026.'}

## Pergunta do Usuário
${query}

## Análise MKTHONEY`;
}

export function buildStructuredChatPrompt(
  query: string,
  context: string,
  systemPrompt?: string
): string {
  return `${systemPrompt || CHAT_SYSTEM_PROMPT}

${STRUCTURED_OUTPUT_INSTRUCTIONS}

## Contexto da Base de Conhecimento
${context || 'Nenhum contexto específico encontrado. Responda com conhecimento geral de mercado 2026.'}

## Pergunta do Usuário
${query}

## Análise MKTHONEY (JSON)`;
}

export {
  CHAT_SYSTEM_PROMPT,
  STRUCTURED_OUTPUT_INSTRUCTIONS,
  COPY_CHAT_SYSTEM_PROMPT,
  SOCIAL_CHAT_SYSTEM_PROMPT,
  ADS_CHAT_SYSTEM_PROMPT,
  DESIGN_CHAT_SYSTEM_PROMPT,
  enrichChatPromptWithBrain,
  FUNNEL_GENERATION_PROMPT,
  FUNNEL_ADJUSTMENT_PROMPT,
  buildFunnelContextPrompt,
  SOCIAL_HOOKS_PROMPT,
  SOCIAL_STRUCTURE_PROMPT,
  SOCIAL_SCORECARD_PROMPT,
  buildCopyPrompt,
  buildAdsGenerationPrompt,
  // Sprint R2.2: Proactive Verdict
  PROACTIVE_VERDICT_SYSTEM_PROMPT,
  buildVerdictPrompt,
  parseVerdictOutput,
};

export type { VerdictOutput };
