import * as React from "react"
import { IntelligenceAsset } from "@/types/competitors"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ExternalLink, Eye, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AssetGalleryProps {
  assets: IntelligenceAsset[];
  loading?: boolean;
}

export function AssetGallery({ assets, loading }: AssetGalleryProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="aspect-video w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
        <ImageIcon className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-sm">Nenhum ativo visual capturado ainda.</p>
        <p className="text-xs opacity-70">O Spy Agent coletará screenshots durante o próximo scan.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {assets.map((asset) => (
        <Card key={asset.id} className="overflow-hidden group border-muted/40 hover:border-primary/50 transition-all">
          <div className="relative aspect-video bg-muted overflow-hidden">
            {asset.publicUrl ? (
              <img 
                src={asset.publicUrl} 
                alt={`${asset.pageType} screenshot`}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <ImageIcon className="h-8 w-8 opacity-20" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button size="sm" variant="secondary" className="h-8 gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                Ver
              </Button>
              <Button size="sm" variant="secondary" className="h-8 w-8 p-0" asChild>
                <a href={asset.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="bg-black/50 text-white backdrop-blur-md border-none text-[10px] uppercase font-bold">
                {asset.pageType.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          <CardContent className="p-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium truncate opacity-80">{asset.url}</span>
              {asset.analysis?.headline && (
                <p className="text-[10px] line-clamp-1 italic opacity-60">
                  "{asset.analysis.headline}"
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
