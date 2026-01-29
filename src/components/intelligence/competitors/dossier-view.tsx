import * as React from "react"
import { CompetitorDossier } from "@/types/competitors"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  TrendingDown, 
  Lightbulb, 
  AlertTriangle,
  FileText,
  Calendar,
  Target,
  Layout
} from "lucide-react"

interface DossierViewProps {
  dossier: CompetitorDossier;
  className?: string;
}

export function DossierView({ dossier, className }: DossierViewProps) {
  const swotItems = [
    { 
      label: "Forças", 
      icon: TrendingUp, 
      items: dossier.analysis.swot.strengths, 
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/20",
      border: "border-green-100 dark:border-green-900/30"
    },
    { 
      label: "Fraquezas", 
      icon: TrendingDown, 
      items: dossier.analysis.swot.weaknesses, 
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-100 dark:border-red-900/30"
    },
    { 
      label: "Oportunidades", 
      icon: Lightbulb, 
      items: dossier.analysis.swot.opportunities, 
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-100 dark:border-blue-900/30"
    },
    { 
      label: "Ameaças", 
      icon: AlertTriangle, 
      items: dossier.analysis.swot.threats, 
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-900/20",
      border: "border-orange-100 dark:border-orange-900/30"
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header do Dossiê */}
      <div className="flex flex-col gap-2 border-b pb-6">
        <div className="flex items-center gap-2 text-primary">
          <FileText className="h-5 w-5" />
          <span className="text-sm font-bold uppercase tracking-widest">Dossiê de Inteligência</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{dossier.title}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Gerado em: {dossier.generatedAt.toDate().toLocaleDateString('pt-BR')}
          </div>
          <Badge variant="outline" className="text-[10px] uppercase">v{dossier.version}.0</Badge>
        </div>
      </div>

      {/* Resumo Executivo */}
      <Card className="border-primary/10 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Resumo Executivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {dossier.summary}
          </p>
        </CardContent>
      </Card>

      {/* Análise SWOT */}
      <div className="grid gap-4 md:grid-cols-2">
        {swotItems.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.label} className={`${section.border} overflow-hidden`}>
              <CardHeader className={`${section.bg} py-3`}>
                <CardTitle className={`text-sm font-bold flex items-center gap-2 ${section.color}`}>
                  <Icon className="h-4 w-4" />
                  {section.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-2">
                  {section.items.map((item, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0 ${section.color.split(' ')[0].replace('text', 'bg')}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Posicionamento e Estilo */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Layout className="h-4 w-4 text-primary" />
              Estilo Visual & Oferta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Tipo de Oferta</p>
              <Badge variant="secondary">{dossier.analysis.offerType}</Badge>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Elementos Visuais</p>
              <div className="flex flex-wrap gap-2">
                {dossier.analysis.visualStyle.map(style => (
                  <Badge key={style} variant="outline" className="text-[10px]">{style}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Posicionamento de Mercado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {dossier.analysis.marketPositioning}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
