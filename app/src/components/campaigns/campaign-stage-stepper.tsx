'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PenTool, Share2, Palette, BarChart3, Rocket, Zap } from 'lucide-react';

const STAGES = [
  { id: 'hub', label: 'Hub', icon: Rocket, href: (id: string) => `/campaigns/${id}` },
  { id: 'copy', label: 'Copy', icon: PenTool, href: (id: string) => `/campaigns/${id}/copy` },
  { id: 'social', label: 'Social', icon: Share2, href: (id: string) => `/campaigns/${id}/social` },
  { id: 'design', label: 'Design', icon: Palette, href: (id: string) => `/campaigns/${id}/design` },
  { id: 'ads', label: 'Ads', icon: BarChart3, href: (id: string) => `/campaigns/${id}/ads` },
  { id: 'launch', label: 'Launch', icon: Zap, href: (id: string) => `/campaigns/${id}/launch` },
] as const;

interface CampaignStageStepperProps {
  campaignId: string;
  currentStage: string;
}

export function CampaignStageStepper({ campaignId, currentStage }: CampaignStageStepperProps) {
  return (
    <nav className="border-b border-white/[0.06] bg-[#0D0B09]">
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center gap-1 overflow-x-auto scrollbar-none">
        {STAGES.map((stage, i) => {
          const isActive = stage.id === currentStage;
          const Icon = stage.icon;
          return (
            <Link
              key={stage.id}
              href={stage.href(campaignId)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                isActive
                  ? 'bg-[#E6B447]/10 text-[#E6B447] border border-[#E6B447]/20'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {stage.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
