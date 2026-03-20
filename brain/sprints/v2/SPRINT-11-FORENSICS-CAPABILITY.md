# Sprint 11 — Forensics → Capacidade Interna

> **Máxima:** Progressão Contínua — Zero Becos Sem Saída
> **Bloqueado por:** Sprint 07 (Brand Intelligence), Sprint 10 (Launch Pad)
> **Ref doc master:** Seção 15.1-15.13
> **Estimativa:** 3-5 dias

---

## Contexto

Page Forensics é uma feature morta (redirect ativo) que concorre com Spy Agent. O `AutopsyEngine` é sofisticado (10 experts, heurísticas reais) mas inacessível. Decisão: de feature standalone para capacidade interna, acessível via 3 pontos de entrada.

---

## Tarefa 11.1 — Limpeza: deletar página e rotas mortas

### O que deletar:

| Arquivo/Config | Ação |
|---|---|
| `next.config.ts` redirect `/strategy/autopsy` → `/funnels` | REMOVER |
| `src/app/(app)/strategy/autopsy/page.tsx` | DELETAR |
| `src/components/funnel-autopsy/AutopsyReportView.tsx` | DELETAR |
| `src/lib/constants.ts` entrada "page-forensics" na sidebar | REMOVER |
| `src/app/(app)/intelligence/page.tsx` entrada "autopsy" | REMOVER |

### O que PRESERVAR:
| Arquivo | Motivo |
|---|---|
| `src/lib/intelligence/autopsy/engine.ts` | Serviço interno (será chamado pelos pontos de entrada) |
| `src/types/autopsy.ts` | Tipos do engine |
| `src/app/api/intelligence/autopsy/run/route.ts` | Refatorar para aceitar chamadas dos novos pontos |

### Critérios de aceitação:
- [ ] Zero rotas mortas
- [ ] Zero componentes não usados
- [ ] Engine preservado e funcional
- [ ] Build passa

---

## Tarefa 11.2 — Ponto de entrada 1: Spy Agent

### No relatório do Spy Agent, adicionar camada de heurísticas de conversão:

```typescript
// Ao final do spy analyze:
const diagnosticResult = await AutopsyEngine.analyze(url, { depth: 'quick' });

// Merge no relatório:
report.conversionDiagnostic = {
  score: diagnosticResult.overallScore,
  findings: diagnosticResult.findings, // Com expert attribution
  hookScore: diagnosticResult.categories.hook,
  offerScore: diagnosticResult.categories.offer,
  frictionScore: diagnosticResult.categories.friction,
  trustScore: diagnosticResult.categories.trust,
};
```

### UI: Seção "Diagnóstico de Conversão" no relatório do Spy

### Critérios de aceitação:
- [ ] Spy Agent inclui diagnóstico de conversão automaticamente
- [ ] Score + findings com expert attribution
- [ ] Sem custo extra (já está na análise do spy)

---

## Tarefa 11.3 — Ponto de entrada 2: Launch Pad

### Health check pré-lançamento no checklist:

```typescript
// No checklist do Launch Pad (Sprint 10):
{
  id: 'health_check',
  title: 'Diagnosticar landing page',
  description: 'Cole a URL do seu funil para verificar antes de investir em tráfego',
  action: async (url: string) => {
    const result = await AutopsyEngine.analyze(url, { depth: 'deep' });
    // Deep = + Gemini Vision + Core Web Vitals (futuro)
    return result;
  },
  completed: false,
}
```

### Score alimenta CampaignContext:
```typescript
// Salvar no manifesto:
campaign.stages.launch.healthCheck = {
  url: analyzedUrl,
  score: result.overallScore,
  findings: result.findings,
  checkedAt: serverTimestamp(),
};
```

### Critérios de aceitação:
- [ ] Input de URL no Launch Pad
- [ ] Diagnóstico deep (quando implementado)
- [ ] Score e findings no manifesto da campanha
- [ ] Recomendações acionáveis

---

## Tarefa 11.4 — Ponto de entrada 3: Chat

### Quando usuário cola URL no chat:

```typescript
// Detecção de URL no chat:
if (containsUrl(message)) {
  const url = extractUrl(message);
  const result = await AutopsyEngine.analyze(url, { depth: 'quick' });

  // Conselheiros relevantes comentam:
  // Carlton comenta hook, Schwartz comenta awareness,
  // Brunson comenta oferta — cada um com sua voz
  const expertComments = result.findings.map(f => ({
    expert: f.expertId,
    comment: f.recommendation,
    framework: f.framework,
  }));

  // Injeta no contexto da resposta
}
```

### Critérios de aceitação:
- [ ] URL colada no chat → análise automática
- [ ] Conselheiros comentam com voz individual
- [ ] Findings atribuídos ao expert correto

---

## Tarefa 11.5 — Cobrar créditos nos pontos de entrada

### Custo por ponto:
| Ponto | Créditos | Motivo |
|---|---|---|
| Spy Agent | 0 extra (incluso nos 2 do spy) | Quick, junto com análise |
| Launch Pad | 2 | Análise dedicada |
| Chat | 1 | Quick, junto com resposta |

### Critérios de aceitação:
- [ ] Cada ponto cobra créditos corretos
- [ ] Transparente antes de executar

---

## Check de Progressão Contínua

```
Spy Agent → "Diagnóstico de conversão: 67/100. Hook fraco, oferta sem urgência."
  ↓ PRÓXIMO PASSO: "Melhorar oferta no Offer Lab →"

Launch Pad → "Health check: 82/100. CTAs bem posicionados, falta prova social."
  ↓ PRÓXIMO PASSO: "Adicionar depoimentos" (item do checklist)

Chat → "Analisei sua página. Carlton diz: hook precisa de mais curiosidade..."
  ↓ FOLLOW-UP: "Como reescrever o hook?" → conselheiro aprofunda
```
