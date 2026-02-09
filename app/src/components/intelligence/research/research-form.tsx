"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ResearchDepth } from '@/types/research';

interface Props {
  onSubmit: (payload: {
    topic: string;
    marketSegment?: string;
    competitors?: string[];
    depth: ResearchDepth;
  }) => Promise<void>;
  loading?: boolean;
}

export function ResearchForm({ onSubmit, loading = false }: Props) {
  const [topic, setTopic] = useState('');
  const [marketSegment, setMarketSegment] = useState('');
  const [competitorsText, setCompetitorsText] = useState('');
  const [depth, setDepth] = useState<ResearchDepth>('standard');

  return (
    <div className="space-y-3 border border-zinc-800 rounded-lg p-4 bg-zinc-900/30">
      <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Tópico de pesquisa" />
      <Input value={marketSegment} onChange={(e) => setMarketSegment(e.target.value)} placeholder="Segmento de mercado (opcional)" />
      <Input
        value={competitorsText}
        onChange={(e) => setCompetitorsText(e.target.value)}
        placeholder="Concorrentes (separados por vírgula)"
      />
      <Select value={depth} onValueChange={(value) => setDepth(value as ResearchDepth)}>
        <SelectTrigger>
          <SelectValue placeholder="Profundidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="quick">Quick</SelectItem>
          <SelectItem value="standard">Standard</SelectItem>
          <SelectItem value="deep">Deep</SelectItem>
        </SelectContent>
      </Select>
      <Button
        onClick={() =>
          onSubmit({
            topic,
            marketSegment: marketSegment || undefined,
            competitors: competitorsText
              .split(',')
              .map((i) => i.trim())
              .filter(Boolean),
            depth,
          })
        }
        disabled={loading || !topic.trim()}
      >
        {loading ? 'Gerando...' : 'Gerar Dossiê'}
      </Button>
    </div>
  );
}
