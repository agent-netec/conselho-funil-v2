# Visual Polish Complete — Honey Gold Design System

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply Honey Gold design tokens consistently across ALL internal pages, eliminating amber/rose/violet/yellow/blue color leaks.

**Architecture:** Mechanical color token replacement across ~24 files, grouped by section.

**Tech Stack:** Tailwind CSS, shadcn/ui, Next.js 16

---

## Color Mapping Reference

| Old (wrong) | New (correct) | Usage |
|---|---|---|
| `text-amber-400/500/600` | `text-[#E6B447]` | Primary accent text |
| `bg-amber-500/10` | `bg-[#E6B447]/10` | Subtle backgrounds |
| `bg-amber-500`, `bg-amber-600` | `bg-[#E6B447]` | Solid buttons |
| `hover:bg-amber-600` | `hover:bg-[#AB8648]` | Button hover |
| `border-amber-200` | `border-[#E6B447]/20` | Borders |
| `text-rose-400` | `text-[#E6B447]` | Icon accent |
| `text-yellow-500` | `text-[#E6B447]` | Pulse indicators |
| `bg-yellow-400/20`, `bg-yellow-500/20` | `bg-[#E6B447]/10` | Warning backgrounds |
| `text-violet-400/500` | `text-[#E6B447]` | RAG/AI accent |
| `bg-violet-500/10`, `bg-violet-600` | `bg-[#E6B447]/10`, `bg-[#AB8648]` | AI backgrounds |
| `text-blue-400/500` | `text-[#AB8648]` or `text-zinc-400` | Secondary info |
| `bg-blue-500/10` | `bg-[#E6B447]/5` | Info backgrounds |
| `to-blue-600` (in gradient) | `to-[#AB8648]` | Gradient endpoints |
| `bg-amber-50`, `bg-green-50/30` | `bg-[#E6B447]/5` | Light theme → dark |
| `text-amber-700`, `text-green-700` | `text-[#E6B447]` | Light theme text |
| `bg-green-100 text-green-700` | `bg-[#7A9B5A]/10 text-[#7A9B5A]` | Success badges (keep green but darken) |
| `bg-blue-100 text-blue-700` | `bg-[#5B8EC4]/10 text-[#5B8EC4]` | Info badges (keep blue but darken) |
| `bg-zinc-950`, `bg-black` | `bg-[#0D0B09]` | Page backgrounds |
| `#895F29` (button hover) | `#AB8648` | Darker gold hover |

## Exemplar Pages (reference these)
- `intelligence/offer-lab/page.tsx` — Perfect Honey Gold implementation
- `intelligence/predictive/page.tsx` — Clean minimal gold

---

## Batch 1: Intelligence Pages (8 files, highest impact)

### Task 1.1: intelligence/creative/page.tsx (25% compliant → 100%)
**Files:** `app/src/app/(app)/intelligence/creative/page.tsx`
- Line 57: `text-amber-400` → `text-[#E6B447]`
- Line 58: `text-blue-400` → `text-[#AB8648]`
- Line 59: `text-rose-400` → `text-[#E6B447]`
- Line 60: already correct `text-[#E6B447]`

### Task 1.2: intelligence/discovery/page.tsx (40% → 100%)
**Files:** `app/src/app/(app)/intelligence/discovery/page.tsx`
- Replace all `text-blue-500` with `text-[#E6B447]`
- Replace all `text-amber-500/400` with `text-[#E6B447]`
- Replace `bg-blue-500/20 text-blue-400` badges with `bg-[#E6B447]/10 text-[#E6B447]`
- Fix gradient: `from-[#E6B447]/10 to-blue-500/10` → `from-[#E6B447]/10 to-[#AB8648]/5`

### Task 1.3: intelligence/page.tsx (60% → 100%)
**Files:** `app/src/app/(app)/intelligence/page.tsx`
- Remove blue from gradient: `from-[#E6B447] to-blue-600` → `from-[#E6B447] to-[#AB8648]`
- Fix hover: `hover:from-[#AB8648] hover:to-blue-700` → `hover:from-[#AB8648] hover:to-[#895F29]`

