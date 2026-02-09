"use client"

// ─── AudienceScanCard ────────────────────────────────────────────────────────
// Card de resumo do scan: data, brandId parcial, confidence score, propensity segment.
// Clicável, responsivo, reutilizável.
// Sprint 28 — S28-PS-05

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AudienceScan } from "@/types/personalization"
import { PropensityBadge } from "./PropensityBadge"
import { BrainCircuit, Users, Target } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export interface AudienceScanCardProps {
  scan: AudienceScan
  onSelect?: (scan: AudienceScan) => void
  isSelected?: boolean
}

export function AudienceScanCard({ scan, onSelect, isSelected }: AudienceScanCardProps) {
  const { persona, propensity, metadata } = scan

  const handleClick = () => {
    onSelect?.(scan)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onSelect?.(scan)
    }
  }

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "border-purple-500 ring-1 ring-purple-500" : ""
      }`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Scan ${scan.name} — ${propensity.segment}`}
    >
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <div className="min-w-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500 shrink-0" />
              <span className="truncate">{scan.name}</span>
            </CardTitle>
            <CardDescription className="mt-1 space-y-0.5">
              <span className="block">
                Gerado em{" "}
                {format(metadata.createdAt.toDate(), "dd 'de' MMMM", {
                  locale: ptBR,
                })}
              </span>
              <span className="block text-[10px] font-mono text-muted-foreground/70">
                Brand: {scan.brandId.substring(0, 8)}…
              </span>
            </CardDescription>
          </div>
          <PropensityBadge
            segment={propensity.segment}
            score={propensity.score}
            size="sm"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Propensão + Sofisticação */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-bold">
              Propensão
            </span>
            <div className="flex items-center gap-2">
              <Progress value={propensity.score * 100} className="h-2" />
              <span className="text-sm font-medium">
                {(propensity.score * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-bold">
              Sofisticação
            </span>
            <div className="flex gap-1">
              {([1, 2, 3, 4, 5] as const).map((level) => (
                <div
                  key={level}
                  className={`h-2 w-full rounded-full ${
                    level <= persona.sophisticationLevel
                      ? "bg-purple-500"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Confidence */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Confiança: {(metadata.confidence * 100).toFixed(0)}%</span>
          <span className="text-muted-foreground/40">·</span>
          <span>{metadata.leadCount} leads</span>
        </div>

        {/* Dores Principais (preview) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="w-4 h-4 text-red-500" />
            Dores Principais
          </div>
          <div className="flex flex-wrap gap-1">
            {persona.painPoints.slice(0, 3).map((pain, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="text-[10px] font-normal"
              >
                {pain}
              </Badge>
            ))}
            {persona.painPoints.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{persona.painPoints.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* IA Reasoning (preview) */}
        <div className="p-3 bg-muted/30 rounded-lg border border-dashed">
          <div className="flex items-start gap-2">
            <BrainCircuit className="w-4 h-4 text-purple-500 mt-1 shrink-0" />
            <p className="text-xs italic text-muted-foreground leading-relaxed line-clamp-2">
              &ldquo;{propensity.reasoning.substring(0, 120)}…&rdquo;
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
export function AudienceScanSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <div className="h-6 w-3/4 bg-muted rounded mb-2" />
        <div className="h-4 w-1/2 bg-muted rounded" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="h-8 bg-muted rounded" />
          <div className="h-8 bg-muted rounded" />
        </div>
        <div className="h-12 bg-muted rounded" />
        <div className="h-16 bg-muted rounded" />
      </CardContent>
    </Card>
  )
}
