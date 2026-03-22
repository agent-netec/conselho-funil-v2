# Sprint 01 — Social Completo + Calendário Básico (Viabilizar Starter)

> **Status:** 🟢 COMPLETO
> **Máxima:** Progressão Contínua — Zero Becos Sem Saída
> **Princípio:** UX First
> **Bloqueado por:** Sprint 00
> **Desbloqueia:** Sprint 02 (tier enforcement faz sentido quando Starter tem valor)
> **Ref doc master:** Seção 6.2, Social (auditoria), Calendar (auditoria)
> **CRÍTICO:** Quando trials expiram no dia 7, Starter PRECISA ter valor real. Sem Social completo e Calendário, Starter não tem proposta de valor.

---

## Contexto

Hoje o Social gera **só hooks** (ganchos de abertura). O usuário sai com meia frase e precisa completar o post sozinho. O Calendário recebe hooks incompletos e não tem exportação. Para o Starter (R$147) ter valor, o mínimo é: post completo + calendário com export.

**Fluxo desejado pós-sprint:**
```
Social Modo Rápido → Post completo (hook + corpo + CTA + hashtags)
    → Enviar para Calendário
        → View semanal/mensal
        → Export CSV (pronto para Buffer/mLabs)
```

---

## Tarefa 01.1 — Social: Output de Post Completo

**Arquivos principais:**
- `app/src/app/api/social/generate/route.ts` (API de geração)
- `app/src/lib/ai/prompts/social*.ts` (prompts do Social)
- `app/src/components/social/` (UI)
- `app/src/types/social.ts` ou equivalente

**Ref:** Seção Social — "Post completo" + "Dois modos de uso"

### O que mudar:

**1. Tipo do output — expandir de hook para post completo:**

```typescript
// DE (hoje):
interface SocialHook {
  text: string;        // só o hook
  style: string;
  reasoning: string;
  framework: string;
}

// PARA:
interface SocialPost {
  hook: string;           // gancho de abertura (o que já existe)
  body: string;           // desenvolvimento do post (2-4 parágrafos)
  cta: string;            // call-to-action final
  hashtags: string[];     // 5-15 hashtags relevantes
  platform: string;       // instagram | linkedin | twitter | tiktok
  format: string;         // feed | stories | reels | carousel
  suggestedVisual: string; // sugestão de visual ("foto lifestyle com texto overlay")
  // Campos existentes preservados:
  style: string;
  reasoning: string;
  framework: string;
}
```

**2. Prompt de geração — pedir post completo:**

No prompt do Gemini, adicionar instrução explícita:

```
Gere posts COMPLETOS, prontos para publicar. Cada post deve ter:

1. HOOK (gancho de abertura): 1 frase impactante que para o scroll
2. CORPO (desenvolvimento): 2-4 parágrafos curtos que desenvolvem a ideia
   - Parágrafo 1: Problema/identificação
   - Parágrafo 2: Virada/insight
   - Parágrafo 3: Solução/benefício
   - Parágrafo 4 (opcional): Prova/dado
3. CTA (chamada para ação): 1 frase final clara
4. HASHTAGS: 5-15 hashtags relevantes ao nicho

Adapte o comprimento à plataforma:
- Instagram feed: 150-300 palavras
- LinkedIn: 200-400 palavras
- Twitter/X: 240-280 caracteres (incluindo hook)
- TikTok caption: 50-150 palavras

Retorne JSON com campos: hook, body, cta, hashtags, platform, format, suggestedVisual
```

**3. Brand context no prompt:**

Carregar via `loadBrandContext(brandId)` e injetar:
- Tom de voz da marca
- Público-alvo
- Vertical/nicho
- Oferta principal
- Keywords salvas (se houver)

**4. UI — Renderizar post completo:**

No componente que mostra os hooks gerados, expandir para mostrar:
- Hook em destaque (negrito, tamanho maior)
- Corpo formatado (parágrafos separados)
- CTA destacado (cor accent)
- Hashtags como pills/tags clicáveis
- Botão "Copiar Post Completo" (copia hook + corpo + CTA + hashtags)
- Botão "Enviar para Calendário"
- Sugestão de visual em tooltip/collapse

