# Sprint 07 — Brand Intelligence Layer (Interconectividade)

> **Máxima:** Progressão Contínua — Zero Becos Sem Saída
> **Princípio:** Interconectividade — todos os engines alimentam e consultam
> **Bloqueado por:** Sprint 03 (Brands P0 — estrutura de dados da marca)
> **Desbloqueia:** Sprint 09 (Discovery), Sprint 11 (Forensics)
> **Ref doc master:** Seção 10
> **Estimativa:** 5-7 dias (4 etapas incrementais)

---

## Contexto

Padrão identificado: Vault, Predict, Offer Lab, Deep Research, Personalization, Spy Agent geram dados valiosos que morrem isolados. Cada feature funciona bem sozinha mas não conversa com as outras.

Ao invés de dezenas de conexões ponto-a-ponto, expandir `brand-context.ts` existente para carregar tudo de um lugar: persona, oferta ativa, keywords, insights de research. Todos os engines que já consultam brand context ganham contexto rico automaticamente.

---

## Tarefa 07.1 — Etapa 1: Expandir `brand-context.ts`

**Arquivo:** `app/src/lib/intelligence/research/brand-context.ts`
**Ref:** Seção 10, Etapa 1

### Hoje carrega:
- Nome, vertical, tom, público, oferta, idealClient

### Expandir para carregar:

```typescript
export interface BrandIntelligence {
  // Base (já existe):
  name: string;
  vertical: string;
  tone: string;
  audience: { who: string; pain: string; awareness: string; objections: string[] };
  offer: { what: string; ticket: number; differentiator: string };

  // NOVO — Persona ativa:
  persona: {
    source: 'deep_scan' | 'ideal_client' | 'audience_analysis';
    name: string;
    age: string;
    pains: string[];
    desires: string[];
    objections: string[];
    triggers: string[];
    sophistication: number; // 1-5
    segments?: { hot: string; warm: string; cold: string };
  } | null;

  // NOVO — Oferta ativa (do Offer Lab):
  activeOffer: {
    promise: string;
    price: number;
    bonuses: string[];
    guarantee: string;
    scarcity: string;
    hormoziScore: number;
    councilScore: number;
  } | null;

  // NOVO — Keywords da marca:
  keywords: {
    terms: Array<{ term: string; volume: number; difficulty: number; intent: string; kos: number }>;
    topByKOS: string[]; // Top 5 por KOS score
    clusters?: Array<{ name: string; terms: string[]; awarenessStage: string }>;
  };

  // NOVO — Research insights:
  researchInsights: {
    trends: string[];
    threats: string[];
    opportunities: string[];
    competitors: Array<{ name: string; strengths: string[]; weaknesses: string[] }>;
    lastUpdated: Date | null;
  };

  // NOVO — Spy insights (quando houver):
  spyInsights: Array<{
    competitorUrl: string;
    strengths: string[];
    weaknesses: string[];
    emulate: string[];
    avoid: string[];
  }>;
}
```

### Implementação:

```typescript
export async function loadBrandIntelligence(brandId: string): Promise<BrandIntelligence> {
  const [brand, keywords, offers, research, spy, persona] = await Promise.all([
    getBrand(brandId),
    getTopKeywords(brandId, 20),
    getActiveOffer(brandId),
    getLatestResearch(brandId),
    getSpyInsights(brandId, 3), // últimos 3
    getActivePersona(brandId),
  ]);

  return {
    // Base
    name: brand.name,
    vertical: brand.vertical,
    tone: brand.voiceTone || '',
    audience: {
      who: brand.audience?.who || '',
      pain: brand.audience?.pain || '',
      awareness: brand.audience?.awareness || '',
      objections: brand.audience?.objections || [],
    },
    offer: {
      what: brand.offer?.what || '',
      ticket: brand.offer?.ticket || 0,
      differentiator: brand.offer?.differentiator || '',
    },

    // Enriquecido
    persona: persona || null,
    activeOffer: offers || null,
    keywords: {
      terms: keywords,
      topByKOS: keywords.slice(0, 5).map(k => k.term),
    },
    researchInsights: research || { trends: [], threats: [], opportunities: [], competitors: [], lastUpdated: null },
    spyInsights: spy || [],
  };
}
```

### Helpers de Firestore:

