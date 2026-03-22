/**
 * Social Batch Generation — Gap 1E
 * Generates N complete posts for a monthly content plan and sends them to the calendar as drafts.
 *
 * Input: brandId, platform, postsPerWeek (1-7), weeks (1-4), topics? (optional array of themes)
 * Output: Array of complete posts + calendar item IDs
 */

import { NextRequest } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { generateWithGemini, isGeminiConfigured, DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';
import { parseAIJSON } from '@/lib/ai/formatters';
import { getBrand } from '@/lib/firebase/brands';
import { ragQuery } from '@/lib/ai/rag';
import { requireBrandAccess, requireMinTier } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { consumeCredits, CREDIT_COSTS } from '@/lib/firebase/firestore-server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { loadBrandIntelligence } from '@/lib/intelligence/research/brand-context';
import { getAdminFirestore } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/** Map social platform strings to calendar platform type */
function mapPlatform(platform: string): 'instagram' | 'linkedin' | 'x' | 'tiktok' {
  const p = platform.toLowerCase();
  if (p.includes('instagram') || p.includes('reels')) return 'instagram';
  if (p.includes('linkedin')) return 'linkedin';
  if (p.includes('twitter') || p === 'x') return 'x';
  if (p.includes('tiktok')) return 'tiktok';
  return 'instagram';
}

/** Map post type to calendar format */
function mapFormat(postType?: string): 'post' | 'story' | 'carousel' | 'reel' {
  if (!postType) return 'post';
  const pt = postType.toLowerCase();
  if (pt.includes('reel') || pt.includes('video') || pt.includes('short')) return 'reel';
  if (pt.includes('carousel') || pt.includes('carrossel')) return 'carousel';
  if (pt.includes('story') || pt.includes('stories')) return 'story';
  return 'post';
}

export async function POST(request: NextRequest) {
  try {
    const { brandId, platform, postsPerWeek, weeks, topics } = await request.json();

    if (!brandId || !platform) {
      return createApiError(400, 'brandId e platform são obrigatórios.');
    }

    const pPerWeek = Math.min(Math.max(postsPerWeek || 3, 1), 7);
    const numWeeks = Math.min(Math.max(weeks || 4, 1), 4);
    const totalPosts = pPerWeek * numWeeks;

    // Auth + tier (Pro minimum for batch)
    let userId = '';
    try {
      const auth = await requireBrandAccess(request, brandId);
      userId = auth.userId;
      requireMinTier(auth.effectiveTier, 'starter');
    } catch (error) {
      return handleSecurityError(error);
    }

    // Credits: 1 per 3 posts (rounded up)
    const creditCost = Math.ceil(totalPosts / 3);
    try {
      await consumeCredits(userId, creditCost, 'social_batch');
    } catch (error) {
      return handleSecurityError(error);
    }

    if (!isGeminiConfigured()) {
      return createApiError(500, 'API do Gemini não configurada.');
    }

    // Load brand context
    let brandContext = 'Nenhuma marca selecionada.';
    let brand: any = null;
    try {
      brand = await getBrand(brandId);
      if (brand) {
        brandContext = `Marca: ${brand.name}\nVertical: ${brand.vertical}\nPosicionamento: ${brand.positioning}\nTom de Voz: ${brand.voiceTone}\nAudiência: ${brand.audience?.who || 'N/A'}\nDores: ${brand.audience?.pain || 'N/A'}\nOferta: ${brand.offer?.what || 'N/A'}\nDiferencial: ${brand.offer?.differentiator || 'N/A'}`;
      }
    } catch (err) {
      console.warn('[Social/Batch] Brand load failed:', err);
    }

    // Load brand intelligence
    let intelSection = '';
    try {
      const intel = await loadBrandIntelligence(brandId);
      if (intel?.keywords?.topByKOS?.length) {
        intelSection = `\n## KEYWORDS DA MARCA\n${intel.keywords.topByKOS.join(', ')}`;
      }
      if (intel?.persona) {
        intelSection += `\n## PERSONA\n${intel.persona.name}${intel.persona.pains?.length ? ` | Dores: ${intel.persona.pains.slice(0, 3).join('; ')}` : ''}`;
      }
    } catch (err) {
      console.warn('[Social/Batch] Intel fetch failed:', err);
    }

    // RAG knowledge
    const { context: knowledgeContext } = await ragQuery(
      `Melhores práticas de conteúdo para ${platform}. Heurísticas de engajamento e viralidade.`,
      { topK: 5, minSimilarity: 0.2, filters: { docType: 'heuristics' } }
    );

    // Build prompt
    const topicsList = topics?.length > 0
      ? `## Temas Fornecidos:\n${topics.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n')}\nUse esses temas como base, mas varie e expanda.`
      : 'Gere temas variados relevantes para a marca e sua vertical.';

    const prompt = `Você é o estrategista de conteúdo do MKTHONEY.

Crie um PLANO DE CONTEÚDO com exatamente ${totalPosts} posts COMPLETOS para a plataforma ${platform}.

## Configuração:
- ${pPerWeek} posts por semana
- ${numWeeks} semanas
- Total: ${totalPosts} posts

## Contexto da Marca:
${brandContext}
${intelSection}

${topicsList}

## Regras:
1. Cada post deve ser completo: hook (gancho), body (corpo 2-4 parágrafos), cta (chamada), hashtags (5-15)
2. Varie estilos: curiosidade, dor/problema, resultado, contra-intuitivo, autoridade, storytelling, lista
3. Varie formatos: post, carousel, reel, story (distribuição natural)
4. Cada post deve ter um tema diferente — NUNCA repita
5. Distribua por pilares de conteúdo (educativo, inspiracional, prova social, bastidores, oferta)
6. Adapte comprimento à plataforma:
   - Instagram: 150-300 palavras
   - LinkedIn: 200-400 palavras
   - X: 240-280 caracteres
   - TikTok: 50-150 palavras
7. Os posts devem formar uma narrativa progressiva ao longo das semanas

${knowledgeContext ? `## Heurísticas:\n${knowledgeContext}` : ''}

Retorne APENAS JSON:
{
  "plan": {
    "pillars": ["pilar 1", "pilar 2", "pilar 3", "pilar 4", "pilar 5"],
    "totalPosts": ${totalPosts}
  },
  "posts": [
    {
      "week": 1,
      "dayOfWeek": "Segunda",
      "pillar": "pilar X",
      "style": "estilo",
      "content": "hook (1 frase)",
      "body": "corpo do post (2-4 parágrafos separados por \\n\\n)",
      "cta": "chamada para ação",
      "hashtags": ["#tag1", "#tag2"],
      "suggestedVisual": "sugestão de visual",
      "postType": "post | reel | carousel | story"
    }
  ]
}`;

    console.log(`[Social/Batch] Generating ${totalPosts} posts for brand ${brandId}`);

    const response = await generateWithGemini(prompt, {
      model: DEFAULT_GEMINI_MODEL,
      temperature: brand?.aiConfiguration?.temperature || 0.85,
      topP: brand?.aiConfiguration?.topP || 0.95,
      maxOutputTokens: 16384,
      timeoutMs: 100_000,
    });

    if (!response?.trim()) {
      return createApiError(500, 'A IA retornou uma resposta vazia.');
    }

    let result;
    try {
      result = parseAIJSON(response);
    } catch (parseError) {
      console.error('[Social/Batch] Parse error:', parseError);
      return createApiError(500, 'Erro ao processar resposta da IA.');
    }

    const posts = result?.posts || [];
    if (posts.length === 0) {
      return createApiError(500, 'Nenhum post gerado. Tente novamente.');
    }

    // Save all posts to calendar as drafts
    const adminDb = getAdminFirestore();
    const createdItems = [];
    const now = new Date();

    const DAY_MAP: Record<string, number> = {
      'segunda': 1, 'terça': 2, 'quarta': 3, 'quinta': 4,
      'sexta': 5, 'sábado': 6, 'domingo': 0,
    };

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const week = (post.week || Math.floor(i / pPerWeek) + 1) - 1;

      // Calculate date: base + week offset + day distribution within week
      const scheduledDate = new Date(now);
      scheduledDate.setDate(now.getDate() + (week * 7) + (i % pPerWeek) + 1);
      scheduledDate.setHours(10, 0, 0, 0);

      // Try to use the specified day of week
      const dayKey = (post.dayOfWeek || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const targetDay = DAY_MAP[dayKey];
      if (targetDay !== undefined) {
        const currentDay = scheduledDate.getDay();
        const diff = targetDay - currentDay;
        scheduledDate.setDate(scheduledDate.getDate() + diff);
      }

      const contentStr = post.content || '';
      const nowTs = Timestamp.now();

      try {
        const itemData = {
          title: `[${post.pillar || post.style || 'Batch'}] ${contentStr.slice(0, 60)}${contentStr.length > 60 ? '...' : ''}`,
          format: mapFormat(post.postType),
          platform: mapPlatform(platform),
          scheduledDate: Timestamp.fromDate(scheduledDate),
          status: 'draft' as const,
          content: [contentStr, post.body, post.cta].filter(Boolean).join('\n\n'),
          postContent: {
            hook: contentStr,
            body: post.body || '',
            cta: post.cta || '',
            hashtags: post.hashtags || [],
          },
          ...(post.suggestedVisual && { suggestedVisual: post.suggestedVisual }),
          metadata: {
            generatedBy: 'ai',
            promptParams: {
              source: 'social_batch',
              week: post.week || week + 1,
              pillar: post.pillar || '',
              style: post.style || '',
            },
          },
          order: i,
          createdBy: userId,
          createdAt: nowTs,
          updatedAt: nowTs,
        };

        const colRef = adminDb.collection('brands').doc(brandId).collection('content_calendar');
        const docRef = await colRef.add(itemData);
        createdItems.push({ id: docRef.id, week: post.week, pillar: post.pillar, title: itemData.title });
      } catch (itemErr: any) {
        console.error(`[Social/Batch] Failed to create item ${i + 1}:`, itemErr);
      }
    }

    console.log(`[Social/Batch] Created ${createdItems.length}/${posts.length} calendar items`);

    return createApiSuccess({
      plan: result.plan,
      posts: posts.length,
      calendarItems: createdItems.length,
      creditsCost: creditCost,
      items: createdItems,
    });
  } catch (error: any) {
    console.error('[Social/Batch] Error:', error);
    if (error?.message?.includes('RESOURCE_EXHAUSTED') || error?.message?.includes('429')) {
      return createApiError(429, 'Cota de IA excedida. Tente novamente em alguns minutos.');
    }
    return createApiError(500, 'Erro interno no servidor', { details: String(error) });
  }
}