### Task 1.4: intelligence/attribution/page.tsx (50% → 100%)
**Files:** `app/src/app/(app)/intelligence/attribution/page.tsx`
- Replace `bg-amber-500/10 text-amber-600 border-amber-200` → `bg-[#E6B447]/10 text-[#E6B447] border-[#E6B447]/20`
- Replace `text-amber-600` → `text-[#E6B447]`
- Replace `bg-amber-50/50` → `bg-[#E6B447]/5`
- Replace `text-amber-700` → `text-[#E6B447]`
- Fix bar chart colors: `#94a3b8, #8b5cf6, #3b82f6, #f59e0b` → `#E6B447, #AB8648, #6B5D4A, #F0C35C`

### Task 1.5: intelligence/ltv/page.tsx (55% → 100%)
**Files:** `app/src/app/(app)/intelligence/ltv/page.tsx`
- Replace `bg-amber-50 text-amber-600 border-amber-200` → `bg-[#E6B447]/10 text-[#E6B447] border-[#E6B447]/20`
- Replace `text-amber-600/700/500` → `text-[#E6B447]`

### Task 1.6: intelligence/personalization/page.tsx (60% → 100%)
**Files:** `app/src/app/(app)/intelligence/personalization/page.tsx`
- Replace `bg-green-50/30 border-green-200` → `border-[#E6B447]/30 bg-[#E6B447]/5`
- Replace `border-gray-200 bg-gray-50/30` → `border-zinc-800 bg-zinc-900/20`
- Replace `text-green-500` → `text-[#E6B447]`
- Replace `text-gray-400` → `text-zinc-500`
- Replace `bg-green-100 text-green-700` → `bg-[#7A9B5A]/10 text-[#7A9B5A]`
- Replace `bg-blue-100 text-blue-700` → `bg-[#5B8EC4]/10 text-[#5B8EC4]`
- Replace `text-violet-400/500` → `text-[#E6B447]`
- Replace `bg-violet-500/10` → `bg-[#E6B447]/10`

### Task 1.7: intelligence/research/page.tsx (70% → 100%)
**Files:** `app/src/app/(app)/intelligence/research/page.tsx`
- Replace `bg-violet-500/10 border-violet-500/20` → `bg-[#E6B447]/10 border-[#E6B447]/20`
- Replace `bg-violet-600 hover:bg-violet-500` → `bg-[#AB8648] hover:bg-[#E6B447]`
- Replace `text-violet-400` → `text-[#E6B447]`
- Fix gradient: `from-violet-500/5 to-[#E6B447]/5 border-violet-500/20` → `from-[#E6B447]/5 to-[#AB8648]/5 border-[#E6B447]/20`

### Task 1.8: intelligence/ab-testing/page.tsx (85% → 100%)
**Files:** `app/src/app/(app)/intelligence/ab-testing/page.tsx`
- Replace `text-yellow-500` → `text-[#E6B447]`

---

## Batch 2: Social + Content + Campaigns (5 files)

### Task 2.1: social/page.tsx
**Files:** `app/src/app/(app)/social/page.tsx`
- Replace `text-rose-400` → `text-[#E6B447]`

### Task 2.2: content/review/page.tsx
**Files:** `app/src/app/(app)/content/review/page.tsx`
- Replace `text-amber-400` header icon → `text-[#E6B447]`

### Task 2.3: campaigns/page.tsx
**Files:** `app/src/app/(app)/campaigns/page.tsx`
- Replace `bg-amber-500/10` → `bg-[#E6B447]/10`
- Replace `text-amber-400` → `text-[#E6B447]`
- Replace `hover:border-amber-500/30` → `hover:border-[#E6B447]/30`
- Replace `bg-amber-600` → `bg-[#E6B447]`
- Replace `bg-amber-500/10` status → `bg-[#E6B447]/10`

### Task 2.4: campaigns/[id]/page.tsx
**Files:** `app/src/app/(app)/campaigns/[id]/page.tsx`
- Replace `text-amber-400` (golden thread) → `text-[#E6B447]`

