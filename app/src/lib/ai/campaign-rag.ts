/**
 * campaign-rag.ts — Index campaign decisions into Pinecone for RAG retrieval.
 * Fire-and-forget: never blocks the calling engine, never throws to caller.
 */
import { generateEmbedding } from './embeddings';
import { upsertToPinecone, buildPineconeRecord } from './pinecone';
import { getCampaignAdmin } from '@/lib/firebase/firestore-server';

type DecisionSection = 'copywriting' | 'social' | 'design' | 'ads';

interface IndexDecisionParams {
  campaignId: string;
  brandId: string;
  section: DecisionSection;
  content?: string; // Optional override — if not provided, auto-formats from campaign doc
}

/**
 * Formats campaign section data into a text chunk suitable for embedding.
 */
function formatSectionContent(campaign: any, section: DecisionSection): string {
  switch (section) {
    case 'copywriting': {
      const c = campaign.copywriting;
      if (!c) return '';
      const parts = [`Decisão de Copy aprovada para campanha "${campaign.name || campaign.id}".`];
      if (c.bigIdea) parts.push(`Big Idea: ${c.bigIdea}`);
      if (c.tone) parts.push(`Tom: ${c.tone}`);
      if (c.headlines?.length) parts.push(`Headlines: ${c.headlines.join(' | ')}`);
      if (c.mainScript) parts.push(`Script principal: ${c.mainScript.slice(0, 500)}`);
      if (c.keyBenefits?.length) parts.push(`Benefícios-chave: ${c.keyBenefits.join(', ')}`);
      return parts.join('\n');
    }
    case 'social': {
      const s = campaign.social;
      if (!s) return '';
      const parts = [`Estratégia social aprovada para campanha "${campaign.name || campaign.id}".`];
      if (s.hooks?.length) {
        const hookTexts = s.hooks.map((h: any) => typeof h === 'string' ? h : h.content || '');
        parts.push(`Hooks: ${hookTexts.join(' | ')}`);
      }
      if (s.platforms?.length) parts.push(`Plataformas: ${s.platforms.join(', ')}`);
      if (s.campaignType) parts.push(`Tipo: ${s.campaignType}`);
      return parts.join('\n');
    }
    case 'design': {
      const d = campaign.design;
      if (!d) return '';
      const parts = [`Estilo visual selecionado para campanha "${campaign.name || campaign.id}".`];
      if (d.visualStyle) parts.push(`Estilo: ${d.visualStyle}`);
      if (d.preferredColors?.length) parts.push(`Cores: ${d.preferredColors.join(', ')}`);
      return parts.join('\n');
    }
    case 'ads': {
      const a = campaign.ads;
      if (!a) return '';
      const parts = [`Ads gerados para campanha "${campaign.name || campaign.id}".`];
      if (Array.isArray(a)) {
        const headlines = a.slice(0, 5).map((ad: any) => ad.headline || ad.title || '').filter(Boolean);
        if (headlines.length) parts.push(`Headlines dos ads: ${headlines.join(' | ')}`);
      }
      return parts.join('\n');
    }
    default:
      return '';
  }
}

/**
 * Indexes a campaign decision into Pinecone for semantic retrieval.
 * Generates embedding and upserts to the brand's namespace.
 *
 * Fire-and-forget: catches all errors internally.
 */
export async function indexCampaignDecision(params: IndexDecisionParams): Promise<void> {
  const { campaignId, brandId, section, content: overrideContent } = params;

  try {
    let text = overrideContent || '';

    if (!text) {
      const campaign = await getCampaignAdmin(campaignId);
      if (!campaign) {
        console.warn(`[CampaignRAG] Campaign ${campaignId} not found, skipping indexing.`);
        return;
      }
      text = formatSectionContent(campaign, section);
    }

    if (!text || text.length < 20) {
      console.warn(`[CampaignRAG] Content too short for section "${section}", skipping.`);
      return;
    }

    const embedding = await generateEmbedding(text);
    const recordId = `campaign_${campaignId}_${section}`;

    const record = buildPineconeRecord(recordId, embedding, {
      docType: 'campaign_decision',
      section,
      brandId,
      campaignId,
      status: 'active',
      version: '1.0',
      isApprovedForAI: true,
    });

    const namespace = `brand_${brandId}`;
    await upsertToPinecone([record], { namespace });

    console.log(`[CampaignRAG] Indexed "${section}" for campaign ${campaignId} in namespace ${namespace}`);
  } catch (err) {
    console.error(`[CampaignRAG] Failed to index "${section}" for campaign ${campaignId}:`, err);
  }
}
