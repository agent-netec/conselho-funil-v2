"use client"

// ─── PersonaDetailView ───────────────────────────────────────────────────────
// Detalhe completo da persona: demographics, painPoints, desires, objections,
// sophisticationLevel (barras 1-5), propensity analysis.
// Seções colapsáveis. Reutilizável — recebe scan como prop.
// Sprint 28 — S28-PS-05

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PropensityBadge } from "./PropensityBadge"
import { AudienceScan } from "@/types/personalization"
import {
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Target,
  ThumbsDown,
  Users,
} from "lucide-react"

// ─── Props ───────────────────────────────────────────────────────────────────
export interface PersonaDetailViewProps {
  scan: AudienceScan
}

// ─── SophisticationBars (internal helper) ────────────────────────────────────
function SophisticationBars({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div className="flex gap-1" role="img" aria-label={`Nível de sofisticação ${level} de 5`}>
      {([1, 2, 3, 4, 5] as const).map((i) => (
        <div
          key={i}
          className={`h-2.5 w-6 rounded-sm transition-colors ${
            i <= level ? "bg-purple-500" : "bg-muted"
          }`}
        />
      ))}
      <span className="ml-1.5 text-xs text-muted-foreground">{level}/5</span>
    </div>
  )
}

// ─── CollapsibleSection ──────────────────────────────────────────────────────
interface CollapsibleSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = true,
}: CollapsibleSectionProps) {
  const [open, setOpen] = React.useState(defaultOpen)

  return (
    <Card>
      <CardHeader
        className="pb-3 cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setOpen((o) => !o)
          }
        }}
      >
        <CardTitle className="text-sm uppercase text-muted-foreground flex items-center gap-2">
          {open ? (
            <ChevronDown className="w-4 h-4 transition-transform" />
          ) : (
            <ChevronRight className="w-4 h-4 transition-transform" />
          )}
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      {open && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  )
}

// ─── BulletList ──────────────────────────────────────────────────────────────
interface BulletListProps {
  items: string[]
  color: string
}

function BulletList({ items, color }: BulletListProps) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <span
            className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${color}`}
            aria-hidden="true"
          />
          {item}
        </li>
      ))}
    </ul>
  )
}

// ─── PersonaDetailView ───────────────────────────────────────────────────────
export function PersonaDetailView({ scan }: PersonaDetailViewProps) {
  const { persona, propensity, metadata } = scan

  return (
    <div className="space-y-6">
      {/* ── Header: nome + badge ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-blue-500" />
          <h3 className="text-xl font-semibold">{scan.name}</h3>
        </div>
        <PropensityBadge
          segment={propensity.segment}
          score={propensity.score}
        />
      </div>

      {/* ── Cards de detalhe: Demographics + Propensity ───────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Perfil Demográfico */}
        <CollapsibleSection
          title="Perfil Demográfico"
          icon={<Users className="w-4 h-4" />}
        >
          <div className="space-y-4">
            <p className="text-sm leading-relaxed">{persona.demographics}</p>
            <div>
              <span className="text-xs text-muted-foreground uppercase font-bold">
                Nível de Sofisticação
              </span>
              <div className="mt-1">
                <SophisticationBars level={persona.sophisticationLevel} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
              <span>{metadata.leadCount} leads analisados</span>
              <ChevronRight className="w-3 h-3" />
              <span>
                Confiança: {(metadata.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </CollapsibleSection>

        {/* Análise de Propensão */}
        <CollapsibleSection
          title="Análise de Propensão"
          icon={<BrainCircuit className="w-4 h-4" />}
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase font-bold">
                  Score
                </span>
                <span className="text-sm font-semibold">
                  {(propensity.score * 100).toFixed(0)}%
                </span>
              </div>
              <Progress value={propensity.score * 100} className="h-2" />
            </div>
            <div className="p-3 bg-muted/30 rounded-lg border border-dashed">
              <p className="text-xs italic text-muted-foreground leading-relaxed">
                &ldquo;{propensity.reasoning}&rdquo;
              </p>
            </div>
          </div>
        </CollapsibleSection>
      </div>

      {/* ── Pain Points + Desires + Objections ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CollapsibleSection
          title="Dores"
          icon={<Target className="w-4 h-4 text-red-500" />}
        >
          <BulletList items={persona.painPoints} color="bg-red-500" />
        </CollapsibleSection>

        <CollapsibleSection
          title="Desejos"
          icon={<Sparkles className="w-4 h-4 text-green-500" />}
        >
          <BulletList items={persona.desires} color="bg-green-500" />
        </CollapsibleSection>

        <CollapsibleSection
          title="Objeções"
          icon={<ThumbsDown className="w-4 h-4 text-amber-500" />}
        >
          <BulletList items={persona.objections} color="bg-amber-500" />
        </CollapsibleSection>
      </div>
    </div>
  )
}
