import { NextResponse } from 'next/server';
import { InboxAggregator } from '@/lib/agents/engagement/inbox-aggregator';
import { BrandVoiceTranslator } from '@/lib/agents/engagement/brand-voice-translator';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { Brand } from '@/types/database';

/**
 * API Route para teste de integração do Social Command Center.
 * GET /api/social-inbox?brandId=...&keyword=...
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get('brandId');
  const keyword = searchParams.get('keyword');

  if (!brandId || !keyword) {
    return NextResponse.json({ error: 'brandId e keyword são obrigatórios' }, { status: 400 });
  }

  try {
    // 1. Buscar Marca
    const brandRef = doc(db, 'brands', brandId);
    const brandSnap = await getDoc(brandRef);

    if (!brandSnap.exists()) {
      return NextResponse.json({ error: 'Marca não encontrada' }, { status: 404 });
    }

    const brandData = brandSnap.data() as Brand;

    // 2. Coletar Interações
    const aggregator = new InboxAggregator();
    const interactions = await aggregator.collectFromX(brandId, keyword);

    // 3. Gerar Sugestões para a primeira interação (se houver)
    const translator = new BrandVoiceTranslator();
    let suggestions = null;

    if (interactions.length > 0) {
      suggestions = await translator.generateSuggestions(interactions[0], brandData);
    }

    return NextResponse.json({
      brand: brandData.name,
      interactionsCount: interactions.length,
      sampleInteraction: interactions[0] || null,
      sampleSuggestions: suggestions
    });

  } catch (error: any) {
    console.error('[API Social Inbox] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
