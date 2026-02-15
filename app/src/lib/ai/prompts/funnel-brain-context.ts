/**
 * Sprint F: Server-only brain context builder for Funnel Generation.
 * Maps 6 funnel counselors by funnel stage and injects their frameworks,
 * red flags, and gold standards into funnel generation prompts.
 */
import { loadBrain } from '@/lib/intelligence/brains/loader';
import { buildScoringPromptFromBrain } from '@/lib/intelligence/brains/prompt-builder';
import type { CounselorId } from '@/types';

// ═══════════════════════════════════════════════════════
// FUNNEL → EXPERTS MAPPING (Brain Integration — Sprint F)
// ═══════════════════════════════════════════════════════

interface FunnelExpertMapping {
  counselorId: CounselorId;
  frameworkId: string;
}

/**
 * Maps funnel stages to the most relevant funnel counselors.
 * Max 2 experts per stage. ~400 tokens per expert.
 */
const FUNNEL_EXPERT_MAP: Record<string, FunnelExpertMapping[]> = {
  awareness: [
    { counselorId: 'russell_brunson', frameworkId: 'value_ladder_score' },
    { counselorId: 'frank_kern', frameworkId: 'behavioral_funnel_score' },
  ],
  interest: [
    { counselorId: 'sam_ovens', frameworkId: 'qualification_score' },
    { counselorId: 'dan_kennedy', frameworkId: 'funnel_offer_score' },
  ],
  decision: [
    { counselorId: 'dan_kennedy', frameworkId: 'message_market_fit' },
    { counselorId: 'perry_belcher', frameworkId: 'monetization_score' },
  ],
  retention: [
    { counselorId: 'ryan_deiss', frameworkId: 'ltv_optimization' },
    { counselorId: 'russell_brunson', frameworkId: 'funnel_architecture' },
  ],
};

/**
 * Builds brain context string for funnel generation.
 * Includes all funnel stages with their expert frameworks.
 * Must be called from server-side only (API routes).
 */
export function buildFunnelBrainContext(): string {
  const stageParts: string[] = [];

  for (const [stage, experts] of Object.entries(FUNNEL_EXPERT_MAP)) {
    const stageLabel = {
      awareness: 'Topo — Awareness',
      interest: 'Meio — Interest',
      decision: 'Fundo — Decision',
      retention: 'Pos-Venda — Retention',
    }[stage] || stage;

    const expertParts: string[] = [];

    for (const { counselorId, frameworkId } of experts) {
      const brain = loadBrain(counselorId);
      if (!brain) continue;

      const frameworkJson = buildScoringPromptFromBrain(counselorId, frameworkId);
      if (!frameworkJson) continue;

      // Summarize frameworks as bullets to stay within token budget
      const redFlags = brain.redFlags.slice(0, 2).map(rf =>
        `- ${rf.label}`
      ).join('\n');

      const goldStandards = brain.goldStandards.slice(0, 1).map(gs =>
        `- ${gs.label}: ${gs.example.slice(0, 100)}`
      ).join('\n');

      expertParts.push(
        `**${brain.name}** (${frameworkId}):\n` +
        `Filosofia: ${brain.philosophy.slice(0, 150)}...\n` +
        `Framework:\n${frameworkJson}\n` +
        (redFlags ? `Evitar:\n${redFlags}\n` : '') +
        (goldStandards ? `Excelencia:\n${goldStandards}` : '')
      );
    }

    if (expertParts.length > 0) {
      stageParts.push(
        `### ${stageLabel}\n\n${expertParts.join('\n\n')}`
      );
    }
  }

  if (stageParts.length === 0) return '';

  return `\n## CONSELHO DE FUNIL — BRAIN CONTEXT (Identity Cards)\n\n` +
    `Aplique os frameworks e principios dos experts para cada estagio do funil:\n\n` +
    stageParts.join('\n\n---\n\n');
}
