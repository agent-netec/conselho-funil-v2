# PROMPT: Purple → Gold — Migração Final de Tokens

> **Branch:** `feature/dashboard-visual-redesign`
> **Contexto:** Emerald já foi 100% removido. Restam 195 referências `purple-*` em 75 arquivos secundários. Telas core (Welcome, Dashboard, Landing, Funnels pipeline, Offer Lab wizard, Funnel detail, Sidebar, Login, Legal pages) já estão em gold.
> **Regra:** NÃO alterar lógica de negócio, RAG, credits, ou persistência. Apenas tokens de cor.

---

## TABELA DE SUBSTITUIÇÃO

Aplicar em TODOS os 75 arquivos listados abaixo. Substituição global (find & replace).

### Texto
| De | Para |
|----|------|
| `text-purple-300` | `text-[#E6B447]` |
| `text-purple-400` | `text-[#E6B447]` |
| `text-purple-500` | `text-[#E6B447]` |
| `text-purple-600` | `text-[#E6B447]` |
| `text-purple-700` | `text-[#E6B447]` |

### Background
| De | Para |
|----|------|
| `bg-purple-500/5` | `bg-[#E6B447]/5` |
| `bg-purple-500/10` | `bg-[#E6B447]/10` |
| `bg-purple-500/20` | `bg-[#E6B447]/20` |
| `bg-purple-50/10` | `bg-[#E6B447]/10` |
| `bg-purple-100` | `bg-[#E6B447]/10` |
| `bg-purple-400` | `bg-[#E6B447]` |
| `bg-purple-500` | `bg-[#E6B447]` |
| `bg-purple-600` | `bg-[#E6B447]` |

### Border
| De | Para |
|----|------|
| `border-purple-100` | `border-[#E6B447]/20` |
| `border-purple-200` | `border-[#E6B447]/30` |
| `border-purple-500/10` | `border-[#E6B447]/10` |
| `border-purple-500/20` | `border-[#E6B447]/20` |
| `border-purple-500/30` | `border-[#E6B447]/30` |
| `border-purple-500/50` | `border-[#E6B447]/50` |
| `border-purple-500/60` | `border-[#E6B447]/60` |
| `border-purple-500` | `border-[#E6B447]` |
| `border-l-purple-500` | `border-l-[#E6B447]` |
| `border-t-purple-500` | `border-t-[#E6B447]` |

### Hover
| De | Para |
|----|------|
| `hover:bg-purple-500` | `hover:bg-[#F0C35C]` |
| `hover:bg-purple-500/10` | `hover:bg-[#E6B447]/10` |
| `hover:bg-purple-500/20` | `hover:bg-[#E6B447]/20` |
| `hover:bg-purple-700` | `hover:bg-[#AB8648]` |
| `hover:text-purple-300` | `hover:text-[#F0C35C]` |
| `hover:text-purple-400` | `hover:text-[#E6B447]` |
| `hover:border-purple-500/40` | `hover:border-[#E6B447]/40` |

### Ring / Focus
| De | Para |
|----|------|
| `ring-purple-500` | `ring-[#E6B447]` |
| `ring-purple-500/20` | `ring-[#E6B447]/20` |
| `focus-visible:ring-purple-500` | `focus-visible:ring-[#E6B447]` |

### Shadow
| De | Para |
|----|------|
| `shadow-purple-900/20` | `shadow-black/20` |
| `shadow-purple-500/20` | `shadow-[#E6B447]/20` |
| `rgba(168,85,247,0.3)` | `rgba(230,180,71,0.3)` |

### Gradients
| De | Para |
|----|------|
| `from-purple-400` | `from-[#E6B447]` |
| `from-purple-500` | `from-[#E6B447]` |
| `from-purple-500/20` | `from-[#E6B447]/20` |
| `from-purple-600` | `from-[#E6B447]` |
| `to-purple-500` | `to-[#AB8648]` |
| `to-purple-600` | `to-[#AB8648]` |
| `hover:from-purple-500` | `hover:from-[#F0C35C]` |
| `hover:from-purple-700` | `hover:from-[#AB8648]` |
| `hover:to-purple-500` | `hover:to-[#F0C35C]` |
| `hover:to-purple-700` | `hover:to-[#AB8648]` |

