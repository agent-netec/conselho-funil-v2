'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  X as XIcon, 
  Linkedin, 
  Instagram, 
  Eye, 
  Edit3, 
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { VaultContent } from '@/types/vault';

interface ApprovalWorkspaceProps {
  content: VaultContent;
  insightText: string;
  onApprove: (platform: string, copy: string) => void;
  onEdit: (platform: string, copy: string) => void;
}

const PLATFORM_CONFIG = {
  X: { icon: XIcon, color: 'text-white', bg: 'bg-zinc-900', label: 'X (Twitter)' },
  LinkedIn: { icon: Linkedin, color: 'text-blue-400', bg: 'bg-blue-900/20', label: 'LinkedIn' },
  Instagram: { icon: Instagram, color: 'text-pink-400', bg: 'bg-pink-900/20', label: 'Instagram' },
};

export function ApprovalWorkspace({ content, insightText, onApprove, onEdit }: ApprovalWorkspaceProps) {
  const [activePlatform, setActivePlatform] = useState<'X' | 'LinkedIn' | 'Instagram'>('X');

  const currentVariant = content.variants.find(v => v.platform === activePlatform);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
      {/* Esquerda: Insight Original */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 px-1">
          <Info className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Insight Original</h3>
        </div>
        <Card className="flex-1 p-6 bg-zinc-900/50 border-white/[0.03] overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 pr-4">
            <p className="text-zinc-300 leading-relaxed text-sm whitespace-pre-wrap">
              {insightText}
            </p>
          </ScrollArea>
          <div className="mt-6 pt-6 border-t border-white/[0.03] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-500/5 text-emerald-400 border-emerald-500/20">
                Alta Relevância
              </Badge>
            </div>
            <span className="text-[10px] text-zinc-500 font-medium uppercase">Sprint 15 Intelligence</span>
          </div>
        </Card>
      </div>

      {/* Direita: Variantes e Aprovação */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Variantes Geradas</h3>
          </div>
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Aguardando Revisão</Badge>
        </div>

        <Card className="flex-1 bg-zinc-900/50 border-white/[0.03] flex flex-col overflow-hidden">
          <Tabs 
            value={activePlatform} 
            onValueChange={(v) => setActivePlatform(v as any)}
            className="flex flex-col h-full"
          >
            <div className="px-6 pt-6 border-b border-white/[0.03]">
              <TabsList className="bg-zinc-800/50 border border-white/[0.05]">
                {content.variants.map((v) => {
                  const Config = PLATFORM_CONFIG[v.platform];
                  return (
                    <TabsTrigger 
                      key={v.platform} 
                      value={v.platform}
                      className="data-[state=active]:bg-zinc-700/50"
                    >
                      <Config.icon className={cn("h-3.5 w-3.5 mr-2", Config.color)} />
                      {v.platform}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              {content.variants.map((v) => (
                <TabsContent 
                  key={v.platform} 
                  value={v.platform} 
                  className="h-full m-0 p-6 flex flex-col"
                >
                  <div className="flex-1 bg-black/20 rounded-xl border border-white/[0.03] p-6 relative group">
                    <ScrollArea className="h-full pr-4">
                      <p className="text-zinc-200 leading-relaxed whitespace-pre-wrap">
                        {v.copy}
                      </p>
                    </ScrollArea>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 bg-zinc-800/80 hover:bg-zinc-700"
                        onClick={() => onEdit(v.platform, v.copy)}
                      >
                        <Edit3 className="h-4 w-4 text-zinc-400" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Brand Voice: OK
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        Otimizado para {v.platform}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        className="btn-ghost border-white/[0.05]"
                        onClick={() => onEdit(v.platform, v.copy)}
                      >
                        <Edit3 className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button 
                        className="btn-accent shadow-lg shadow-emerald-500/10"
                        onClick={() => onApprove(v.platform, v.copy)}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Aprovar para o Vault
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
