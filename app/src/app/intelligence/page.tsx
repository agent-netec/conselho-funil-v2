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
import { CompetitorProfile, IntelligenceAsset, CompetitorDossier } from "@/types/competitors"
import { Timestamp } from "firebase/firestore"
import { DossierView } from "@/components/intelligence/competitors/dossier-view"
import { FileText, BrainCircuit, Search, Share2, Sparkles } from "lucide-react"
import { PublicEmotion } from "@/components/intelligence/public-emotion"
import { KeywordRanking } from "@/components/intelligence/keyword-ranking"
import { SocialVolumeChart } from "@/components/intelligence/social-volume-chart"
import { KeywordIntelligence } from "@/types/intelligence"
import Link from "next/link"
import { Button } from "@/components/ui/button"

// Mock data for initial UI development
const MOCK_KEYWORDS: KeywordIntelligence[] = [
  {
    term: "como vender infoprodutos",
    intent: "informational",
    metrics: {
      volume: 12500,
      difficulty: 45,
      opportunityScore: 82,
      trend: 15
    },
    relatedTerms: ["vender cursos online", "plataformas de infoprodutos"],
    suggestedBy: "scout"
  },
  {
    term: "melhor plataforma de checkout",
    intent: "commercial",
    metrics: {
      volume: 8400,
      difficulty: 65,
      opportunityScore: 58,
      trend: 5
    },
    relatedTerms: ["checkout transparente", "taxas hotmart vs kiwify"],
    suggestedBy: "analyst"
  },
  {
    term: "conselho de funil login",
    intent: "navigational",
    metrics: {
      volume: 2100,
      difficulty: 10,
      opportunityScore: 95,
      trend: 40
    },
    relatedTerms: [],
    suggestedBy: "manual"
  },
  {
    term: "comprar curso de funil de vendas",
    intent: "transactional",
    metrics: {
      volume: 3200,
      difficulty: 80,
      opportunityScore: 42,
      trend: -10
    },
    relatedTerms: ["curso funil de vendas preço"],
    suggestedBy: "scout"
  }
];

const MOCK_SOCIAL_VOLUME = [
  { date: "18 Jan", twitter: 45, reddit: 12, total: 57 },
  { date: "19 Jan", twitter: 52, reddit: 15, total: 67 },
  { date: "20 Jan", twitter: 38, reddit: 22, total: 60 },
  { date: "21 Jan", twitter: 65, reddit: 28, total: 93 },
  { date: "22 Jan", twitter: 88, reddit: 35, total: 123 },
  { date: "23 Jan", twitter: 72, reddit: 31, total: 103 },
  { date: "24 Jan", twitter: 95, reddit: 42, total: 137 },
];

const MOCK_EMOTIONS = {
  joy: 45,
  anger: 12,
  sadness: 5,
  surprise: 18,
  fear: 8,
  neutral: 12
};
const MOCK_COMPETITORS: CompetitorProfile[] = [
// ... (previous mock competitors)
];

const MOCK_DOSSIER: CompetitorDossier = {
  id: "dossier_1",
  competitorId: "comp_1",
  brandId: "brand_123",
  title: "Análise Estratégica: Concorrente Alpha",
  summary: "O Concorrente Alpha apresenta uma operação madura focada em tráfego direto para LPs de alta conversão. Sua principal vantagem reside na agressividade do copywriting e no uso extensivo de provas sociais dinâmicas. Detectamos um funil de 3 etapas com upsell imediato de ticket médio.",
  analysis: {
    swot: {
      strengths: [
        "Copywriting altamente persuasivo focado em dor",
        "Velocidade de carregamento das LPs otimizada",
        "Uso avançado de retargeting baseado em comportamento"
      ],
      weaknesses: [
        "Design visual datado (estilo 2022)",
        "Dependência excessiva de uma única fonte de tráfego (Meta Ads)",
        "Checkout com fricção elevada em dispositivos móveis"
      ],
      opportunities: [
        "Explorar canais de busca (SEO/Google Ads) onde eles são fracos",
        "Adotar um design mais minimalista e moderno para atrair público premium",
        "Implementar Order Bump que eles ainda não utilizam"
      ],
      threats: [
        "Escala agressiva de orçamento que pode inflacionar o CPM do nicho",
        "Lançamento iminente de uma nova linha de produtos detectada no código fonte"
      ]
    },
    offerType: "Venda Direta com Upsell",
    visualStyle: ["Agressivo", "Contraste Alto", "Focado em Texto"],
    marketPositioning: "Líder em volume de vendas no segmento B2C, posicionando-se como a solução mais rápida e barata do mercado."
  },
  generatedAt: Timestamp.now(),
  version: 1
};

const MOCK_ASSETS: IntelligenceAsset[] = [
// ... (previous mock assets)
];

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
        <TabsList className="grid w-full max-w-[600px] grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="competitors">Concorrentes</TabsTrigger>
          <TabsTrigger value="assets">Ativos</TabsTrigger>
          <TabsTrigger value="dossier">Dossiê</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              {loadingStats ? (
                <Skeleton className="h-[350px] w-full rounded-xl" />
              ) : (
                <SocialVolumeChart data={stats.socialVolume.length > 0 ? stats.socialVolume : MOCK_SOCIAL_VOLUME} />
              )}
            </div>
            <div>
              {loadingStats ? (
                <Skeleton className="h-[350px] w-full rounded-xl" />
              ) : (
                <PublicEmotion emotions={Object.values(stats.emotions).some(v => v > 0) ? stats.emotions : MOCK_EMOTIONS} />
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {loadingKeywords ? (
                <Skeleton className="h-[400px] w-full rounded-xl" />
              ) : (
                <KeywordRanking keywords={keywords.length > 0 ? keywords : MOCK_KEYWORDS} />
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
            <KeywordRanking keywords={keywords.length > 0 ? keywords : MOCK_KEYWORDS} />
          )}
        </TabsContent>

        <TabsContent value="competitors" className="space-y-6">
          <CompetitorList 
            competitors={MOCK_COMPETITORS}
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
          <AssetGallery assets={MOCK_ASSETS} />
        </TabsContent>

        <TabsContent value="dossier" className="space-y-6">
          {viewingDossier ? (
            <DossierView dossier={MOCK_DOSSIER} />
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


