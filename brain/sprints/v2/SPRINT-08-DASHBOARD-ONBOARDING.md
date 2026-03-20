# Sprint 08 — Dashboard + Onboarding (Retenção)

> **Máxima:** Progressão Contínua — Zero Becos Sem Saída
> **Princípio:** Aha moment em < 60 segundos
> **Bloqueado por:** Sprint 03 (Brands P0)
> **Desbloqueia:** Nenhum
> **Ref doc master:** Seção 16.1-16.14
> **Estimativa:** 5-7 dias

---

## Contexto

O Dashboard é o hub central de progressão. Hoje: onboarding sem aha moment (4-5 min até primeiro valor, e é texto no chat), 2 dashboards desconectadas, verdict que desaparece ao criar funil, sparklines fake, estado "active" pobre.

---

## Tarefa 08.1 — Verdict como card visual fullscreen (Aha Moment)

**Ref:** Seção 16.1

### Hoje:
Signup → wizard → transição fake 3.5s → chat → verdict como mensagem de texto

### Depois:
Signup → wizard → **Verdict como card visual fullscreen** → CTA para próximo passo

```tsx
function VerdictFullscreen({ verdict, brand }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-card">
      <div className="max-w-2xl w-full space-y-8 p-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">Diagnóstico: {brand.name}</h1>
          <p className="text-muted">Seus conselheiros analisaram sua marca</p>
        </div>

        {/* Score principal animado */}
        <div className="flex justify-center">
          <AnimatedScore value={verdict.overallScore} max={100} />
        </div>

        {/* Scores por área (4-5 dimensões) */}
        <div className="grid grid-cols-2 gap-4">
          {verdict.dimensions.map(dim => (
            <ScoreCard key={dim.name} name={dim.name} score={dim.score} feedback={dim.feedback} />
          ))}
        </div>

        {/* Parecer do conselheiro com foto */}
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Avatar src={verdict.leadCounselor.avatarUrl} />
            <div>
              <span className="font-semibold">{verdict.leadCounselor.name}</span>
              <Badge>{verdict.leadCounselor.specialty}</Badge>
            </div>
          </div>
          <p className="text-sm">{verdict.summary}</p>
        </div>

        {/* CTA claro */}
        <div className="text-center space-y-3">
          <Button size="lg" onClick={goToCreateFunnel}>
            Criar seu primeiro funil →
          </Button>
          <p className="text-xs text-muted">Baseado no seu diagnóstico, recomendamos começar por aqui</p>
        </div>
      </div>
    </div>
  );
}
```

### Gerar verdict DURANTE a transição (não depois):

```typescript
// Ao submit do wizard de marca:
// 1. Criar marca no Firestore
// 2. Mostrar skeleton do verdict com loading real
// 3. Chamar API de verdict em paralelo
// 4. Quando pronto → animar scores entrando
```

### Critérios de aceitação:
- [ ] Verdict aparece como card visual (não texto no chat)
- [ ] Scores animados (contagem progressiva)
- [ ] Parecer com foto e nome do conselheiro
- [ ] CTA claro: "Criar seu primeiro funil →"
- [ ] Tempo até aha moment: < 60 segundos após submit do wizard
- [ ] Verdict SALVO para exibir no dashboard depois

---

## Tarefa 08.2 — Onboarding: caminho único

**Ref:** Seção 16.2

### Eliminar opções que levam a experiências vazias:
- ❌ "Consultar MKTHONEY" → chat sem marca = vazio
- ❌ "Explorar a plataforma" → funnels sem marca = vazio
- ❌ "Pular e ir para o dashboard" → vai pra `/chat`

### Manter: **1 caminho claro**
```
Signup → Wizard de marca (obrigatório) → Verdict → "Criar funil →"
```

### Eliminar:
- `/welcome` (spinner inútil) → redirect direto para `/home`
- Estado "welcome" com 3 opções → pular para wizard
- Link "Pular e ir para o dashboard" → remover

### Critérios de aceitação:
- [ ] Novo usuário vai direto para wizard de marca
- [ ] Zero opções que levam a telas vazias
- [ ] `/welcome` não existe mais (redirect)
- [ ] Após wizard → verdict → CTA

---

## Tarefa 08.3 — Eliminar transição fake

**Ref:** Seção 16.3

### Hoje: `OnboardingTransition` mostra barra de progresso por 3.5s. Timer, não trabalho real.

### Opção implementar (B): Ir direto para skeleton do verdict com loading real.

```tsx
// Após submit wizard:
setLoading(true);
const verdict = await generateVerdict(brandId);
setLoading(false);
// Verdict aparece com animação
```

### Critérios de aceitação:
- [ ] Nenhuma transição fake
- [ ] Loading real (skeleton enquanto gera)
- [ ] Componente `OnboardingTransition` deletado ou não usado

---

## Tarefa 08.4 — Dashboard unificada adaptativa

**Ref:** Seção 16.4

### DE: 2 dashboards (Home + Performance)
### PARA: 1 dashboard com state machine expandida

