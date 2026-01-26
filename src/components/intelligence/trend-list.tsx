import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

interface TrendListProps {
  trends?: Array<{ term: string; count: number }>;
}

export function TrendList({ trends }: TrendListProps) {
  if (!trends) return <TrendListSkeleton />;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Tendências & Keywords</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {trends.map((trend, i) => (
          <div key={i} className="flex items-center justify-between group">
            <div className="flex flex-col">
              <span className="text-sm font-medium group-hover:text-primary transition-colors">
                {trend.term}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {trend.count} menções detectadas
              </span>
            </div>
            <Badge variant="secondary" className="font-mono">
              +{Math.round(Math.random() * 100)}%
            </Badge>
          </div>
        ))}
        {trends.length === 0 && (
          <p className="text-sm text-center text-muted-foreground py-4">
            Aguardando processamento de tendências...
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function TrendListSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Tendências</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-3 w-[60px]" />
            </div>
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
