'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  ShieldAlert,
  ArrowRight,
  Zap,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Dimension {
  score: number;
  feedback: string;
}

interface Scorecard {
  overall_score: number;
  verdict: string;
  dimensions: {
    hook: Dimension;
    retention: Dimension;
    engagement: Dimension;
    funnel: Dimension;
  };
  recommendations: string[];
}

interface ScorecardViewerProps {
  scorecard: Scorecard;
}

export function ScorecardViewer({ scorecard }: ScorecardViewerProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-400';
    if (score >= 6) return 'text-amber-400';
    return 'text-red-400';
  };

  const getVerdictIcon = (verdict: string) => {
    if (verdict.includes('Escalar')) return <Trophy className="h-5 w-5 text-amber-400" />;
    if (verdict.includes('Publicar')) return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
    if (verdict.includes('Ajustar')) return <AlertCircle className="h-5 w-5 text-amber-400" />;
    return <ShieldAlert className="h-5 w-5 text-red-400" />;
  };

  const getVerdictColor = (verdict: string) => {
    if (verdict.includes('Escalar')) return 'border-amber-500/30 bg-amber-500/5 text-amber-400';
    if (verdict.includes('Publicar')) return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400';
    if (verdict.includes('Ajustar')) return 'border-amber-500/30 bg-amber-500/5 text-amber-400';
    return 'border-red-500/30 bg-red-500/5 text-red-400';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Overall Score & Verdict */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-zinc-900/60 border-white/[0.04] flex flex-col items-center justify-center text-center space-y-2">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Score Geral</span>
          <div className="relative">
            <div className={cn("text-5xl font-black tracking-tighter", getScoreColor(scorecard.overall_score))}>
              {scorecard.overall_score.toFixed(1)}
            </div>
            <div className="absolute -top-1 -right-4">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400 animate-pulse" />
            </div>
          </div>
          <span className="text-[10px] text-zinc-600 font-medium italic">Baseado em 4 dimensões</span>
        </Card>

        <Card className={cn("p-6 md:col-span-2 border flex items-center gap-4", getVerdictColor(scorecard.verdict))}>
          <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center shrink-0">
            {getVerdictIcon(scorecard.verdict)}
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Veredito do Conselho</span>
            <h3 className="text-xl font-bold tracking-tight">{scorecard.verdict}</h3>
          </div>
        </Card>
      </div>

      {/* Dimensions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(scorecard.dimensions).map(([key, dim]) => (
          <Card key={key} className="p-4 bg-zinc-900/40 border-white/[0.04] space-y-3 group hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                {key === 'hook' ? 'Gancho' : key === 'retention' ? 'Retenção' : key === 'engagement' ? 'Engajamento' : 'Funil'}
              </h4>
              <span className={cn("text-lg font-black", getScoreColor(dim.score))}>
                {dim.score}/10
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed italic">
              "{dim.feedback}"
            </p>
            {/* Progress bar */}
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all duration-1000", 
                  dim.score >= 8 ? 'bg-emerald-500' : dim.score >= 6 ? 'bg-amber-500' : 'bg-red-500'
                )}
                style={{ width: `${dim.score * 10}%` }}
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Recommendations */}
      <Card className="p-6 bg-zinc-900/60 border-white/[0.04] space-y-4">
        <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          Recomendações de Melhoria
        </h4>
        <div className="space-y-3">
          {scorecard.recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.02] group hover:border-emerald-500/20 transition-all">
              <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <ArrowRight className="h-3 w-3 text-emerald-400" />
              </div>
              <p className="text-sm text-zinc-300">
                {rec}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

