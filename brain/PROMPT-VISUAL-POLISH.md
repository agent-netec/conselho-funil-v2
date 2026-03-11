# PROMPT: Visual Polish + Cleanup Final

> **Branch:** `feature/dashboard-visual-redesign`
> **Contexto:** Fases 0-3 completas (D0, T1-T6, E1-E7). Migração de cores emerald→gold feita. Restam 3 referências textuais residuais de "Conselho" e gaps visuais entre telas atuais e referências de design.
> **Regra:** NÃO alterar lógica de negócio, RAG, credits, ou persistência. Apenas visual e copy.

---

## PARTE 1 — Limpar 3 Referências Residuais de "Conselho"

### 1A. `app/src/app/funnels/page.tsx` — linha 155

**De:**
```
'O Conselho avalia cada etapa com score de conversão',
```

**Para:**
```
'O MKTHONEY avalia cada etapa com score de conversão',
```

### 1B. `app/src/app/integrations/page.tsx` — linha 569

**De:**
```
// OAuth button — uses the central Conselho de Funil Meta app (META_APP_ID env var)
```

**Para:**
```
// OAuth button — uses the central MKTHONEY Meta app (META_APP_ID env var)
```

### 1C. `app/src/components/social/debate-viewer.tsx` — linha 43

**De:**
```
if (line.includes('Veredito do Conselho') || line.includes('Veredito Final') || line.includes('VEREDITO_DO_CONSELHO')) {
```

**Para:**
```
if (line.includes('Veredito do Conselho') || line.includes('Veredito Final') || line.includes('VEREDITO_DO_CONSELHO') || line.includes('Veredito do MKTHONEY')) {
```

> **NOTA:** Manter os checks antigos pois dados históricos no Firebase ainda contêm "Veredito do Conselho". Apenas ADICIONAR o novo padrão.

---

## PARTE 2 — Visual Discovery: Telas vs Referências

As referências estão em `_netecmt/docs/design/screens/`. Consulte CADA imagem e compare com a implementação atual. Para cada tela, identifique gaps de layout, composição, espaçamento, e copy — NÃO apenas cores (cores já foram migradas).

### Referências disponíveis:

| Referência | Arquivo de imagem | Tela no app |
|------------|-------------------|-------------|
| Welcome (entry flow) | `entry-flow/welcome.png` | `app/src/app/page.tsx` (WelcomeBody) |
| Onboarding modal | `entry-flow/onboarding-modal.png` | `app/src/components/onboarding/` |
| Dashboard pre-briefing | `core-loop/dashboard-pre-briefing.png` | `app/src/app/page.tsx` (PreBriefingBody) |
| Landing full page | `landing-page/full-page.png` | `app/src/app/landing/page.tsx` |
| Landing live | `landing-page/full-page-live.png` | `app/src/app/landing/page.tsx` |
| Landing hero | `landing-page/hero.png` | `app/src/components/landing/` |
| Landing arsenal | `landing-page/arsenal.png` | `app/src/components/landing/` |
| Landing pricing | `landing-page/pricing.png` | `app/src/app/(public)/pricing/page.tsx` |
| Funnels pipeline | `second-loop/funnels-pipeline.png` | `app/src/app/funnels/page.tsx` |
| Funnel detail | `second-loop/funnel-detail.png` | `app/src/app/funnels/[id]/page.tsx` |
| Offer Lab wizard | `second-loop/offer-lab-wizard.png` | `app/src/app/intelligence/offer-lab/page.tsx` |
| Offer Lab result | `second-loop/offer-lab-result.png` | `app/src/app/intelligence/offer-lab/page.tsx` |

### Para CADA referência, responda:

```
## [Nome da Tela]

### Layout Match (1-10): ___
### Composição Match (1-10): ___
### Copy Match (1-10): ___

### Gaps encontrados:
1. [Gap específico — ex: "Cards em grid 2 colunas, referência mostra lista vertical"]
2. ...

### Mudanças necessárias:
1. [Mudança específica com arquivo e linha]
2. ...

### Prioridade: ALTA / MÉDIA / BAIXA
```

---

## PARTE 3 — Executar Correções

Após o discovery (Parte 2), execute TODAS as correções identificadas como ALTA prioridade. Para MÉDIA, liste mas não execute sem aprovação.

### Design Tokens de referência (usar estes valores):

```
# Cores
Primary Gold:     #E6B447
Gold Hover:       #F0C35C
Gold Muted:       #AB8648
Bronze:           #895F29
Chocolate:        #593519

# Superfícies
BG Base:          #0D0B09
Surface 1:        #1A1612
Surface 2:        #231E17
Surface 3:        #2C2519
Surface hover:    #2C2519

# Texto
Text Primary:     #F5E8CE
Text Secondary:   #A89B84
Text Muted:       #6B5F4D
Text Disabled:    #4A4039

# Borders
Border Subtle:    rgba(255,255,255,0.06)
Border Default:   rgba(255,255,255,0.10)
Border Gold:      rgba(230,180,71,0.2)

# Glow
Gold Glow:        0 0 20px rgba(230,180,71,0.15)
```

### Regras visuais:
- Dark-only. NUNCA usar `bg-white`, `text-black`, ou cores claras de fundo
- Bordas: `border-white/[0.06]` (sutil) ou `border-white/[0.10]` (padrão)
- Cards: `bg-white/[0.02]` com `border-white/[0.06]`
- Hover: mudar border e bg sutilmente, NUNCA mudar texto
- Sombras: usar `shadow-lg shadow-black/20`, NUNCA `shadow-gray-*`
- Fonte: Geist Sans (já configurada via next/font)
- Espaçamento: generoso. `py-16` para seções, `gap-3` a `gap-4` entre cards
- Textos de UI: português BR, direto, máximo 2 linhas

---

## CHECKLIST FINAL

- [ ] Zero refs a "Conselho" (exceto backward-compat no debate-viewer)
- [ ] Todas as telas com referência foram comparadas
- [ ] Gaps ALTA prioridade corrigidos
- [ ] Gaps MÉDIA prioridade listados (sem executar)
- [ ] Build passa: `cd app && npm run build`
- [ ] Nenhum arquivo de lógica alterado (apenas visual/copy)

---

## COMMIT

```
fix(visual): polish screens to match design references + clean residual "Conselho" refs

- Replace 3 residual "Conselho" text references with "MKTHONEY"
- [listar gaps corrigidos aqui após execução]

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## VERIFICAÇÃO

```bash
# 1. Zero "Conselho" residual (exceto backward-compat)
grep -rn "Conselho" app/src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v ".next" | grep -v "import" | grep -v "COUNSELORS" | grep -v "counselor" | grep -v "Counselor" | grep -v "backward-compat" | grep -v "Veredito do Conselho"
# Deve retornar ZERO (ou apenas a linha de backward-compat no debate-viewer)

# 2. Build
cd app && npm run build
```
