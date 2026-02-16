/**
 * Sprint M: Server-only brain context builder for Social Generation.
 * Separated from social-generation.ts because loader.ts uses `fs` (Node.js only)
 * and social-generation.ts is re-exported through prompts/index.ts into client components.
 *
 * Pattern: follows ads-brain-context.ts
 */
import { loadBrain } from '@/lib/intelligence/brains/loader';
import { buildScoringPromptFromBrain } from '@/lib/intelligence/brains/prompt-builder';
import type { CounselorId } from '@/types';

// ═══════════════════════════════════════════════════════
// SOCIAL → EXPERTS MAPPING (Brain Integration — Sprint M)
// ═══════════════════════════════════════════════════════

interface SocialExpertMapping {
  counselorId: CounselorId;
  frameworkId: string;
}

/** 4 social counselors with their primary evaluation frameworks */
const SOCIAL_EXPERT_MAP: Record<string, SocialExpertMapping> = {
  hook_effectiveness: { counselorId: 'rachel_karten', frameworkId: 'hook_effectiveness' },
  algorithm_alignment: { counselorId: 'lia_haberman', frameworkId: 'algorithm_alignment' },
  viral_potential: { counselorId: 'nikita_beer', frameworkId: 'viral_potential' },
  social_funnel_score: { counselorId: 'justin_welsh', frameworkId: 'social_funnel_score' },
};

export const SOCIAL_COUNSELOR_IDS: CounselorId[] = [
  'rachel_karten',
  'lia_haberman',
  'nikita_beer',
  'justin_welsh',
];

/**
 * Builds brain context string for social scorecard evaluation.
 * Injects real evaluation frameworks, red flags, and gold standards.
 * Must be called from server-side only (API routes).
 */
export function buildSocialBrainContext(): string {
  const parts: string[] = [];

  for (const [dimension, { counselorId, frameworkId }] of Object.entries(SOCIAL_EXPERT_MAP)) {
    const brain = loadBrain(counselorId);
    if (!brain) continue;

    const frameworkJson = buildScoringPromptFromBrain(counselorId, frameworkId);

    const redFlags = brain.redFlags.slice(0, 3).map(rf =>
      `- **${rf.label}**: "${rf.before}" → "${rf.after}"`
    ).join('\n');

    const goldStandards = brain.goldStandards.slice(0, 2).map(gs =>
      `- **${gs.label}**: ${gs.example}`
    ).join('\n');

    parts.push(
      `### ${brain.name} — ${brain.subtitle} (${dimension})\n` +
      `**Filosofia:** ${brain.philosophy.slice(0, 200)}...\n` +
      (frameworkJson ? `**Framework (${frameworkId}):**\n${frameworkJson}\n` : '') +
      (redFlags ? `**Erros Comuns (Red Flags):**\n${redFlags}\n` : '') +
      (goldStandards ? `**Padroes de Excelencia (Gold Standards):**\n${goldStandards}` : '')
    );
  }

  if (parts.length === 0) return '';

  return `\n## EVALUATION FRAMEWORKS DOS CONSELHEIROS SOCIAIS (Calibração Real)\n\nIMPORTANTE: Use os pesos e critérios REAIS listados abaixo para cada dimensão. NÃO invente critérios — use EXATAMENTE os que estão nos frameworks.\n\n${parts.join('\n\n---\n\n')}\n`;
}
