'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { OnboardingProgress } from './onboarding-progress';
import { OnboardingStepIdentity } from './onboarding-step-identity';
import { OnboardingStepAudience } from './onboarding-step-audience';
import { OnboardingStepOffer } from './onboarding-step-offer';
import { VerdictFullscreen } from './verdict-fullscreen';
import { useBrands } from '@/lib/hooks/use-brands';
import { useBrandStore } from '@/lib/stores/brand-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { updateUserPreferences } from '@/lib/firebase/firestore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Sparkles, Loader2 } from 'lucide-react';

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
  const [completedBrand, setCompletedBrand] = useState<{ id: string; name: string } | null>(null);

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
      toast.error('Preencha todos os campos obrigatorios');
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
      toast.error('Usuario nao autenticado');
      return;
    }

    setIsSubmitting(true);

    try {
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

      await updateUserPreferences(user.uid, {
        onboardingPhase1AComplete: true,
      });

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

      // Sprint 08.1: Show fullscreen verdict with real AI generation
      setCompletedBrand({ id: brandId, name: formData.name });
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

  // Sprint 08.1: Show fullscreen verdict after brand creation
  if (completedBrand) {
    return <VerdictFullscreen brandId={completedBrand.id} brandName={completedBrand.name} />;
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
        className="relative z-10 w-full max-w-[680px] mx-4 max-h-[90vh] overflow-y-auto rounded-2xl bg-[#1A1612] border border-[#2A2318] p-6 sm:p-8 shadow-2xl"
      >
        {/* Progress */}
        <OnboardingProgress currentStep={currentStep} />

        {/* Step content */}
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#2A2318]">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
              className="border-[#2A2318] bg-transparent text-[#CAB792] hover:bg-[#241F19] hover:text-[#F5E8CE]"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Voltar
            </Button>
          ) : (
            <div />
          )}

          <Button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting || !canProceed()}
            className="bg-gradient-to-r from-[#E6B447] to-[#AB8648] text-[#0D0B09] font-semibold hover:from-[#F0C35C] hover:to-[#E6B447] disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : currentStep === 3 ? (
              <>
                <Sparkles className="h-4 w-4" />
                Analisar minha marca
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