```tsx
function Dashboard({ user, brands, campaigns }: Props) {
  const state = computeDashboardState(user, brands, campaigns);

  switch (state) {
    case 'no_brand':
      return <OnboardingCTA />;

    case 'has_brand_no_funnel':
      return <PostAhaDashboard verdict={lastVerdict} />;

    case 'has_funnel_no_campaign':
      return <ActiveDashboard
        brandHealth={verdict}
        credits={user.credits}
        nextAction="Iniciar campanha para seu funil aprovado →"
      />;

    case 'has_active_campaign':
      return <ActiveDashboard
        brandHealth={verdict}
        credits={user.credits}
        campaign={activeCampaign}
        goldenThreadProgress={campaign.progress}
        nextAction={getNextStageAction(campaign)}
      />;

    case 'has_ads_connected':
      return <ActiveDashboard
        // tudo acima +
        adsMetrics={metricsFromPerformance}
        anomalies={anomalies}
        aiInsight={insight}
      />;
  }
}
```

### Cards do estado "active":

| Card | Dados | Sempre visível |
|------|-------|----------------|
| Health da marca | Score do último verdict | Sim |
| Créditos | Barra visual + reset date | Sim |
| Campanha ativa | Stepper da Linha de Ouro | Se tem campanha |
| Próxima ação | CTA contextual | Sim |
| KPIs de ads | ROAS, spend, CAC | Se ads conectados |

### Critérios de aceitação:
- [ ] 1 única dashboard
- [ ] State machine com 5 estados
- [ ] Cada estado mostra conteúdo relevante
- [ ] Próxima ação sempre visível
- [ ] Performance inline quando há dados (não página separada)

---

## Tarefa 08.5 — Verdict permanente (não desaparece)

**Ref:** Seção 16.6

### Hoje: Verdict só aparece no estado "post-aha". Ao criar funil, some.

### Depois:
- Verdict salvo em `brands/{brandId}/verdicts/latest`
- Sempre visível no dashboard como "Health Score"
- Re-gerável: botão "Atualizar diagnóstico" (1 crédito)
- Compara com anterior: "Score subiu de 62 para 78 (+16)"

### Critérios de aceitação:
- [ ] Verdict persistido no Firestore
- [ ] Visível no dashboard sempre
- [ ] Botão "Atualizar diagnóstico"
- [ ] Comparação com anterior (evolução)

---

## Tarefa 08.6 — Remover sparklines fake + bugs

**Ref:** Seções 16.7, 16.9, 16.10, 16.11, 16.12

### Fixes:
1. **Sparklines fake:** Remover StatsCards com SVG hardcoded
2. **Acknowledge = console.log:** Implementar update no Firestore
3. **AI Insight múltiplas vezes:** Debounce + cache (gerar 1x, refresh manual)
4. **Reporting requer admin:** Remover `verifyAdminRole` → todos com ads veem insights
5. **Data em inglês:** `toLocaleDateString('en-US')` → `'pt-BR'`
6. **Link "Pular" errado:** Remove ou corrige (tarefa 08.2 já remove)

### Critérios de aceitação:
- [ ] Zero dados fake na UI
- [ ] Acknowledge funciona
- [ ] AI Insight gera 1x (não 3x)
- [ ] Insights para todos (não só admin)
- [ ] Datas em português

---

## Tarefa 08.7 — Next steps em cada feature

**Ref:** Seção 16.13

### Implementar CTA de "próximo passo" ao completar cada feature:

| Feature | Ao completar | CTA |
|---------|-------------|-----|
| Funil aprovado | Badge "Pronto" | "Iniciar Campanha →" |
| Copy aprovada | Manifesto atualizado | "Criar posts sociais →" |
| Social gerado | Posts prontos | "Enviar para Calendário →" ou "Gerar Design →" |
| Design aprovado | Assets salvos | "Revisar no Launch Pad →" |
| Deep Research | Dossiê gerado | "Criar campanha com esses insights →" |
| Offer Lab | Oferta avaliada | "Voltar para campanha →" |

### Componente genérico:

```tsx
function CompletionBanner({ title, description, cta, href }: Props) {
  return (
    <div className="bg-green-50 border-green-200 border rounded-lg p-4 flex items-center justify-between">
      <div>
        <p className="font-medium text-green-800">{title}</p>
        <p className="text-sm text-green-600">{description}</p>
      </div>
      <Button variant="outline" asChild>
        <Link href={href}>{cta} →</Link>
      </Button>
    </div>
  );
}
```

### Critérios de aceitação:
- [ ] Cada feature mostra CTA após completar ação
- [ ] CTA é contextual (próximo passo natural)
- [ ] Nenhuma tela termina em silêncio

---

## Check de Progressão Contínua

```
Novo usuário
  ↓ Wizard (2 min)
  ↓ AHA: Verdict visual com scores animados (< 60s)
  ↓ CELEBRAÇÃO: "Sua marca tem score 72/100!"
  ↓ CONTEXTO: "Seu posicionamento está forte, audiência precisa de atenção"
  ↓ PRÓXIMO PASSO: "Criar primeiro funil →"
  ↓ Dashboard: Health score + créditos + próxima ação

Usuário recorrente
  ↓ Dashboard mostra: campanha ativa + progresso + créditos
  ↓ PRÓXIMO PASSO: "Sua copy está aprovada. Gerar posts sociais →"
  ↓ Nunca tela vazia, nunca "e agora?"
```
