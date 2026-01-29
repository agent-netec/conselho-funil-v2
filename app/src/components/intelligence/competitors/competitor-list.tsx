import * as React from "react"
import { CompetitorProfile } from "@/types/competitors"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TechStackBadges } from "./tech-stack-badges"
import { 
  Plus, 
  MoreVertical, 
  Globe, 
  Search, 
  FileText, 
  ArrowRight,
  ShieldAlert
} from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface CompetitorListProps {
  competitors: CompetitorProfile[];
  onSelect: (competitor: CompetitorProfile) => void;
  onAdd: () => void;
  onTriggerDossier: (competitorId: string) => void;
  loading?: boolean;
}

export function CompetitorList({ 
  competitors, 
  onSelect, 
  onAdd, 
  onTriggerDossier,
  loading 
}: CompetitorListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Concorrentes</h2>
          <p className="text-sm text-muted-foreground">Gerencie e monitore seus principais adversários.</p>
        </div>
        <Button onClick={onAdd} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Novo Concorrente
        </Button>
      </div>

      <div className="grid gap-4">
        {competitors.map((competitor) => (
          <Card key={competitor.id} className="group hover:border-primary/40 transition-all cursor-pointer overflow-hidden" onClick={() => onSelect(competitor)}>
            <div className="flex items-center p-4 gap-4">
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/5 transition-colors">
                <Globe className="h-6 w-6 opacity-40 group-hover:text-primary group-hover:opacity-100 transition-all" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">{competitor.name}</h3>
                  {competitor.category.map(cat => (
                    <Badge key={cat} variant="secondary" className="text-[10px] px-1.5 py-0 h-4 uppercase font-bold tracking-tighter">
                      {cat}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {competitor.websiteUrl}
                </p>
              </div>

              <div className="hidden md:block px-4 border-l border-r h-10">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Tech Stack</p>
                <TechStackBadges techStack={competitor.techStack} />
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 gap-1.5 border-primary/20 hover:bg-primary/5 hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTriggerDossier(competitor.id);
                  }}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Gerar Dossiê</span>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Editar</DropdownMenuItem>
                    <DropdownMenuItem>Forçar Scan</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Arquivar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </Card>
        ))}

        {competitors.length === 0 && !loading && (
          <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/20">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-6 w-6 opacity-20" />
            </div>
            <h3 className="font-medium text-lg">Nenhum concorrente cadastrado</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
              Adicione seu primeiro concorrente para começar a monitorar tecnologias e funis.
            </p>
            <Button onClick={onAdd} variant="outline" className="mt-6 gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Agora
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
