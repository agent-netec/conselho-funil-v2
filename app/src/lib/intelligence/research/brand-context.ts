/**
 * Loads brand data from Firestore and formats it as prompt context
 * for Deep Research endpoints (chat, audience, dossier synthesis).
 *
 * Sprint 07: Expanded with loadBrandIntelligence() that aggregates
 * brand + keywords + research + case studies + offer lab + idealClient
 * into a single enriched context object for all engines.
 */

import { getAdminFirestore } from '@/lib/firebase/admin';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

export interface BrandIntelligence extends BrandContext {
  /** Persona ativa (idealClient expandido com triggers e segmentos) */
  persona: {
    source: 'research' | 'manual' | 'ideal_client';
    name: string;
    age: string;
    pains: string[];
    desires: string[];
    objections: string[];
    triggers: string[];
    summary: string;
    segments?: { hot: string; warm: string; cold: string };
  } | null;

  /** Oferta ativa do Offer Lab */
  activeOffer: {
    promise: string;
    price: number;
    bonuses: string[];
    guarantee: string;
    scarcity: string;
    scoring: { total: number };
  } | null;

  /** Keywords mineradas (top por opportunity score) */
  keywords: {
    terms: Array<{ term: string; volume: number; difficulty: number; intent: string; opportunityScore: number }>;
    topByKOS: string[];
  };

  /** Insights do Deep Research (último dossier) */
  researchInsights: {
    trends: string[];
    threats: string[];
    opportunities: string[];
    competitors: Array<{ name: string; strengths: string[]; weaknesses: string[] }>;
    lastUpdated: Date | null;
  };

  /** Spy Agent / Page Forensics case studies */
  spyInsights: Array<{
    competitorUrl: string;
    competitorName: string;
    strengths: string[];
    weaknesses: string[];
    emulate: string[];
    avoid: string[];
  }>;
}

// ---------------------------------------------------------------------------
// Loaders
// ---------------------------------------------------------------------------

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

/**
 * Loads full brand intelligence — brand doc + subcollections in parallel.
 * All queries are fire-and-forget safe: failures return empty defaults.
 */
