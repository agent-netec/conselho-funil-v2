export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { updateUserUsageAdmin } from '@/lib/firebase/firestore-server';
import { generateWithGemini, DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';
import { buildBriefingPrompt } from '@/lib/ai/prompts/briefing-prompt';
import { fetchLogoAsBase64 } from '@/lib/briefing/logo-fetcher';
import { buildBriefingPdfHtml } from '@/lib/briefing/briefing-pdf-html';
import { buildBriefingSlidesHtml } from '@/lib/briefing/briefing-slides-html';
import type { CampaignContext } from '@/types/campaign';
import type { BriefingSections, BriefingFormat } from '@/types/briefing';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/campaigns/[id]/generate-briefing
 *
 * Gera um briefing estratégico rico em HTML (PDF document ou Slides).
 * O client abre o HTML numa nova aba — o usuário salva como PDF via print.
 * Custo: 3 créditos.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
    }

    // Parse body
    let format: BriefingFormat = 'pdf';
    try {
      const body = await request.json();
      if (body.format === 'slides') format = 'slides';
    } catch {
      // default to pdf
    }

    const adminDb = getAdminFirestore();

    // 1. Load campaign
    const campaignSnap = await adminDb.collection('campaigns').doc(campaignId).get();
    if (!campaignSnap.exists) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const campaign = { id: campaignSnap.id, ...campaignSnap.data() } as CampaignContext;
    const brandId = campaign.brandId;

    // 2. Auth guard
    let userId: string | undefined;
    if (brandId) {
      try {
        const access = await requireBrandAccess(request, brandId);
        userId = access.userId;
      } catch (err) {
        return handleSecurityError(err);
      }
    }

    // 3. Verify campaign is complete
    if (!campaign.funnel || !campaign.copywriting || !campaign.social || !campaign.design || !campaign.ads) {
      return NextResponse.json(
        { error: 'Campaign must be complete (all 5 stages) to generate briefing' },
        { status: 400 }
      );
    }

    // 4. Load brand name + logo
    let brandName = 'Marca';
    let logoUrl: string | null = null;

    if (brandId) {
      try {
        const brandSnap = await adminDb.collection('brands').doc(brandId).get();
        if (brandSnap.exists) {
          const brandData = brandSnap.data() as Record<string, unknown>;
          brandName = (brandData.name as string) || brandName;
          const brandKit = brandData.brandKit as Record<string, unknown> | undefined;
          const logoLock = brandKit?.logoLock as Record<string, unknown> | undefined;
          const variants = logoLock?.variants as Record<string, unknown> | undefined;
          const primary = variants?.primary as Record<string, unknown> | undefined;
          logoUrl = (primary?.url as string) || null;
        }
      } catch (e) {
        console.warn('[GenerateBriefing] Failed to load brand:', e);
      }
    }

    // 5. Fetch logo as base64
    const logoBase64 = await fetchLogoAsBase64(logoUrl);

    // 6. Generate briefing sections via Gemini
    const { systemPrompt, userPrompt } = buildBriefingPrompt(campaign, brandName);

    let rawJson: string;
    try {
      rawJson = await generateWithGemini(userPrompt, {
        model: DEFAULT_GEMINI_MODEL,
        temperature: 0.3,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
        systemPrompt,
        userId: userId || 'system',
        brandId,
        feature: 'campaign_briefing',
        timeoutMs: 60_000,
      });
    } catch (geminiErr) {
      console.error('[GenerateBriefing] Gemini call failed:', geminiErr);
      return NextResponse.json(
        { error: 'Falha ao gerar conteúdo do briefing via IA. Tente novamente.' },
        { status: 502 }
      );
    }

    // Parse JSON response
    let sections: BriefingSections;
    try {
      let jsonStr = rawJson.trim();
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
      sections = JSON.parse(jsonStr.trim()) as BriefingSections;
    } catch (parseErr) {
      console.error('[GenerateBriefing] Failed to parse Gemini response:', parseErr);
      console.error('[GenerateBriefing] Raw response:', rawJson.slice(0, 500));
      return NextResponse.json(
        { error: 'Falha ao processar resposta da IA. Tente novamente.' },
        { status: 500 }
      );
    }

    // 7. Build HTML
    const now = new Date();
    const generatedAt = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const templateData = {
      brandName,
      campaignName: campaign.name || 'Campanha',
      logoBase64,
      sections,
      generatedAt,
    };

    const html = format === 'slides'
      ? buildBriefingSlidesHtml(templateData)
      : buildBriefingPdfHtml(templateData);

    // 8. Debit credits
    if (userId) {
      try {
        await updateUserUsageAdmin(userId, -3);
        console.log(`[GenerateBriefing] 3 créditos debitados: ${userId}`);
      } catch (creditErr) {
        console.error('[GenerateBriefing] Credit debit failed:', creditErr);
      }
    }

    // 9. Return HTML
    return NextResponse.json({ html });
  } catch (error) {
    console.error('[GenerateBriefing] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate briefing', details: String(error) },
      { status: 500 }
    );
  }
}
