'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { useBrands } from '@/lib/hooks/use-brands';
import { uploadLogo } from '@/lib/firebase/storage';
import { uploadBrandAsset, validateBrandAssetFile } from '@/lib/firebase/storage';
import { createAsset } from '@/lib/firebase/assets';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

import { WizardProgress, BRAND_STEPS } from '@/components/brands/wizard/wizard-progress';
import { StepIdentity } from '@/components/brands/wizard/step-identity';
import { StepAudience } from '@/components/brands/wizard/step-audience';
import { StepOffer } from '@/components/brands/wizard/step-offer';
import { StepVisualLogo } from '@/components/brands/wizard/step-visual-logo';
import { StepDocuments } from '@/components/brands/wizard/step-documents';
import { StepConfirm } from '@/components/brands/wizard/step-confirm';

const TOTAL_STEPS = 6;

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

    // Step 4: Visual + Logo
    colors: { primary: '#E6B447', secondary: '#3b82f6', accent: '#f59e0b', background: '#09090b' },
    visualStyle: 'modern',
    typography: { primaryFont: 'Inter', secondaryFont: 'Inter' },
    logoFile: null as File | null,
    logoLocked: true,

    // Step 5: Documents
    queuedDocuments: [] as File[],
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
      // Steps 4-5 optional
      case 4:
      case 5:
        return true;
      default:
        return true;
    }
  };

  const isOptionalStep = currentStep === 4 || currentStep === 5;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Create brand with core data
      const brandId = await create({
        userId: user?.uid ?? '',
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

      // 2. Update with visual/logo data if customized
      const hasVisualData = formData.colors.primary !== '#E6B447' ||
        formData.colors.secondary !== '#3b82f6' ||
        formData.typography.primaryFont !== 'Inter' ||
        formData.logoFile;

      if (hasVisualData || formData.logoFile) {
        const updateData: any = {};
        const brandKit: any = {
          colors: formData.colors,
          typography: { ...formData.typography, systemFallback: 'sans-serif' },
          visualStyle: formData.visualStyle,
          logoLock: {
            variants: { primary: { url: '', storagePath: '', format: 'png' } },
            locked: formData.logoLocked,
          },
          characters: [],
          updatedAt: new Date(),
        };

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
        // Default AI config
        updateData.aiConfiguration = { temperature: 0.6, topP: 0.85, profile: 'equilibrado' };
        await update(brandId, updateData);
      }

      // 3. Upload queued documents
      if (formData.queuedDocuments.length > 0 && user) {
        for (const file of formData.queuedDocuments) {
          try {
            const validation = validateBrandAssetFile(file);
            if (!validation.valid) continue;

            const { url: storageUrl } = await uploadBrandAsset(file, brandId, user.uid);
            const isImage = file.type.startsWith('image/');
            await createAsset({
              brandId,
              userId: user.uid,
              name: file.name,
              originalName: file.name,
              type: isImage ? 'image' : 'reference',
              mimeType: file.type || 'application/octet-stream',
              size: file.size,
              url: storageUrl,
              status: 'uploaded',
              isApprovedForAI: true,
              createdAt: Timestamp.now(),
              metadata: {
                sourceType: isImage ? 'image' : file.type.includes('pdf') ? 'pdf' : 'text',
                originalName: file.name,
                isApprovedForAI: true,
                extractedAt: new Date().toISOString(),
                processingMethod: isImage ? 'gemini-vision' : 'readability',
              },
            });
          } catch (err) {
            console.error(`Failed to upload ${file.name}:`, err);
          }
        }
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
        return <StepIdentity name={formData.name} vertical={formData.vertical} positioning={formData.positioning} voiceTone={formData.voiceTone} onUpdate={updateForm} />;
      case 2:
        return <StepAudience who={formData.who} pain={formData.pain} awareness={formData.awareness} objections={formData.objections} onUpdate={updateForm} />;
      case 3:
        return <StepOffer what={formData.what} ticket={formData.ticket} type={formData.type} differentiator={formData.differentiator} onUpdate={updateForm} />;
      case 4:
        return <StepVisualLogo colors={formData.colors} visualStyle={formData.visualStyle} typography={formData.typography} logoFile={formData.logoFile} logoLocked={formData.logoLocked} onUpdate={updateForm} />;
      case 5:
        return <StepDocuments onFileQueued={(file) => updateForm('queuedDocuments', [...formData.queuedDocuments, file])} queuedFiles={formData.queuedDocuments} />;
      case 6:
        return <StepConfirm formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0B09]">
      <Header />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <button
            onClick={() => router.push('/brands')}
            className="inline-flex items-center text-sm text-zinc-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Marcas
          </button>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
          <div className="mb-8 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E6B447] to-[#AB8648] mb-4">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Nova Marca</h1>
            <p className="text-zinc-500">Configure o contexto da sua marca para usar em todas as análises</p>
          </div>

          <WizardProgress currentStep={currentStep} />

          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>

          {/* Navigation */}
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
                  className="bg-[#E6B447] hover:bg-[#AB8648]"
                >
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-[#E6B447] hover:bg-[#AB8648]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