### Critérios de aceitação:
- [x] API retorna posts com hook + body + cta + hashtags
- [x] UI mostra post completo formatado (não só hook)
- [x] Botão "Copiar" copia texto completo formatado
- [x] Botão "Enviar para Calendário" funciona (ver tarefa 01.3)
- [x] Post adaptado à plataforma selecionada
- [x] Brand context injetado no prompt

---

## Tarefa 01.2 — Social: Dois Modos de Uso

**Ref:** Seção Social — "Dois modos de uso"

### Modo Rápido (Starter):
- 1 tela, 1 formulário mínimo: tema + plataforma + tom (ou herda da marca)
- Click → gera 3 posts completos
- Custo: 1 crédito
- Sem debate, sem scorecard, sem A/B
- Output: 3 cards de post completo com "Copiar" e "Enviar para Calendário"

### Modo Estratégico (Pro):
- 4 etapas existentes (config → geração → debate → scorecard)
- Debate com 4 conselheiros
- Scorecard 0-100
- Variações A/B
- Custo: 2 créditos (1 geração + 1 debate/score)
- Output expandido para post completo (mesma estrutura do modo rápido)

### Implementação:

**UI — Seletor de modo no início da página Social:**

```tsx
// Antes do wizard:
<ModeSelector>
  <ModeCard
    title="Modo Rápido"
    description="Post completo em segundos"
    icon={Zap}
    tier="Starter"
    onClick={() => setMode('quick')}
  />
  <ModeCard
    title="Modo Estratégico"
    description="Debate + Scorecard + A/B"
    icon={Brain}
    tier="Pro"
    locked={tier < 'pro'}
    onClick={() => setMode('strategic')}
  />
</ModeSelector>
```

**Modo Rápido — Formulário mínimo:**

```tsx
// Campos:
// 1. Tema/assunto (texto livre, placeholder contextual)
// 2. Plataforma (Instagram, LinkedIn, Twitter, TikTok) — chips
// 3. Tom (herda da marca por default, editável)
// 4. Botão "Gerar Posts" → 3 posts completos
```

**API — Rota existente com flag `mode`:**

```typescript
// POST /api/social/generate
// body: { brandId, campaignId?, topic, platform, tone?, mode: 'quick' | 'strategic' }

if (mode === 'quick') {
  // 1 chamada Gemini, 3 posts, sem debate
  // Custo: 1 crédito
} else {
  // Fluxo existente com debate + scorecard
  // Custo: 2 créditos
}
```

### Critérios de aceitação:
- [x] Seletor de modo aparece na página Social
- [x] Modo Rápido: 1 tela → 3 posts completos em < 30s
- [x] Modo Estratégico: 4 etapas com debate e scorecard
- [x] Modo Estratégico bloqueado para Starter (cadeado + "Disponível no Pro")
- [x] Créditos corretos (1 quick, 2 strategic)
- [x] Posts de ambos os modos são post completo (não só hook)

---

## Tarefa 01.3 — Calendário: Receber Posts Completos do Social

**Arquivos:**
- `app/src/app/(app)/social/` ou equivalente (botão de envio)
- `app/src/app/(app)/calendar/` ou equivalente (recepção)
- Firestore collection: `brands/{brandId}/calendar` ou similar

**Ref:** Seção Calendar — "De quem recebe"

### O que mudar:

**1. No Social — botão "Enviar para Calendário":**

Ao clicar, cria documento na collection de calendário:

```typescript
const calendarItem = {
  brandId,
  campaignId: campaignId || null,
  title: post.hook.slice(0, 80),  // Preview curto
  content: {
    hook: post.hook,
    body: post.body,
    cta: post.cta,
    hashtags: post.hashtags,
  },
  platform: post.platform,
  format: post.format,
  suggestedVisual: post.suggestedVisual,
  status: 'draft',  // Draft → Pending → Approved → Scheduled → Published
  scheduledDate: null,  // Usuário define no calendário
  source: 'social_wizard',
  sourceMode: mode,  // 'quick' | 'strategic'
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
};
```

**2. No Calendário — mostrar post completo:**

Quando o item vem do Social, exibir no modal/detail:
- Hook em destaque
- Corpo formatado
- CTA
- Hashtags
- Plataforma + formato
- Status do workflow
- Botão "Copiar Post Completo"

