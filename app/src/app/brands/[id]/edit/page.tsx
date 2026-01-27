'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Save, Loader2 } from 'lucide-react';
import { useBrands } from '@/lib/hooks/use-brands';

// Wizard Components (reutilizando do wizard de criação)
import { WizardProgress } from '@/components/brands/wizard/wizard-progress';
import { StepIdentity } from '@/components/brands/wizard/step-identity';
import { StepAudience } from '@/components/brands/wizard/step-audience';
import { StepOffer } from '@/components/brands/wizard/step-offer';
import { StepConfirm } from '@/components/brands/wizard/step-confirm';

/**
 * Página de Edição de Marca
 * 
 * Reutiliza os componentes do wizard de criação para permitir edição.
 * Carrega dados da marca existente e salva alterações.
 */
export default function EditBrandPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.id as string;
  
  const { brands, update, isLoading } = useBrands();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBrand, setIsLoadingBrand] = useState(true);
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

  // Carrega dados da marca existente
  useEffect(() => {
    const brand = brands.find(b => b.id === brandId);
    
    if (brand) {
      setFormData({
        name: brand.name,
        vertical: brand.vertical,
        positioning: brand.positioning,
        voiceTone: brand.voiceTone,
        who: brand.audience.who,
        pain: brand.audience.pain,
        awareness: brand.audience.awareness,
        objections: brand.audience.objections,
        what: brand.offer.what,
        ticket: String(brand.offer.ticket),
        type: brand.offer.type,
        differentiator: brand.offer.differentiator,
      });
      setIsLoadingBrand(false);
    } else if (!isLoading) {
      // Marca não encontrada
      alert('Marca não encontrada.');
      router.push('/brands');
    }
  }, [brands, brandId, isLoading, router]);

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
      await update(brandId, {
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

      // Redireciona para listagem de marcas
      router.push('/brands');
    } catch (error) {
      console.error('Error updating brand:', error);
      alert('Erro ao atualizar marca. Tente novamente.');
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

  // Loading da marca
  if (isLoadingBrand) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-500">Carregando marca...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header showBrandSelector={false} />
      
      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => router.push('/brands')}
            className="inline-flex items-center text-sm text-zinc-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Marcas
          </button>
          
          <Button
            variant="outline"
            onClick={() => router.push(`/brands/${brandId}/assets`)}
            className="border-white/[0.06]"
          >
            📁 Ver Arquivos
          </Button>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-2">
              Editar Marca
            </h1>
            <p className="text-zinc-500">
              Atualize o contexto da sua marca
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
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
