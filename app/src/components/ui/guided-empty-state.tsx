'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface GuidedEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  tips?: string[];
  secondaryAction?: { label: string; href: string };
}

export function GuidedEmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  tips,
  secondaryAction,
}: GuidedEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium p-10 text-center"
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 mb-5">
        <Icon className="h-8 w-8 text-emerald-400" />
      </div>

      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-zinc-400 mb-6 max-w-md mx-auto text-sm">{description}</p>

      {tips && tips.length > 0 && (
        <div className="mb-6 space-y-2 max-w-sm mx-auto">
          {tips.map((tip, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex items-start gap-2 text-left"
            >
              <span className="text-emerald-500 mt-0.5 text-xs">•</span>
              <span className="text-xs text-zinc-500">{tip}</span>
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <Link href={ctaHref}>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Icon className="mr-2 h-4 w-4" />
            {ctaLabel}
          </Button>
        </Link>

        {secondaryAction && (
          <Link href={secondaryAction.href}>
            <Button variant="outline" className="border-white/[0.08]">
              {secondaryAction.label}
            </Button>
          </Link>
        )}
      </div>
    </motion.div>
  );
}
