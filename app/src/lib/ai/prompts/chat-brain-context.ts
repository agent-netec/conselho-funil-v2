/**
 * Sprint D: Server-only brain context builder for Chat System prompts.
 * Separated from chat-system.ts because loader.ts uses `fs` (Node.js only)
 * and chat-system.ts is re-exported through prompts/index.ts into client components.
 *
 * Injects: filosofia + principios + catchphrases (narrative, NO frameworks JSON)
 * Budget: ~2500 tokens per council type
 */
import { loadBrain } from '@/lib/intelligence/brains/loader';
import type { CounselorId } from '@/types';

// ═══════════════════════════════════════════════════════
// CHAT → COUNSELORS BY COUNCIL TYPE (Brain Integration — Sprint D)
// ═══════════════════════════════════════════════════════

type CouncilType = 'funnel' | 'copy' | 'social' | 'ads';

const COUNCIL_COUNSELORS: Record<CouncilType, CounselorId[]> = {
  funnel: [
    'russell_brunson', 'dan_kennedy', 'frank_kern',
    'sam_ovens', 'ryan_deiss', 'perry_belcher',
  ],
  copy: [
    'eugene_schwartz', 'gary_halbert', 'dan_kennedy_copy',
    'joseph_sugarman', 'claude_hopkins', 'david_ogilvy',
    'john_carlton', 'drayton_bird', 'frank_kern_copy',
  ],
  social: [
    'lia_haberman', 'rachel_karten', 'nikita_beer', 'justin_welsh',
  ],
  ads: [
    'justin_brooke', 'nicholas_kusmich', 'jon_loomer', 'savannah_sanchez',
  ],
};

/**
 * Builds narrative brain context for a specific council type.
 * Includes filosofia + principios + catchphrases (NO frameworks JSON — token budget).
 * Must be called from server-side only (API routes, server components).
 */
export function buildChatBrainContext(councilType: CouncilType): string {
  const counselorIds = COUNCIL_COUNSELORS[councilType];
  if (!counselorIds) return '';

  const parts: string[] = [];

  for (const counselorId of counselorIds) {
    const brain = loadBrain(counselorId);
    if (!brain) continue;

    const catchphrases = brain.catchphrases.slice(0, 3).map(c => `"${c}"`).join(', ');

    parts.push(
      `### ${brain.name} — ${brain.subtitle}\n` +
      `**Filosofia:** ${brain.philosophy.slice(0, 250)}\n` +
      `**Principios:** ${brain.principles.slice(0, 300)}\n` +
      (catchphrases ? `**Frases tipicas:** ${catchphrases}` : '')
    );
  }

  if (parts.length === 0) return '';

  return `## IDENTITY CARDS DOS ESPECIALISTAS (Conhecimento Real)\n\n${parts.join('\n\n---\n\n')}`;
}