### Task 2.5: funnels/[id]/social/page.tsx
**Files:** `app/src/app/(app)/funnels/[id]/social/page.tsx`
- Replace `text-rose-400` → `text-[#E6B447]`
- Replace `border-rose-500/20 text-rose-400 bg-rose-500/5` → `border-[#E6B447]/20 text-[#E6B447] bg-[#E6B447]/5`

---

## Batch 3: Brands sub-pages (4 files)

### Task 3.1: brands/new/page.tsx
**Files:** `app/src/app/(app)/brands/new/page.tsx`
- Replace `bg-[#AB8648]` buttons → `bg-[#E6B447]`
- Replace `hover:bg-[#895F29]` → `hover:bg-[#AB8648]`
- Fix gradient: `from-[#E6B447] to-blue-600` → `from-[#E6B447] to-[#AB8648]`

### Task 3.2: brands/[id]/page.tsx
**Files:** `app/src/app/(app)/brands/[id]/page.tsx`
- Replace `bg-[#AB8648] hover:bg-[#895F29]` edit button → `bg-[#E6B447] hover:bg-[#AB8648]`
- Replace `bg-blue-500/10` → `bg-[#E6B447]/5`

### Task 3.3: brands/[id]/edit/page.tsx
**Files:** `app/src/app/(app)/brands/[id]/edit/page.tsx`
- Replace `bg-[#AB8648]` buttons → `bg-[#E6B447]`
- Replace `hover:bg-[#895F29]` → `hover:bg-[#AB8648]`

### Task 3.4: brands/[id]/assets/page.tsx
**Files:** `app/src/app/(app)/brands/[id]/assets/page.tsx`
- Replace `bg-zinc-950` → `bg-[#0D0B09]`
- Replace `bg-blue-500/10 border-blue-500/30` → `bg-[#E6B447]/5 border-[#E6B447]/20`

---

## Batch 4: Funnels sub-pages (3 files)

### Task 4.1: funnels/[id]/copy/page.tsx
**Files:** `app/src/app/(app)/funnels/[id]/copy/page.tsx`
- Fix hover: `hover:bg-[#AB8648]` on approve button → keep (this is a valid darker hover)
- Fix gradient: `from-violet-500 to-[#AB8648]` → `from-[#E6B447] to-[#AB8648]`

### Task 4.2: funnels/[id]/design/page.tsx
**Files:** `app/src/app/(app)/funnels/[id]/design/page.tsx`
- Replace `text-blue-400` → `text-[#E6B447]`
- Replace `bg-black` → `bg-[#0D0B09]`

### Task 4.3: funnels/[id]/proposals/[proposalId]/page.tsx
**Files:** `app/src/app/(app)/funnels/[id]/proposals/[proposalId]/page.tsx`
- Fix gradient: `from-violet-600 to-[#AB8648]` → `from-[#E6B447] to-[#AB8648]`

---

## Batch 5: Settings sub-pages (3 files)

### Task 5.1: settings/billing/page.tsx
**Files:** `app/src/app/(app)/settings/billing/page.tsx`
- Replace `text-amber-400` trial badge → `text-[#E6B447]`
- Replace `bg-amber-500` → `bg-[#E6B447]`
- Replace `hover:bg-amber-600` → `hover:bg-[#AB8648]`

### Task 5.2: settings/integrations/payments/page.tsx
**Files:** `app/src/app/(app)/settings/integrations/payments/page.tsx`
- Replace `bg-yellow-400/20` → `bg-[#E6B447]/10`

### Task 5.3: settings/tracking/page.tsx
**Files:** `app/src/app/(app)/settings/tracking/page.tsx`
- Replace `bg-yellow-500/20` → `bg-[#E6B447]/10`

---

## Batch 6: Journey lead detail (1 file)

### Task 6.1: intelligence/journey/[leadId]/page.tsx
**Files:** `app/src/app/(app)/intelligence/journey/[leadId]/page.tsx`
- Replace `from-slate-900 to-slate-800` → `from-[#1A1612] to-[#241F19]`

---

## Verification

After all batches:
1. `cd app && npm run build` — must pass
2. Grep for remaining violations: `amber-`, `rose-`, `violet-`, `yellow-`, `bg-black`, `bg-zinc-950`
3. Commit all changes