### Data attributes
| De | Para |
|----|------|
| `data-[state=active]:bg-purple-500/10` | `data-[state=active]:bg-[#E6B447]/10` |
| `data-[state=active]:text-purple-400` | `data-[state=active]:text-[#E6B447]` |

### Constants (string values)
| De | Para |
|----|------|
| `'bg-purple-500'` | `'bg-[#E6B447]'` |
| `accentColor: 'purple'` | `accentColor: 'gold'` |

---

## EXCEÇÕES — NÃO SUBSTITUIR

Estes usos de purple são **intencionais** (branding de plataforma ou gradiente decorativo):

1. **`meta-stories-card.tsx:41`** — `from-pink-500 to-purple-600` → gradiente Instagram. **MANTER.**
2. **`meta-feed-card.tsx:30`** — `from-blue-500 to-purple-600` → gradiente Meta. **MANTER.**
3. **`chat-message-bubble.tsx:409`** — `from-[#E6B447] via-blue-500 to-purple-500` → gradiente multicolor decorativo. **MANTER.**

---

## LISTA DE ARQUIVOS (75 total)

Agrupar por área para processar em batches:

### Batch 1 — Chat (5 arquivos, ~31 refs)
- `src/components/chat/design-generation-card.tsx` (20 refs)
- `src/components/chat/chat-message-bubble.tsx` (4 refs — 1 é exceção)
- `src/components/chat/chat-empty-state.tsx` (4 refs)
- `src/components/chat/ads-strategy-card.tsx` (2 refs)
- `src/components/chat/chat-mode-selector.tsx` (1 ref)

### Batch 2 — Intelligence (18 arquivos, ~42 refs)
- `src/app/intelligence/personalization/page.tsx` (8 refs)
- `src/app/intelligence/predictive/page.tsx` (3 refs)
- `src/app/intelligence/discovery/page.tsx` (3 refs)
- `src/app/intelligence/page.tsx` (2 refs)
- `src/app/intelligence/ab-testing/page.tsx` (1 ref)
- `src/app/intelligence/attribution/page.tsx` (3 refs)
- `src/app/intelligence/journey/page.tsx` (1 ref)
- `src/components/intelligence/offer-lab/offer-compare.tsx` (3 refs)
- `src/components/intelligence/offer-lab/offer-list.tsx` (2 refs)
- `src/components/intelligence/discovery/keywords-miner.tsx` (3 refs)
- `src/components/intelligence/discovery/assets-panel.tsx` (1 ref)
- `src/components/intelligence/ad-preview/ad-preview-system.tsx` (4 refs)
- `src/components/intelligence/ad-preview/meta-stories-card.tsx` (1 ref — EXCEÇÃO)
- `src/components/intelligence/ad-preview/meta-feed-card.tsx` (1 ref — EXCEÇÃO)
- `src/components/intelligence/predictive/ScaleSimulator.tsx` (1 ref)
- `src/components/intelligence/predictor/recommendations-list.tsx` (1 ref)
- `src/components/intelligence/predictor/prediction-panel.tsx` (1 ref)
- `src/components/intelligence/personalization/AudienceScanCard.tsx` (3 refs)
- `src/components/intelligence/personalization/PersonaDetailView.tsx` (1 ref)
- `src/components/intelligence/ltv/CohortDashboard.tsx` (1 ref)
- `src/components/intelligence/ab-test-card.tsx` (1 ref)
- `src/components/intelligence/ab-test-wizard.tsx` (1 ref)
- `src/components/intelligence/ab-test-results.tsx` (1 ref)
- `src/components/intelligence/competitors/tech-stack-badges.tsx` (1 ref)
- `src/components/intelligence/keyword-ranking.tsx` (1 ref)
- `src/components/intelligence/journey/LeadTimeline.tsx` (1 ref)
- `src/components/intelligence/sources-tab.tsx` (1 ref)
- `src/components/intelligence/public-emotion.tsx` (1 ref)

