# Sprint 04 — Campaigns Foundation (Linha de Ouro Real)

> **Máxima:** Progressão Contínua — Zero Becos Sem Saída
> **Princípio:** UX First — Namespace unificado, zero query params
> **Bloqueado por:** Sprint 00
> **Desbloqueia:** Sprint 05 (Chat), Sprint 06 (Design), Sprint 10 (Launch Pad)
> **Ref doc master:** Seção 12.1-12.9
> **Estimativa:** 7-10 dias
> **CRÍTICO:** Fundação arquitetural. Todos os engines downstream (Copy, Social, Design, Ads) dependem de um manifesto correto.

---

## Contexto

Campanhas são o coração da Linha de Ouro — orquestram 6 estágios (Funil → Oferta → Copy → Social → Design → Ads). Hoje:
- `campaignId = funnelId` (sem separação real)
- Virtual campaigns criadas silenciosamente
- Awareness SEMPRE string vazia em todos os engines
- Copy/Social vivem em `/funnels/`, Design/Ads vivem em `/chat`
- Dados rasos no manifesto (keyBenefits: [], tone = awareness)
- "Congruência" mede progresso, não congruência

---

## Tarefa 04.1 — Eliminar Virtual Campaigns

**Arquivo:** `app/src/app/(app)/campaigns/[id]/page.tsx`
**Arquivo:** `app/src/hooks/` ou similar (listagem)
**Ref:** Seção 12.1

### Problema:
Quando abre `/campaigns/[id]`, se não existe no Firestore, cria "campanha virtual" do funil + persiste silenciosamente com `setDoc({ merge: true })`. `campaignId = funnelId`.

### O que fazer:

**1. Campanha criada EXPLICITAMENTE:**

Botão "Iniciar Campanha" no funil aprovado → cria documento real:

```typescript
const newCampaign = {
  id: `campaign_${Date.now()}_${generateShortId()}`, // ID único, NUNCA = funnelId
  funnelId: funnel.id,
  brandId: funnel.brandId,
  userId,

  // Herdado do funil (snapshot no momento da criação):
  funnel: {
    type: funnel.type,
    architecture: proposal.architecture,
    targetAudience: funnel.audience.who,
    mainGoal: funnel.objective,
    stages: proposal.stages,
    summary: proposal.summary,
    awareness: funnel.audience.awareness,          // ← FIX 12.2
    pain: funnel.audience.pain,                     // ← FIX 12.2
    objection: funnel.audience.objection,           // ← FIX 12.2
    differentiator: funnel.offer.differentiator,    // ← FIX 12.2
    proposalName: proposal.name,
    proposalVersion: proposal.version || 1,
    scorecard: proposal.scorecard || null,
    primaryChannel: funnel.channels?.primary,
    secondaryChannel: funnel.channels?.secondary,
  },

  // Brand context (snapshot):
  brand: {
    name: brand.name,
    vertical: brand.vertical,
    tone: brand.voiceTone,
    offerPromise: brand.offer?.what,
  },

  // Stages (iniciam vazios):
  stages: {
    offer: null,
    copy: null,
    social: null,
    design: null,
    ads: null,
    launch: null,
  },

  // Metadata:
  status: 'active',
  progress: 0,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
};
```

**2. Listagem só mostra campanhas reais:**

`/campaigns` → query `campaigns` collection where `userId == X`

Funis sem campanha ficam em `/funnels` com badge "Pronto para campanha →"

**3. Remover lógica de virtual campaign:**

Deletar ou condicionar todo código que:
- Carrega funil como fallback quando campanha não existe
- Persiste com `setDoc({ merge: true })` silenciosamente
- Cria "campanhas virtuais" na listagem

### Critérios de aceitação:
- [x] `campaignId` NUNCA é igual ao `funnelId`
- [x] Campanha criada explicitamente via botão no funil
- [x] Manifesto preenchido completo na criação (não parcial)
- [x] `/campaigns` mostra só campanhas reais
- [x] Funis sem campanha: badge "Iniciar Campanha →" na listagem de funis
- [x] Zero persistência silenciosa

---

## Tarefa 04.2 — Expandir CampaignContext com campos perdidos

**Arquivo:** `app/src/lib/ai/campaign-context.ts`
**Arquivo:** `app/src/types/campaign.ts`
**Ref:** Seção 12.2

### Problema:
`CampaignContext.funnel` tem apenas 6 campos genéricos. `awareness` é SEMPRE string vazia. Dor, objeção, diferencial — todos perdidos.

### Expandir tipo:

