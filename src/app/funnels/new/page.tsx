'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Target,
  Users,
  Package,
  Radio,
  Sparkles,
  Loader2,
  Library,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFunnels } from '@/lib/hooks/use-funnels';
import type { FunnelContext, LibraryTemplate } from '@/types/database';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const STEPS = [
  { id: 1, title: 'Objetivo', description: 'O que você quer alcançar?', icon: Target },
  { id: 2, title: 'Público', description: 'Quem é seu cliente ideal?', icon: Users },
  { id: 3, title: 'Oferta', description: 'O que você está vendendo?', icon: Package },
  { id: 4, title: 'Canais', description: 'Como vai atrair tráfego?', icon: Radio },
  { id: 5, title: 'Confirmar', description: 'Revise e crie', icon: Check },
];

const OBJECTIVES = [
  { id: 'leads', label: 'Captar Leads', description: 'Crescer lista, gerar awareness', icon: '📧' },
  { id: 'sales', label: 'Vender Direto', description: 'Converter em compra imediata', icon: '💰' },
  { id: 'calls', label: 'Agendar Calls', description: 'Qualificar e levar para conversa', icon: '📞' },
  { id: 'retention', label: 'Reter/Upsell', description: 'Aumentar LTV de clientes', icon: '🔄' },
];

const AWARENESS_LEVELS = [
  { id: 'unaware', label: 'Não sabe que tem problema', short: 'Inconsciente' },
  { id: 'problem', label: 'Sabe do problema', short: 'Problema' },
  { id: 'solution', label: 'Conhece soluções', short: 'Solução' },
  { id: 'product', label: 'Conhece seu produto', short: 'Produto' },
];

const CHANNELS = [
  { id: 'youtube', label: 'YouTube', icon: '📺' },
  { id: 'meta', label: 'Meta Ads', icon: '📘' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'google', label: 'Google', icon: '🔍' },
  { id: 'email', label: 'Email', icon: '📧' },
  { id: 'organic', label: 'Orgânico', icon: '🌱' },
];

