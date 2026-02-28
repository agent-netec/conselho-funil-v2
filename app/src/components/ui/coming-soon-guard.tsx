'use client';

import { ReactNode } from 'react';
import { Lock, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

export interface ComingSoonGuardProps {
  /** Content to show when feature is available (or render behind overlay) */
  children?: ReactNode;
  /** Feature name displayed in the guard */
  feature: string;
  /** Optional description of what the feature will do */
  description?: string;
  /** Expected release date (optional) */
  expectedDate?: string;
  /** Show content behind a blurred overlay instead of hiding completely */
  showBlurred?: boolean;
  /** Custom className for the container */
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Coming Soon Guard — R4.2
 * Wraps features that are not yet implemented.
 * Shows a lock icon and message instead of the actual content.
 */
export function ComingSoonGuard({
  children,
  feature,
  description,
  expectedDate,
  showBlurred = false,
  className,
}: ComingSoonGuardProps) {
  return (
    <div className={cn('relative w-full h-full min-h-[400px]', className)}>
      {/* Blurred background content (optional) */}
      {showBlurred && children && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="blur-sm opacity-30 pointer-events-none">
            {children}
          </div>
        </div>
      )}

      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
        <div className="flex flex-col items-center max-w-md text-center px-6">
          {/* Icon */}
          <div className="relative mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-900 border border-white/[0.06]">
              <Lock className="h-8 w-8 text-[#E6B447]" />
            </div>
            {/* Sparkle decoration */}
            <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#E6B447]/10 border border-[#E6B447]/20">
              <Sparkles className="h-4 w-4 text-[#E6B447]" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-2">Em Breve</h2>

          {/* Feature name */}
          <p className="text-lg text-[#E6B447] font-semibold mb-3">{feature}</p>

          {/* Description */}
          {description && (
            <p className="text-sm text-zinc-400 mb-4">{description}</p>
          )}

          {/* Expected date */}
          {expectedDate && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 border border-white/[0.06]">
              <Clock className="h-4 w-4 text-zinc-500" />
              <span className="text-xs text-zinc-500">
                Previsao: {expectedDate}
              </span>
            </div>
          )}

          {/* Subtle progress indicator */}
          <div className="mt-6 w-48">
            <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#E6B447] to-[#E6B447] rounded-full animate-pulse"
                style={{ width: '30%' }}
              />
            </div>
            <p className="text-[10px] text-zinc-600 mt-1.5">
              Estamos trabalhando nisso
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// FULL PAGE VARIANT
// ============================================

export interface ComingSoonPageProps {
  /** Feature name */
  feature: string;
  /** Description */
  description?: string;
  /** Expected date */
  expectedDate?: string;
}

/**
 * Full-page Coming Soon component for use in page.tsx files.
 * Centers the guard in the full viewport.
 */
export function ComingSoonPage({
  feature,
  description,
  expectedDate,
}: ComingSoonPageProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="flex flex-col items-center max-w-md text-center">
        {/* Icon */}
        <div className="relative mb-8">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-zinc-900 border border-white/[0.06]">
            <Lock className="h-10 w-10 text-[#E6B447]" />
          </div>
          <div className="absolute -top-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#E6B447]/10 border border-[#E6B447]/20">
            <Sparkles className="h-5 w-5 text-[#E6B447]" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-3">Em Breve</h1>

        {/* Feature name */}
        <p className="text-xl text-[#E6B447] font-semibold mb-4">{feature}</p>

        {/* Description */}
        {description && (
          <p className="text-base text-zinc-400 mb-6 leading-relaxed">
            {description}
          </p>
        )}

        {/* Expected date */}
        {expectedDate && (
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-900/50 border border-white/[0.06]">
            <Clock className="h-4 w-4 text-zinc-500" />
            <span className="text-sm text-zinc-500">
              Previsao: {expectedDate}
            </span>
          </div>
        )}

        {/* Progress indicator */}
        <div className="mt-8 w-64">
          <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#E6B447] to-[#E6B447] rounded-full animate-pulse"
              style={{ width: '30%' }}
            />
          </div>
          <p className="text-xs text-zinc-600 mt-2">
            Estamos trabalhando nisso
          </p>
        </div>
      </div>
    </div>
  );
}
