"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AudienceScan } from "@/types/personalization"
import { BrainCircuit, Users, Target, Zap, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface AudienceScanCardProps {
  scan: AudienceScan;
  onSelect?: (scan: AudienceScan) => void;
  isSelected?: boolean;
}

export function AudienceScanCard({ scan, onSelect, isSelected }: AudienceScanCardProps) {
  const { persona, propensity, metadata } = scan;

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'border-purple-500 ring-1 ring-purple-500' : ''}`}
      onClick={() => onSelect?.(scan)}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              {scan.name}
            </CardTitle>
            <CardDescription>
              Gerado em {format(metadata.createdAt.toDate(), "dd 'de' MMMM", { locale: ptBR })}
            </CardDescription>
          </div>
          <Badge variant={propensity.segment === 'hot' ? 'default' : propensity.segment === 'warm' ? 'secondary' : 'outline'} className="capitalize">
            {propensity.segment}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-bold">Propensão</span>
            <div className="flex items-center gap-2">
              <Progress value={propensity.score * 100} className="h-2" />
              <span className="text-sm font-medium">{(propensity.score * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-bold">Sofisticação</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div 
                  key={level} 
                  className={`h-2 w-full rounded-full ${level <= persona.sophisticationLevel ? 'bg-purple-500' : 'bg-muted'}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="w-4 h-4 text-red-500" />
            Dores Principais
          </div>
          <div className="flex flex-wrap gap-1">
            {persona.painPoints.slice(0, 3).map((pain, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] font-normal">
                {pain}
              </Badge>
            ))}
            {persona.painPoints.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{persona.painPoints.length - 3}</span>
            )}
          </div>
        </div>

        <div className="p-3 bg-muted/30 rounded-lg border border-dashed">
          <div className="flex items-start gap-2">
            <BrainCircuit className="w-4 h-4 text-purple-500 mt-1 shrink-0" />
            <p className="text-xs italic text-muted-foreground leading-relaxed">
              "{propensity.reasoning.substring(0, 120)}..."
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
  );
}
