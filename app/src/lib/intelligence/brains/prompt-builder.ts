import type { CounselorId } from '@/types';
import { loadBrain, loadBrainsByDomain } from './loader';
import type { BrainIdentityCard, BrainDomain, EvaluationFramework } from './types';

// ============================================
// Prompt Builder — Injects brain data into prompts
// ============================================

const MAX_EXPERTS_PER_PROMPT = 4;

/**
 * Build the system instruction (persona) for a single counselor.
 * Includes: philosophy, principles, voice, catchphrases.
 */
export function buildCounselorContext(counselorId: CounselorId): string | null {
  const brain = loadBrain(counselorId);
  if (!brain) return null;
  return brain.rawNarrative;
}

/**
 * Build the user-context JSON for a specific evaluation framework.
 * Returns the stringified framework ready for prompt injection.
 */
export function buildScoringPromptFromBrain(
  counselorId: CounselorId,
  frameworkId: string
): string | null {
  const brain = loadBrain(counselorId);
  if (!brain) return null;

  const framework = brain.evaluationFrameworks[frameworkId];
  if (!framework) return null;

  return JSON.stringify(
    {
      counselor: counselorId,
      framework: frameworkId,
      ...framework,
    },
    null,
    2
  );
}

/**
 * Build context for multiple counselors (max 3-4, ~2500 tokens).
 * Used for multi-expert scoring or chat modes.
 */
export function buildMultiCounselorContext(
  counselorIds: CounselorId[],
  options?: { maxExperts?: number }
): string {
  const max = options?.maxExperts ?? MAX_EXPERTS_PER_PROMPT;
  const selected = counselorIds.slice(0, max);

  const sections: string[] = [];
  for (const id of selected) {
    const brain = loadBrain(id);
    if (!brain) continue;
    sections.push(
      `### ${brain.name} — ${brain.subtitle}\n${brain.philosophy}\n\nPrincipios:\n${brain.principles}\n\nVoz: ${brain.voice}`
    );
  }

  return sections.join('\n\n---\n\n');
}

/**
 * Build context for all experts in a domain.
 */
export function buildDomainContext(domain: BrainDomain): string {
  const brains = loadBrainsByDomain(domain);
  const ids = brains.map(b => b.frontmatter.counselor);
  return buildMultiCounselorContext(ids);
}

/**
 * Format red flags for prompt injection (user context section).
 */
export function formatRedFlagsForPrompt(counselorId: CounselorId): string | null {
  const brain = loadBrain(counselorId);
  if (!brain || brain.redFlags.length === 0) return null;

  const flags = brain.redFlags.map(rf => ({
    id: rf.id,
    label: rf.label,
    penalty: rf.penalty,
    before: rf.before,
    after: rf.after,
  }));

  return JSON.stringify(flags, null, 2);
}

/**
 * Format gold standards for prompt injection (user context section).
 */
export function formatGoldStandardsForPrompt(counselorId: CounselorId): string | null {
  const brain = loadBrain(counselorId);
  if (!brain || brain.goldStandards.length === 0) return null;

  const standards = brain.goldStandards.map(gs => ({
    id: gs.id,
    label: gs.label,
    bonus: gs.bonus,
    example: gs.example,
  }));

  return JSON.stringify(standards, null, 2);
}

/**
 * Build a complete scoring context for a dimension.
 * Combines frameworks + red flags + gold standards from multiple experts.
 */
export function buildDimensionScoringContext(
  counselorIds: CounselorId[],
  frameworkId: string
): string {
  const max = Math.min(counselorIds.length, MAX_EXPERTS_PER_PROMPT);
  const parts: string[] = [];

  for (let i = 0; i < max; i++) {
    const id = counselorIds[i];
    const brain = loadBrain(id);
    if (!brain) continue;

    const framework = brain.evaluationFrameworks[frameworkId];
    if (!framework) continue;

    parts.push(
      `## ${brain.name} — Framework: ${frameworkId}\n` +
      `${JSON.stringify(framework, null, 2)}\n\n` +
      `Red Flags:\n${JSON.stringify(brain.redFlags.slice(0, 3), null, 2)}\n\n` +
      `Gold Standards:\n${JSON.stringify(brain.goldStandards.slice(0, 3), null, 2)}`
    );
  }

  return parts.join('\n\n---\n\n');
}

/**
 * Get all available framework IDs for a counselor.
 */
export function getAvailableFrameworks(counselorId: CounselorId): string[] {
  const brain = loadBrain(counselorId);
  if (!brain) return [];
  return Object.keys(brain.evaluationFrameworks);
}