export async function loadBrandIntelligence(brandId: string): Promise<BrandIntelligence | null> {
  try {
    const db = getAdminFirestore();
    const brandRef = db.collection('brands').doc(brandId);

    const logSubcollectionError = (collection: string, err: unknown) => {
      const code = (err as { code?: string })?.code;
      if (code === 'permission-denied') {
        console.error(`[loadBrandIntelligence] PERMISSION DENIED on brands/${brandId}/${collection} — verify firestore.rules`);
      } else {
        console.warn(`[loadBrandIntelligence] Failed to fetch ${collection}:`, code || err);
      }
      return null;
    };

    const [brandSnap, keywordsSnap, activeOfferSnap, researchSnap, caseStudiesSnap] = await Promise.all([
      brandRef.get(),
      brandRef.collection('keywords').orderBy('opportunityScore', 'desc').limit(20).get().catch(err => logSubcollectionError('keywords', err)),
      brandRef.collection('offers').where('status', '==', 'active').limit(1).get().catch(err => logSubcollectionError('offers', err)),
      brandRef.collection('research').orderBy('createdAt', 'desc').limit(1).get().catch(err => logSubcollectionError('research', err)),
      brandRef.collection('case_studies').orderBy('createdAt', 'desc').limit(5).get().catch(err => logSubcollectionError('case_studies', err)),
    ]);

    if (!brandSnap.exists) return null;
    const d = brandSnap.data()!;

    // Base context
    const base: BrandContext = {
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

    // Persona from idealClient
    const persona: BrandIntelligence['persona'] = d.idealClient ? {
      source: d.idealClient.source ?? 'ideal_client',
      name: d.idealClient.name ?? '',
      age: d.idealClient.age ?? '',
      pains: d.idealClient.pains ?? [],
      desires: d.idealClient.desires ?? [],
      objections: d.audience?.objections ?? [],
      triggers: d.idealClient.triggers ?? [],
      summary: d.idealClient.summary ?? '',
      ...(d.idealClient.segments?.hot ? { segments: d.idealClient.segments } : {}),
    } : null;

    // Keywords
    const keywordDocs = keywordsSnap?.docs ?? [];
    const terms = keywordDocs.map(doc => {
      const kd = doc.data();
      return {
        term: kd.term ?? '',
        volume: kd.volume ?? 0,
        difficulty: kd.difficulty ?? 0,
        intent: kd.intent ?? 'informational',
        opportunityScore: kd.opportunityScore ?? 0,
      };
    });

    // Active offer (Offer Lab)
    const offerDoc = activeOfferSnap?.docs?.[0]?.data();
    const activeOffer: BrandIntelligence['activeOffer'] = offerDoc ? {
      promise: offerDoc.promise ?? offerDoc.headline ?? '',
      price: offerDoc.price ?? d.offer?.ticket ?? 0,
      bonuses: offerDoc.bonuses ?? [],
      guarantee: offerDoc.guarantee ?? '',
      scarcity: offerDoc.scarcity ?? '',
      scoring: { total: offerDoc.scoring?.total ?? 0 },
    } : null;

    // Research insights (latest dossier)
    const dossierDoc = researchSnap?.docs?.[0]?.data();
    const researchInsights: BrandIntelligence['researchInsights'] = extractResearchInsights(dossierDoc);

    // Spy/Forensics case studies
    const caseDocs = caseStudiesSnap?.docs ?? [];
    const spyInsights: BrandIntelligence['spyInsights'] = caseDocs.map(doc => {
      const cs = doc.data();
      const insights = cs.insights ?? [];
      return {
        competitorUrl: cs.url ?? '',
        competitorName: cs.competitorName ?? cs.title ?? '',
        strengths: insights.filter((i: any) => i.category === 'strength').map((i: any) => i.text),
        weaknesses: insights.filter((i: any) => i.category === 'weakness').map((i: any) => i.text),
        emulate: insights.filter((i: any) => i.category === 'emulate').map((i: any) => i.text),
        avoid: insights.filter((i: any) => i.category === 'avoid').map((i: any) => i.text),
      };
    });

    return {
      ...base,
      persona,
      activeOffer,
      keywords: {
        terms,
        topByKOS: terms.slice(0, 5).map(k => k.term),
      },
      researchInsights,
      spyInsights,
    };
  } catch (err) {
    console.error('[loadBrandIntelligence] Failed:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractResearchInsights(dossierDoc: any): BrandIntelligence['researchInsights'] {
  const empty = { trends: [], threats: [], opportunities: [], competitors: [], lastUpdated: null };
  if (!dossierDoc) return empty;

  const sections = dossierDoc.sections ?? dossierDoc.analysis ?? {};
  const createdAt = dossierDoc.createdAt?.toDate?.() ?? null;

  // Dossier sections can vary — extract what we can
  const trends: string[] = [];
  const threats: string[] = [];
  const opportunities: string[] = [];
  const competitors: Array<{ name: string; strengths: string[]; weaknesses: string[] }> = [];

  // Iterate sections looking for relevant content
  if (Array.isArray(sections)) {
    for (const section of sections) {
      const title = (section.title ?? '').toLowerCase();
      const content = section.content ?? section.text ?? '';
      if (title.includes('tendência') || title.includes('trend')) {
        trends.push(...extractBullets(content));
      } else if (title.includes('ameaça') || title.includes('threat') || title.includes('risco')) {
        threats.push(...extractBullets(content));
      } else if (title.includes('oportunidade') || title.includes('opportunity')) {
        opportunities.push(...extractBullets(content));
      } else if (title.includes('concorr') || title.includes('competit')) {
        // Try to extract competitor names from bullet points
        const bullets = extractBullets(content);
        for (const bullet of bullets) {
          competitors.push({ name: bullet.slice(0, 60), strengths: [], weaknesses: [] });
        }
      }
    }
  } else if (typeof sections === 'object') {
    // Object-based sections (key: content)
    for (const [key, val] of Object.entries(sections)) {
      const k = key.toLowerCase();
      const content = typeof val === 'string' ? val : (val as any)?.content ?? '';
      if (k.includes('trend') || k.includes('tendência')) {
        trends.push(...extractBullets(content));
      } else if (k.includes('threat') || k.includes('ameaça') || k.includes('risk')) {
        threats.push(...extractBullets(content));
      } else if (k.includes('opportunit') || k.includes('oportunidade')) {
        opportunities.push(...extractBullets(content));
      }
    }
  }

  return { trends: trends.slice(0, 5), threats: threats.slice(0, 5), opportunities: opportunities.slice(0, 5), competitors: competitors.slice(0, 5), lastUpdated: createdAt };
}

function extractBullets(text: string): string[] {
  if (!text) return [];
  return text
    .split('\n')
    .map(l => l.replace(/^[\s\-*•]+/, '').trim())
    .filter(l => l.length > 5 && l.length < 300);
}

// ---------------------------------------------------------------------------
// Exported helpers — selective data loading for engines that don't need full intelligence
// ---------------------------------------------------------------------------

/** Top keywords by opportunity score */
export async function getTopKeywords(brandId: string, limit = 20): Promise<BrandIntelligence['keywords']> {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection(`brands/${brandId}/keywords`).orderBy('opportunityScore', 'desc').limit(limit).get();
    const terms = snap.docs.map(d => {
      const kd = d.data();
      return { term: kd.term ?? '', volume: kd.volume ?? 0, difficulty: kd.difficulty ?? 0, intent: kd.intent ?? 'informational', opportunityScore: kd.opportunityScore ?? 0 };
    });
    return { terms, topByKOS: terms.slice(0, 5).map(k => k.term) };
  } catch (err) {
    console.warn('[getTopKeywords] Failed:', err);
    return { terms: [], topByKOS: [] };
  }
}

/** Active offer from Offer Lab */
export async function getActiveOffer(brandId: string): Promise<BrandIntelligence['activeOffer']> {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection(`brands/${brandId}/offers`).where('status', '==', 'active').limit(1).get();
    if (snap.empty) return null;
    const o = snap.docs[0].data();
    return { promise: o.promise ?? o.headline ?? '', price: o.price ?? 0, bonuses: o.bonuses ?? [], guarantee: o.guarantee ?? '', scarcity: o.scarcity ?? '', scoring: { total: o.scoring?.total ?? 0 } };
  } catch (err) {
    console.warn('[getActiveOffer] Failed:', err);
    return null;
  }
}

/** Latest research dossier insights */
export async function getLatestResearch(brandId: string): Promise<BrandIntelligence['researchInsights']> {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection(`brands/${brandId}/research`).orderBy('createdAt', 'desc').limit(1).get();
    return extractResearchInsights(snap.empty ? null : snap.docs[0].data());
  } catch (err) {
    console.warn('[getLatestResearch] Failed:', err);
    return { trends: [], threats: [], opportunities: [], competitors: [], lastUpdated: null };
  }
}