### Batch 3 — Performance (4 arquivos, ~15 refs)
- `src/components/performance/automation-control-center.tsx` (8 refs)
- `src/app/performance/page.tsx` (6 refs)
- `src/app/performance/cross-channel/page.tsx` (4 refs)
- `src/components/performance/cross-channel/UnifiedDashboard.tsx` (2 refs)
- `src/components/performance/war-room-dashboard.tsx` (1 ref)

### Batch 4 — Funnels sub-pages (3 arquivos, ~9 refs)
- `src/app/funnels/[id]/design/page.tsx` (5 refs)
- `src/app/funnels/[id]/proposals/[proposalId]/page.tsx` (3 refs)
- `src/app/funnels/[id]/copy/page.tsx` (1 ref)

### Batch 5 — Brands / Brand Config (4 arquivos, ~10 refs)
- `src/components/brands/wizard/step-ai-config.tsx` (4 refs)
- `src/components/brands/wizard/step-confirm.tsx` (4 refs)
- `src/components/brand-config/ai-config-modal.tsx` (4 refs)
- `src/components/brand-config/rag-assets-modal.tsx` (2 refs)
- `src/components/brands/strategic-context.tsx` (1 ref)
- `src/app/brands/[id]/page.tsx` (2 refs)
- `src/app/brands/[id]/assets/page.tsx` (3 refs)

### Batch 6 — Assets (3 arquivos, ~13 refs)
- `src/components/assets/metrics-table.tsx` (6 refs)
- `src/components/assets/asset-detail-modal.tsx` (5 refs)
- `src/components/assets/metrics-summary.tsx` (2 refs)
- `src/app/assets/page.tsx` (1 ref)

### Batch 7 — Personalization (2 arquivos, ~6 refs)
- `src/components/personalization/rule-editor.tsx` (3 refs)
- `src/components/personalization/audience-scan-card.tsx` (3 refs)

### Batch 8 — Content (3 arquivos, ~5 refs)
- `src/app/content/calendar/page.tsx` (3 refs)
- `src/components/content/status-badge.tsx` (1 ref)
- `src/components/content/calendar-view.tsx` (1 ref)
- `src/components/content/review-card.tsx` (1 ref)

### Batch 9 — Outros (10 arquivos, ~15 refs)
- `src/components/creative/copy-lab-modal.tsx` (5 refs)
- `src/components/funnel-autopsy/AutopsyReportView.tsx` (4 refs)
- `src/lib/constants.ts` (3 refs)
- `src/components/legal/cookie-banner.tsx` (2 refs)
- `src/components/ui/slider.tsx` (2 refs)
- `src/components/agency/ClientPerformanceCard.tsx` (2 refs)
- `src/app/(agency)/dashboard/page.tsx` (1 ref)
- `src/app/settings/billing/page.tsx` (1 ref)
- `src/components/dashboard/quick-actions.tsx` (1 ref)
- `src/components/copy/copy-scorecard.tsx` (1 ref)
- `src/components/context/scope-selector.tsx` (2 refs)
- `src/components/context/context-indicator.tsx` (1 ref)
- `src/app/page.tsx` (3 refs)
- `src/app/library/page.tsx` (2 refs)
- `src/app/(public)/cookies/page.tsx` (3 refs)
- `src/app/chat/page.tsx` (2 refs)

---

## VERIFICAÇÃO

```bash
# 1. Zero purple (exceto 3 exceções)
grep -rn "purple" app/src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v ".next"
# Deve retornar APENAS as 3 exceções (meta-stories, meta-feed, chat-message-bubble gradient)

# 2. Build
cd app && npm run build
```

---

## COMMIT

```
fix(visual): migrate all purple accent tokens to Honey Gold across 75 files

- Replace 195 purple-* Tailwind classes with #E6B447 gold equivalents
- Preserve platform branding gradients (Instagram, Meta)
- Complete the emerald→gold palette migration started in prior commits
- Zero remaining off-brand accent colors in codebase

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## PÓS-EXECUÇÃO

Após este commit, a branch `feature/dashboard-visual-redesign` estará pronta para merge no master.

```bash
git checkout master
git merge feature/dashboard-visual-redesign
```
