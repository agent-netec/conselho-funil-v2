"use client";

/**
 * Sprint O — O-1: Research Form with Task Templates & Custom URLs
 * Template selection pre-fills fields and adjusts depth/sources.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Users, Crosshair, TrendingUp, Package, Map,
  Plus, X, Link2, Sparkles, Loader2, Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ResearchDepth, ResearchTemplateId } from '@/types/research';

const ICONS: Record<string, React.ElementType> = {
  Users, Crosshair, TrendingUp, Package, Map,
};

interface TemplateInfo {
  id: ResearchTemplateId;
  label: string;
  description: string;
  icon: string;
  defaultDepth: ResearchDepth;
  promptHint: string;
}

const TEMPLATES: TemplateInfo[] = [
  { id: 'audience_analysis', label: 'Análise de Audiência', description: 'Voz ativa: dores, desejos, gatilhos', icon: 'Users', defaultDepth: 'deep', promptHint: 'Ex: Meu público de marketing digital no Instagram' },
  { id: 'competitor_analysis', label: 'Análise de Concorrente', description: 'Estratégias, forças e fraquezas', icon: 'Crosshair', defaultDepth: 'deep', promptHint: 'Ex: Hotmart vs Kiwify vs Eduzz' },
  { id: 'trends', label: 'Tendências', description: 'Oportunidades e sinais emergentes', icon: 'TrendingUp', defaultDepth: 'standard', promptHint: 'Ex: Tendências de IA para marketing em 2026' },
  { id: 'product_research', label: 'Pesquisa de Produto', description: 'Viabilidade e posicionamento', icon: 'Package', defaultDepth: 'standard', promptHint: 'Ex: Ferramentas de automação de social media' },
  { id: 'niche_mapping', label: 'Mapeamento de Nicho', description: 'Ecossistema, players e canais', icon: 'Map', defaultDepth: 'deep', promptHint: 'Ex: Nicho de emagrecimento feminino 40+' },
];

interface Props {
  onSubmit: (payload: {
    topic: string;
    marketSegment?: string;
    competitors?: string[];
    depth: ResearchDepth;
    templateId?: ResearchTemplateId;
    customUrls?: string[];
  }) => Promise<void>;
  loading?: boolean;
}

export function ResearchForm({ onSubmit, loading = false }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<ResearchTemplateId | null>(null);
  const [topic, setTopic] = useState('');
  const [marketSegment, setMarketSegment] = useState('');
  const [competitorsText, setCompetitorsText] = useState('');
  const [depth, setDepth] = useState<ResearchDepth>('standard');
  const [customUrls, setCustomUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');

  const selectTemplate = (id: ResearchTemplateId) => {
    const tpl = TEMPLATES.find(t => t.id === id);
    setSelectedTemplate(id);
    if (tpl) setDepth(tpl.defaultDepth);
  };

  const addUrl = () => {
    const url = urlInput.trim();
    if (url && (url.startsWith('http://') || url.startsWith('https://')) && !customUrls.includes(url)) {
      setCustomUrls(prev => [...prev, url]);
      setUrlInput('');
    }
  };

  const removeUrl = (url: string) => {
    setCustomUrls(prev => prev.filter(u => u !== url));
  };

  const activeTemplate = TEMPLATES.find(t => t.id === selectedTemplate);

  return (
    <div className="space-y-4">
      {/* O-1.1: Template Selection */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {TEMPLATES.map(tpl => {
          const Icon = ICONS[tpl.icon] || Search;
          const isActive = selectedTemplate === tpl.id;
          return (
            <button
              key={tpl.id}
              onClick={() => selectTemplate(tpl.id)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-xl text-xs transition-all border text-center',
                isActive
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]'
                  : 'bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive ? 'text-emerald-400' : 'text-zinc-500')} />
              <span className="font-medium text-[11px]">{tpl.label}</span>
            </button>
          );
        })}
      </div>

      {/* O-1.2: Pre-filled form fields */}
      <Card className="p-4 bg-zinc-900/30 border-zinc-800 space-y-3">
        {activeTemplate && (
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/50">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-zinc-400">{activeTemplate.description}</span>
            <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-400 ml-auto">
              {activeTemplate.defaultDepth}
            </Badge>
          </div>
        )}

        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={activeTemplate?.promptHint || 'Tópico de pesquisa'}
          className="bg-zinc-800/50 border-zinc-700"
        />
        <Input
          value={marketSegment}
          onChange={(e) => setMarketSegment(e.target.value)}
          placeholder="Segmento de mercado (opcional)"
          className="bg-zinc-800/50 border-zinc-700"
        />
        <Input
          value={competitorsText}
          onChange={(e) => setCompetitorsText(e.target.value)}
          placeholder="Concorrentes (separados por vírgula)"
          className="bg-zinc-800/50 border-zinc-700"
        />

        <Select value={depth} onValueChange={(value) => setDepth(value as ResearchDepth)}>
          <SelectTrigger className="bg-zinc-800/50 border-zinc-700">
            <SelectValue placeholder="Profundidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quick">Quick (3 fontes)</SelectItem>
            <SelectItem value="standard">Standard (5 fontes, 2 enriquecidas)</SelectItem>
            <SelectItem value="deep">Deep (10 fontes, 3 enriquecidas)</SelectItem>
          </SelectContent>
        </Select>

        {/* O-1.3: Custom URLs */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Link2 className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-400">URLs Customizadas (Instagram, YouTube, blogs)</span>
          </div>
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://instagram.com/... ou https://youtube.com/..."
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
              className="bg-zinc-800/50 border-zinc-700 text-xs"
            />
            <Button type="button" size="sm" variant="outline" onClick={addUrl} className="border-zinc-700 px-2">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          {customUrls.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {customUrls.map(url => {
                let hostname = url;
                try { hostname = new URL(url).hostname.replace('www.', ''); } catch { /* use full url */ }
                return (
                  <Badge key={url} variant="outline" className="text-[10px] border-zinc-700 text-zinc-400 gap-1 pr-1">
                    {hostname}
                    <button onClick={() => removeUrl(url)} className="hover:text-red-400 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        <Button
          onClick={() =>
            onSubmit({
              topic,
              marketSegment: marketSegment || undefined,
              competitors: competitorsText.split(',').map(i => i.trim()).filter(Boolean),
              depth,
              templateId: selectedTemplate || undefined,
              customUrls: customUrls.length > 0 ? customUrls : undefined,
            })
          }
          disabled={loading || !topic.trim()}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
        >
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando Dossiê...</>
          ) : (
            <><Search className="mr-2 h-4 w-4" />Gerar Dossiê</>
          )}
        </Button>
      </Card>
    </div>
  );
}
