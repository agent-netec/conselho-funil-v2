# Sprint J — UX Polish & User Testing Readiness

> Fase: 3 — Evolucao Pos-QA
> Status: PENDENTE
> Dependencia: Sprint I concluido (bugs corrigidos, deploy feito)
> Prioridade: **MAXIMA** — Gate para iniciar testes com usuarios
> Estimativa: ~2-3 sessoes
> Issues relacionados: #8, #14 (nivel 1), #16, #17 (observacao)

---

## Contexto

Sprint I revelou que varios modulos **funcionam tecnicamente** mas dao a impressao de estarem quebrados para um usuario de primeira vez. Antes de colocar o app nas maos de amigos/testers, precisamos eliminar esses "falsos negativos" de UX que vao gerar feedback incorreto ("nao funciona" quando na verdade funciona mas nao guia o usuario).

**Criterio de sucesso:** Um usuario novo consegue completar os fluxos principais sem achar que algo esta quebrado.

---

## Tarefas

### J-1. Offer Lab — Guia de UX & Feedback Contextual (Issue #16)

**Problema:** Score parece travado em 24 ("Oferta Fraca"). Nao e bug — sliders default 5/5/5/5 produzem base 4/80. Usuario foca nos campos de texto achando que sao o driver, mas 80% do score vem dos sliders Hormozi.

**Arquivos principais:**
- `app/src/components/intelligence/offer-lab/offer-lab-wizard.tsx`
- `app/src/lib/intelligence/offer/calculator.ts`

**Tarefas:**
- [ ] J-1.1 — Adicionar tooltip/callout nos sliders Hormozi explicando que eles controlam 80% do score
- [ ] J-1.2 — Inverter labels de Tempo/Esforco para UX intuitiva (slider alto = "Rapido/Facil" = score ALTO, internamente mapeado para valor baixo na formula)
- [ ] J-1.3 — Adicionar feedback contextual abaixo do score explicando POR QUE esta baixo (ex: "Tempo e Esforco percebidos estao altos — reduza para aumentar a irresistibilidade")
- [ ] J-1.4 — Melhorar defaults iniciais: considerar 3/7/7/3 (Dream medio, Prob alta, Tempo baixo, Esforco baixo) para score inicial mais motivador (~45)
- [ ] J-1.5 — Adicionar mini-guia "Como funciona a Equacao de Valor" com exemplo visual da formula Hormozi

**Pontos de atencao:**
- NAO alterar a formula do calculator.ts — ela esta correta
- NAO alterar como o score e salvo no Firebase (alimenta Funnels/Copy via brain context)
- Apenas UX: tooltips, labels, feedback, defaults

---

### J-2. Campaign Command Center — Experiencia de Conclusao (Issue #8)

**Problema:** Todos os 5 stages ficam "APROVADO" mas nada acontece. Sem relatorio, sem resumo executivo, sem proximos passos, sem celebracao. UX anticlimatica — usuario completa todo o fluxo e o sistema nao reage.

**Arquivos principais:**
- `app/src/app/campaigns/[id]/page.tsx`

**Tarefas:**
- [ ] J-2.1 — Detectar estado "campanha completa" (todos os 5 stages approved)
- [ ] J-2.2 — Exibir card de conclusao com: resumo executivo dos assets gerados (copy aprovada, design, social, ads), celebracao visual
- [ ] J-2.3 — Adicionar botao "Gerar Campaign Brief" que consolida todos os assets aprovados em um resumo acionavel
- [ ] J-2.4 — Adicionar secao "Proximos Passos" com checklist pratico (subir criativos na plataforma, configurar publicos, definir orcamento, programar lancamento)
- [ ] J-2.5 — Adicionar botao "Exportar Brief" (JSON ou texto formatado para copiar) — PDF pode ser futuro

**Pontos de atencao:**
- Issue #5 (Real-Time Performance mock) esta na mesma pagina — NAO tentar resolver aqui
- Focar apenas no estado POS-CONCLUSAO da Linha de Ouro
- O brief deve puxar dados reais dos stages (copywriting, social, design, ads do Firestore)
- Nao adicionar logica de "lancamento real" — isso e Sprint futuro

---

### J-3. Funnel Autopsy — Renomear para "Page Forensics" (Issue #14, Nivel 1)

**Problema:** Nome "Autopsia de Funil" promete analise de funil completo (LP→VSL→Checkout→Upsell→Thank You) mas entrega analise de pagina unica. O engine e solido (10 experts, 5 heuristicas, health score) mas o naming e enganoso.

**Arquivos principais:**
- `app/src/app/strategy/autopsy/page.tsx`
- Sidebar/navigation que referencia "Autopsy"

**Tarefas:**
- [ ] J-3.1 — Renomear de "Autopsia de Funil" para "Forensics de Pagina" (ou "Page Forensics") em toda a UI
- [ ] J-3.2 — Atualizar descricao/subtitulo para refletir o escopo real: "Analise profunda de uma pagina especifica com 10 especialistas"
- [ ] J-3.3 — Adicionar nota na UI: "Quer analisar um funil completo? Em breve: Funnel Journey Analysis" (placeholder para Sprint K)
- [ ] J-3.4 — Verificar sidebar/nav e atualizar labels consistentemente

**Pontos de atencao:**
- NAO alterar o engine (autopsy-engine.ts) — funciona bem para analise de pagina
- NAO alterar os endpoints de API
- Apenas mudancas de texto/label na UI
- Nivel 2 (integracao com Pipeline) e Nivel 3 (crawler multi-pagina) ficam para Sprint K

---

### J-4. Deep Research — Conexao Minima com Brand (Issue #17, observacao)

**Problema:** Pipeline funciona (Exa+Firecrawl+Gemini+Brain Schwartz/Brunson) mas dossie gerado e descartavel — nao alimenta outros modulos nem e acessivel pelos conselheiros.

**Arquivos principais:**
- `app/src/app/intelligence/research/page.tsx`
- `app/src/lib/intelligence/research/engine.ts`
- `app/src/lib/firebase/research.ts`

**Tarefas:**
- [ ] J-4.1 — Verificar que dossie salvo no Firebase (brands/{id}/research) ja esta acessivel via listResearch()
- [ ] J-4.2 — Adicionar secao "Dossies Anteriores" na pagina de research mostrando ultimos 5 dossies da brand
- [ ] J-4.3 — Adicionar botao "Salvar Insights no Brand" que extrai keywords, trends e opportunities do dossie e salva no contexto da brand (campo `researchInsights` ou similar)
- [ ] J-4.4 — Garantir que o dossie persista alem de 24h (expiresAt so para CACHE, nao para exibicao)

**Pontos de atencao:**
- NAO alterar o pipeline de geracao (Exa/Firecrawl/Gemini) — funciona
- NAO alterar a logica de brain context no dossier-generator
- Integracao profunda com engines fica para Sprint K
- Verificar se composite index do Firestore ja foi criado (bug #17 fix #1)

---

## Criterio de Aprovacao

| # | Criterio | Verificacao |
|---|----------|-------------|
| 1 | Offer Lab: usuario entende que sliders controlam o score | Teste com 2+ pessoas |
| 2 | Campaign: conclusao da Linha de Ouro gera brief visivel | Completar 1 campanha |
| 3 | Autopsy: nome e descricao refletem escopo real | Navegacao sem confusao |
| 4 | Research: dossies anteriores visiveis | Gerar 2+ dossies e ver historico |

---

## Changelog

| Data | Acao | Status |
|------|------|--------|
| 2026-02-15 | Sprint planejado a partir de Issues #8, #14, #16, #17 | CRIADO |
