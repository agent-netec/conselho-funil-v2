import { motion } from 'framer-motion';
import { Check, LucideIcon, Target, Users, Package, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const STEPS: Step[] = [
  { id: 1, title: 'Objetivo', description: 'O que você quer alcançar?', icon: Target },
  { id: 2, title: 'Público', description: 'Quem é seu cliente ideal?', icon: Users },
  { id: 3, title: 'Oferta', description: 'O que você está vendendo?', icon: Package },
  { id: 4, title: 'Canais', description: 'Como vai atrair tráfego?', icon: Radio },
  { id: 5, title: 'Confirmar', description: 'Revise e crie', icon: Check },
];

interface WizardProgressProps {
  currentStep: number;
}

export function WizardProgress({ currentStep }: WizardProgressProps) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <motion.div
              initial={false}
              animate={{
                backgroundColor: currentStep >= step.id 
                  ? 'rgb(16, 185, 129)' 
                  : 'rgba(255, 255, 255, 0.04)',
                scale: currentStep === step.id ? 1.1 : 1,
              }}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl transition-all',
                currentStep >= step.id ? 'text-white' : 'text-zinc-600'
              )}
            >
              {currentStep > step.id ? (
                <Check className="h-5 w-5" />
              ) : (
                <step.icon className="h-5 w-5" />
              )}
            </motion.div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-8 mx-1 rounded-full transition-colors',
                  currentStep > step.id ? 'bg-emerald-500' : 'bg-white/[0.06]'
                )}
              />
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-center">
        <h2 className="text-lg font-semibold text-white">
          {STEPS[currentStep - 1].title}
        </h2>
        <p className="text-sm text-zinc-500">
          {STEPS[currentStep - 1].description}
        </p>
      </div>
    </div>
  );
}

