'use client';

import { getCounselorMeta } from '@/data/counselor-metadata';
import { CounselorAvatar } from './counselor-avatar';

interface CounselorMessageHeaderProps {
  counselorIds: string[];
}

export function CounselorMessageHeader({ counselorIds }: CounselorMessageHeaderProps) {
  if (!counselorIds || counselorIds.length === 0) {
    // Fallback: MKTHONEY branding
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-zinc-300">MKTHONEY</span>
      </div>
    );
  }

  const primaryId = counselorIds[0];
  const primary = getCounselorMeta(primaryId);
  const remaining = counselorIds.length - 1;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-zinc-300">
        {primary.name}
      </span>

      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-zinc-500">
        {primary.specialty}
      </span>

      {remaining > 0 && (
        <span
          className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-zinc-500"
          title={counselorIds
            .slice(1)
            .map((id) => getCounselorMeta(id).name)
            .join(', ')}
        >
          +{remaining}
        </span>
      )}
    </div>
  );
}
