"use client"

import * as React from "react"
import { SentimentGauge, SentimentGaugeSkeleton } from "@/components/intelligence/sentiment-gauge"
import { Skeleton } from "@/components/ui/skeleton"
import { CompetitorList } from "@/components/intelligence/competitors/competitor-list"
import { AssetGallery } from "@/components/intelligence/competitors/asset-gallery"
import { CompetitorProfile } from "@/types/competitors"
import { DossierView } from "@/components/intelligence/competitors/dossier-view"
import { PublicEmotion } from "@/components/intelligence/public-emotion"
import { KeywordRanking } from "@/components/intelligence/keyword-ranking"
import dynamic from 'next/dynamic'
import Link from "next/link"

const SocialVolumeChart = dynamic(() => import("@/components/intelligence/social-volume-chart").then(m => ({ default: m.SocialVolumeChart })), { ssr: false })
import { useKeywordIntelligence, useIntelligenceStats } from "@/lib/hooks/use-intelligence"
import { useActiveBrand } from "@/lib/hooks/use-active-brand"
import { FileText } from "lucide-react"

const NAV = [
  { key: "overview", label: "Overview", href: null },
  { key: "discovery", label: "Discovery", href: "/intelligence/discovery" },
  { key: "attribution", label: "Attribution", href: "/intelligence/attribution" },
  { key: "ltv", label: "LTV", href: "/intelligence/ltv" },
  { key: "journey", label: "Journey", href: "/intelligence/journey" },
  { key: "offer-lab", label: "Offer Lab", href: "/intelligence/offer-lab" },
] as const

