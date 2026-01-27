'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { CopyScorecard } from '@/types/database';
import { 
  FileText, 
  Layout, 
  Gift, 
  DollarSign, 
  BadgeCheck,
  TrendingUp,
} from 'lucide-react';

interface CopyScorecardProps {
  scorecard: CopyScorecard;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

const DIMENSIONS = [
  {
    key: 'headlines' as const,
    label: 'Headlines',
    description: 'Prende atenção, benefício específico, curiosidade',
    icon: FileText,
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-400',
  },
  {
    key: 'structure' as const,
    label: 'Estrutura',
    description: 'Clareza, fluxo natural, transições suaves',
    icon: Layout,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
  },
  {
    key: 'benefits' as const,
    label: 'Benefícios',
    description: 'Benefícios vs features, especificidade, voz',
    icon: Gift,
    color: 'from-emerald-500 to-green-500',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
  },
  {
    key: 'offer' as const,
    label: 'Oferta',
    description: 'Clareza de oferta, garantia, urgência',
    icon: DollarSign,
    color: 'from-violet-500 to-purple-500',
    bgColor: 'bg-violet-500/10',
    textColor: 'text-violet-400',
  },
  {
    key: 'proof' as const,
    label: 'Prova',
    description: 'Prova social, validação, CTA claro',
    icon: BadgeCheck,
    color: 'from-rose-500 to-pink-500',
    bgColor: 'bg-rose-500/10',
    textColor: 'text-rose-400',
  },
];

function getScoreLabel(score: number): { label: string; emoji: string } {
  if (score >= 9) return { label: 'Excelente', emoji: '🏆' };
  if (score >= 8) return { label: 'Muito Bom', emoji: '⭐' };
  if (score >= 7) return { label: 'Bom', emoji: '👍' };
  if (score >= 6) return { label: 'Adequado', emoji: '✅' };
  if (score >= 5) return { label: 'Mediano', emoji: '🔄' };
  return { label: 'Precisa Melhorar', emoji: '⚠️' };
}

function getScoreColor(score: number): string {
  if (score >= 8) return 'text-emerald-400';
  if (score >= 6) return 'text-amber-400';
  return 'text-red-400';
}

function RadialScore({ 
  value, 
  maxValue = 10, 
  size = 120,
  strokeWidth = 8,
}: { 
  value: number; 
  maxValue?: number; 
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (value / maxValue) * 100;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  const { label, emoji } = getScoreLabel(value);
  
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg className="absolute transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-zinc-800"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Center content */}
      <div className="text-center z-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className={cn('text-3xl font-bold', getScoreColor(value))}
        >
          {value.toFixed(1)}
        </motion.div>
        <div className="text-xs text-zinc-500 mt-1">{emoji} {label}</div>
      </div>
    </div>
  );
}

function DimensionBar({ 
  dimension, 
  score, 
  delay,
  showDescription = true,
}: { 
  dimension: typeof DIMENSIONS[number]; 
  score: number; 
  delay: number;
  showDescription?: boolean;
}) {
  const Icon = dimension.icon;
  const percentage = (score / 10) * 100;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded-lg', dimension.bgColor)}>
            <Icon className={cn('h-4 w-4', dimension.textColor)} />
          </div>
          <div>
            <span className="text-sm font-medium text-white">{dimension.label}</span>
            {showDescription && (
              <p className="text-xs text-zinc-500 hidden md:block">{dimension.description}</p>
            )}
          </div>
        </div>
        <span className={cn('text-sm font-bold tabular-nums', getScoreColor(score))}>
          {score.toFixed(1)}
        </span>
      </div>
      
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, delay: delay + 0.2, ease: 'easeOut' }}
          className={cn('h-full rounded-full bg-gradient-to-r', dimension.color)}
        />
      </div>
    </motion.div>
  );
}

export function CopyScorecardFull({ scorecard }: { scorecard: CopyScorecard }) {
  return (
    <div className="card-premium p-6">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
        <TrendingUp className="h-5 w-5 text-emerald-400" />
        Scorecard de Copy
      </h3>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Radial score */}
        <div className="flex flex-col items-center justify-center">
          <RadialScore value={scorecard.overall} />
          <p className="text-sm text-zinc-500 mt-4 text-center">
            Score Geral<br />
            <span className="text-xs text-zinc-600">Média ponderada das 5 dimensões</span>
          </p>
        </div>
        
        {/* Dimension bars */}
        <div className="flex-1 space-y-4">
          {DIMENSIONS.map((dim, index) => (
            <DimensionBar
              key={dim.key}
              dimension={dim}
              score={scorecard[dim.key]}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CopyScorecardCompact({ scorecard }: { scorecard: CopyScorecard }) {
  return (
    <div className="space-y-2">
      {DIMENSIONS.map((dim, index) => {
        const score = scorecard[dim.key];
        const percentage = (score / 10) * 100;
        
        return (
          <div key={dim.key} className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 w-16 truncate">{dim.label}</span>
            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className={cn('h-full rounded-full bg-gradient-to-r', dim.color)}
              />
            </div>
            <span className={cn('text-xs font-medium w-8 text-right', getScoreColor(score))}>
              {score.toFixed(1)}
            </span>
          </div>
        );
      })}
      
      <div className="pt-2 mt-2 border-t border-zinc-800 flex items-center justify-between">
        <span className="text-sm font-medium text-white">Geral</span>
        <span className={cn('text-lg font-bold', getScoreColor(scorecard.overall))}>
          {scorecard.overall.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

export function CopyScorecardMini({ score }: { score: number }) {
  const { emoji } = getScoreLabel(score);
  
  return (
    <div className={cn(
      'flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm font-medium',
      score >= 8 ? 'bg-emerald-500/10 text-emerald-400' :
      score >= 6 ? 'bg-amber-500/10 text-amber-400' :
      'bg-red-500/10 text-red-400'
    )}>
      <span>{emoji}</span>
      <span>{score.toFixed(1)}</span>
    </div>
  );
}

export default function CopyScorecardDisplay({ 
  scorecard, 
  size = 'md',
  showLabels = true,
}: CopyScorecardProps) {
  if (size === 'sm') {
    return <CopyScorecardMini score={scorecard.overall} />;
  }
  
  if (size === 'lg') {
    return <CopyScorecardFull scorecard={scorecard} />;
  }
  
  return <CopyScorecardCompact scorecard={scorecard} />;
}



