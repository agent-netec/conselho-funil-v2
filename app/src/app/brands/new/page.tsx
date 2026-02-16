'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useBrands } from '@/lib/hooks/use-brands';
import { uploadLogo } from '@/lib/firebase/storage';
import { useAuthStore } from '@/lib/stores/auth-store';
import { toast } from 'sonner';

// Wizard Components
import { WizardProgress, BRAND_STEPS } from '@/components/brands/wizard/wizard-progress';
import { StepIdentity } from '@/components/brands/wizard/step-identity';
import { StepAudience } from '@/components/brands/wizard/step-audience';
import { StepOffer } from '@/components/brands/wizard/step-offer';
import { StepVisualIdentity } from '@/components/brands/wizard/step-visual-identity';
import { StepLogo } from '@/components/brands/wizard/step-logo';
import { StepAiConfig } from '@/components/brands/wizard/step-ai-config';
import { StepConfirm } from '@/components/brands/wizard/step-confirm';

const AI_PRESETS: Record<string, { temperature: number; topP: number }> = {
  agressivo: { temperature: 0.9, topP: 0.95 },
  sobrio: { temperature: 0.3, topP: 0.7 },
  criativo: { temperature: 0.8, topP: 0.9 },
  equilibrado: { temperature: 0.6, topP: 0.85 },
};

const TOTAL_STEPS = 7;

export default function NewBrandPage() {
  const router = useRouter();
  const { create, update } = useBrands();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Identity
    name: '',
    vertical: '',
    positioning: '',
    voiceTone: '',

    // Step 2: Audience
    who: '',
    pain: '',
    awareness: 'problem_aware',
    objections: [] as string[],

    // Step 3: Offer
    what: '',
    ticket: '',
    type: '',
    differentiator: '',

    // Step 4: Visual Identity
    colors: { primary: '#10b981', secondary: '#3b82f6', accent: '#f59e0b', background: '#09090b' },
    visualStyle: 'modern',
    typography: { primaryFont: 'Inter', secondaryFont: 'Inter' },

    // Step 5: Logo
    logoFile: null as File | null,
    logoLocked: true,

    // Step 6: AI Config
    aiProfile: 'equilibrado',
  });

  const updateForm = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!formData.name && !!formData.vertical && !!formData.positioning && !!formData.voiceTone;
      case 2:
        return !!formData.who && !!formData.pain && !!formData.awareness;
      case 3:
        return !!formData.what && !!formData.ticket && !!formData.type && !!formData.differentiator;
      // Steps 4-6 are optional — always can proceed
      case 4:
      case 5:
      case 6:
        return true;
      default:
        return true;
    }
  };

  const isOptionalStep = currentStep >= 4 && currentStep <= 6;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Create brand with core data
      const brandId = await create({
        userId: '',
        name: formData.name,
        vertical: formData.vertical,
        positioning: formData.positioning,
        voiceTone: formData.voiceTone,
        audience: {
          who: formData.who,
          pain: formData.pain,
          awareness: formData.awareness,
          objections: formData.objections.filter(o => o.trim()),
        },
        offer: {
          what: formData.what,
          ticket: Number(formData.ticket),
          type: formData.type,
          differentiator: formData.differentiator,
        },
      });

      // 2. Build brandKit if any visual data was customized
      const hasVisualData = formData.colors.primary !== '#10b981' ||
        formData.colors.secondary !== '#3b82f6' ||
        formData.typography.primaryFont !== 'Inter' ||
        formData.logoFile;

      const hasAiConfig = formData.aiProfile !== '';

      if (hasVisualData || hasAiConfig || formData.logoFile) {
        const updateData: any = {};

        // Build brandKit
        if (hasVisualData || formData.logoFile) {
          const brandKit: any = {
            colors: formData.colors,
            typography: {
              ...formData.typography,
              systemFallback: 'sans-serif',
            },
            visualStyle: formData.visualStyle,
            logoLock: {
              variants: { primary: { url: '', storagePath: '', format: 'png' } },
              locked: formData.logoLocked,
            },
            updatedAt: new Date(),
          };

          // Upload logo if provided
          if (formData.logoFile && user) {
            try {
              const logoUrl = await uploadLogo(formData.logoFile, brandId, user.uid);
              const format = formData.logoFile.name.split('.').pop() as any;
              brandKit.logoLock.variants.primary = {
                url: logoUrl,
                storagePath: `brands/${user.uid}/${brandId}/logos/${formData.logoFile.name}`,
                format: format === 'svg' ? 'svg' : (format === 'webp' ? 'webp' : 'png'),
              };
            } catch (err) {
              console.error('Logo upload failed:', err);
              toast.error('Logo upload falhou, mas a marca foi criada.');
            }
          }

          updateData.brandKit = brandKit;
        }

        // Build AI configuration
        if (hasAiConfig) {
          const preset = AI_PRESETS[formData.aiProfile] || AI_PRESETS.equilibrado;
          updateData.aiConfiguration = {
            temperature: preset.temperature,
            topP: preset.topP,
            profile: formData.aiProfile,
          };
        }

        await update(brandId, updateData);
      }

      toast.success('Marca criada com sucesso!');
      router.push(`/brands/${brandId}`);
    } catch (error) {
      console.error('Error creating brand:', error);
      toast.error('Erro ao criar marca. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepIdentity
            name={formData.name}
            vertical={formData.vertical}
            positioning={formData.positioning}
            voiceTone={formData.voiceTone}
            onUpdate={updateForm}
          />
        );
      case 2:
        return (
          <StepAudience
            who={formData.who}
            pain={formData.pain}
            awareness={formData.awareness}
            objections={formData.objections}
            onUpdate={updateForm}
          />
        );
      case 3:
        return (
          <StepOffer
            what={formData.what}
            ticket={formData.ticket}
            type={formData.type}
            differentiator={formData.differentiator}
            onUpdate={updateForm}
          />
        );
      case 4:
        return (
          <StepVisualIdentity
            colors={formData.colors}
            visualStyle={formData.visualStyle}
            typography={formData.typography}
            onUpdate={updateForm}
          />
        );
      case 5:
        return (
          <StepLogo
            logoFile={formData.logoFile}
            logoLocked={formData.logoLocked}
            onUpdate={updateForm}
          />
        );
      case 6:
        return (
          <StepAiConfig
            aiProfile={formData.aiProfile}
            onUpdate={updateForm}
          />
        );
      case 7:
        return <StepConfirm formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center text-sm text-zinc-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </button>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
          <div className="mb-8 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 mb-4">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Nova Marca
            </h1>
            <p className="text-zinc-500">
              Configure o contexto da sua marca para usar em todos os conselhos
            </p>
          </div>

          <WizardProgress currentStep={currentStep} />

          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="border-white/[0.06]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>

            <div className="flex items-center gap-3">
              {isOptionalStep && (
                <button
                  onClick={() => setCurrentStep((prev) => prev + 1)}
                  className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Pular por enquanto
                </button>
              )}

              {currentStep < TOTAL_STEPS ? (
                <Button
                  onClick={() => setCurrentStep((prev) => prev + 1)}
                  disabled={!canProceed()}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !canProceed()}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Criando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Criar Marca
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