```typescript
// Em types/campaign.ts:
interface CampaignFunnelContext {
  // Existentes:
  type: string;
  architecture: string;
  targetAudience: string;
  mainGoal: string;
  stages: string[];
  summary: string;

  // NOVOS (do wizard):
  awareness: string;          // 'unaware' | 'problem_aware' | 'solution_aware' | 'product_aware' | 'most_aware'
  pain: string | string[];    // dor principal ou top 3
  objection: string | string[]; // objeção principal ou top 3
  differentiator: string;     // diferencial competitivo

  // NOVOS (da proposta aprovada):
  proposalName?: string;
  proposalVersion?: number;
  scorecard?: Record<string, number>;

  // NOVOS (canais):
  primaryChannel?: string;
  secondaryChannel?: string;
  channelLayers?: { acquisition: string[]; nurture: string[]; conversion: string[] };
}
```

### Atualizar `loadCampaignContext()`:

```typescript
// Em campaign-context.ts:
export async function loadCampaignContext(campaignId: string): Promise<CampaignContext> {
  const campaign = await getCampaign(campaignId);

  return {
    campaign: {
      id: campaign.id,
      funnelId: campaign.funnelId,
      brandId: campaign.brandId,
      status: campaign.status,
    },
    funnel: {
      ...campaign.funnel, // Todos os campos do snapshot
    },
    brand: campaign.brand,
    stages: {
      offer: campaign.stages?.offer || null,
      copy: campaign.stages?.copy || null,
      social: campaign.stages?.social || null,
      design: campaign.stages?.design || null,
      ads: campaign.stages?.ads || null,
    },
  };
}
```

### Critérios de aceitação:
- [x] `loadCampaignContext()` retorna awareness real (não string vazia)
- [x] Dor, objeção, diferencial disponíveis no contexto
- [x] Todos os engines downstream recebem campos completos
- [x] Design sabe se é tráfego frio/quente (via awareness)
- [x] Social gera hooks com estágio de consciência

---

## Tarefa 04.3 — Namespace unificado de rotas

**Ref:** Seção 12.9

### DE (hoje):
```
Copy → /funnels/[id]/copy?campaignId=...
Social → /funnels/[id]/social?campaignId=...
Design → /chat?mode=design&funnelId=...&campaignId=...
Ads → /chat?mode=ads&funnelId=...&campaignId=...
```

### PARA:
```
/campaigns/[id]           → Command Center (hub)
/campaigns/[id]/copy      → Estágio de Copy
/campaigns/[id]/social    → Estágio de Social
/campaigns/[id]/design    → Estágio de Design
/campaigns/[id]/ads       → Estágio de Ads
/campaigns/[id]/launch    → Launch Pad (Sprint 10)
```

### Implementação:

**1. Criar novas rotas:**

```
app/src/app/(app)/campaigns/[id]/page.tsx      → Command Center
app/src/app/(app)/campaigns/[id]/copy/page.tsx  → Copy stage
app/src/app/(app)/campaigns/[id]/social/page.tsx → Social stage
app/src/app/(app)/campaigns/[id]/design/page.tsx → Design stage
app/src/app/(app)/campaigns/[id]/ads/page.tsx    → Ads stage
```

**2. Cada página carrega contexto via `params.id`:**

```tsx
// Padrão de cada página:
export default async function CopyStagePage({ params }: { params: { id: string } }) {
  return <CopyStageClient campaignId={params.id} />;
}

// Client component:
function CopyStageClient({ campaignId }: { campaignId: string }) {
  // Carrega manifesto via campaignId da URL
  // ZERO query params
  // Componentes existentes reutilizados
}
```

**3. Header com stepper (Linha de Ouro visual):**

```tsx
function CampaignStepper({ campaignId, currentStage }: Props) {
  const stages = [
    { id: 'offer', label: 'Oferta', href: `/campaigns/${campaignId}` },
    { id: 'copy', label: 'Copy', href: `/campaigns/${campaignId}/copy` },
    { id: 'social', label: 'Social', href: `/campaigns/${campaignId}/social` },
    { id: 'design', label: 'Design', href: `/campaigns/${campaignId}/design` },
    { id: 'ads', label: 'Ads', href: `/campaigns/${campaignId}/ads` },
    { id: 'launch', label: 'Launch', href: `/campaigns/${campaignId}/launch` },
  ];

  return (
    <nav className="flex items-center gap-2">
      {stages.map((stage, i) => (
        <StepperItem
          key={stage.id}
          label={stage.label}
          status={getStageStatus(campaign, stage.id)}
          active={currentStage === stage.id}
          href={stage.href}
        />
      ))}
    </nav>
  );
}
```

**4. Redirects de rotas antigas:**

