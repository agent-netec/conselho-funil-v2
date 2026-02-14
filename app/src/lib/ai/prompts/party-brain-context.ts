/**
 * Sprint D: Server-only brain context builder for Party Mode (debate).
 * Separated from party-mode.ts because loader.ts uses `fs` (Node.js only)
 * and party-mode.ts is re-exported through prompts/index.ts into client components.
 *
 * DYNAMIC: Loads identity cards for the specific agents selected by the user.
 * Injects: filosofia + principios + voz + catchphrases per selected agent.
 */
import { loadBrain } from '@/lib/intelligence/brains/loader';
import type { CounselorId } from '@/types';

/**
 * Builds brain context for Party Mode based on user-selected agents.
 * Returns enriched descriptions with real identity card content.
 * Must be called from server-side only (API routes).
 */
export function buildPartyBrainContext(agentIds: string[]): string {
  if (!agentIds || agentIds.length === 0) return '';

  const parts: string[] = [];

  for (const agentId of agentIds) {
    const brain = loadBrain(agentId as CounselorId);
    if (!brain) continue;

    const catchphrases = brain.catchphrases.slice(0, 4).map(c => `"${c}"`).join(', ');

    parts.push(
      `### ${brain.name} — ${brain.subtitle}\n` +
      `**Filosofia:** ${brain.philosophy.slice(0, 300)}\n` +
      `**Principios:** ${brain.principles.slice(0, 350)}\n` +
      `**Voz:** ${brain.voice.slice(0, 200)}\n` +
      (catchphrases ? `**Frases tipicas (USE-AS no debate):** ${catchphrases}` : '')
    );
  }

  if (parts.length === 0) return '';

  return `## IDENTITY CARDS DOS ESPECIALISTAS CONVOCADOS (Debate com Voz Autentica)\n\nIMPORTANTE: Cada especialista DEVE falar com seu tom de voz real, usando suas frases tipicas e fundamentando suas opinioes em seus principios operacionais listados abaixo.\n\n${parts.join('\n\n---\n\n')}`;
}
