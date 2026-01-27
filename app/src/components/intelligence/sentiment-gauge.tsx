import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { IntelligenceStats } from "@/types/intelligence"

interface SentimentGaugeProps {
  stats?: IntelligenceStats;
}

export function SentimentGauge({ stats }: SentimentGaugeProps) {
  if (!stats) return <SentimentGaugeSkeleton />;

  const total = stats.bySentiment.positive + stats.bySentiment.negative + stats.bySentiment.neutral;
  const getPercentage = (val: number) => total > 0 ? Math.round((val / total) * 100) : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Sentimento Geral</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-6">
        <div className="relative h-32 w-32 flex items-center justify-center border-8 border-muted rounded-full">
          <div className="text-center">
            <span className="text-2xl font-bold">{stats.averageSentimentScore.toFixed(1)}</span>
            <p className="text-[10px] text-muted-foreground uppercase">Score</p>
          </div>
        </div>
        <div className="mt-6 flex w-full justify-around">
          <div className="text-center">
            <p className="text-sm font-semibold text-green-600">{getPercentage(stats.bySentiment.positive)}%</p>
            <p className="text-[10px] text-muted-foreground">Positivo</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-500">{getPercentage(stats.bySentiment.neutral)}%</p>
            <p className="text-[10px] text-muted-foreground">Neutro</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-red-600">{getPercentage(stats.bySentiment.negative)}%</p>
            <p className="text-[10px] text-muted-foreground">Negativo</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SentimentGaugeSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Sentimento Geral</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-6">
        <div className="relative h-32 w-32">
          <Skeleton className="h-full w-full rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="h-8 w-12" />
          </div>
        </div>
        <div className="mt-6 flex w-full justify-around">
          <div className="text-center">
            <Skeleton className="mx-auto h-4 w-12" />
            <Skeleton className="mt-1 h-3 w-8" />
          </div>
          <div className="text-center">
            <Skeleton className="mx-auto h-4 w-12" />
            <Skeleton className="mt-1 h-3 w-8" />
          </div>
          <div className="text-center">
            <Skeleton className="mx-auto h-4 w-12" />
            <Skeleton className="mt-1 h-3 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
