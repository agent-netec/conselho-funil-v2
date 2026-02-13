'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Library } from 'lucide-react';
import { useFunnels } from '@/lib/hooks/use-funnels';
import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import type { FunnelContext, LibraryTemplate } from '@/types/database';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getAuthHeaders } from '@/lib/utils/auth-headers';

// Wizard Components
import { WizardProgress } from '@/components/funnels/wizard/wizard-progress';
import { StepObjective } from '@/components/funnels/wizard/step-objective';
import { StepAudience } from '@/components/funnels/wizard/step-audience';
import { StepOffer } from '@/components/funnels/wizard/step-offer';
import { StepChannels } from '@/components/funnels/wizard/step-channels';
import { StepConfirm } from '@/components/funnels/wizard/step-confirm';

export default function NewFunnelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { create } = useFunnels();
  const activeBrand = useActiveBrand(); // Marca ativa para vincular automaticamente
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [template, setTemplate] = useState<LibraryTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    objective: '' as 'leads' | 'sales' | 'calls' | 'retention' | '',
    audience: '',
    pain: '',
    awareness: 'problem' as 'unaware' | 'problem' | 'solution' | 'product',
    objection: '',
    product: '',
    ticket: '',
    productType: '',
    differential: '',
    primaryChannel: '',
    secondaryChannel: '',
  });

  useEffect(() => {
    const templateId = searchParams.get('templateId');
    if (templateId) loadTemplate(templateId);
  }, [searchParams]);

  const loadTemplate = async (templateId: string) => {
    try {
      const templateDoc = await getDoc(doc(db, 'library', templateId));
      if (templateDoc.exists()) {
        const templateData = { id: templateDoc.id, ...templateDoc.data() } as LibraryTemplate;
        setTemplate(templateData);
        const meta = templateData.metadata;
        setFormData(prev => ({
          ...prev,
          name: searchParams.get('name') || templateData.name + ' (cópia)',
          objective: (meta?.objective as any) || '',
          productType: meta?.vertical || '',
          ticket: meta?.ticket?.toString() || '',
          primaryChannel: (meta?.sourceContext?.channel?.main as string) || '',
        }));
      }
    } catch (error) {
      console.error('Error loading template:', error);
    }
  };

  const updateForm = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!formData.objective;
      case 2: return !!formData.audience && !!formData.pain;
      case 3: return !!formData.product && !!formData.ticket;
      case 4: return !!formData.primaryChannel;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    if (!formData.objective) return;
    setIsSubmitting(true);
    try {
      // Schwartz awareness passthrough (canônico) — normalizeAwareness() para legado PT
      const awarenessMap: Record<string, 'unaware' | 'problem' | 'solution' | 'product' | 'most_aware'> = {
        unaware: 'unaware', problem: 'problem', solution: 'solution', product: 'product', most_aware: 'most_aware',
        fria: 'unaware', morna: 'solution', quente: 'product',
      };
      const context: FunnelContext = {
        company: formData.name || 'Meu Negócio',
        market: formData.productType || 'Digital',
        maturity: 'em tração',
        objective: formData.objective as any,
        audience: {
          who: formData.audience, pain: formData.pain,
          awareness: awarenessMap[formData.awareness] || 'solution',
          ...(formData.objection ? { objection: formData.objection } : {}),
        },
        offer: { what: formData.product, ticket: formData.ticket, type: (formData.productType?.toLowerCase() as any) || 'servico' },
        channel: { main: formData.primaryChannel, ...(formData.secondaryChannel ? { secondary: formData.secondaryChannel } : {}) },
      };
      
      // Vincula automaticamente à marca ativa se existir
      const funnelId = await create({ 
        name: formData.name || `Funil ${formData.objective}`, 
        context,
        brandId: activeBrand?.id, // Vincula à marca selecionada
      });
      
      getAuthHeaders().then(h => fetch('/api/funnels/generate', { method: 'POST', headers: h, body: JSON.stringify({ funnelId, context }) })).catch(console.error);
      if (template) updateDoc(doc(db, 'library', template.id), { usageCount: increment(1) }).catch(console.error);
      router.push(`/funnels/${funnelId}`);
    } catch (error) {
      console.error('Error creating funnel:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    const props = { formData, onUpdate: updateForm };
    switch (currentStep) {
      case 1: return <StepObjective objective={formData.objective} onUpdate={(val) => updateForm('objective', val)} />;
      case 2: return <StepAudience {...props} />;
      case 3: return <StepOffer {...props} />;
      case 4: return <StepChannels {...props} />;
      case 5: return <StepConfirm {...props} onSubmit={handleSubmit} isSubmitting={isSubmitting} />;
      default: return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header title={template ? 'Criar a partir de Template' : 'Novo Funil'} subtitle={template?.name} showBack />
      {template && (
        <div className="border-b border-emerald-500/20 bg-emerald-500/5 px-8 py-3">
          <div className="mx-auto max-w-2xl flex items-center gap-3">
            <Library className="h-5 w-5 text-emerald-400" />
            <span className="text-sm text-emerald-300">Usando template: <span className="font-medium">{template.name}</span></span>
          </div>
        </div>
      )}
      <div className="flex-1 p-8">
        <div className="mx-auto max-w-2xl">
          <WizardProgress currentStep={currentStep} />
          <div className="card-premium p-6">
            <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
          </div>
          <div className="mt-6 flex justify-between">
            <Button onClick={() => currentStep === 1 ? router.push('/funnels') : setCurrentStep(s => s - 1)} variant="ghost" className="btn-ghost">
              <ArrowLeft className="mr-2 h-4 w-4" /> {currentStep === 1 ? 'Cancelar' : 'Voltar'}
            </Button>
            {currentStep < 5 && (
              <Button onClick={() => setCurrentStep(s => s + 1)} disabled={!canProceed()} className="btn-accent">
                Próximo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
