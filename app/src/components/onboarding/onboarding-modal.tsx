'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { OnboardingProgress } from './onboarding-progress';
import { OnboardingStepIdentity } from './onboarding-step-identity';
import { OnboardingStepAudience } from './onboarding-step-audience';
import { OnboardingStepOffer } from './onboarding-step-offer';
import { OnboardingTransition } from './onboarding-transition';
import { useBrands } from '@/lib/hooks/use-brands';
import { useBrandStore } from '@/lib/stores/brand-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { updateUserPreferences } from '@/lib/firebase/firestore';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

interface FormData {
  // Step 1 - Identity
  name: string;
  positioning: string;
  vertical: string;
  voiceTone: string;
  // Step 2 - Audience
  who: string;
  pain: string;
  awareness: string;
  objections: string[];
  // Step 3 - Offer
  what: string;
  ticket: number;
  type: string;
  differentiator: string;
}

const initialFormData: FormData = {
  name: '',
  positioning: '',
  vertical: '',
  voiceTone: '',
  who: '',
  pain: '',
  awareness: '',
  objections: [],
  what: '',
  ticket: 0,
  type: '',
  differentiator: '',
};

export function OnboardingModal() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTransition, setShowTransition] = useState(false);

  const { create } = useBrands();
  const { setSelectedBrand } = useBrandStore();
  const { user } = useAuthStore();

  const updateForm = useCallback((field: string, value: string | string[] | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return (
          formData.name.trim() !== '' &&
          formData.vertical !== '' &&
          formData.voiceTone !== ''
        );
      case 2:
        return (
          formData.who.trim() !== '' &&
          formData.pain.trim() !== '' &&
          formData.awareness !== ''
        );
      case 3:
        return (
          formData.what.trim() !== '' &&
          formData.ticket > 0 &&
          formData.type !== ''
        );
      default:
        return false;
    }
  }, [currentStep, formData]);

  const handleNext = () => {
    if (!canProceed()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create brand with collected data
      const brandId = await create({
        userId: user.uid,
        name: formData.name,
        vertical: formData.vertical,
        positioning: formData.positioning || `${formData.name} - ${formData.vertical}`,
        voiceTone: formData.voiceTone,
        audience: {
          who: formData.who,
          pain: formData.pain,
          awareness: formData.awareness,
          objections: formData.objections,
        },
        offer: {
          what: formData.what,
          ticket: formData.ticket,
          type: formData.type,
          differentiator: formData.differentiator,
        },
      });

      // Mark onboarding as complete
      await updateUserPreferences(user.uid, {
        onboardingPhase1AComplete: true,
      });

      // Set as selected brand
      setSelectedBrand({
        id: brandId,
        userId: user.uid,
        name: formData.name,
        vertical: formData.vertical,
        positioning: formData.positioning || `${formData.name} - ${formData.vertical}`,
        voiceTone: formData.voiceTone,
        audience: {
          who: formData.who,
          pain: formData.pain,
          awareness: formData.awareness,
          objections: formData.objections,
        },
        offer: {
          what: formData.what,
          ticket: formData.ticket,
          type: formData.type,
          differentiator: formData.differentiator,
        },
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      });

      // Show transition screen
      setShowTransition(true);
    } catch (error) {
      console.error('Error creating brand:', error);
      toast.error('Erro ao criar marca. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <OnboardingStepIdentity
            name={formData.name}
            positioning={formData.positioning}
            vertical={formData.vertical}
            voiceTone={formData.voiceTone}
            onUpdate={updateForm}
          />
        );
      case 2:
        return (
          <OnboardingStepAudience
            who={formData.who}
            pain={formData.pain}
            awareness={formData.awareness}
            objections={formData.objections}
            onUpdate={updateForm}
          />
        );
      case 3:
        return (
          <OnboardingStepOffer
            what={formData.what}
            ticket={formData.ticket}
            type={formData.type}
            differentiator={formData.differentiator}
            onUpdate={updateForm}
          />
        );
      default:
        return null;
    }
  };

  // Show transition screen
  if (showTransition) {
    return <OnboardingTransition />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[680px] mx-4 max-h-[90vh] overflow-y-auto rounded-3xl bg-zinc-900 border border-white/[0.06] p-6 sm:p-8 shadow-2xl"
      >
        {/* Progress bar */}
        <OnboardingProgress currentStep={currentStep} />

        {/* Step content */}
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.06]">
          {/* Back button */}
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/[0.1] transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
          ) : (
            <div />
          )}

          {/* Next/Submit button */}
          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting || !canProceed()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#E6B447] text-white font-medium hover:bg-[#E6B447] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="h-4 w-4" />
                </motion.div>
                <span className="text-sm">Criando...</span>
              </>
            ) : currentStep === 3 ? (
              <>
                <Sparkles className="h-4 w-4" />
                <span className="text-sm">Analisar minha marca</span>
              </>
            ) : (
              <>
                <span className="text-sm">Continuar</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
