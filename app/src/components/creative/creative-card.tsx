'use client';

import { CreativePerformance } from '@/types/creative';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  AlertTriangle, 
  Copy, 
  BarChart3,
  MousePointer2,
  DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CreativeCardProps {
  creative: CreativePerformance;
  onGenerateCopy: (creative: CreativePerformance) => void;
}

export function CreativeCard({ creative, onGenerateCopy }: CreativeCardProps) {
  const isFatigued = creative.fatigueIndex > 0.7;
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden bg-zinc-900/50 border-white/[0.05] hover:border-white/[0.1] transition-all group">
        {/* Preview do Ativo */}
        <div className="relative aspect-square overflow-hidden bg-zinc-800">
          {creative.type === 'image' ? (
            <img 
              src={creative.assetUrl} 
              alt="Creative Preview" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <video 
              src={creative.assetUrl} 
              className="w-full h-full object-cover"
              muted
              loop
              onMouseOver={(e) => e.currentTarget.play()}
              onMouseOut={(e) => e.currentTarget.pause()}
            />
          )}
          
          {/* Overlay de Fadiga */}
          {isFatigued && (
            <div className="absolute top-2 right-2">
              <Badge variant="destructive" className="flex items-center gap-1 animate-pulse">
                <AlertTriangle className="h-3 w-3" />
                Fadiga Alta
              </Badge>
            </div>
          )}

          {/* Profit Score Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Profit Score</p>
                <p className={`text-2xl font-black ${getScoreColor(creative.profitScore)}`}>
                  {creative.profitScore}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">ROI Est.</p>
                <p className="text-sm font-bold text-white">
                  {(creative.metrics.ltvAttributed / creative.metrics.spend).toFixed(1)}x
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas Rápidas */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-500">
                <DollarSign className="h-3 w-3" />
                <span className="text-[10px] font-medium uppercase">Investido</span>
              </div>
              <p className="text-sm font-semibold text-zinc-200">
                ${creative.metrics.spend.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-500">
                <TrendingUp className="h-3 w-3" />
                <span className="text-[10px] font-medium uppercase">LTV Atrib.</span>
              </div>
              <p className="text-sm font-semibold text-emerald-400">
                ${creative.metrics.ltvAttributed.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Barra de Fadiga */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-medium uppercase">
              <span className="text-zinc-500">Índice de Fadiga</span>
              <span className={isFatigued ? 'text-rose-400' : 'text-zinc-400'}>
                {Math.round(creative.fatigueIndex * 100)}%
              </span>
            </div>
            <Progress value={creative.fatigueIndex * 100} className="h-1" />
          </div>

          {/* Ações */}
          <div className="pt-2">
            <Button 
              onClick={() => onGenerateCopy(creative)}
              className="w-full bg-white text-black hover:bg-zinc-200 font-bold gap-2"
            >
              <Copy className="h-4 w-4" />
              Gerar Variações de Copy
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