**3. Feedback visual no Social após enviar:**

```tsx
// Após enviar com sucesso:
toast.success("Post enviado para o Calendário! 📅");
// Botão muda de "Enviar" para "✅ No Calendário" (disabled)
```

### Critérios de aceitação:
- [x] Botão "Enviar para Calendário" no card de post gerado
- [x] Item criado no Firestore com todos os campos
- [x] Item aparece no calendário como draft
- [x] Post completo visível no detalhe do item no calendário
- [x] Toast de confirmação no Social
- [x] Status workflow funciona (Draft → Pending → Approved)

---

## Tarefa 01.4 — Calendário: Export CSV

**Arquivo:** Componente do Calendário (toolbar ou header)
**Ref:** Seção Calendar — "Export CSV/PDF FASE 1"

### O que implementar:

Botão "Exportar CSV" na toolbar do calendário que gera CSV com:

```csv
Data,Plataforma,Status,Hook,Corpo,CTA,Hashtags
2026-03-20,Instagram,draft,"Hook aqui","Corpo do post...","CTA aqui","#hash1 #hash2"
2026-03-21,LinkedIn,approved,"Outro hook","Outro corpo...","Outro CTA","#hash3 #hash4"
```

**Colunas do CSV:**
1. Data agendada (ou "Sem data" se não agendada)
2. Plataforma
3. Formato (feed/stories/reels)
4. Status
5. Hook
6. Corpo
7. CTA
8. Hashtags (separadas por espaço)
9. Campanha (nome, se vinculada)

**Filtros de export:**
- Semana atual (default)
- Mês atual
- Todos os drafts
- Todos os aprovados
- Range customizado (date picker)

**Implementação client-side:**

```typescript
function exportCalendarCSV(items: CalendarItem[], range: string) {
  const headers = ['Data', 'Plataforma', 'Formato', 'Status', 'Hook', 'Corpo', 'CTA', 'Hashtags', 'Campanha'];
  const rows = items.map(item => [
    item.scheduledDate ? formatDate(item.scheduledDate) : 'Sem data',
    item.platform,
    item.format || '',
    item.status,
    `"${escapeCSV(item.content.hook)}"`,
    `"${escapeCSV(item.content.body)}"`,
    `"${escapeCSV(item.content.cta)}"`,
    item.content.hashtags.join(' '),
    item.campaignName || '',
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csv, `calendario-${range}.csv`, 'text/csv');
}
```

### Critérios de aceitação:
- [x] Botão "Exportar CSV" visível na toolbar do calendário
- [x] CSV contém todas as colunas especificadas
- [ ] Filtro de range funciona (semana, mês, custom) — exporta view atual (semana/mês), sem range picker custom ainda
- [x] Posts completos no CSV (não só hooks)
- [x] Encoding UTF-8 (acentos corretos)
- [x] Download automático com nome descritivo

---

## Tarefa 01.5 — Social + Calendar como tabs na mesma página

**Ref:** Seção Calendar — "Posicionamento na UI"

### Decisão do doc master:

Calendário e Aprovações devem ser **abas dentro de `/social`**, não páginas separadas.

**Tabs:**
```
[ Criar ] [ Calendário ] [ Aprovações ]
```

### O que mudar:

1. **Página `/social` ganha 3 tabs:**
   - **Criar** — seletor de modo (rápido/estratégico) + wizard de geração
   - **Calendário** — view semanal/mensal + drag-and-drop + export
   - **Aprovações** — dashboard de aprovação com workflow

2. **Sidebar:** Um único item "Social" que abre `/social` com tab "Criar" ativa

3. **Rotas:**
   - `/social` → tab Criar (default)
   - `/social?tab=calendar` → tab Calendário
   - `/social?tab=approvals` → tab Aprovações
   - Rotas antigas de calendário/aprovações → redirect para `/social?tab=...`

### Critérios de aceitação:
- [x] 3 tabs funcionam na página Social
- [x] Tab ativa persistida por query param
- [x] Fluxo natural: gerar → enviar → ver no calendário (1 click entre tabs)
- [x] Sidebar tem 1 item "Social" (não 3 items separados)
- [x] Rotas antigas redirecionam corretamente — /content/calendar continua funcionando standalone

