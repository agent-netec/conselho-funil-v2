"use client";

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MarketDossier } from '@/types/research';

interface Props {
  dossier: MarketDossier;
}

export function DossierViewer({ dossier }: Props) {
  const sections = dossier.sections;
  return (
    <Card className="p-4 border-zinc-800 bg-zinc-900/30 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-100">{dossier.topic}</h3>
        <Badge variant="outline">{dossier.status}</Badge>
      </div>
      <details open>
        <summary className="cursor-pointer text-zinc-200">Market Overview</summary>
        <p className="text-sm text-zinc-400 mt-1">{sections.marketOverview}</p>
      </details>
      <details>
        <summary className="cursor-pointer text-zinc-200">Market Size</summary>
        <p className="text-sm text-zinc-400 mt-1">{sections.marketSize}</p>
      </details>
      <details>
        <summary className="cursor-pointer text-zinc-200">Trends</summary>
        <ul className="list-disc ml-5 text-sm text-zinc-400 mt-1">
          {sections.trends.map((item, idx) => (
            <li key={`${item}-${idx}`}>{item}</li>
          ))}
        </ul>
      </details>
      <details>
        <summary className="cursor-pointer text-zinc-200">Opportunities</summary>
        <ul className="list-disc ml-5 text-sm text-zinc-400 mt-1">
          {sections.opportunities.map((item, idx) => (
            <li key={`${item}-${idx}`}>{item}</li>
          ))}
        </ul>
      </details>
      <details>
        <summary className="cursor-pointer text-zinc-200">Threats</summary>
        <ul className="list-disc ml-5 text-sm text-zinc-400 mt-1">
          {sections.threats.map((item, idx) => (
            <li key={`${item}-${idx}`}>{item}</li>
          ))}
        </ul>
      </details>
      <details>
        <summary className="cursor-pointer text-zinc-200">Recommendations</summary>
        <ul className="list-disc ml-5 text-sm text-zinc-400 mt-1">
          {sections.recommendations.map((item, idx) => (
            <li key={`${item}-${idx}`}>{item}</li>
          ))}
        </ul>
      </details>
      <div>
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Sources</div>
        <div className="space-y-2">
          {dossier.sources.map((src, idx) => (
            <div key={`${src.url}-${idx}`} className="border border-zinc-800 rounded p-2">
              <a href={src.url} target="_blank" rel="noreferrer" className="text-sm text-blue-400 underline">
                {src.title || src.url}
              </a>
              <div className="text-xs text-zinc-500">
                {src.source} • score {(src.relevanceScore * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
