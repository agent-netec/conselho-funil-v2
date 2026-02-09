'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TargetSegment } from '@/types/ab-testing';
import { getAuthHeaders } from '@/lib/utils/auth-headers';

interface ABTestWizardProps {
  brandId: string;
  onCreated?: () => void;
}

interface VariantDraft {
  name: string;
  headline: string;
  cta?: string;
  body?: string;
}

const SEGMENT_OPTIONS: Array<{ value: TargetSegment; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
];

export function ABTestWizard({ brandId, onCreated }: ABTestWizardProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [targetSegment, setTargetSegment] = useState<TargetSegment>('all');
  const [variants, setVariants] = useState<VariantDraft[]>([
    { name: 'Variant A', headline: '' },
    { name: 'Variant B', headline: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canProceedStep1 = name.trim().length > 0;
  const canProceedStep2 = variants.length >= 2 && variants.length <= 5 && variants.every(v => v.headline.trim().length > 0);

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function addVariant() {
    if (variants.length >= 5) return;
    setVariants((prev) => [...prev, { name: `Variant ${String.fromCharCode(65 + prev.length)}`, headline: '' }]);
  }

  function removeVariant(index: number) {
    if (variants.length <= 2) return;
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    setError(null);
    if (!brandId) {
      setError('Selecione uma marca antes de criar o teste.');
      return;
    }
    if (!canProceedStep2) {
      setError('Preencha headlines e mantenha entre 2 e 5 variantes.');
      return;
    }

    setSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/intelligence/ab-tests', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brandId,
          name,
          targetSegment,
          variants: variants.map((v) => ({
            name: v.name,
            contentVariations: {
              headline: v.headline,
              cta: v.cta,
              body: v.body,
            },
          })),
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? 'Erro ao criar A/B Test');
      }

      setName('');
      setTargetSegment('all');
      setVariants([
        { name: 'Variant A', headline: '' },
        { name: 'Variant B', headline: '' },
      ]);
      setStep(1);
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar A/B Test');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-6 border-zinc-800 bg-zinc-900/40 space-y-6">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
          Wizard
        </Badge>
        <span className="text-xs text-zinc-500">Step {step} of 3</span>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase">Nome do Teste</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Headlines para Oferta X" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase">Target Segment</label>
            <select
              className="w-full h-10 px-3 py-2 text-sm border rounded-md bg-background"
              value={targetSegment}
              onChange={(e) => setTargetSegment(e.target.value as TargetSegment)}
            >
              {SEGMENT_OPTIONS.map((seg) => (
                <option key={seg.value} value={seg.value}>{seg.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {variants.map((variant, index) => (
            <div key={`${variant.name}-${index}`} className="border border-zinc-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Input
                  value={variant.name}
                  onChange={(e) => updateVariant(index, { name: e.target.value })}
                  className="max-w-xs"
                />
                <Button variant="ghost" size="sm" onClick={() => removeVariant(index)} disabled={variants.length <= 2}>
                  Remover
                </Button>
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase">Headline *</label>
                <Input
                  value={variant.headline}
                  onChange={(e) => updateVariant(index, { headline: e.target.value })}
                  placeholder="Ex: Transforme leads frios em clientes"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 uppercase">CTA</label>
                  <Input value={variant.cta || ''} onChange={(e) => updateVariant(index, { cta: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase">Body</label>
                  <Input value={variant.body || ''} onChange={(e) => updateVariant(index, { body: e.target.value })} />
                </div>
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={addVariant} disabled={variants.length >= 5}>
            Adicionar Variante
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="border border-zinc-800 rounded-lg p-4 space-y-2">
            <div className="text-sm font-semibold text-white">{name}</div>
            <div className="text-xs text-zinc-500">Segmento: {targetSegment.toUpperCase()}</div>
          </div>
          <div className="space-y-2">
            {variants.map((variant, index) => (
              <div key={`${variant.name}-${index}`} className="border border-zinc-800 rounded-lg p-3">
                <div className="text-xs text-zinc-500 uppercase">{variant.name}</div>
                <div className="text-sm text-white">{variant.headline}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <div className="text-sm text-red-400">{error}</div>}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1 || submitting}>
          Voltar
        </Button>
        {step < 3 && (
          <Button onClick={() => setStep((s) => Math.min(3, s + 1))} disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}>
            Próximo
          </Button>
        )}
        {step === 3 && (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Criando...' : 'Criar A/B Test'}
          </Button>
        )}
      </div>
    </Card>
  );
}
