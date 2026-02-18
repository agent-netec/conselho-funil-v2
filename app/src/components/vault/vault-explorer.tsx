'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Plus, 
  LayoutGrid, 
  List, 
  Dna, 
  Library as LibraryIcon,
  Image as ImageIcon,
  MoreVertical,
  Copy,
  ExternalLink,
  Trash2,
  Clock,
  Linkedin,
  Instagram
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { CopyDNA, VaultContent, VaultAsset } from '@/types/vault';

interface VaultExplorerProps {
  dnaItems: CopyDNA[];
  libraryItems: VaultContent[];
  assets: VaultAsset[];
  onUseItem: (item: any) => void;
}

export function VaultExplorer({ dnaItems, libraryItems, assets, onUseItem }: VaultExplorerProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input 
            placeholder="Buscar no Vault..." 
            className="pl-10 input-premium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center bg-zinc-900/50 rounded-lg p-1 border border-white/[0.05]">
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn("h-8 w-8 p-0", viewMode === 'grid' && "bg-zinc-800 text-white")}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn("h-8 w-8 p-0", viewMode === 'list' && "bg-zinc-800 text-white")}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button className="btn-accent h-10">
            <Plus className="mr-2 h-4 w-4" />
            Novo Ativo
          </Button>
        </div>
      </div>

      <Tabs defaultValue="library" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="bg-transparent border-b border-white/[0.03] rounded-none h-12 p-0 gap-8">
          <TabsTrigger 
            value="library" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent px-2 text-zinc-400 data-[state=active]:text-white"
          >
            <LibraryIcon className="h-4 w-4 mr-2" />
            Library
          </TabsTrigger>
          <TabsTrigger 
            value="dna" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent px-2 text-zinc-400 data-[state=active]:text-white"
          >
            <Dna className="h-4 w-4 mr-2" />
            Copy DNA
          </TabsTrigger>
          <TabsTrigger 
            value="assets" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent px-2 text-zinc-400 data-[state=active]:text-white"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Media Assets
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 mt-6 overflow-hidden">
          <TabsContent value="library" className="h-full m-0 outline-none">
            <ScrollArea className="h-full pr-4">
              <div className={cn(
                "grid gap-4",
                viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
              )}>
                {libraryItems.map((item) => (
                  <ContentCard key={item.id} item={item} viewMode={viewMode} onUse={() => onUseItem(item)} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="dna" className="h-full m-0 outline-none">
            <ScrollArea className="h-full pr-4">
              <div className={cn(
                "grid gap-4",
                viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
              )}>
                {dnaItems.map((item) => (
                  <DNACard key={item.id} item={item} viewMode={viewMode} onUse={() => onUseItem(item)} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="assets" className="h-full m-0 outline-none">
            <ScrollArea className="h-full pr-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {assets.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function ContentCard({ item, viewMode, onUse }: { item: VaultContent; viewMode: 'grid' | 'list'; onUse: () => void }) {
  return (
    <Card className="group bg-zinc-900/40 border-white/[0.03] hover:border-emerald-500/30 transition-all overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <LibraryIcon className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                Post Multi-Plataforma
              </h4>
              <p className="text-[10px] text-zinc-500 uppercase font-medium">
                {new Date(item.createdAt.seconds * 1000).toLocaleDateString()}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4 text-zinc-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-white/[0.05]">
              <DropdownMenuItem className="text-zinc-400 focus:text-white">
                <Copy className="h-4 w-4 mr-2" /> Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem className="text-zinc-400 focus:text-white">
                <ExternalLink className="h-4 w-4 mr-2" /> Ver Detalhes
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-400 focus:text-red-400 focus:bg-red-400/10">
                <Trash2 className="h-4 w-4 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <p className="text-xs text-zinc-400 line-clamp-3 mb-4 leading-relaxed">
          {item.variants[0]?.copy}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {item.variants.map((v) => (
              <div 
                key={v.platform} 
                className="h-6 w-6 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center"
                title={v.platform}
              >
                {v.platform === 'x' && <span className="text-[8px] font-bold">X</span>}
                {v.platform === 'linkedin' && <Linkedin className="h-3 w-3 text-blue-400" />}
                {v.platform === 'instagram' && <Instagram className="h-3 w-3 text-pink-400" />}
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase font-bold tracking-widest text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/5" onClick={onUse}>
            Usar Conteúdo
          </Button>
        </div>
      </div>
    </Card>
  );
}

function DNACard({ item, viewMode, onUse }: { item: CopyDNA; viewMode: 'grid' | 'list'; onUse: () => void }) {
  return (
    <Card className="group bg-zinc-900/40 border-white/[0.03] hover:border-emerald-500/30 transition-all">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Dna className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                {item.name}
              </h4>
              <Badge variant="outline" className="text-[8px] uppercase h-4 bg-blue-500/5 text-blue-400 border-blue-500/20">
                {item.type}
              </Badge>
            </div>
          </div>
        </div>

        <p className="text-xs text-zinc-400 line-clamp-3 mb-4 leading-relaxed italic">
          "{item.content}"
        </p>

        {/* X-2.2: Performance badges */}
        {item.performance_metrics?.engagement_rate ? (
          <div className="mb-3">
            <Badge variant="outline" className="text-[9px] border-amber-500/20 text-amber-400 bg-amber-500/5">
              {item.performance_metrics.engagement_rate.toFixed(1)}x engajamento
            </Badge>
            {item.performance_metrics.best_platform && (
              <Badge variant="outline" className="ml-1 text-[9px] border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                Melhor: {item.performance_metrics.best_platform}
              </Badge>
            )}
          </div>
        ) : null}

        <div className="flex items-center justify-between pt-4 border-t border-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[10px] text-zinc-500">
              <Clock className="h-3 w-3" />
              {item.performance_metrics?.posts_using || item.performance_metrics?.usage_count || 0} usos
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase font-bold tracking-widest text-blue-400 hover:text-blue-300 hover:bg-blue-500/5" onClick={onUse}>
            Aplicar DNA
          </Button>
        </div>
      </div>
    </Card>
  );
}

function AssetCard({ asset }: { asset: VaultAsset }) {
  return (
    <div className="group relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.03] hover:border-emerald-500/30 transition-all cursor-pointer">
      <img 
        src={asset.url} 
        alt={asset.name} 
        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
        <p className="text-[10px] font-bold text-white truncate">{asset.name}</p>
        <p className="text-[8px] text-zinc-400 uppercase">{asset.type} • {asset.metadata?.dimensions || 'N/A'}</p>
      </div>
    </div>
  );
}
