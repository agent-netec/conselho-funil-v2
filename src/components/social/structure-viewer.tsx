'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Video, 
  Type, 
  Zap, 
  MessageSquare, 
  Target,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Element {
  timestamp?: string;
  verbal: string;
  visual: string;
  purpose: string;
}

interface Structure {
  platform: string;
  hook: string;
  type: 'video' | 'text';
  elements: Element[];
  cliffhanger: string;
  cta: {
    content: string;
    placement: string;
  };
  viral_triggers: string[];
  pacing_notes: string;
}

interface StructureViewerProps {
  structure: Structure;
}

export function StructureViewer({ structure }: StructureViewerProps) {
  const isVideo = structure.type === 'video';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Info */}
      <Card className="p-6 bg-zinc-900/60 border-rose-500/20 shadow-[0_0_20px_-10px_rgba(244,63,94,0.3)]">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">
            {isVideo ? <Video className="h-3 w-3 mr-1" /> : <Type className="h-3 w-3 mr-1" />}
            {isVideo ? 'Roteiro de Vídeo' : 'Post de Texto'}
          </Badge>
          <Badge variant="outline" className="border-white/[0.08] text-zinc-400">
            {structure.platform}
          </Badge>
        </div>
        <h3 className="text-xl font-bold text-zinc-100 mb-2 italic">
          "{structure.hook}"
        </h3>
        <p className="text-sm text-zinc-500 italic flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          {structure.pacing_notes}
        </p>
      </Card>

      {/* Script Elements */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 px-1">
          <Zap className="h-4 w-4 text-rose-400 fill-current" />
          Estrutura do Conteúdo
        </h4>
        
        <div className="grid gap-3">
          {structure.elements.map((element, index) => (
            <div key={index} className="relative group">
              {/* Timeline line */}
              {index !== structure.elements.length - 1 && (
                <div className="absolute left-6 top-12 bottom-0 w-px bg-zinc-800 group-hover:bg-rose-500/20 transition-colors" />
              )}
              
              <Card className="relative ml-4 p-5 bg-zinc-900/40 border-white/[0.04] group-hover:border-rose-500/20 transition-all">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Left: Time & Purpose */}
                  <div className="flex flex-row md:flex-col gap-3 md:w-32 shrink-0">
                    {element.timestamp && (
                      <div className="flex items-center gap-1.5 text-rose-400 font-mono text-xs bg-rose-500/5 px-2 py-1 rounded border border-rose-500/10">
                        <Clock className="h-3 w-3" />
                        {element.timestamp}
                      </div>
                    )}
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-[10px] uppercase border-none py-0.5">
                      {element.purpose}
                    </Badge>
                  </div>

                  {/* Right: Verbal & Visual */}
                  <div className="flex-1 space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-600 uppercase">O que falar:</span>
                      <p className="text-zinc-200 text-sm leading-relaxed">
                        {element.verbal}
                      </p>
                    </div>
                    <div className="space-y-1 bg-white/[0.02] p-2.5 rounded border border-white/[0.02]">
                      <span className="text-[10px] font-bold text-zinc-600 uppercase">O que mostrar / Texto na tela:</span>
                      <p className="text-zinc-400 text-xs italic">
                        {element.visual}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Step indicator */}
              <div className="absolute left-[-4px] top-6 h-3 w-3 rounded-full bg-zinc-800 border-2 border-zinc-900 group-hover:bg-rose-500 group-hover:scale-125 transition-all" />
            </div>
          ))}
        </div>
      </div>

      {/* Cliffhanger & CTA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 bg-zinc-900/40 border-white/[0.04] space-y-3">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 fill-current" />
            Ponto de Virada (Cliffhanger)
          </h4>
          <p className="text-sm text-zinc-300 italic">
            {structure.cliffhanger}
          </p>
        </Card>

        <Card className="p-5 bg-rose-500/5 border-rose-500/10 space-y-3">
          <h4 className="text-xs font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2">
            <Target className="h-3.5 w-3.5" />
            Chamada para Ação (CTA)
          </h4>
          <p className="text-sm text-zinc-200 font-medium">
            {structure.cta.content}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-zinc-500 italic">
            <ArrowRight className="h-2.5 w-2.5" />
            Local: {structure.cta.placement}
          </div>
        </Card>
      </div>

      {/* Viral Triggers */}
      <Card className="p-6 bg-zinc-900/40 border-white/[0.04]">
        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-4">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          Gatilhos de Viralização
        </h4>
        <div className="flex flex-wrap gap-2">
          {structure.viral_triggers.map((trigger, idx) => (
            <Badge key={idx} variant="outline" className="bg-zinc-800/50 text-zinc-400 border-white/[0.05] font-normal">
              #{trigger}
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}

