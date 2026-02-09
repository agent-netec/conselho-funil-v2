"use client"

// ─── PropensityBadge ─────────────────────────────────────────────────────────
// Badge visual de propensão de compra: hot (vermelho/laranja), warm (amarelo), cold (azul).
// Tamanhos: sm | md | lg. Acessível com aria-label.
// Sprint 28 — S28-PS-05

import * as React from "react"

type PropensitySegment = "hot" | "warm" | "cold"
type BadgeSize = "sm" | "md" | "lg"

export interface PropensityBadgeProps {
  segment: PropensitySegment
  score: number
  size?: BadgeSize
}

const SEGMENT_CONFIG: Record<
  PropensitySegment,
  { label: string; bg: string; text: string; ring: string; dot: string }
> = {
  hot: {
    label: "Hot",
    bg: "bg-red-100 dark:bg-red-950",
    text: "text-red-700 dark:text-red-400",
    ring: "ring-red-300 dark:ring-red-800",
    dot: "bg-red-500",
  },
  warm: {
    label: "Warm",
    bg: "bg-amber-100 dark:bg-amber-950",
    text: "text-amber-700 dark:text-amber-400",
    ring: "ring-amber-300 dark:ring-amber-800",
    dot: "bg-amber-500",
  },
  cold: {
    label: "Cold",
    bg: "bg-blue-100 dark:bg-blue-950",
    text: "text-blue-700 dark:text-blue-400",
    ring: "ring-blue-300 dark:ring-blue-800",
    dot: "bg-blue-500",
  },
}

const SIZE_CONFIG: Record<BadgeSize, { wrapper: string; dot: string; text: string }> = {
  sm: {
    wrapper: "px-2 py-0.5 text-xs",
    dot: "h-1.5 w-1.5",
    text: "text-xs",
  },
  md: {
    wrapper: "px-3 py-1 text-sm",
    dot: "h-2 w-2",
    text: "text-sm",
  },
  lg: {
    wrapper: "px-4 py-1.5 text-base",
    dot: "h-2.5 w-2.5",
    text: "text-base",
  },
}

export function PropensityBadge({ segment, score, size = "md" }: PropensityBadgeProps) {
  const c = SEGMENT_CONFIG[segment]
  const s = SIZE_CONFIG[size]
  const scorePercent = (score * 100).toFixed(0)

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset ${c.bg} ${c.text} ${c.ring} ${s.wrapper}`}
      role="status"
      aria-label={`Propensão ${c.label} — ${scorePercent}%`}
    >
      <span className={`rounded-full shrink-0 ${c.dot} ${s.dot}`} aria-hidden="true" />
      <span className={s.text}>
        {c.label} — {scorePercent}%
      </span>
    </span>
  )
}