```typescript
async function getTopKeywords(brandId: string, limit: number) {
  return db.collection(`brands/${brandId}/keywords`)
    .orderBy('kos', 'desc')
    .limit(limit)
    .get()
    .then(snap => snap.docs.map(d => d.data()));
}

async function getActiveOffer(brandId: string) {
  const snap = await db.collection(`brands/${brandId}/offers`)
    .where('status', '==', 'active')
    .limit(1)
    .get();
  return snap.empty ? null : snap.docs[0].data();
}

async function getLatestResearch(brandId: string) {
  const snap = await db.collection(`brands/${brandId}/dossiers`)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();
  return snap.empty ? null : snap.docs[0].data()?.sections;
}

async function getSpyInsights(brandId: string, limit: number) {
  return db.collection(`brands/${brandId}/case_studies`)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get()
    .then(snap => snap.docs.map(d => ({
      competitorUrl: d.data().url,
      strengths: d.data().analysis?.strengths || [],
      weaknesses: d.data().analysis?.weaknesses || [],
      emulate: d.data().analysis?.emulate || [],
      avoid: d.data().analysis?.avoid || [],
    })));
}

async function getActivePersona(brandId: string) {
  // Prioridade: Deep-Scan > idealClient > audience analysis
  const brand = await getBrand(brandId);
  if (brand.idealClient) {
    return { source: 'ideal_client', ...brand.idealClient };
  }
  // Fallback: último audience analysis
  const snap = await db.collection(`brands/${brandId}/audience_analyses`)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();
  return snap.empty ? null : { source: 'audience_analysis', ...snap.docs[0].data().persona };
}
```

### Critérios de aceitação:
- [x] `loadBrandIntelligence()` retorna todos os dados disponíveis (brand + keywords + offers + research + case_studies)
- [x] Campos ausentes retornam null/[] (não erro) — cada subcollection query tem .catch(() => null)
- [x] Performance: todas as queries em `Promise.all` (5 queries paralelas)
- [x] `formatBrandIntelligenceForPrompt()` formata tudo como markdown para prompt

---

## Tarefa 07.2 — Etapa 2: Injetar nos prompts de Copy/Social/Ads/Chat

**Ref:** Seção 10, Etapa 2

### Formatter para prompt:

