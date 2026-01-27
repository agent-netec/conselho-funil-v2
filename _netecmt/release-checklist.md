# Release Checklist - NETECMT

Este documento define o checklist obrigatório antes de qualquer deploy para produção.

## Pre-Deploy Checklist

### 1. Verificação de Código

- [ ] Todas as rotas da Sprint existem em `app/src/app/`
- [ ] Build local (`cd app && npm run build`) passa sem erros
- [ ] Output do build mostra as rotas esperadas na seção "Route (pages)"
- [ ] Todos os testes passam (`cd app && npm test`)
- [ ] Sem erros de TypeScript (`cd app && npx tsc --noEmit`)

### 2. Verificação de Configuração

- [ ] `app/vercel.json` existe e está configurado
- [ ] Variáveis de ambiente necessárias estão configuradas na Vercel
- [ ] `Root Directory` no Dashboard Vercel está como `app`

### 3. Verificação de Rotas Críticas (Sprint 10-29)

Execute localmente para verificar se as rotas críticas existem:

```bash
# Sprint 10 - Assets/Ingestão
ls app/src/app/assets/page.tsx

# Sprint 13 - Intelligence
ls app/src/app/intelligence/page.tsx

# Sprint 17 - Social
ls app/src/app/social/page.tsx

# Sprint 20 - Automation
ls app/src/app/automation/page.tsx

# Sprint 21 - LTV
ls app/src/app/intelligence/ltv/page.tsx

# Sprint 22 - Predictive
ls app/src/app/intelligence/predictive/page.tsx

# Sprint 25 - Attribution
ls app/src/app/intelligence/attribution/page.tsx

# Sprint 26 - Creative
ls app/src/app/intelligence/creative/page.tsx

# Sprint 28 - Cross-Channel
ls app/src/app/performance/cross-channel/page.tsx

# Sprint 29 - Personalization
ls app/src/app/intelligence/personalization/page.tsx
```

### 4. Deploy Preview

- [ ] Deploy preview criado e testado
- [ ] Rotas principais acessíveis no preview
- [ ] Sem erros de console no navegador
- [ ] APIs respondem corretamente

### 5. Post-Deploy Verification

- [ ] Executar smoke test (`_netecmt\scripts\smoke-test.ps1`)
- [ ] Verificar logs da Vercel por erros
- [ ] Testar login/autenticação
- [ ] Testar uma funcionalidade crítica de cada sprint

---

## Matriz de Rotas por Sprint

| Sprint | Rota | Descrição |
|--------|------|-----------|
| S10 | `/assets` | Dashboard de Assets |
| S11 | `/campaign/[id]` | Command Center |
| S13 | `/intelligence` | Intelligence Base |
| S14 | `/intelligence` (competitors) | Competitor Tab |
| S17 | `/social`, `/social-inbox` | Social Command |
| S18 | `/performance` | War Room |
| S19 | `/funnels/[id]` | Funnel Autopsy |
| S20 | `/automation` | Automation Center |
| S21 | `/intelligence/ltv`, `/intelligence/journey/[id]` | LTV & Journey |
| S22 | `/intelligence/predictive` | ROI Forecaster |
| S24 | `/shared/reports/[token]` | Client Reports |
| S25 | `/intelligence/attribution` | Attribution |
| S26 | `/intelligence/creative` | Creative Lab |
| S27 | `/automation` | Automation v2 |
| S28 | `/performance/cross-channel` | Cross-Channel |
| S29 | `/intelligence/personalization` | Personalization |

---

## Troubleshooting

### Problema: Rotas dão 404 em produção

1. Verificar `Root Directory` no Dashboard Vercel (Settings > General) = `app`
2. Verificar se `app/vercel.json` existe
3. Verificar logs do build na Vercel
4. Executar build local e conferir output de rotas

### Problema: Build falha na Vercel

1. Verificar se todas as dependências estão em `app/package.json`
2. Verificar variáveis de ambiente
3. Verificar se não há erros de TypeScript
4. Conferir logs detalhados do build

### Problema: APIs não respondem

1. Verificar se as rotas de API existem em `app/src/app/api/`
2. Verificar configuração de `functions` no `app/vercel.json`
3. Verificar logs de function na Vercel

---

*Luke (Release Agent) - NETECMT v2.0*
