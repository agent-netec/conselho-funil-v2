/**
 * campaign-context.ts — Shared helper to load campaign context for all engines.
 * Part of the Golden Thread (Linha de Ouro) interconectivity layer.
 *
 * Usage: `const ctx = await loadCampaignContext(campaignId);`
 * Returns null if campaign doesn't exist (graceful degradation).
 * Never throws — all errors are caught and logged.
 */
import { getCampaignAdmin } from '@/lib/firebase/firestore-server';

export interface CampaignContextData {
  id: string;
  bigIdea: string;
  tone: string;
  targetAudience: string;
  mainGoal: string;
  headlines: string[];
  hooks: string[];
  visualStyle: string;
  offerPromise: string;
  mainScript: string;
  /** Pre-formatted text block ready for prompt injection */
  text: string;
}

/**
 * Loads a campaign document and returns a typed context object
 * with a pre-formatted text block for prompt injection.
 *
 * - Returns `null` if campaignId is falsy or campaign doesn't exist.
 * - Never throws.
 */
export async function loadCampaignContext(
  campaignId: string | undefined | null
): Promise<CampaignContextData | null> {
  if (!campaignId || campaignId === 'undefined' || campaignId === 'null') {
    return null;
  }

  try {
    const campaign = await getCampaignAdmin(campaignId);
    if (!campaign) return null;

    const bigIdea = campaign.copywriting?.bigIdea || '';
    const tone = campaign.copywriting?.tone || '';
    const targetAudience = campaign.funnel?.targetAudience || '';
    const mainGoal = campaign.funnel?.mainGoal || '';
    const headlines: string[] = campaign.copywriting?.headlines || [];
    const hooks: string[] = (campaign.social?.hooks || []).map(
      (h: any) => (typeof h === 'string' ? h : h.content || '')
    );
    const visualStyle = campaign.design?.visualStyle || '';
    const offerPromise = campaign.offer?.promise || '';
    const mainScript = campaign.copywriting?.mainScript || '';

    // Build formatted text block
    const lines: string[] = ['## Contexto da Campanha (Linha de Ouro)'];
    if (bigIdea) lines.push(`**Big Idea:** ${bigIdea}`);
    if (tone) lines.push(`**Tom:** ${tone}`);
    if (targetAudience) lines.push(`**Público-Alvo:** ${targetAudience}`);
    if (mainGoal) lines.push(`**Objetivo:** ${mainGoal}`);
    if (offerPromise) lines.push(`**Promessa da Oferta:** ${offerPromise}`);
    if (headlines.length > 0) lines.push(`**Headlines:** ${headlines.slice(0, 5).join(' | ')}`);
    if (hooks.length > 0) lines.push(`**Hooks Aprovados:** ${hooks.slice(0, 5).join(' | ')}`);
    if (visualStyle) lines.push(`**Estilo Visual:** ${visualStyle}`);

    return {
      id: campaignId,
      bigIdea,
      tone,
      targetAudience,
      mainGoal,
      headlines,
      hooks,
      visualStyle,
      offerPromise,
      mainScript,
      text: lines.join('\n'),
    };
  } catch (err) {
    console.warn('[loadCampaignContext] Failed to load campaign:', err);
    return null;
  }
}