```typescript
export function formatBrandIntelligenceForPrompt(intel: BrandIntelligence): string {
  const parts: string[] = [];

  // Base
  parts.push(`# MARCA: ${intel.name} (${intel.vertical})`);
  parts.push(`Tom: ${intel.tone}`);
  parts.push(`Público: ${intel.audience.who}`);
  parts.push(`Consciência: ${intel.audience.awareness}`);

  // Persona
  if (intel.persona) {
    parts.push(`\n## PERSONA ATIVA (${intel.persona.source})`);
    parts.push(`Nome: ${intel.persona.name}, ${intel.persona.age}`);
    parts.push(`Dores: ${intel.persona.pains.join(', ')}`);
    parts.push(`Desejos: ${intel.persona.desires.join(', ')}`);
    parts.push(`Objeções: ${intel.persona.objections.join(', ')}`);
    parts.push(`Gatilhos de compra: ${intel.persona.triggers.join(', ')}`);
  }

  // Oferta
  if (intel.activeOffer) {
    parts.push(`\n## OFERTA ATIVA`);
    parts.push(`Promessa: ${intel.activeOffer.promise}`);
    parts.push(`Preço: R$${intel.activeOffer.price}`);
    parts.push(`Garantia: ${intel.activeOffer.guarantee}`);
    parts.push(`Score Hormozi: ${intel.activeOffer.hormoziScore}/100`);
  }

  // Keywords
  if (intel.keywords.topByKOS.length) {
    parts.push(`\n## KEYWORDS TOP (por oportunidade)`);
    parts.push(intel.keywords.topByKOS.join(', '));
  }

  // Research
  if (intel.researchInsights.trends.length) {
    parts.push(`\n## TENDÊNCIAS DE MERCADO`);
    parts.push(intel.researchInsights.trends.slice(0, 5).join('\n- '));
  }

  // Spy
  if (intel.spyInsights.length) {
    parts.push(`\n## INSIGHTS DE CONCORRENTES`);
    intel.spyInsights.forEach(spy => {
      parts.push(`${spy.competitorUrl}: Emular: ${spy.emulate.join(', ')}. Evitar: ${spy.avoid.join(', ')}`);
    });
  }

  return parts.join('\n');
}
```

### Onde injetar:

| Engine | Arquivo | Como |
|--------|---------|------|
| Chat | `api/chat/route.ts` | Adicionar ao system prompt |
| Copy Director | `api/campaigns/[id]/generate-copy/route.ts` | Adicionar ao contexto de geração |
| Social | `api/social/generate/route.ts` | Adicionar ao prompt de geração |
| Design | `api/design/plan/route.ts` | Já tem brand context, expandir |
| Predict/Ads | `api/predict/*/route.ts` | Adicionar ao contexto de análise/geração |

**Padrão de injeção:**
```typescript
// Em cada route:
const brandIntel = await loadBrandIntelligence(brandId);
const brandBlock = formatBrandIntelligenceForPrompt(brandIntel);

const prompt = [
  brandBlock,
  '', // separador
  // ... prompt específico do engine
].join('\n');
```

### Critérios de aceitação:
- [x] Chat: brandIntelContext injeta persona + offer + research + spy no contexto (Promise.all paralelo)
- [x] Copy: personaContext injeta persona + spy insights via buildCopyPrompt context
- [x] Social: intelSection injeta persona + keywords top no prompt de hooks
- [x] Design: designIntelContext injeta awareness + spy emulate/avoid no plan prompt
- [x] Ads (generate-ads): personaContext injeta persona + segmentos + spy no brandContext

---

## Tarefa 07.3 — Etapa 3: Injetar no Offer Lab

**Ref:** Seção 10, Etapa 3

### Quando o Offer Lab avalia uma oferta:

```typescript
// No prompt de avaliação do Offer Lab:
if (brandIntel.persona) {
  prompt += `\n## PERSONA REAL DO PÚBLICO
  Dores: ${brandIntel.persona.pains.join(', ')}
  Objeções: ${brandIntel.persona.objections.join(', ')}
  Desejos: ${brandIntel.persona.desires.join(', ')}

  SUGESTÕES BASEADAS NA PERSONA:
  - Bônus que resolvam as objeções: ${brandIntel.persona.objections[0]}
  - Garantia que neutralize o medo: "${brandIntel.persona.pains[0]}"
  - Prova social que valide o desejo: "${brandIntel.persona.desires[0]}"
  `;
}
```

### Critérios de aceitação:
- [x] evaluateOfferQuality() recebe brandId e carrega persona via loadBrandIntelligence()
- [x] Prompt inclui seção PERSONA REAL com dores, objeções, desejos e sugestões contextuais
- [x] calculate-score route passa brandId ao evaluator

---

## Tarefa 07.4 — Etapa 4: Injetar no Predict

**Ref:** Seção 10, Etapa 4

### Quando Predict gera ads:

```typescript
// Gerar variações específicas por segmento:
if (brandIntel.persona?.segments) {
  prompt += `\n## SEGMENTOS DE PÚBLICO
  HOT (prontos para comprar): ${brandIntel.persona.segments.hot}
  → Ads diretos, CTA de compra, urgência

  WARM (considerando): ${brandIntel.persona.segments.warm}
  → Prova social, benefícios, depoimentos

  COLD (não conhecem): ${brandIntel.persona.segments.cold}
  → Educação, problema, identificação
  `;
}
```

### Critérios de aceitação:
- [x] Ads gerados com contexto de segmento (HOT/WARM/COLD quando persona.segments existe)
- [x] Keywords da marca já injetadas via keywordContext existente
- [x] Persona + spy emulate injetados no brandContext do generateAds

---

## Check de Progressão Contínua

Após Sprint 07:

```
Usuário fez Deep Research → insights salvos
Usuário analisou concorrente → spy insights salvos
Usuário minerou keywords → keywords salvos
Usuário criou persona → persona ativa

TODOS esses dados agora FLUEM automaticamente para:
  ↓ Chat (conselheiros sabem sobre persona, mercado, concorrentes)
  ↓ Copy (usa objeções e gatilhos reais)
  ↓ Social (keywords viram hashtags e tópicos)
  ↓ Design (awareness direciona estilo visual)
  ↓ Predict (ads por segmento)
  ↓ Offer Lab (bônus contra objeções reais)

Resultado: cada ação do usuário torna TODO o sistema mais inteligente.
O investimento emocional aumenta a cada passo.
```

**Nenhuma feature gera dados que morrem.** Tudo alimenta tudo.
