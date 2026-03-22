# Sprint 10 — Launch Pad (O Estágio Final)

> **Status:** 🟢 COMPLETO (2026-03-21) — Auditado + 5 fixes (ver SPRINT-10-EXECUTION.md)
> **Máxima:** Progressão Contínua — Zero Becos Sem Saída
> **Princípio:** Output acionável, não texto genérico
> **Bloqueado por:** Sprint 04 (namespace de campanhas)
> **Ref doc master:** Seção 12.10

---

## Contexto

Após 5 estágios da Linha de Ouro (Oferta → Copy → Social → Design → Ads), o usuário não tem output acionável. "O que faço com isso? Para onde levo?" O Launch Pad fecha o ciclo.

**Rota:** `/campaigns/[id]/launch`

---

## Tarefa 10.1 — Bloco 1: Kit de Campanha (Exportação)

### Componentes do kit:

```tsx
function CampaignKit({ campaign }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <KitCard
        title="PDF Executivo"
        description="Briefing completo formatado com logo da marca"
        icon={FileText}
        onClick={() => generatePDF(campaign)}
      />
      <KitCard
        title="Pack de Copy"
        description="Toda copy aprovada, organizada por estágio"
        icon={Type}
        onClick={() => downloadCopyPack(campaign)}
      />
      <KitCard
        title="Pack de Social"
        description="Posts + calendário exportável"
        icon={Share2}
        onClick={() => downloadSocialPack(campaign)}
      />
      <KitCard
        title="Pack de Design"
        description="Assets aprovados por plataforma/formato"
        icon={Image}
        onClick={() => downloadDesignPack(campaign)}
      />
      <KitCard
        title="Plano de Mídia"
        description="Budget, canais, audiências, benchmarks"
        icon={BarChart}
        onClick={() => generateMediaPlan(campaign)}
      />
      <KitCard
        title="Kit Completo"
        description="Tudo acima em um ZIP"
        icon={Download}
        onClick={() => downloadFullKit(campaign)}
        primary
      />
    </div>
  );
}
```

### PDF Executivo (via html2pdf.js ou react-pdf):
- Logo da marca
- Resumo da estratégia
- Copy principal
- Posts sociais
- Thumbnails dos designs
- Plano de mídia
- Dados do funil

### Pack de Social = CSV dos posts (mesma lógica do Sprint 01)
### Pack de Design = ZIP dos assets aprovados

### Critérios de aceitação:
- [ ] 5 packs individuais + 1 kit completo
- [ ] PDF formatado com logo da marca
- [ ] Copy organizada por estágio
- [ ] Social como CSV
- [ ] Design como ZIP
- [ ] Download funciona

---

## Tarefa 10.2 — Bloco 2: Checklist de Lançamento

### Checklist real com dados da campanha:

```typescript
const generateChecklist = (campaign: Campaign): ChecklistItem[] => [
  {
    id: 'pixel',
    title: 'Configurar pixel na landing page',
    description: `Instale o pixel do ${campaign.funnel.primaryChannel || 'Meta'} na sua LP`,
    link: 'https://business.facebook.com/events-manager', // link externo útil
    completed: false,
  },
  {
    id: 'creatives',
    title: 'Subir criativos no Ads Manager',
    description: `${campaign.stages.design?.assets?.length || 0} assets prontos para download`,
    action: () => downloadDesignPack(campaign),
    completed: false,
  },
  {
    id: 'schedule_posts',
    title: 'Agendar posts da semana 1',
    description: `${campaign.stages.social?.hooks?.filter(h => h.approved).length || 0} posts aprovados`,
    action: () => downloadSocialPack(campaign),
    completed: false,
  },
  {
    id: 'audiences',
    title: 'Configurar audiências',
    description: `Público: ${campaign.funnel.targetAudience}`,
    completed: false,
  },
  {
    id: 'activate',
    title: 'Ativar campanha',
    description: 'Data sugerida: ' + suggestLaunchDate(),
    completed: false,
  },
];
```

### Persistência: checklist salvo em `campaigns/{id}/checklist`
### Cada item clicável e marcável

### Critérios de aceitação:
- [ ] 5+ items no checklist
- [ ] Dados reais da campanha (não genérico)
- [ ] Cada item marcável (persiste no Firestore)
- [ ] Links/ações úteis em cada item

---

## Tarefa 10.3 — Bloco 3: Diário de Campanha

### Input manual de métricas semanais:

```tsx
function CampaignDiary({ campaignId }: Props) {
  return (
    <div>
      <h3>Diário de Campanha</h3>
      <Button onClick={() => addEntry()}>+ Nova entrada</Button>

      {entries.map(entry => (
        <DiaryEntry key={entry.id}>
          <span>Semana {entry.week}</span>
          <MetricInput label="Spend" value={entry.spend} prefix="R$" />
          <MetricInput label="Clicks" value={entry.clicks} />
          <MetricInput label="Conversões" value={entry.conversions} />

          {/* Calculados automaticamente: */}
          <MetricDisplay label="CPA" value={entry.spend / entry.conversions} prefix="R$" />
          <MetricDisplay label="CTR" value={(entry.clicks / entry.impressions) * 100} suffix="%" />

          {/* IA compara com benchmarks: */}
          {entry.aiInsight && <InsightCard>{entry.aiInsight}</InsightCard>}
        </DiaryEntry>
      ))}
    </div>
  );
}
```

### Persistência: `campaigns/{id}/diary/{weekN}`

### AI Insight por entrada:
```typescript
// Gemini Flash compara com benchmarks:
// "Seu CPA está 30% acima do target para {vertical}. Considere: ..."
```

### Critérios de aceitação:
- [ ] Input de métricas semanais
- [ ] CPA, CTR, ROAS calculados automaticamente
- [ ] Timeline visual
- [ ] AI Insight opcional (1 crédito)

---

## Tarefa 10.4 — Bloco 4: Iteração Inteligente

### 3 caminhos pós-lançamento:

```tsx
<div className="grid grid-cols-3 gap-4">
  <IterationCard
    title="Não performou?"
    description="Criar variação com pontos fracos abertos para ajuste"
    icon={RefreshCw}
    cta="Criar variação →"
    onClick={() => createVariation(campaign, 'optimize')}
  />
  <IterationCard
    title="Performou bem?"
    description="Sugestões de escala: budget, canais, audiências"
    icon={TrendingUp}
    cta="Ver sugestões de escala →"
    onClick={() => generateScalePlan(campaign)}
  />
  <IterationCard
    title="Outro ângulo?"
    description="Campanha v2 com mesmo funil mas abordagem diferente"
    icon={Zap}
    cta="Criar campanha v2 →"
    onClick={() => createV2Campaign(campaign)}
  />
</div>
```

### "Criar variação" → herda manifesto, abre estágios para edição
### "Escalar" → Gemini sugere budget, novos canais, expansão de audiência
### "Campanha v2" → novo campaign doc linkado ao mesmo funil

### Critérios de aceitação:
- [ ] 3 caminhos visíveis
- [ ] "Variação" herda dados da campanha original
- [ ] "Escalar" gera sugestões via Gemini
- [ ] "V2" cria campanha nova com mesmo funil

---

## Tarefa 10.5 — Bloco 5: Feedback Loop

### Marcar resultado da campanha:

```tsx
<div className="space-y-4">
  <h3>Como foi essa campanha?</h3>
  <div className="flex gap-4">
    <FeedbackButton icon={ThumbsUp} label="Sucesso" value="success" />
    <FeedbackButton icon={ThumbsDown} label="Fracasso" value="failure" />
    <FeedbackButton icon={Minus} label="Mediocre" value="mediocre" />
  </div>

  {selectedFeedback && (
    <>
      <Textarea placeholder="O que funcionou/não funcionou? (opcional)" />
      <Button onClick={saveFeedback}>Salvar feedback</Button>
    </>
  )}
</div>
```

### Feedback alimenta RAG:
```typescript
// Salvar feedback + dados da campanha como chunk no Pinecone
// Futuras campanhas aprendem: "Campanha de {objetivo} para {público} com {abordagem} → {resultado}"
```

### Critérios de aceitação:
- [ ] 3 opções de feedback (sucesso/fracasso/mediocre)
- [ ] Campo de texto opcional
- [ ] Salvo no Firestore + indexado no RAG
- [ ] Futuras campanhas consideram histórico

---

## Check de Progressão Contínua

```
5 estágios completos
  ↓ Launch Pad
  ↓ Kit de Campanha → "Baixar tudo" (output tangível!)
  ↓ Checklist → items acionáveis com dados reais
  ↓ CELEBRAÇÃO: "Campanha pronta para rodar! 🚀"
  ↓ CONTEXTO: "Aqui está tudo que você precisa para lançar"
  ↓ PRÓXIMO PASSO (3 opções):
      → "Diagnosticar landing page" (Forensics)
      → "Criar próximo funil"
      → "Acompanhar resultados" (Diário)

Após lançar:
  ↓ Diário de métricas semanais
  ↓ IA compara com benchmarks
  ↓ "Não performou?" → Criar variação
  ↓ "Performou?" → Escalar
  ↓ "Outro ângulo?" → V2
  ↓ Feedback → alimenta futuras campanhas

CICLO COMPLETO. O usuário NUNCA sai sem saber o que fazer.
```
