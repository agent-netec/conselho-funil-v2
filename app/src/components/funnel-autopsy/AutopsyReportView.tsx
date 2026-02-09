'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AutopsyReport, HeuristicResult, Recommendation } from '@/types/autopsy';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  Target, 
  Layers, 
  ShieldCheck, 
  MousePointer2, 
  ArrowRight,
  Clock,
  Globe,
  Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutopsyReportViewProps {
  report: AutopsyReport & { id?: string; url?: string };
}

const HeuristicCard = ({ 
  title, 
  result, 
  icon: Icon, 
  delay 
}: { 
  title: string; 
  result: HeuristicResult; 
  icon: any; 
  delay: number 
}) => {
  const statusConfig = {
    pass: { color: 'text-green-400', bg: 'bg-green-500/10', icon: CheckCircle2 },
    fail: { color: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle },
    warning: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: AlertCircle },
  };

  const config = statusConfig[result.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card-premium p-5 border-l-4 border-l-zinc-800 hover:border-l-purple-500 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-800 rounded-lg">
            <Icon className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <h4 className="font-bold text-white">{title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={result.score * 10} className="h-1 w-20 bg-zinc-800" />
              <span className={cn("text-[10px] font-bold", config.color)}>{result.score}/10</span>
            </div>
          </div>
        </div>
        <config.icon className={cn("w-5 h-5", config.color)} />
      </div>
      <ul className="space-y-2">
        {result.findings.map((finding, i) => (
          <li key={i} className="flex gap-2 text-xs text-zinc-400 leading-relaxed">
            <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", config.color.replace('text', 'bg'))} />
            {finding}
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

export const AutopsyReportView: React.FC<AutopsyReportViewProps> = ({ report }) => {
  const getScoreColor = (s: number) => {
    if (s < 4) return 'text-red-500';
    if (s < 7) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      {/* Header Forense */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-zinc-900/50 border-zinc-800 backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Target className="w-32 h-32" />
          </div>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-purple-400 border-purple-500/30 bg-purple-500/5">
                Diagnóstico Forense Ativo
              </Badge>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest">ID: {report.id}</span>
            </div>
            <CardTitle className="text-3xl font-black text-white">Resumo Executivo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-400 leading-relaxed text-lg italic">
              "{report.summary}"
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Health Score</span>
                <div className={cn("text-2xl font-black", getScoreColor(report.score))}>{report.score * 10}%</div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Load Time</span>
                <div className="text-2xl font-black text-white">{report.metadata.loadTimeMs}ms</div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Tech Stack</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {report.metadata.techStack.map(tech => (
                    <Badge key={tech} variant="secondary" className="text-[9px] bg-zinc-800">{tech}</Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Status</span>
                <div className="flex items-center gap-1 text-emerald-400 text-sm font-bold">
                  <CheckCircle2 className="w-4 h-4" /> COMPLETO
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center group">
          <div className="relative w-full aspect-video rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950">
            {report.metadata.screenshotUrl ? (
              <img 
                src={report.metadata.screenshotUrl} 
                alt="Screenshot do Funil" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700">
                <Monitor className="w-12 h-12 mb-2" />
                <span className="text-xs">Preview Indisponível</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent opacity-60" />
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <Globe className="w-3 h-3 text-zinc-400" />
              <span className="text-[10px] text-zinc-300 truncate max-w-[150px]">{report.url}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="mt-4 text-zinc-500 hover:text-white text-[10px] uppercase font-bold tracking-widest">
            Ver Captura Full-Size <ArrowRight className="w-3 h-3 ml-2" />
          </Button>
        </Card>
      </div>

      {/* Heurísticas Wilder */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <HeuristicCard title="Hook" result={report.heuristics.hook} icon={Zap} delay={0.1} />
        <HeuristicCard title="Story" result={report.heuristics.story} icon={Layers} delay={0.2} />
        <HeuristicCard title="Offer" result={report.heuristics.offer} icon={Target} delay={0.3} />
        <HeuristicCard title="Friction" result={report.heuristics.friction} icon={MousePointer2} delay={0.4} />
        <HeuristicCard title="Trust" result={report.heuristics.trust} icon={ShieldCheck} delay={0.5} />
      </div>

      {/* Recomendações Priorizadas */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-purple-400" />
          Plano de Ação Corretiva
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.recommendations.sort((a, b) => {
            const weights = { high: 3, medium: 2, low: 1 };
            return weights[b.priority] - weights[a.priority];
          }).map((rec, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + (i * 0.1) }}
              className="p-5 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex gap-4 hover:bg-zinc-900/50 transition-colors group"
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                rec.priority === 'high' ? 'bg-red-500/10 text-red-400' :
                rec.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-blue-500/10 text-blue-400'
              )}>
                <Zap className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn(
                    "text-[9px] uppercase font-black",
                    rec.priority === 'high' ? 'border-red-500/30 text-red-400' :
                    rec.priority === 'medium' ? 'border-yellow-500/30 text-yellow-400' : 'border-blue-500/30 text-blue-400'
                  )}>
                    {rec.priority} Priority
                  </Badge>
                  <Badge variant="secondary" className="text-[9px] uppercase bg-zinc-800">{rec.type}</Badge>
                </div>
                <h5 className="font-bold text-white group-hover:text-purple-400 transition-colors">{rec.action}</h5>
                <p className="text-xs text-zinc-500 leading-relaxed">{rec.impact}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
