/**
 * Sprint F: Server-only brain context builder for Design Generation.
 * Loads design_director identity card and injects C.H.A.P.E.U framework
 * dynamically instead of hardcoded elements.
 */
import { loadBrain } from '@/lib/intelligence/brains/loader';
import { buildScoringPromptFromBrain } from '@/lib/intelligence/brains/prompt-builder';
import type { CounselorId } from '@/types';

// ═══════════════════════════════════════════════════════
// DESIGN → EXPERT MAPPING (Brain Integration — Sprint F)
// ═══════════════════════════════════════════════════════

interface DesignExpertMapping {
  counselorId: CounselorId;
  frameworkId: string;
}

/** Design director with both frameworks */
const DESIGN_EXPERT_MAP: Record<string, DesignExpertMapping[]> = {
  visual_direction: [
    { counselorId: 'design_director', frameworkId: 'visual_impact_score' },
    { counselorId: 'design_director', frameworkId: 'chapeu_compliance' },
  ],
};

/**
 * Builds brain context string for design generation.
 * Replaces hardcoded C.H.A.P.E.U elements with dynamic brain data.
 * Must be called from server-side only (API routes).
 */
export function buildDesignBrainContext(): string {
  const parts: string[] = [];

  for (const [area, experts] of Object.entries(DESIGN_EXPERT_MAP)) {
    const expertParts: string[] = [];

    for (const { counselorId, frameworkId } of experts) {
      const brain = loadBrain(counselorId);
      if (!brain) continue;

      const frameworkJson = buildScoringPromptFromBrain(counselorId, frameworkId);
      if (!frameworkJson) continue;

      // Only add philosophy/voice once (same counselor for both frameworks)
      if (expertParts.length === 0) {
        const redFlags = brain.redFlags.slice(0, 3).map(rf =>
          `- **${rf.label}**: "${rf.before}" → "${rf.after}"`
        ).join('\n');

        const goldStandards = brain.goldStandards.slice(0, 2).map(gs =>
          `- **${gs.label}**: ${gs.example}`
        ).join('\n');

        expertParts.push(
          `### ${brain.name} — ${brain.subtitle}\n` +
          `**Filosofia:** ${brain.philosophy.slice(0, 300)}...\n` +
          `**Principios:** ${brain.principles.slice(0, 300)}...\n` +
          `**Voz:** ${brain.voice.slice(0, 200)}...\n` +
          `**Framework (${frameworkId}):**\n${frameworkJson}\n` +
          (redFlags ? `**Erros Comuns a Evitar:**\n${redFlags}\n` : '') +
          (goldStandards ? `**Padroes de Excelencia:**\n${goldStandards}` : '')
        );
      } else {
        // Additional framework from same counselor — just add the framework
        expertParts.push(
          `**Framework (${frameworkId}):**\n${frameworkJson}`
        );
      }
    }

    if (expertParts.length > 0) {
      parts.push(expertParts.join('\n\n'));
    }
  }

  if (parts.length === 0) return '';

  return `\n## DIREÇÃO DE ARTE — BRAIN CONTEXT (Identity Card)\n\n` +
    `Aplique rigorosamente os frameworks e principios abaixo do Diretor de Arte:\n\n` +
    parts.join('\n\n---\n\n');
}
