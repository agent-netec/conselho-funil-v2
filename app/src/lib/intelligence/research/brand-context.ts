/**
 * Loads brand data from Firestore and formats it as prompt context
 * for Deep Research endpoints (chat, audience, dossier synthesis).
 */

import { getAdminFirestore } from '@/lib/firebase/admin';

export interface BrandContext {
  name: string;
  vertical: string;
  positioning: string;
  voiceTone: string;
  audience: {
    who: string;
    pain: string;
    awareness: string;
    objections: string[];
  };
  offer: {
    what: string;
    ticket: number;
    type: string;
    differentiator: string;
  };
  idealClient?: {
    name: string;
    summary: string;
    pains: string[];
    desires: string[];
  };
}

export async function loadBrandContext(brandId: string): Promise<BrandContext | null> {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection('brands').doc(brandId).get();
    if (!snap.exists) return null;
    const d = snap.data()!;
    return {
      name: d.name ?? '',
      vertical: d.vertical ?? '',
      positioning: d.positioning ?? '',
      voiceTone: d.voiceTone ?? '',
      audience: {
        who: d.audience?.who ?? '',
        pain: d.audience?.pain ?? '',
        awareness: d.audience?.awareness ?? '',
        objections: d.audience?.objections ?? [],
      },
      offer: {
        what: d.offer?.what ?? '',
        ticket: d.offer?.ticket ?? 0,
        type: d.offer?.type ?? '',
        differentiator: d.offer?.differentiator ?? '',
      },
      ...(d.idealClient ? {
        idealClient: {
          name: d.idealClient.name,
          summary: d.idealClient.summary,
          pains: d.idealClient.pains ?? [],
          desires: d.idealClient.desires ?? [],
        },
      } : {}),
    };
  } catch {
    return null;
  }
}

export function formatBrandContextForPrompt(brand: BrandContext): string {
  const lines: string[] = [
    `# CONTEXTO DA MARCA`,
    `Marca: ${brand.name}`,
    `Vertical/Nicho: ${brand.vertical}`,
    `Posicionamento: ${brand.positioning}`,
    `Tom de Voz: ${brand.voiceTone}`,
    '',
    `## Público-Alvo`,
    `Quem: ${brand.audience.who}`,
    `Dor principal: ${brand.audience.pain}`,
    `Nível de consciência: ${brand.audience.awareness}`,
  ];

  if (brand.audience.objections.length > 0) {
    lines.push(`Objeções: ${brand.audience.objections.join('; ')}`);
  }

  lines.push(
    '',
    `## Oferta`,
    `O que vende: ${brand.offer.what}`,
    `Ticket: R$${brand.offer.ticket}`,
    `Tipo: ${brand.offer.type}`,
    `Diferencial: ${brand.offer.differentiator}`,
  );

  if (brand.idealClient) {
    lines.push(
      '',
      `## Cliente Ideal (salvo)`,
      `Nome: ${brand.idealClient.name}`,
      `Resumo: ${brand.idealClient.summary}`,
      `Dores: ${brand.idealClient.pains.join('; ')}`,
      `Desejos: ${brand.idealClient.desires.join('; ')}`,
    );
  }

  return lines.join('\n');
}
