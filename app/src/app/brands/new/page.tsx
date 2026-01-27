'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useBrands } from '@/lib/hooks/use-brands';

// Wizard Components
import { WizardProgress } from '@/components/brands/wizard/wizard-progress';
import { StepIdentity } from '@/components/brands/wizard/step-identity';
import { StepAudience } from '@/components/brands/wizard/step-audience';
import { StepOffer } from '@/components/brands/wizard/step-offer';
import { StepConfirm } from '@/components/brands/wizard/step-confirm';

export default function NewBrandPage() {
  const router = useRouter();
  const { create } = useBrands();
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
      default: 
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;
    
    setIsSubmitting(true);
    try {
      const brandId = await create({
        userId: '', // será preenchido pelo hook
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

      // Redireciona para a home
      router.push(`/`);
    } catch (error) {
      console.error('Error creating brand:', error);
      alert('Erro ao criar marca. Tente novamente.');
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

            {currentStep < 4 ? (
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
      </main>
    </div>
  );
}

