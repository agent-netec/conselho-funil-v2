import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, LucideIcon, Target, Sparkles, PenTool, Share2, Palette, BarChart3, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CampaignStep {
  id: string;
  title: string;
  icon: LucideIcon;
  status: 'pending' | 'active' | 'completed';
}

export const CAMPAIGN_STAGES: CampaignStep[] = [
  { id: 'funnel', title: 'Funil', icon: Target, status: 'pending' },
  { id: 'offer', title: 'Oferta', icon: Sparkles, status: 'pending' },
  { id: 'copy', title: 'Copy', icon: PenTool, status: 'pending' },
  { id: 'social', title: 'Social', icon: Share2, status: 'pending' },
  { id: 'design', title: 'Design', icon: Palette, status: 'pending' },
  { id: 'ads', title: 'Ads', icon: BarChart3, status: 'pending' },
  { id: 'launch', title: 'Launch', icon: Rocket, status: 'pending' },
];

// Sprint 04.3: Route map for clickable stepper
const STAGE_ROUTES: Record<string, (campaignId: string) => string> = {
  funnel: (id) => `/campaigns/${id}`,
  offer: (id) => `/campaigns/${id}`,
  copy: (id) => `/campaigns/${id}/copy`,
  social: (id) => `/campaigns/${id}/social`,
  design: (id) => `/campaigns/${id}/design`,
  ads: (id) => `/campaigns/${id}/ads`,
  launch: (id) => `/campaigns/${id}/launch`,
};

interface CampaignStepperProps {
  currentStageId: string;
  completedStages: string[];
  campaignId?: string;
}

export function CampaignStepper({ currentStageId, completedStages, campaignId }: CampaignStepperProps) {
  return (
    <div className="w-full py-4 sm:py-6 overflow-x-auto scrollbar-none">
      <div className="flex items-center justify-between min-w-[340px] max-w-4xl mx-auto px-4 gap-2">
        {CAMPAIGN_STAGES.map((stage, index) => {
          const isCompleted = completedStages.includes(stage.id);
          const isActive = currentStageId === stage.id;
          const href = campaignId ? STAGE_ROUTES[stage.id]?.(campaignId) : undefined;
          const isClickable = !!href && (isCompleted || isActive);

          const stepContent = (
            <div className="flex flex-col items-center relative group">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isCompleted
                    ? 'rgb(230, 180, 71)'
                    : isActive
                      ? 'rgba(230, 180, 71, 0.2)'
                      : 'rgba(255, 255, 255, 0.04)',
                  borderColor: isCompleted || isActive ? 'rgb(230, 180, 71)' : 'rgba(255, 255, 255, 0.1)',
                }}
                className={cn(
                  'flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl border-2 transition-all shadow-lg',
                  isCompleted ? 'text-white' : isActive ? 'text-[#E6B447]' : 'text-zinc-600',
                  isClickable && 'cursor-pointer hover:scale-105'
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 sm:h-6 sm:w-6" />
                ) : (
                  <stage.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                )}
              </motion.div>

              {/* label */}
              <div className={cn(
                "absolute -bottom-6 sm:-bottom-8 flex flex-col items-center transition-all duration-300",
                isActive ? "opacity-100 translate-y-0" : "opacity-0 sm:opacity-60 translate-y-1"
              )}>
                <span className={cn(
                  "text-[8px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap",
                  isActive ? "text-[#E6B447]" : "text-zinc-500"
                )}>
                  {stage.title}
                </span>
              </div>
            </div>
          );

          return (
            <div key={stage.id} className="flex items-center flex-1 last:flex-none">
              {isClickable && href ? (
                <Link href={href}>{stepContent}</Link>
              ) : (
                stepContent
              )}

              {index < CAMPAIGN_STAGES.length - 1 && (
                <div className="flex-1 mx-2 sm:mx-4 h-[2px] bg-zinc-800 rounded-full relative overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: isCompleted ? '100%' : '0%' }}
                    className="absolute inset-0 bg-[#E6B447]"
                    transition={{ duration: 0.5 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
