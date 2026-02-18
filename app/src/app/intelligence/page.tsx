"use client"

import * as React from "react"
import { MentionCardSkeleton } from "@/components/intelligence/mention-card"
import { TrendListSkeleton } from "@/components/intelligence/trend-list"
import { SentimentGauge, SentimentGaugeSkeleton } from "@/components/intelligence/sentiment-gauge"
import { IntelligenceFeedSkeleton } from "@/components/intelligence/intelligence-feed"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CompetitorList } from "@/components/intelligence/competitors/competitor-list"
import { AssetGallery } from "@/components/intelligence/competitors/asset-gallery"
import { CompetitorProfile } from "@/types/competitors"
import { DossierView } from "@/components/intelligence/competitors/dossier-view"
import { FileText, BrainCircuit, Search, Share2, Sparkles } from "lucide-react"
import { PublicEmotion } from "@/components/intelligence/public-emotion"
import { KeywordRanking } from "@/components/intelligence/keyword-ranking"
import { SocialVolumeChart } from "@/components/intelligence/social-volume-chart"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useKeywordIntelligence, useIntelligenceStats } from "@/lib/hooks/use-intelligence"

export default function IntelligencePage() {
  const [selectedCompetitor, setSelectedCompetitor] = React.useState<CompetitorProfile | null>(null);
  const [viewingDossier, setViewingDossier] = React.useState<boolean>(false);

  const { keywords, loading: loadingKeywords } = useKeywordIntelligence();
  const { stats, loading: loadingStats } = useIntelligenceStats();

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Intelligence Dashboard</h1>
          <p className="text-muted-foreground">
            Monitoramento de menções, tendências e inteligência competitiva em tempo real.
          </p>
        </div>
        <Link href="/intelligence/personalization">
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 gap-2">
            <Sparkles className="w-4 h-4" />
            Personalização Dinâmica
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-[840px] grid-cols-7">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="discovery" asChild>
            <Link href="/intelligence/discovery">Discovery Hub</Link>
          </TabsTrigger>
          <TabsTrigger value="attribution" asChild>
            <Link href="/intelligence/attribution">Atribuição</Link>
          </TabsTrigger>
          <TabsTrigger value="ltv" asChild>
            <Link href="/intelligence/ltv">LTV & Retenção</Link>
          </TabsTrigger>
          <TabsTrigger value="journey" asChild>
            <Link href="/intelligence/journey">Jornada</Link>
          </TabsTrigger>
          <TabsTrigger value="autopsy" asChild>
            <Link href="/strategy/autopsy">Funnel Autopsy</Link>
          </TabsTrigger>
          <TabsTrigger value="offer-lab" asChild>
            <Link href="/intelligence/offer-lab">Offer Lab</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              {loadingStats ? (
                <Skeleton className="h-[350px] w-full rounded-xl" />
              ) : (
                <SocialVolumeChart data={stats.socialVolume} />
              )}
            </div>
            <div>
              {loadingStats ? (
                <Skeleton className="h-[350px] w-full rounded-xl" />
              ) : (
                <PublicEmotion emotions={Object.values(stats.emotions).some((v: number) => v > 0) ? stats.emotions as { joy: number; anger: number; sadness: number; surprise: number; fear: number; neutral: number } : undefined} />
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {loadingKeywords ? (
                <Skeleton className="h-[400px] w-full rounded-xl" />
              ) : (
                <KeywordRanking keywords={keywords} />
              )}
            </div>
            <div className="space-y-6">
              {loadingStats ? (
                <SentimentGaugeSkeleton />
              ) : (
                <SentimentGauge stats={stats.fullStats} />
              )}
              <div className="p-6 border rounded-xl bg-muted/20">
                <h3 className="font-bold flex items-center gap-2 mb-2">
                  <BrainCircuit className="w-5 h-5 text-purple-500" />
                  Insight do Analyst
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {keywords.length > 0 ? (
                    `Detectamos ${keywords.length} novas oportunidades de palavras-chave. 
                     O termo "${keywords[0].term}" possui o maior KOS (${keywords[0].metrics.opportunityScore}), 
                     sendo a prioridade número 1 para sua estratégia de conteúdo.`
                  ) : (
                    `Detectamos um aumento de 40% nas buscas por "conselho de funil login". 
                     Isso indica uma retenção forte, mas também sugere que o link de acesso 
                     deve estar mais visível em suas comunicações sociais.`
                  )}
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Inteligência de Palavras-Chave</h2>
              <p className="text-sm text-muted-foreground">Análise profunda de termos e oportunidades de SEO.</p>
            </div>
          </div>
          {loadingKeywords ? (
            <Skeleton className="h-[600px] w-full rounded-xl" />
          ) : (
            <KeywordRanking keywords={keywords} />
          )}
        </TabsContent>

        <TabsContent value="competitors" className="space-y-6">
          <CompetitorList 
            competitors={[]}
            onSelect={(comp) => {
              setSelectedCompetitor(comp);
              // Em um app real, aqui mudaríamos para a aba de ativos ou dossiê filtrado
            }}
            onAdd={() => console.log("Add competitor")}
            onTriggerDossier={(id) => {
              console.log("Trigger dossier for", id);
              setViewingDossier(true);
            }}
          />
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Biblioteca de Ativos</h2>
              <p className="text-sm text-muted-foreground">Screenshots e evidências coletadas pelo Spy Agent.</p>
            </div>
          </div>
          <AssetGallery assets={[]} />
        </TabsContent>

        <TabsContent value="dossier" className="space-y-6">
          {viewingDossier ? (
            <DossierView dossier={undefined} />
          ) : (
            <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/20">
              <FileText className="mx-auto h-12 w-12 opacity-20 mb-4" />
              <h3 className="font-medium text-lg">Nenhum dossiê selecionado</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                Selecione um concorrente na aba ao lado e clique em "Gerar Dossiê" para visualizar a análise detalhada.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}


