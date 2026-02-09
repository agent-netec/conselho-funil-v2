'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ConversionGrade } from '@/types/prediction';
import { GradeBadge } from './grade-badge';

interface CPSGaugeProps {
  score: number;
  grade: ConversionGrade;
  className?: string;
}

/** Retorna cor do gradiente baseada no score (0-100) */
function getScoreColor(score: number): string {
  if (score >= 90) return '#facc15'; // yellow-400 (S)
  if (score >= 75) return '#34d399'; // emerald-400 (A)
  if (score >= 60) return '#60a5fa'; // blue-400 (B)
  if (score >= 45) return '#fb923c'; // orange-400 (C)
  if (score >= 30) return '#f87171'; // red-400 (D)
  return '#71717a';                  // zinc-500 (F)
}

export function CPSGauge({ score, grade, className }: CPSGaugeProps) {
  const clampedScore = Math.min(100, Math.max(0, score));
  const percentage = clampedScore / 100;

  // SVG semicircle arc config
  const size = 240;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2;

  // Arc from 180° to 0° (left to right, bottom semicircle flipped)
  const startAngle = Math.PI;
  const endAngle = 0;
  const sweepAngle = startAngle - (startAngle - endAngle) * percentage;

  const startX = centerX + radius * Math.cos(startAngle);
  const startY = centerY - radius * Math.sin(startAngle);
  const endX = centerX + radius * Math.cos(sweepAngle);
  const endY = centerY - radius * Math.sin(sweepAngle);

  const largeArcFlag = percentage > 0.5 ? 1 : 0;

  const bgArcEndX = centerX + radius * Math.cos(endAngle);
  const bgArcEndY = centerY - radius * Math.sin(endAngle);

  const bgPath = `M ${startX} ${startY} A ${radius} ${radius} 0 1 1 ${bgArcEndX} ${bgArcEndY}`;
  const fillPath = percentage > 0
    ? `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`
    : '';

  const scoreColor = getScoreColor(clampedScore);

  return (
    <div className={cn('relative flex flex-col items-center', className)}>
      <svg
        width={size}
        height={size / 2 + 20}
        viewBox={`0 0 ${size} ${size / 2 + 20}`}
        className="overflow-visible"
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id="cps-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#71717a" />
            <stop offset="25%" stopColor="#f87171" />
            <stop offset="50%" stopColor="#fb923c" />
            <stop offset="75%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#facc15" />
          </linearGradient>
        </defs>

        {/* Background arc */}
        <path
          d={bgPath}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Filled arc with animation */}
        {fillPath && (
          <motion.path
            d={fillPath}
            fill="none"
            stroke={scoreColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        )}
      </svg>

      {/* Score + Grade overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
        <motion.span
          className="text-5xl font-bold tabular-nums"
          style={{ color: scoreColor }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {clampedScore}
        </motion.span>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <GradeBadge grade={grade} size="sm" showLabel />
        </motion.div>
      </div>
    </div>
  );
}
