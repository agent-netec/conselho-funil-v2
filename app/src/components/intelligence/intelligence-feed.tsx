import * as React from "react"
import { MentionCard, MentionCardSkeleton } from "./mention-card"
import { Skeleton } from "@/components/ui/skeleton"
import { IntelligenceDocument } from "@/types/intelligence"

interface IntelligenceFeedProps {
  documents?: IntelligenceDocument[];
  loading?: boolean;
}

export function IntelligenceFeed({ documents, loading }: IntelligenceFeedProps) {
  if (loading) return <IntelligenceFeedSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Feed de Inteligência</h2>
        <span className="text-xs text-muted-foreground">{documents?.length || 0} resultados</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
        {documents?.map((doc) => (
          <MentionCard key={doc.id} mention={doc} />
        ))}
        {(!documents || documents.length === 0) && (
          <div className="text-center py-12 border border-dashed rounded-lg">
            <p className="text-sm text-muted-foreground">Nenhuma menção encontrada no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function IntelligenceFeedSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
        {[1, 2, 3, 4].map((i) => (
          <MentionCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
