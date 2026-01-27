import { NextRequest, NextResponse } from 'next/server';
import { KeywordMiner } from '@/lib/intelligence/keywords/miner';
import { createIntelligenceDocument } from '@/lib/firebase/intelligence';

export async function POST(req: NextRequest) {
  try {
    const { brandId, seedTerm } = await req.json();

    if (!brandId || !seedTerm) {
      return NextResponse.json({ error: 'brandId and seedTerm are required' }, { status: 400 });
    }

    const miner = new KeywordMiner();
    const keywords = await miner.mine(brandId, seedTerm);

    // Salvar no Firestore
    const savedIds = [];
    for (const kw of keywords) {
      const id = await createIntelligenceDocument({
        brandId,
        type: 'keyword',
        source: {
          platform: 'google_autocomplete',
          fetchedVia: 'api',
        },
        content: {
          text: kw.term,
          keywordData: kw,
        } as any,
      });
      savedIds.push(id);
    }

    return NextResponse.json({ 
      success: true, 
      count: keywords.length,
      keywords: keywords.map(k => k.term)
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