/** Recent spy/forensics case studies */
export async function getSpyInsights(brandId: string, limit = 5): Promise<BrandIntelligence['spyInsights']> {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection(`brands/${brandId}/case_studies`).orderBy('createdAt', 'desc').limit(limit).get();
    return snap.docs.map(d => {
      const cs = d.data();
      const insights = cs.insights ?? [];
      return {
        competitorUrl: cs.url ?? '', competitorName: cs.competitorName ?? cs.title ?? '',
        strengths: insights.filter((i: any) => i.category === 'strength').map((i: any) => i.text),
        weaknesses: insights.filter((i: any) => i.category === 'weakness').map((i: any) => i.text),
        emulate: insights.filter((i: any) => i.category === 'emulate').map((i: any) => i.text),
        avoid: insights.filter((i: any) => i.category === 'avoid').map((i: any) => i.text),
      };
    });
  } catch (err) {
    console.warn('[getSpyInsights] Failed:', err);
    return [];
  }
}

/** Active persona (idealClient from brand doc) */
export async function getActivePersona(brandId: string): Promise<BrandIntelligence['persona']> {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection('brands').doc(brandId).get();
    if (!snap.exists) return null;
    const d = snap.data()!;
    if (!d.idealClient) return null;
    return {
      source: d.idealClient.source ?? 'ideal_client', name: d.idealClient.name ?? '', age: d.idealClient.age ?? '',
      pains: d.idealClient.pains ?? [], desires: d.idealClient.desires ?? [], objections: d.audience?.objections ?? [],
      triggers: d.idealClient.triggers ?? [], summary: d.idealClient.summary ?? '',
      ...(d.idealClient.segments?.hot ? { segments: d.idealClient.segments } : {}),
    };
  } catch (err) {
    console.warn('[getActivePersona] Failed:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

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

/**
 * Formats the full BrandIntelligence as rich prompt context.
 * Includes persona, active offer, keywords, research, and spy insights.
 */
export function formatBrandIntelligenceForPrompt(intel: BrandIntelligence): string {
  const parts: string[] = [];

  // Base
  parts.push(`# MARCA: ${intel.name} (${intel.vertical})`);
  parts.push(`Tom: ${intel.voiceTone}`);
  parts.push(`Posicionamento: ${intel.positioning}`);
  parts.push(`Público: ${intel.audience.who}`);
  parts.push(`Consciência: ${intel.audience.awareness}`);
  if (intel.audience.objections.length > 0) {
    parts.push(`Objeções conhecidas: ${intel.audience.objections.join('; ')}`);
  }
  parts.push(`Oferta: ${intel.offer.what} — R$${intel.offer.ticket} (${intel.offer.type})`);
  parts.push(`Diferencial: ${intel.offer.differentiator}`);

  // Persona
  if (intel.persona) {
    parts.push('');
    parts.push(`## PERSONA ATIVA (fonte: ${intel.persona.source})`);
    parts.push(`Nome: ${intel.persona.name}${intel.persona.age ? `, ${intel.persona.age}` : ''}`);
    if (intel.persona.pains.length > 0) parts.push(`Dores: ${intel.persona.pains.join('; ')}`);
    if (intel.persona.desires.length > 0) parts.push(`Desejos: ${intel.persona.desires.join('; ')}`);
    if (intel.persona.objections.length > 0) parts.push(`Objeções: ${intel.persona.objections.join('; ')}`);
    if (intel.persona.triggers.length > 0) parts.push(`Gatilhos de compra: ${intel.persona.triggers.join('; ')}`);
    if (intel.persona.segments) {
      parts.push(`Segmentos: HOT=${intel.persona.segments.hot} | WARM=${intel.persona.segments.warm} | COLD=${intel.persona.segments.cold}`);
    }
  }

  // Active Offer
  if (intel.activeOffer) {
    parts.push('');
    parts.push(`## OFERTA ATIVA (Offer Lab — Score: ${intel.activeOffer.scoring.total}/100)`);
    parts.push(`Promessa: ${intel.activeOffer.promise}`);
    parts.push(`Preço: R$${intel.activeOffer.price}`);
    if (intel.activeOffer.guarantee) parts.push(`Garantia: ${intel.activeOffer.guarantee}`);
    if (intel.activeOffer.bonuses.length > 0) parts.push(`Bônus: ${intel.activeOffer.bonuses.join('; ')}`);
    if (intel.activeOffer.scarcity) parts.push(`Escassez: ${intel.activeOffer.scarcity}`);
  }

  // Keywords
  if (intel.keywords.topByKOS.length > 0) {
    parts.push('');
    parts.push(`## KEYWORDS TOP (por oportunidade)`);
    parts.push(intel.keywords.topByKOS.join(', '));
  }

  // Research
  const ri = intel.researchInsights;
  if (ri.trends.length > 0 || ri.threats.length > 0 || ri.opportunities.length > 0) {
    parts.push('');
    parts.push(`## INSIGHTS DE MERCADO (Deep Research)`);
    if (ri.trends.length > 0) parts.push(`Tendências: ${ri.trends.join('; ')}`);
    if (ri.opportunities.length > 0) parts.push(`Oportunidades: ${ri.opportunities.join('; ')}`);
    if (ri.threats.length > 0) parts.push(`Ameaças: ${ri.threats.join('; ')}`);
    if (ri.competitors.length > 0) {
      parts.push(`Concorrentes mapeados: ${ri.competitors.map(c => c.name).join(', ')}`);
    }
  }

  // Spy
  if (intel.spyInsights.length > 0) {
    parts.push('');
    parts.push(`## ANÁLISE DE CONCORRENTES (Spy Agent)`);
    for (const spy of intel.spyInsights.slice(0, 3)) {
      parts.push(`**${spy.competitorName}** (${spy.competitorUrl})`);
      if (spy.emulate.length > 0) parts.push(`  Emular: ${spy.emulate.join('; ')}`);
      if (spy.avoid.length > 0) parts.push(`  Evitar: ${spy.avoid.join('; ')}`);
    }
  }

  return parts.join('\n');
}
