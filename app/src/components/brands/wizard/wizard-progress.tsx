import { motion } from 'framer-motion';
import { Check, LucideIcon, Building2, Users, Package, CheckCircle, Palette, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
  optional?: boolean;
}

export const BRAND_STEPS: Step[] = [
  { id: 1, title: 'Identidade', description: 'Nome, vertical e posicionamento', icon: Building2 },
  { id: 2, title: 'Público', description: 'Quem você serve?', icon: Users },
  { id: 3, title: 'Oferta', description: 'O que você vende?', icon: Package },
  { id: 4, title: 'Visual + Logo', description: 'Cores, tipografia e logo', icon: Palette, optional: true },
  { id: 5, title: 'Documentos', description: 'PDFs, URLs da marca', icon: FileText, optional: true },
  { id: 6, title: 'Confirmar', description: 'Revise e crie', icon: CheckCircle },
];

interface WizardProgressProps {
  currentStep: number;
}

export function WizardProgress({ currentStep }: WizardProgressProps) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between">
        {BRAND_STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <motion.div
              initial={false}
              animate={{
                backgroundColor: currentStep >= step.id
                  ? 'rgb(230, 180, 71)'
                  : 'rgba(255, 255, 255, 0.04)',
                scale: currentStep === step.id ? 1.1 : 1,
              }}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-xl transition-all',
                currentStep >= step.id ? 'text-white' : 'text-zinc-600'
              )}
            >
              {currentStep > step.id ? (
                <Check className="h-4 w-4" />
              ) : (
                <step.icon className="h-4 w-4" />
              )}
            </motion.div>
            {index < BRAND_STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-6 mx-1 rounded-full transition-colors',
                  currentStep > step.id ? 'bg-[#E6B447]' : 'bg-white/[0.06]'
                )}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <h2 className="text-lg font-semibold text-white">
          {BRAND_STEPS[currentStep - 1].title}
        </h2>
        <p className="text-sm text-zinc-500">
          {BRAND_STEPS[currentStep - 1].description}
          {BRAND_STEPS[currentStep - 1].optional && (
            <span className="ml-2 text-[10px] text-zinc-600 bg-white/[0.04] px-2 py-0.5 rounded-full">
              Opcional
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
