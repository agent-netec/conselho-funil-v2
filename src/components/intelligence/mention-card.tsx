import * as React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { IntelligenceDocument } from "@/types/intelligence"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface MentionCardProps {
  mention: IntelligenceDocument;
}

export function MentionCard({ mention }: MentionCardProps) {
  const sentimentColor = {
    positive: "bg-green-100 text-green-800 border-green-200",
    negative: "bg-red-100 text-red-800 border-red-200",
    neutral: "bg-gray-100 text-gray-800 border-gray-200",
  }[mention.analysis?.sentiment || 'neutral'];

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
          {mention.source.platform[0].toUpperCase()}
        </div>
        <div className="flex flex-col flex-1">
          <h3 className="font-semibold text-sm line-clamp-1">{mention.content.title || 'Menção sem título'}</h3>
          <p className="text-xs text-muted-foreground">
            {mention.source.author || mention.source.platform} • {formatDistanceToNow(mention.collectedAt.toDate(), { addSuffix: true, locale: ptBR })}
          </p>
        </div>
        <Badge variant="outline" className={cn("capitalize", sentimentColor)}>
          {mention.analysis?.sentiment || 'Pendente'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-card-foreground line-clamp-3">
          {mention.analysis?.summary || mention.content.text}
        </p>
        <div className="flex flex-wrap gap-1 pt-2">
          {mention.analysis?.keywords.map((kw, i) => (
            <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
              {kw}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function MentionCardSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-3 w-[80px]" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[90%]" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-5 w-12 rounded-md" />
          <Skeleton className="h-5 w-12 rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}