export default function NewFunnelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { create } = useFunnels();
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

  // Load template if templateId is provided
  useEffect(() => {
    const templateId = searchParams.get('templateId');
    if (templateId) {
      loadTemplate(templateId);
    }
  }, [searchParams]);

  const loadTemplate = async (templateId: string) => {
    try {
      const templateDoc = await getDoc(doc(db, 'library', templateId));
      if (templateDoc.exists()) {
        const templateData = { id: templateDoc.id, ...templateDoc.data() } as LibraryTemplate;
        setTemplate(templateData);
        
        // Pre-fill form with template data
        const meta = templateData.metadata;
        setFormData(prev => ({
          ...prev,
          name: searchParams.get('name') || templateData.name + ' (cópia)',
          objective: (meta?.objective as '' | 'leads' | 'sales' | 'calls' | 'retention') || '',
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
      // Map awareness to new format
      const awarenessMap: Record<string, 'fria' | 'morna' | 'quente'> = {
        unaware: 'fria',
        problem: 'fria',
        solution: 'morna',
        product: 'quente',
      };

      const context: FunnelContext = {
        company: formData.name || 'Meu Negócio',
        market: formData.productType || 'Digital',
        maturity: 'em tração',
        objective: formData.objective as 'leads' | 'sales' | 'calls' | 'retention',
        audience: {
          who: formData.audience || '',
          pain: formData.pain || '',
          awareness: awarenessMap[formData.awareness] || 'morna',
          ...(formData.objection ? { objection: formData.objection } : {}),
        },
        offer: {
          what: formData.product || '',
          ticket: formData.ticket || '',
          type: (formData.productType?.toLowerCase() as any) || 'servico',
        },
        channel: {
          main: formData.primaryChannel || '',
          ...(formData.secondaryChannel ? { secondary: formData.secondaryChannel } : {}),
        },
      };

      const funnelName = formData.name || `Funil ${formData.objective} - ${formData.primaryChannel}`;
      
      // 1. Create the funnel first
      const funnelId = await create({ name: funnelName, context });
      
      // 2. Start generating proposals in background
      fetch('/api/funnels/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funnelId, context }),
      }).catch(console.error); // Fire and forget
      
      // 3. Increment template usage count if using template
      if (template) {
        updateDoc(doc(db, 'library', template.id), {
          usageCount: increment(1),
        }).catch(console.error);
      }

      // 4. Redirect to funnel page (will show generating status)
      router.push(`/funnels/${funnelId}`);
    } catch (error) {
      console.error('Error creating funnel:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepContent = {
    1: (
      <motion.div
        key="step1"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <div>
          <h3 className="text-lg font-medium text-white mb-2">
            Qual é o objetivo deste funil?
          </h3>
          <p className="text-sm text-zinc-500">
            Isso define a estrutura e métricas do seu funil
          </p>
        </div>
        
        <div className="grid gap-3 sm:grid-cols-2">
          {OBJECTIVES.map((obj) => (
            <motion.button
              key={obj.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => updateForm('objective', obj.id)}
              className={cn(
                'relative rounded-xl border p-5 text-left transition-all',
                formData.objective === obj.id
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]'
              )}
            >
              {formData.objective === obj.id && (
                <div className="absolute top-3 right-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}
              <span className="text-2xl mb-3 block">{obj.icon}</span>
              <div className="font-medium text-white">{obj.label}</div>
              <div className="text-sm text-zinc-500 mt-1">{obj.description}</div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    ),
    2: (
      <motion.div
        key="step2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <div>
          <h3 className="text-lg font-medium text-white mb-2">
            Descreva seu público-alvo
          </h3>
          <p className="text-sm text-zinc-500">
            Quanto mais específico, melhores as recomendações
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Cliente ideal *
            </label>
            <Textarea
              value={formData.audience}
              onChange={(e) => updateForm('audience', e.target.value)}
              placeholder="Ex: Empresários de e-commerce faturando R$50-500k/mês que querem escalar"
              className="input-premium min-h-[100px]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Principal dor *
            </label>
            <Textarea
              value={formData.pain}
              onChange={(e) => updateForm('pain', e.target.value)}
              placeholder="Ex: Gastam muito tempo em tarefas operacionais e não conseguem escalar"
              className="input-premium min-h-[80px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              Nível de consciência
            </label>
            <div className="grid grid-cols-4 gap-2">
              {AWARENESS_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => updateForm('awareness', level.id)}
                  className={cn(
                    'rounded-lg border px-3 py-2.5 text-center text-sm transition-all',
                    formData.awareness === level.id
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                      : 'border-white/[0.06] text-zinc-400 hover:border-white/[0.1] hover:text-zinc-300'
                  )}
                >
                  {level.short}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Principal objeção
            </label>
            <Input
              value={formData.objection}
              onChange={(e) => updateForm('objection', e.target.value)}
              placeholder="Ex: Não tenho tempo para implementar"
              className="input-premium"
            />
          </div>
        </div>
      </motion.div>
    ),
    3: (
      <motion.div
        key="step3"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <div>
          <h3 className="text-lg font-medium text-white mb-2">
            Descreva sua oferta
          </h3>
          <p className="text-sm text-zinc-500">
            O que você está vendendo e qual o diferencial
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Produto/Serviço *
            </label>
            <Input
              value={formData.product}
              onChange={(e) => updateForm('product', e.target.value)}
              placeholder="Ex: Sistema de automação de marketing"
              className="input-premium"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Ticket *
              </label>
              <Input
                value={formData.ticket}
                onChange={(e) => updateForm('ticket', e.target.value)}
                placeholder="R$ 497"
                className="input-premium"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Tipo
              </label>
              <Input
                value={formData.productType}
                onChange={(e) => updateForm('productType', e.target.value)}
                placeholder="SaaS, Curso, Mentoria..."
                className="input-premium"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Diferencial
            </label>
            <Textarea
              value={formData.differential}
              onChange={(e) => updateForm('differential', e.target.value)}
              placeholder="Ex: Integração com 50+ plataformas, setup em 15min"
              className="input-premium min-h-[80px]"
            />
          </div>
        </div>
      </motion.div>
    ),
    4: (
      <motion.div
        key="step4"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <div>
          <h3 className="text-lg font-medium text-white mb-2">
            Canais de aquisição
          </h3>
          <p className="text-sm text-zinc-500">
            De onde vem seu tráfego principal?
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-3">
            Canal principal *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {CHANNELS.map((channel) => (
              <motion.button
                key={channel.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => updateForm('primaryChannel', channel.id)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border p-4 transition-all',
                  formData.primaryChannel === channel.id
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.02]'
                )}
              >
                <span className="text-2xl">{channel.icon}</span>
                <span className={cn(
                  'text-sm',
                  formData.primaryChannel === channel.id ? 'text-white' : 'text-zinc-400'
                )}>
                  {channel.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-3">
            Canal secundário (opcional)
          </label>
          <div className="grid grid-cols-3 gap-3">
            {CHANNELS.filter((c) => c.id !== formData.primaryChannel).map((channel) => (
              <motion.button
                key={channel.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  updateForm(
                    'secondaryChannel',
                    formData.secondaryChannel === channel.id ? '' : channel.id
                  )
                }
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border p-4 transition-all',
                  formData.secondaryChannel === channel.id
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.02]'
                )}
              >
                <span className="text-2xl">{channel.icon}</span>
                <span className={cn(
                  'text-sm',
                  formData.secondaryChannel === channel.id ? 'text-white' : 'text-zinc-400'
                )}>
                  {channel.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    ),
    5: (
      <motion.div
        key="step5"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <div>
          <h3 className="text-lg font-medium text-white mb-2">
            Revise e confirme
          </h3>
          <p className="text-sm text-zinc-500">
            Verifique os dados antes de criar seu funil
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Nome do funil
          </label>
          <Input
            value={formData.name}
            onChange={(e) => updateForm('name', e.target.value)}
            placeholder={`Funil ${formData.objective} - ${formData.primaryChannel}`}
            className="input-premium"
          />
        </div>

        <div className="rounded-xl border border-white/[0.06] divide-y divide-white/[0.06]">
          {[
            { label: 'Objetivo', value: OBJECTIVES.find((o) => o.id === formData.objective)?.label },
            { label: 'Público', value: formData.audience },
            { label: 'Produto', value: formData.product },
            { label: 'Ticket', value: formData.ticket },
            { label: 'Canais', value: `${formData.primaryChannel}${formData.secondaryChannel ? ` + ${formData.secondaryChannel}` : ''}` },
          ].map((item) => (
            <div key={item.label} className="flex justify-between p-4">
              <span className="text-zinc-500">{item.label}</span>
              <span className="text-white font-medium max-w-[60%] text-right truncate">
                {item.value}
              </span>
            </div>
          ))}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full btn-accent h-12"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Criando...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Criar Funil
            </>
          )}
        </Button>
      </motion.div>
    ),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header 
        title={template ? 'Criar a partir de Template' : 'Novo Funil'} 
        subtitle={template ? template.name : undefined}
        showBack 
      />

      {/* Template Banner */}
      {template && (
        <div className="border-b border-emerald-500/20 bg-emerald-500/5 px-8 py-3">
          <div className="mx-auto max-w-2xl flex items-center gap-3">
            <Library className="h-5 w-5 text-emerald-400" />
            <span className="text-sm text-emerald-300">
              Usando template: <span className="font-medium">{template.name}</span>
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 p-8">
        <div className="mx-auto max-w-2xl">
          {/* Progress */}
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

          {/* Step Content */}
          <div className="card-premium p-6">
            <AnimatePresence mode="wait">
              {stepContent[currentStep as keyof typeof stepContent]}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="mt-6 flex justify-between">
            <Button
              onClick={() =>
                currentStep === 1
                  ? router.push('/funnels')
                  : setCurrentStep((s) => s - 1)
              }
              variant="ghost"
              className="btn-ghost"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {currentStep === 1 ? 'Cancelar' : 'Voltar'}
            </Button>

            {currentStep < 5 && (
              <Button
                onClick={() => setCurrentStep((s) => s + 1)}
                disabled={!canProceed()}
                className="btn-accent"
              >
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
