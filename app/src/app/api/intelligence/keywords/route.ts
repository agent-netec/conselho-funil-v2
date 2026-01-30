export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { KeywordMiner } from '@/lib/intelligence/keywords/miner';
import { createIntelligenceDocument } from '@/lib/firebase/intelligence';
import { db } from '@/lib/firebase/config';

export async function POST(req: NextRequest) {
  try {
    const { brandId, seedTerm } = await req.json();

    if (!brandId || !seedTerm) {
      return NextResponse.json({ error: 'brandId and seedTerm are required' }, { status: 400 });
    }

    const miner = new KeywordMiner();
    const keywords = await miner.mine(brandId, seedTerm);

    // Salvar no Firestore (não bloqueia o retorno da mineração)
    const savedIds: string[] = [];
    let saveError: string | null = null;

    if (!db) {
      saveError = 'Firebase não inicializado no ambiente';
    } else {
      try {
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
      } catch (error: any) {
        saveError = error?.message || 'Falha ao persistir keywords';
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: keywords.length,
      keywords: keywords.map(k => k.term),
      persisted: savedIds.length,
      saveError,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