```typescript
// next.config.ts:
redirects: [
  { source: '/funnels/:id/copy', destination: '/campaigns/:id/copy', permanent: true },
  { source: '/funnels/:id/social', destination: '/campaigns/:id/social', permanent: true },
  { source: '/funnels/:id/design', destination: '/campaigns/:id/design', permanent: true },
]
```

### Critérios de aceitação:
- [x] Todas as rotas `/campaigns/[id]/*` funcionam
- [x] Header com stepper mostra posição na Linha de Ouro
- [x] Click no stepper navega entre estágios
- [x] Context carregado via `campaignId` da URL (sem query params)
- [x] Rotas antigas redirecionam corretamente
- [x] Componentes existentes reutilizados (não reescritos)

---

## Tarefa 04.4 — Enriquecer manifesto de Copy

**Ref:** Seção 12.4

### Hoje:
- `mainScript` = copy inteira como string plana
- `tone` = pode receber `awarenessStage` no fallback
- `keyBenefits` = sempre `[]`

### Expandir:

```typescript
interface CampaignCopyStage {
  // Existentes:
  mainScript: string;
  tone: string;
  bigIdea: string;

  // NOVOS:
  structured: {
    headline: string;
    subheadline: string;
    body: string;
    cta: string;
    proof: string;  // depoimentos, dados, garantia
  };
  keyBenefits: string[];    // Extraídos da copy aprovada (não empty [])
  scorecard?: {
    persuasion: number;
    clarity: number;
    emotional: number;
    credibility: number;
    actionability: number;
  };
  selectedVariation?: string; // Qual variação A/B foi escolhida
}
```

### Critérios de aceitação:
- [x] Copy no manifesto tem campos estruturados
- [x] `keyBenefits` populados (extraídos pela IA da copy)
- [x] `tone` separado de `awareness` (campos distintos)
- [x] Scorecard salvo (se existe)
- [x] Social e Design recebem dados estruturados (não string plana)

---

## Tarefa 04.5 — Social: scores por hook + aprovação

**Ref:** Seção 12.5

### Expandir:

```typescript
interface CampaignSocialStage {
  hooks: Array<{
    text: string;
    score: number;        // 0-100 do scorecard
    framework: string;
    approved: boolean;    // Flag de aprovação
  }>;
  debate: string;         // Texto do debate (manter como está)
  evaluation: {
    engagement: number;
    clarity: number;
    brandAlignment: number;
    virality: number;
  };
  contentPlan?: {
    posts: Array<{
      // ...
      approved: boolean;  // Flag por post
    }>;
  };
}
```

### Critérios de aceitação:
- [x] Scores individuais por hook
- [x] Hooks marcáveis como aprovado/rejeitado
- [x] Design recebe hooks aprovados (não todos)

---

## Tarefa 04.6 — Renomear "Congruência" para "Progresso"

**Ref:** Seção 12.8

### O que mudar:
- Em toda a UI: "Congruência" → "Progresso"
- Manter o cálculo existente (stages preenchidos / total)
- Remover qualquer menção a "análise de coerência" que não existe

### Critérios de aceitação:
- [x] Label "Congruência" não aparece mais na UI
- [x] "Progresso" reflete stages preenchidos
- [x] Build sem referências a "congruence" na UI (pode manter internamente)

---

## Tarefa 04.7 — Esconder Metrics/MonitoringDashboard

**Ref:** Seção 12.7

### O que fazer:
- Esconder `MonitoringDashboard` da UI no Command Center
- Métricas que era tudo zero → não mostrar
- Substituir por placeholder para Launch Pad (Sprint 10)

### Critérios de aceitação:
- [x] Zero componentes de métricas com dados falsos na campanha
- [x] Espaço reservado para "Launch Pad" (coming soon)

---

## Check de Progressão Contínua (Máxima do Projeto)

Após Sprint 04:

```
Funil aprovado
  ↓ "Iniciar Campanha →" (botão explícito)
  ↓ Campanha criada com manifesto COMPLETO
  ↓ Command Center com stepper da Linha de Ouro
  ↓ [Oferta] → [Copy] → [Social] → [Design] → [Ads] → [Launch]
  ↓ Cada estágio sabe onde está e o que veio antes
  ↓ Awareness flui para Copy, Social, Design, Ads
  ↓ PRÓXIMO PASSO sempre visível no stepper
```

**Zero becos sem saída:**
- Command Center → stepper mostra próximo estágio
- Copy aprovada → "Avançar para Social →"
- Social aprovado → "Avançar para Design →"
- Todos os estágios compartilham contexto completo
- 2 clicks max: sidebar → campanha → estágio