---

## Tarefa 01.6 — Trends Research: Persistir + "Gerar sobre isso"

**Ref:** Seção Social — "Trends sugerir tópicos + persistência"

### Problema hoje:
Trends Research gera 5-8 tendências mas resultado morre no `useState`. Ao mudar de aba ou recarregar, some.

### O que mudar:

**1. Persistir no Firestore:**

```typescript
// Collection: brands/{brandId}/trends
const trendDoc = {
  topic: query,
  trends: results, // array de tendências
  source: 'exa_firecrawl',
  createdAt: serverTimestamp(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // TTL 7 dias
};
```

**2. Botão "Gerar posts sobre isso" em cada tendência:**

Cada card de tendência ganha CTA:
```tsx
<Button onClick={() => generatePostAboutTrend(trend)}>
  Gerar posts sobre isso →
</Button>
```

Ao clicar:
- Muda para tab "Criar" do Social
- Pré-preenche o campo de tema com a tendência
- Modo rápido ativado por default
- Usuário confirma e gera

**3. Carregar tendências salvas ao entrar:**
- Se existem tendências não expiradas (< 7 dias), mostrar como "Tendências recentes"
- Botão "Atualizar" para re-pesquisar

### Critérios de aceitação:
- [x] Tendências persistem no Firestore (brands/{brandId}/trends)
- [x] Ao recarregar página, tendências anteriores aparecem
- [x] Botão "Gerar posts sobre isso" navega para criar com tema pré-preenchido
- [x] TTL de 7 dias funciona
- [x] Zero perda de dados ao navegar entre tabs

---

## Tarefa 01.7 — Profile Analysis: Persistir

**Ref:** Seção Social — "Profile Analysis alimentar geração"

### Problema hoje:
Mesmo que Trends — resultado morre no `useState`.

### O que mudar:

**1. Persistir no Firestore:**

```typescript
// Collection: brands/{brandId}/competitor_profiles
const profileDoc = {
  url: analyzedUrl,
  analysis: results, // forças, fraquezas, estilo, frequência, etc.
  createdAt: serverTimestamp(),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // TTL 30 dias
};
```

**2. Mostrar perfis salvos:**
- Lista de "Perfis analisados" com link para re-visualizar

**3. Injetar como contexto na geração (futuro, Sprint 07):**
- Quando Brand Intelligence Layer existir, perfis de concorrentes serão automaticamente injetados como contexto

### Critérios de aceitação:
- [x] Análises de perfil persistem no Firestore (brands/{brandId}/competitor_profiles)
- [x] Ao recarregar, análises anteriores visíveis (lista clicável)
- [x] TTL de 30 dias
- [x] Dados disponíveis para futura injeção no Brand Intelligence Layer

---

## Check de Progressão Contínua (Máxima do Projeto)

Após Sprint 01, o fluxo de progressão:

```
Usuário quer criar conteúdo
  ↓ Vai para Social (sidebar, 1 click)
  ↓ Escolhe "Modo Rápido" → tema → gera
  ↓ AHA: 3 posts COMPLETOS prontos para publicar (< 30s)
  ↓ CELEBRAÇÃO: "3 posts prontos!" com preview
  ↓ CONTEXTO: "Seus posts já estão formatados para [Instagram]"
  ↓ PRÓXIMO PASSO: "Enviar para Calendário →" (1 click)
  ↓ No Calendário: vê post organizado por data
  ↓ PRÓXIMO PASSO: "Exportar CSV →" (leva para Buffer/mLabs)
  ↓ PRÓXIMO PASSO: "Gerar mais posts →" (volta para tab Criar)
```

**Zero becos sem saída:**
- Post gerado → "Enviar para Calendário"
- No Calendário → "Exportar" ou "Gerar mais"
- Trend pesquisada → "Gerar posts sobre isso"
- Profile analisado → dados salvos (não morrem)

**Proposta de valor do Starter validada:**
- R$147/mês → posts completos + calendário + export
- Alternativa: contratar freelancer (R$3.000+/mês)
- O trial de 7 dias mostrou o valor → agora Starter mantém o essencial
