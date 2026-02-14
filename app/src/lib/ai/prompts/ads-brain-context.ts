/**
 * Sprint C: Server-only brain context builder for Ads Generation.
 * Separated from ads-generation.ts because loader.ts uses `fs` (Node.js only)
 * and ads-generation.ts is re-exported through prompts/index.ts into client components.
 */
import { loadBrain } from '@/lib/intelligence/brains/loader';
import { buildScoringPromptFromBrain } from '@/lib/intelligence/brains/prompt-builder';
import type { CounselorId } from '@/types';

// ═══════════════════════════════════════════════════════
// ADS → EXPERTS MAPPING (Brain Integration — Sprint C)
// ═══════════════════════════════════════════════════════

interface AdsExpertMapping {
  counselorId: CounselorId;
  frameworkId: string;
}

/** 4 ads counselors with their primary frameworks */
const ADS_EXPERT_MAP: Record<string, AdsExpertMapping[]> = {
  strategy_scale: [
    { counselorId: 'justin_brooke', frameworkId: 'ad_strategy_score' },
    { counselorId: 'nicholas_kusmich', frameworkId: 'meta_ads_score' },
  ],
  technical_creative: [
    { counselorId: 'jon_loomer', frameworkId: 'technical_setup_score' },
    { counselorId: 'savannah_sanchez', frameworkId: 'creative_native_score' },
  ],
};

/**
 * Builds brain context string for ads generation.
 * Must be called from server-side only (API routes, server components).
 */
export function buildAdsBrainContext(): string {
  const parts: string[] = [];

  for (const [area, experts] of Object.entries(ADS_EXPERT_MAP)) {
    const expertParts: string[] = [];

    for (const { counselorId, frameworkId } of experts) {
      const brain = loadBrain(counselorId);
      if (!brain) continue;

      const frameworkJson = buildScoringPromptFromBrain(counselorId, frameworkId);
      if (!frameworkJson) continue;

      const redFlags = brain.redFlags.slice(0, 3).map(rf =>
        `- **${rf.label}**: "${rf.before}" → "${rf.after}"`
      ).join('\n');

      const goldStandards = brain.goldStandards.slice(0, 2).map(gs =>
        `- **${gs.label}**: ${gs.example}`
      ).join('\n');

      expertParts.push(
        `### ${brain.name} — ${brain.subtitle}\n` +
        `**Filosofia:** ${brain.philosophy.slice(0, 200)}...\n` +
        `**Framework (${frameworkId}):**\n${frameworkJson}\n` +
        (redFlags ? `**Erros Comuns:**\n${redFlags}\n` : '') +
        (goldStandards ? `**Padroes de Excelencia:**\n${goldStandards}` : '')
      );
    }

    if (expertParts.length > 0) {
      parts.push(expertParts.join('\n\n'));
    }
  }

  return parts.join('\n\n---\n\n');
}
