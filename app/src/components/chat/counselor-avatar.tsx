'use client';

import { getCounselorMeta } from '@/data/counselor-metadata';
import { cn } from '@/lib/utils';

interface CounselorAvatarProps {
  counselorId: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
} as const;

export function CounselorAvatar({ counselorId, size = 'md' }: CounselorAvatarProps) {
  const meta = getCounselorMeta(counselorId);

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold shrink-0',
        sizeClasses[size]
      )}
      style={{
        backgroundColor: `${meta.accentColor}33`, // 20% opacity
        color: meta.accentColor,
      }}
      title={`${meta.name} — ${meta.specialty}`}
    >
      {meta.initials}
    </div>
  );
}
