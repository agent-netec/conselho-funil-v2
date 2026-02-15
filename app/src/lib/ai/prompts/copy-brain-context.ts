/**
 * Sprint F: Server-only brain context builder for Copy Generation.
 * Maps 9 copy counselors by awareness stage and injects their frameworks,
 * red flags, and gold standards into copy prompts.
 */
import { loadBrain } from '@/lib/intelligence/brains/loader';
import { buildScoringPromptFromBrain } from '@/lib/intelligence/brains/prompt-builder';
import type { CounselorId } from '@/types';

// ═══════════════════════════════════════════════════════
// COPY → EXPERTS MAPPING (Brain Integration — Sprint F)
// ═══════════════════════════════════════════════════════

interface CopyExpertMapping {
  counselorId: CounselorId;
  frameworkId: string;
}

/**
 * Maps awareness stages to the most relevant copy counselors.
 * Max 2-3 experts per stage + 1 transversal (frank_kern_copy).
 */
const COPY_EXPERT_MAP: Record<string, CopyExpertMapping[]> = {
  unaware: [
    { counselorId: 'eugene_schwartz', frameworkId: 'awareness_alignment' },
    { counselorId: 'gary_halbert', frameworkId: 'headline_score' },
  ],
  problem_aware: [
    { counselorId: 'joseph_sugarman', frameworkId: 'slippery_slide' },
    { counselorId: 'john_carlton', frameworkId: 'hook_and_fascinations' },
  ],
  solution_aware: [
    { counselorId: 'dan_kennedy_copy', frameworkId: 'offer_architecture' },
    { counselorId: 'david_ogilvy', frameworkId: 'big_idea_test' },
  ],
  product_aware: [
    { counselorId: 'dan_kennedy_copy', frameworkId: 'offer_architecture' },
    { counselorId: 'david_ogilvy', frameworkId: 'big_idea_test' },
  ],
  most_aware: [
    { counselorId: 'claude_hopkins', frameworkId: 'scientific_rigor' },
    { counselorId: 'drayton_bird', frameworkId: 'simplicity_efficiency' },
  ],
};

/** Transversal expert included in all stages */
const TRANSVERSAL_EXPERT: CopyExpertMapping = {
  counselorId: 'frank_kern_copy',
  frameworkId: 'sequence_logic',
};

/**
 * Builds brain context string for copy generation based on awareness stage.
 * Must be called from server-side only (API routes).
 */
export function buildCopyBrainContext(awarenessStage: string): string {
  const stageExperts = COPY_EXPERT_MAP[awarenessStage] || COPY_EXPERT_MAP['problem_aware'];
  const allExperts = [...stageExperts, TRANSVERSAL_EXPERT];

  const parts: string[] = [];

  for (const { counselorId, frameworkId } of allExperts) {
    const brain = loadBrain(counselorId);
    if (!brain) continue;

    const frameworkJson = buildScoringPromptFromBrain(counselorId, frameworkId);
    if (!frameworkJson) continue;

    const redFlags = brain.redFlags.slice(0, 2).map(rf =>
      `- **${rf.label}**: "${rf.before}" → "${rf.after}"`
    ).join('\n');

    const goldStandards = brain.goldStandards.slice(0, 1).map(gs =>
      `- **${gs.label}**: ${gs.example}`
    ).join('\n');

    parts.push(
      `### ${brain.name} — ${brain.subtitle}\n` +
      `**Filosofia:** ${brain.philosophy.slice(0, 200)}...\n` +
      `**Framework (${frameworkId}):**\n${frameworkJson}\n` +
      (redFlags ? `**Erros Comuns:**\n${redFlags}\n` : '') +
      (goldStandards ? `**Padrao de Excelencia:**\n${goldStandards}` : '')
    );
  }

  if (parts.length === 0) return '';

  return `\n## CONSELHO DE COPYWRITING — BRAIN CONTEXT (Identity Cards)\n\n` +
    `Estagio de consciencia: **${awarenessStage}**\n` +
    `Aplique os frameworks e principios dos experts abaixo ao gerar a copy:\n\n` +
    parts.join('\n\n---\n\n');
}
