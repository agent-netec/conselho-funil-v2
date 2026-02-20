"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  TrendingUp,
  Target,
  Layers,
  Gift,
  Shield,
  Zap,
  Sparkles,
} from 'lucide-react';
import type { OfferDocument } from '@/types/offer';

interface OfferCompareProps {
  offerA: OfferDocument;
  offerB: OfferDocument;
  onBack: () => void;
}

function ScoreBadge({ value, label }: { value: number | undefined; label: string }) {
  const v = value ?? 0;
  const color = v >= 80 ? 'text-green-400' : v >= 50 ? 'text-yellow-400' : 'text-red-400';
  return (
    <div className="text-center">
      <div className={`text-3xl font-black ${color}`}>{v}</div>
      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function CompareRow({ label, icon: Icon, valueA, valueB }: {
  label: string;
  icon: React.ElementType;
  valueA: React.ReactNode;
  valueB: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 py-3 border-b border-zinc-800/50 last:border-0">
      <div className="text-sm text-zinc-300">{valueA}</div>
      <div className="flex items-center gap-1.5 text-zinc-500 min-w-[120px] justify-center">
        <Icon className="w-3 h-3" />
        <span className="text-[10px] uppercase tracking-wider font-bold">{label}</span>
      </div>
      <div className="text-sm text-zinc-300 text-right">{valueB}</div>
    </div>
  );
}

export function OfferCompare({ offerA, offerB, onBack }: OfferCompareProps) {
  const a = offerA;
  const b = offerB;

  const aStack = a.components?.stacking?.length ?? 0;
  const bStack = b.components?.stacking?.length ?? 0;
  const aStackValue = a.components?.stacking?.reduce((s, i) => s + i.value, 0) ?? 0;
  const bStackValue = b.components?.stacking?.reduce((s, i) => s + i.value, 0) ?? 0;
  const aBonuses = a.components?.bonuses?.length ?? 0;
  const bBonuses = b.components?.bonuses?.length ?? 0;
  const aBonusValue = a.components?.bonuses?.reduce((s, i) => s + i.value, 0) ?? 0;
  const bBonusValue = b.components?.bonuses?.reduce((s, i) => s + i.value, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-zinc-400">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        <h2 className="text-lg font-bold text-white">Comparar Ofertas</h2>
      </div>

      {/* Score Comparison Header */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-zinc-500 mb-2 truncate font-medium">{a.name || 'Oferta A'}</p>
            <div className="flex items-center justify-center gap-6">
              <ScoreBadge value={a.scoring?.total} label="Fórmula" />
              {a.aiEvaluation?.overallQuality ? (
                <ScoreBadge value={a.aiEvaluation.overallQuality} label="AI" />
              ) : null}
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center">
          <Badge variant="outline" className="text-zinc-500 border-zinc-700 text-[10px]">VS</Badge>
        </div>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-zinc-500 mb-2 truncate font-medium">{b.name || 'Oferta B'}</p>
            <div className="flex items-center justify-center gap-6">
              <ScoreBadge value={b.scoring?.total} label="Fórmula" />
              {b.aiEvaluation?.overallQuality ? (
                <ScoreBadge value={b.aiEvaluation.overallQuality} label="AI" />
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Comparison */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-400">Detalhes lado a lado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <CompareRow
            label="Promessa"
            icon={Target}
            valueA={a.components?.coreProduct?.promise || '—'}
            valueB={b.components?.coreProduct?.promise || '—'}
          />
          <CompareRow
            label="Preço"
            icon={TrendingUp}
            valueA={`R$ ${a.components?.coreProduct?.price?.toLocaleString('pt-BR') ?? '—'}`}
            valueB={`R$ ${b.components?.coreProduct?.price?.toLocaleString('pt-BR') ?? '—'}`}
          />
          <CompareRow
            label="Valor Percebido"
            icon={TrendingUp}
            valueA={`R$ ${a.components?.coreProduct?.perceivedValue?.toLocaleString('pt-BR') ?? '—'}`}
            valueB={`R$ ${b.components?.coreProduct?.perceivedValue?.toLocaleString('pt-BR') ?? '—'}`}
          />
          <CompareRow
            label="Value Stack"
            icon={Layers}
            valueA={`${aStack} itens (R$ ${aStackValue.toLocaleString('pt-BR')})`}
            valueB={`${bStack} itens (R$ ${bStackValue.toLocaleString('pt-BR')})`}
          />
          <CompareRow
            label="Bônus"
            icon={Gift}
            valueA={`${aBonuses} bônus (R$ ${aBonusValue.toLocaleString('pt-BR')})`}
            valueB={`${bBonuses} bônus (R$ ${bBonusValue.toLocaleString('pt-BR')})`}
          />
          <CompareRow
            label="Garantia"
            icon={Shield}
            valueA={a.components?.riskReversal || '—'}
            valueB={b.components?.riskReversal || '—'}
          />
          <CompareRow
            label="Escassez"
            icon={Zap}
            valueA={a.components?.scarcity || '—'}
            valueB={b.components?.scarcity || '—'}
          />
        </CardContent>
      </Card>

      {/* AI Insights Comparison */}
      {(a.aiEvaluation?.insights?.length || b.aiEvaluation?.insights?.length) ? (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Pareceres AI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">{a.name || 'Oferta A'}</p>
                {a.aiEvaluation?.insights?.map((ins, i) => (
                  <div key={i} className="text-[11px] text-zinc-400 leading-relaxed">
                    <span className="font-bold text-zinc-300">{ins.counselorName}:</span> &ldquo;{ins.opinion}&rdquo;
                  </div>
                )) || <p className="text-[11px] text-zinc-600">Sem avaliação AI</p>}
                {a.aiEvaluation?.summary && (
                  <p className="text-[11px] text-purple-400/80 italic">{a.aiEvaluation.summary}</p>
                )}
              </div>
              <div className="space-y-3 border-l border-zinc-800 pl-4">
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">{b.name || 'Oferta B'}</p>
                {b.aiEvaluation?.insights?.map((ins, i) => (
                  <div key={i} className="text-[11px] text-zinc-400 leading-relaxed">
                    <span className="font-bold text-zinc-300">{ins.counselorName}:</span> &ldquo;{ins.opinion}&rdquo;
                  </div>
                )) || <p className="text-[11px] text-zinc-600">Sem avaliação AI</p>}
                {b.aiEvaluation?.summary && (
                  <p className="text-[11px] text-purple-400/80 italic">{b.aiEvaluation.summary}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Scoring Factors Comparison */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-400">Fatores de Valor (Hormozi)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          {[
            { label: 'Dream Outcome', key: 'dreamOutcome' as const },
            { label: 'Perceived Likelihood', key: 'perceivedLikelihood' as const },
            { label: 'Time Delay', key: 'timeDelay' as const, inverse: true },
            { label: 'Effort/Sacrifice', key: 'effortSacrifice' as const, inverse: true },
          ].map(({ label, key, inverse }) => {
            const valA = a.scoring?.factors?.[key] ?? 0;
            const valB = b.scoring?.factors?.[key] ?? 0;
            const displayA = inverse ? 11 - valA : valA;
            const displayB = inverse ? 11 - valB : valB;
            return (
              <CompareRow
                key={key}
                label={label}
                icon={TrendingUp}
                valueA={`${displayA}/10`}
                valueB={`${displayB}/10`}
              />
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