export default function IntelligencePage() {
  const [selectedCompetitor, setSelectedCompetitor] = React.useState<CompetitorProfile | null>(null)
  const [viewingDossier, setViewingDossier] = React.useState(false)
  const [tab, setTab] = React.useState("overview")

  const activeBrand = useActiveBrand()
  const { keywords, loading: lk } = useKeywordIntelligence()
  const { stats, loading: ls } = useIntelligenceStats()

  const mentions = stats.fullStats?.totalMentions ?? 0
  const sentiment = stats.fullStats?.averageSentimentScore ?? 0
  const topTerm = keywords[0]?.term ?? "—"
  const topKOS = keywords[0]?.metrics?.opportunityScore ?? 0

  return (
    <div className="min-h-screen flex flex-col">
      {/* ═══ HEADER — no icons, numbers ARE the design ═══════════════════ */}
      <header className="shrink-0 border-b border-white/[0.06]">
        <div className="px-8 pt-8 pb-0 max-w-[1440px] mx-auto">
          {/* Row 1: Status + action */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-baseline gap-4">
              <h1 className="text-[42px] font-black tracking-[-0.02em] text-[#F5E8CE] leading-none">
                Intelligence
              </h1>
              <div className="flex items-center gap-2">
                <span className="inline-block h-[6px] w-[6px] rounded-full bg-[#E6B447] shadow-[0_0_12px_rgba(230,180,71,0.8)] animate-pulse" />
                <span className="text-[11px] font-mono text-[#AB8648] tracking-wider">LIVE</span>
              </div>
            </div>
            <Link
              href="/intelligence/personalization"
              className="text-[11px] font-mono font-bold tracking-wider text-[#0D0B09] bg-[#E6B447] hover:bg-[#F0C35C] px-4 py-2 transition-colors"
            >
              PERSONALIZAÇÃO DINÂMICA →
            </Link>
          </div>

          {/* Row 2: KPI bar — giant monospace numbers, vertical dividers */}
          <div className="grid grid-cols-4 border border-white/[0.06] divide-x divide-white/[0.06] mb-8">
            <KPI label="Menções Totais" value={String(mentions)} />
            <KPI label="Sentimento" value={sentiment.toFixed(1)} unit="/10" />
            <KPI label="Top Keyword" value={topTerm} isText />
            <KPI label="Melhor KOS" value={String(topKOS)} unit="pts" highlight />
          </div>

          {/* Row 3: Navigation — minimal, text-only */}
          <nav className="flex gap-0 -mb-px">
            {NAV.map((item) => {
              const active = tab === item.key
              const cls = `
                block px-5 py-3 text-[11px] font-mono tracking-wider transition-colors
                border-b-2 ${active
                  ? 'text-[#E6B447] border-[#E6B447] font-bold'
                  : 'text-[#6B5D4A] border-transparent hover:text-[#CAB792]'
                }
              `
              return item.href ? (
                <Link key={item.key} href={item.href} className={cls}>
                  {item.label}
                </Link>
              ) : (
                <button key={item.key} onClick={() => setTab(item.key)} className={cls}>
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {/* ═══ CONTENT ═════════════════════════════════════════════════════ */}
      <main className="flex-1 px-8 py-8 max-w-[1440px] mx-auto w-full">
        {tab === "overview" && (
          <div className="space-y-8">
            {/* Bento row 1 — chart 2/3, emotion 1/3 */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-px bg-white/[0.04] border border-white/[0.06] overflow-hidden">
              <section className="lg:col-span-3 bg-[#0D0B09] p-6">
                <SectionLabel>Volume Social · 7 dias</SectionLabel>
                {ls ? <Skeleton className="h-[280px] w-full" /> : <SocialVolumeChart data={stats.socialVolume} />}
              </section>
              <section className="lg:col-span-2 bg-[#0D0B09] p-6">
                <SectionLabel>Emoção do Público</SectionLabel>
                {ls ? (
                  <Skeleton className="h-[280px] w-full" />
                ) : (
                  <PublicEmotion
                    emotions={
                      Object.values(stats.emotions).some((v: number) => v > 0)
                        ? (stats.emotions as { joy: number; anger: number; sadness: number; surprise: number; fear: number; neutral: number })
                        : undefined
                    }
                  />
                )}
              </section>
            </div>

            {/* Bento row 2 — keywords 3/5, right col 2/5 */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-px bg-white/[0.04] border border-white/[0.06] overflow-hidden">
              <section className="lg:col-span-3 bg-[#0D0B09] p-6">
                <SectionLabel>Keyword Ranking · KOS</SectionLabel>
                {lk ? <Skeleton className="h-[360px] w-full" /> : <KeywordRanking keywords={keywords} brandId={activeBrand?.id} />}
              </section>

              <div className="lg:col-span-2 bg-[#0D0B09] flex flex-col divide-y divide-white/[0.04]">
                {/* Sentiment */}
                <section className="p-6 flex-1">
                  <SectionLabel>Sentimento Geral</SectionLabel>
                  {ls ? <SentimentGaugeSkeleton /> : <SentimentGauge stats={stats.fullStats} />}
                </section>

                {/* AI Insight — gold left border, no chrome */}
                <section className="p-6">
                  <div className="border-l-2 border-[#E6B447] pl-4">
                    <p className="text-[10px] font-mono font-bold tracking-wider text-[#E6B447] mb-2">
                      ANALYST INSIGHT
                    </p>
                    <p className="text-[13px] leading-relaxed text-[#CAB792]">
                      {keywords.length > 0 ? (
                        <>
                          <strong className="text-[#F5E8CE]">{keywords.length} oportunidades</strong> detectadas.
                          Termo prioritário: <strong className="text-[#E6B447] font-mono">{keywords[0].term}</strong> com
                          KOS <strong className="text-[#E6B447] font-mono">{keywords[0].metrics.opportunityScore}</strong>.
                        </>
                      ) : (
                        <>
                          Buscas por <strong className="text-[#E6B447]">"mkthoney"</strong> subiram
                          <strong className="text-[#F5E8CE]"> 40%</strong>. Indica retenção forte — torne o link de acesso mais visível.
                        </>
                      )}
                    </p>
                    <div className="flex gap-4 mt-3">
                      <Link href="/intelligence/discovery" className="text-[10px] font-mono tracking-wider text-[#AB8648] hover:text-[#E6B447] transition-colors">
                        Discovery →
                      </Link>
                      <Link href="/intelligence/research" className="text-[10px] font-mono tracking-wider text-[#AB8648] hover:text-[#E6B447] transition-colors">
                        Deep Research →
                      </Link>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        {tab === "keywords" && (
          <section className="border border-white/[0.06] bg-[#0D0B09] p-6">
            <SectionLabel>Inteligência de Palavras-Chave</SectionLabel>
            {lk ? <Skeleton className="h-[600px] w-full" /> : <KeywordRanking keywords={keywords} brandId={activeBrand?.id} />}
          </section>
        )}

        {tab === "competitors" && (
          <section className="border border-white/[0.06] bg-[#0D0B09] p-6">
            <SectionLabel>Competidores</SectionLabel>
            <CompetitorList
              competitors={[]}
              onSelect={(comp) => setSelectedCompetitor(comp)}
              onAdd={() => console.log("Add competitor")}
              onTriggerDossier={(id) => {
                console.log("Trigger dossier for", id)
                setViewingDossier(true)
              }}
            />
          </section>
        )}

        {tab === "assets" && (
          <section className="border border-white/[0.06] bg-[#0D0B09] p-6">
            <SectionLabel>Biblioteca de Ativos</SectionLabel>
            <AssetGallery assets={[]} />
          </section>
        )}

        {tab === "dossier" && (
          <section className="border border-white/[0.06] bg-[#0D0B09] p-6">
            <SectionLabel>Dossiê</SectionLabel>
            <div className="py-20 text-center">
              <p className="text-[#6B5D4A] text-sm">Selecione um concorrente e gere o dossiê.</p>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

/* ── KPI Cell ─────────────────────────────────────────────────────────── */
function KPI({ label, value, unit, isText, highlight }: {
  label: string
  value: string
  unit?: string
  isText?: boolean
  highlight?: boolean
}) {
  return (
    <div className="px-6 py-5 bg-[#0D0B09]">
      <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A] mb-1">
        {label}
      </p>
      <p className={`leading-none ${isText
          ? 'text-lg font-bold text-[#F5E8CE] truncate max-w-[200px]'
          : 'text-[36px] font-mono font-black tabular-nums'
        } ${highlight ? 'text-[#E6B447]' : 'text-[#F5E8CE]'}`}
      >
        {value}
        {unit && <span className="text-[11px] font-normal text-[#6B5D4A] ml-1">{unit}</span>}
      </p>
    </div>
  )
}

/* ── Section Label ────────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A] mb-4">
      {children}
    </p>
  )
}
