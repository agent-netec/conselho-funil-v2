'use client';

import { motion } from 'framer-motion';
import { Building2, Users, Package } from 'lucide-react';

const steps = [
  { id: 1, label: 'Identidade', icon: Building2 },
  { id: 2, label: 'Audiencia', icon: Users },
  { id: 3, label: 'Oferta', icon: Package },
];

interface OnboardingProgressProps {
  currentStep: number;
}

export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
      {steps.map((step, index) => {
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isActive || isCompleted
                    ? '#E6B447'
                    : '#241F19',
                  scale: isActive ? 1.1 : 1,
                  borderColor: isActive || isCompleted
                    ? '#E6B447'
                    : '#2A2318',
                }}
                transition={{ duration: 0.3 }}
                className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2"
              >
                <Icon
                  className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${
                    isActive || isCompleted ? 'text-[#0D0B09]' : 'text-[#6B5D4A]'
                  }`}
                />
              </motion.div>
              <span
                className={`mt-2 text-xs font-medium tracking-wider uppercase transition-colors ${
                  isActive ? 'text-[#E6B447]' : isCompleted ? 'text-[#CAB792]' : 'text-[#6B5D4A]'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="relative mx-2 sm:mx-4 h-0.5 w-8 sm:w-16 bg-[#2A2318] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: isCompleted ? '100%' : '0%' }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#E6B447] to-[#AB8648]"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
