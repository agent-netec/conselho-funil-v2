'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useBrands } from '@/lib/hooks/use-brands';
import { useBrandAssets } from '@/lib/hooks/use-brand-assets';
import { useBrandAutoSave } from '@/lib/hooks/use-brand-auto-save';
import { updateBrandKit } from '@/lib/firebase/brands';
import { uploadLogo } from '@/lib/firebase/storage';
import { useUser } from '@/lib/hooks/use-user';
import { useAuthStore } from '@/lib/stores/auth-store';
import { calculateBrandCompleteness } from '@/lib/utils/brand-completeness';
import { AssetUploader } from '@/components/brands/asset-uploader';
import { BrandCharactersSection } from '@/components/brands/brand-characters-section';
import { VoiceProfileEditor } from '@/components/brands/voice-profile-editor';
import { toast } from 'sonner';
import Image from 'next/image';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import {
  ArrowLeft, ChevronDown, CheckCircle2, Circle,
  Building, Users, ShoppingBag, Palette, Type, ImageIcon,
  Mic, UserCircle, BrainCircuit, FileText,
  Loader2, Upload, Lock, Unlock, Plus, X, Check,
  Sparkles, Zap, ShieldCheck, Activity,
  Save, CloudOff, Wand2,
} from 'lucide-react';
import type { Brand, BrandKit } from '@/types/database';

// ─── Vertical Autocomplete (reuse from wizard) ─────────────────────
import { VERTICAL_GROUPS } from '@/components/brands/wizard/step-identity';
// ─── Awareness Questions (reuse from wizard) ────────────────────────
import { StepAudience } from '@/components/brands/wizard/step-audience';

// ─── Offer Types (reuse from wizard) ────────────────────────────────
const OFFER_TYPES = [
  { id: 'course', label: 'Curso Online', emoji: '📚' },
  { id: 'mentorship', label: 'Mentoria', emoji: '🎯' },
  { id: 'consultancy', label: 'Consultoria', emoji: '💼' },
  { id: 'saas', label: 'SaaS/App', emoji: '💻' },
  { id: 'ebook', label: 'E-book/Digital', emoji: '📱' },
  { id: 'service', label: 'Serviço', emoji: '🛠️' },
  { id: 'physical', label: 'Produto Físico', emoji: '📦' },
  { id: 'community', label: 'Comunidade', emoji: '👥' },
  { id: 'event', label: 'Evento/Workshop', emoji: '🎤' },
  { id: 'subscription', label: 'Assinatura', emoji: '🔄' },
  { id: 'franchise', label: 'Franquia', emoji: '🏢' },
  { id: 'other', label: 'Outro', emoji: '✏️' },
];

// ─── AI Presets ──────────────────────────────────────────────────────
const AI_PRESETS = {
  agressivo: { temperature: 0.9, topP: 0.95, profile: 'agressivo' as const },
  sobrio: { temperature: 0.3, topP: 0.7, profile: 'sobrio' as const },
  criativo: { temperature: 0.8, topP: 0.9, profile: 'criativo' as const },
  equilibrado: { temperature: 0.6, topP: 0.85, profile: 'equilibrado' as const },
};

// ─── Font catalog ───────────────────────────────────────────────────
const FONT_CATALOG = [
  'Inter', 'Poppins', 'Montserrat', 'Roboto', 'Open Sans', 'Lato',
  'Raleway', 'Playfair Display', 'Cormorant Garamond', 'Bebas Neue',
  'Oswald', 'DM Sans', 'Space Grotesk', 'Sora', 'Plus Jakarta Sans',
];

// ─── Section Header Component ───────────────────────────────────────
function SectionHeader({
  icon: Icon,
  title,
  isComplete,
  isOpen,
}: {
  icon: React.ElementType;
  title: string;
  isComplete: boolean;
  isOpen: boolean;
}) {
  return (
    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-xl hover:bg-white/[0.02] transition-colors group">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] group-hover:border-white/[0.1] transition-colors">
          <Icon className="h-4 w-4 text-[#E6B447]" />
        </div>
        <span className="text-sm font-semibold text-white">{title}</span>
        {isComplete ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : (
          <Circle className="h-4 w-4 text-zinc-600" />
        )}
      </div>
      <ChevronDown className={cn(
        'h-4 w-4 text-zinc-500 transition-transform duration-200',
        isOpen && 'rotate-180'
      )} />
    </CollapsibleTrigger>
  );
}

// ─── Save Status Indicator ──────────────────────────────────────────
function SaveIndicator({ status }: { status: string }) {
  if (status === 'idle') return null;
  return (
    <div className="flex items-center gap-2 text-xs">
      {status === 'saving' && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />
          <span className="text-zinc-400">Salvando...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="h-3 w-3 text-emerald-500" />
          <span className="text-emerald-500">Salvo</span>
        </>
      )}
      {status === 'error' && (
        <>
          <CloudOff className="h-3 w-3 text-red-400" />
          <span className="text-red-400">Erro ao salvar</span>
        </>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────
export default function EditBrandPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.id as string;
  const { user } = useUser();

  const { brands, isLoading, refresh } = useBrands();
  const { assets, isLoading: assetsLoading, refresh: refreshAssets } = useBrandAssets(brandId);
  const { queueSave, saveNow, status: saveStatus } = useBrandAutoSave(brandId);

  const [brand, setBrand] = useState<Brand | null>(null);
  const [kit, setKit] = useState<BrandKit | null>(null);
  const [aiConfig, setAiConfig] = useState<{ temperature: number; topP: number; profile: string }>({ temperature: 0.6, topP: 0.85, profile: 'equilibrado' });
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Track which sections are open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    identity: true,
    audience: true,
    offer: true,
    visual: false,
    typography: false,
    logo: false,
    voice: false,
    characters: false,
    ai: false,
    documents: false,
  });

  // Load brand data
  useEffect(() => {
    const found = brands.find(b => b.id === brandId);
    if (found) {
      setBrand(found);
      setKit(found.brandKit || {
        colors: { primary: '#E6B447', secondary: '#3b82f6', accent: '#f59e0b', background: '#09090b' },
        typography: { primaryFont: 'Inter', secondaryFont: 'Inter', systemFallback: 'sans-serif' as const },
        visualStyle: 'modern' as const,
        logoLock: { variants: { primary: { url: '', storagePath: '', format: 'png' as const } }, locked: false },
        characters: [],
        updatedAt: Timestamp.now(),
      });
      setAiConfig((found as any).aiConfiguration || { temperature: 0.6, topP: 0.85, profile: 'equilibrado' as string });
    } else if (!isLoading) {
      router.push('/brands');
    }
  }, [brands, brandId, isLoading, router]);

  // Hash-based scroll to section
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash && openSections[hash] !== undefined) {
        setOpenSections(prev => ({ ...prev, [hash]: true }));
        setTimeout(() => {
          document.getElementById(`section-${hash}`)?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    }
  }, [brand]); // Run after brand loads

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── Update helpers (auto-save) ─────────────────────────────────
  const updateField = useCallback((field: string, value: any) => {
    setBrand(prev => prev ? { ...prev, [field]: value } : prev);
    queueSave(field, value);
  }, [queueSave]);

  const updateAudience = useCallback((subfield: string, value: any) => {
    setBrand(prev => {
      if (!prev) return prev;
      const updated = { ...prev, audience: { ...prev.audience, [subfield]: value } };
      queueSave('audience', updated.audience);
      return updated;
    });
  }, [queueSave]);

  const updateOffer = useCallback((subfield: string, value: any) => {
    setBrand(prev => {
      if (!prev) return prev;
      const updated = { ...prev, offer: { ...prev.offer, [subfield]: value } };
      queueSave('offer', updated.offer);
      return updated;
    });
  }, [queueSave]);

  const updateKit = useCallback(async (updatedKit: BrandKit) => {
    setKit(updatedKit);
    try {
      const sanitized = {
        ...updatedKit,
        logoLock: {
          ...updatedKit.logoLock,
          variants: Object.fromEntries(
            Object.entries(updatedKit.logoLock.variants).filter(([_, v]) => v !== undefined && v !== null)
          ),
        },
        characters: updatedKit.characters || [],
        updatedAt: Timestamp.now(),
      };
      await updateBrandKit(brandId, sanitized as typeof updatedKit);
    } catch (err) {
      console.error('[updateKit] Error:', err);
      toast.error('Erro ao salvar configurações visuais');
    }
  }, [brandId]);

  const updateAiConfig = useCallback((newConfig: typeof aiConfig) => {
    setAiConfig(newConfig);
    queueSave('aiConfiguration', newConfig);
  }, [queueSave]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !kit) return;

    setUploadingLogo(true);
    try {
      const url = await uploadLogo(file, brandId, user.id);
      const updatedKit: BrandKit = {
        ...kit,
        logoLock: {
          ...kit.logoLock,
          variants: {
            ...kit.logoLock.variants,
            primary: {
              url,
              storagePath: `brands/${brandId}/logos/${file.name}`,
              format: file.type.split('/')[1] as any || 'png',
            },
          },
          locked: true,
        },
        updatedAt: Timestamp.now(),
      };
      await updateKit(updatedKit);
      toast.success('Logo enviada e salva!');
    } catch (err) {
      console.error('[LogoUpload] Error:', err);
      toast.error('Erro ao enviar logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Completeness calculation
  const completeness = brand ? calculateBrandCompleteness(brand, assets.length) : null;

  // Loading state
  if (!brand || !kit) {
    return (
      <div className="min-h-screen bg-[#0D0B09] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-[#E6B447] animate-spin mx-auto mb-4" />
          <p className="text-zinc-500">Carregando marca...</p>
        </div>
      </div>
    );
  }

  // ─── Completeness checks per section ────────────────────────────
  const sectionComplete = {
    identity: !!brand.name && !!brand.vertical,
    audience: !!brand.audience?.who && !!brand.audience?.awareness,
    offer: !!brand.offer?.what && brand.offer?.ticket != null,
    visual: !!kit.colors?.primary,
    typography: !!kit.typography?.primaryFont,
    logo: !!kit.logoLock?.variants?.primary?.url,
    voice: !!brand.voiceProfile?.primaryTone || !!brand.voiceTone,
    characters: (kit.characters?.length || 0) > 0,
    ai: !!(brand as any).aiConfiguration?.profile,
    documents: assets.length > 0,
  };

  // ─── Offer type helpers ─────────────────────────────────────────
  const knownOfferIds = OFFER_TYPES.map(t => t.id);
  const offerType = brand.offer?.type || '';
  const isCustomOfferType = offerType && !knownOfferIds.includes(offerType) && offerType !== 'other';

  return (
    <div className="min-h-screen bg-[#0D0B09]">
      <Header showBrandSelector={false} />

      <main className="mx-auto max-w-3xl px-6 py-8">
        {/* Top Bar */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/brands')}
            className="inline-flex items-center text-sm text-zinc-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Marcas
          </button>
          <SaveIndicator status={saveStatus} />
        </div>

        {/* Brand Header */}
        <div className="mb-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">{brand.name}</h1>
              <p className="text-sm text-zinc-500 mt-1">{brand.vertical}</p>
            </div>
            {completeness && (
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#E6B447] to-emerald-500 transition-all duration-500"
                      style={{ width: `${completeness.score}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-zinc-400">{completeness.score}%</span>
                </div>
                <p className="text-[10px] text-zinc-600 mt-1">
                  {completeness.missingFields.length} campo{completeness.missingFields.length !== 1 ? 's' : ''} pendente{completeness.missingFields.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECTIONS
           ═══════════════════════════════════════════════════════════ */}
        <div className="space-y-3">

          {/* ── 1. IDENTIDADE ──────────────────────────────────────── */}
          <div id="section-identity" className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <Collapsible open={openSections.identity} onOpenChange={() => toggleSection('identity')}>
              <SectionHeader icon={Building} title="Identidade" isComplete={sectionComplete.identity} isOpen={openSections.identity} />
              <CollapsibleContent className="px-4 pb-4 space-y-4">
                <div>
                  <Label className="text-xs text-zinc-400 mb-1.5 block">Nome da marca *</Label>
                  <Input
                    value={brand.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Nome da marca"
                    className="bg-white/[0.02] border-white/[0.06] text-white"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-400 mb-1.5 block">Vertical / Segmento *</Label>
                  <Input
                    value={brand.vertical}
                    onChange={(e) => updateField('vertical', e.target.value)}
                    placeholder="Ex: Marketing Digital, E-commerce, SaaS..."
                    className="bg-white/[0.02] border-white/[0.06] text-white"
                    list="vertical-options"
                  />
                  <datalist id="vertical-options">
                    {VERTICAL_GROUPS.flatMap(g => g.items).map(v => (
                      <option key={v} value={v} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <Label className="text-xs text-zinc-400 mb-1.5 block">Posicionamento</Label>
                  <Textarea
                    value={brand.positioning}
                    onChange={(e) => updateField('positioning', e.target.value)}
                    placeholder="Como sua marca se posiciona no mercado?"
                    rows={3}
                    className="bg-white/[0.02] border-white/[0.06] text-white resize-none"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-400 mb-1.5 block">Tom de voz (resumo)</Label>
                  <Input
                    value={brand.voiceTone}
                    onChange={(e) => updateField('voiceTone', e.target.value)}
                    placeholder="Ex: Direto e inspirador, com autoridade..."
                    className="bg-white/[0.02] border-white/[0.06] text-white"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* ── 2. AUDIÊNCIA ───────────────────────────────────────── */}
          <div id="section-audience" className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <Collapsible open={openSections.audience} onOpenChange={() => toggleSection('audience')}>
              <SectionHeader icon={Users} title="Audiência" isComplete={sectionComplete.audience} isOpen={openSections.audience} />
              <CollapsibleContent className="px-4 pb-4 space-y-4">
                <div>
                  <Label className="text-xs text-zinc-400 mb-1.5 block">Quem é seu cliente ideal? *</Label>
                  <Textarea
                    value={brand.audience?.who || ''}
                    onChange={(e) => updateAudience('who', e.target.value)}
                    placeholder="Ex: Donos de agências de marketing digital com equipe entre 5-20 pessoas"
                    rows={3}
                    className="bg-white/[0.02] border-white/[0.06] text-white resize-none"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-400 mb-1.5 block">Maior dor do público *</Label>
                  <Textarea
                    value={brand.audience?.pain || ''}
                    onChange={(e) => updateAudience('pain', e.target.value)}
                    placeholder="Ex: Dificuldade em escalar operações sem perder qualidade"
                    rows={3}
                    className="bg-white/[0.02] border-white/[0.06] text-white resize-none"
                  />
                </div>

                {/* Awareness — inline 3-question widget */}
                <AwarenessWidget
                  awareness={brand.audience?.awareness || ''}
                  onUpdate={(value) => updateAudience('awareness', value)}
                />

                {/* Objections with AI suggestions */}
                <ObjectionsSection
                  brandId={brandId}
                  objections={brand.audience?.objections || []}
                  vertical={brand.vertical}
                  offer={brand.offer?.what}
                  audience={brand.audience?.who}
                  onUpdate={(objections) => updateAudience('objections', objections)}
                />
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* ── 3. OFERTA ──────────────────────────────────────────── */}
          <div id="section-offer" className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <Collapsible open={openSections.offer} onOpenChange={() => toggleSection('offer')}>
              <SectionHeader icon={ShoppingBag} title="Oferta" isComplete={sectionComplete.offer} isOpen={openSections.offer} />
              <CollapsibleContent className="px-4 pb-4 space-y-4">
                <div>
                  <Label className="text-xs text-zinc-400 mb-1.5 block">O que você vende? *</Label>
                  <Textarea
                    value={brand.offer?.what || ''}
                    onChange={(e) => updateOffer('what', e.target.value)}
                    placeholder="Ex: Plataforma de automação de marketing com IA para agências"
                    rows={3}
                    className="bg-white/[0.02] border-white/[0.06] text-white resize-none"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-400 mb-1.5 block">Ticket Médio *</Label>
                  <CurrencyInput
                    value={brand.offer?.ticket}
                    onChange={(val) => updateOffer('ticket', val)}
                    placeholder="997,00"
                    className="bg-white/[0.02] border-white/[0.06] text-white"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-400 mb-1.5 block">Tipo de Oferta *</Label>
                  <div className="flex flex-wrap gap-2">
                    {OFFER_TYPES.map((ot) => {
                      const isSelected = ot.id === 'other'
                        ? isCustomOfferType
                        : offerType === ot.id;
                      return (
                        <button
                          key={ot.id}
                          type="button"
                          onClick={() => {
                            if (ot.id === 'other') {
                              updateOffer('type', '');
                            } else {
                              updateOffer('type', ot.id);
                            }
                          }}
                          className={cn(
                            'rounded-lg border px-3 py-2 text-sm transition-all flex items-center gap-1.5',
                            isSelected
                              ? 'border-[#E6B447]/50 bg-[#E6B447]/5 text-[#E6B447]'
                              : 'border-white/[0.06] bg-white/[0.02] text-zinc-300 hover:border-white/[0.1]'
                          )}
                        >
                          <span>{ot.emoji}</span>
                          <span>{ot.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {isCustomOfferType && (
                    <Input
                      value={offerType}
                      onChange={(e) => updateOffer('type', e.target.value)}
                      placeholder="Descreva o tipo da sua oferta..."
                      className="mt-2 bg-white/[0.02] border-white/[0.06] text-white"
                    />
                  )}
                </div>
                <div>
                  <Label className="text-xs text-zinc-400 mb-1.5 block">Diferencial Competitivo</Label>
                  <Textarea
                    value={brand.offer?.differentiator || ''}
                    onChange={(e) => updateOffer('differentiator', e.target.value)}
                    placeholder="O que torna sua oferta única no mercado?"
                    rows={3}
                    className="bg-white/[0.02] border-white/[0.06] text-white resize-none"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* ── 4. VISUAL (Cores + Estilo) ─────────────────────────── */}
          <div id="section-visual" className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <Collapsible open={openSections.visual} onOpenChange={() => toggleSection('visual')}>
              <SectionHeader icon={Palette} title="Visual" isComplete={sectionComplete.visual} isOpen={openSections.visual} />
              <CollapsibleContent className="px-4 pb-4 space-y-4">
                <Label className="text-xs font-bold uppercase text-zinc-400 block">Paleta de Cores</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {([
                    { key: 'primary' as const, label: 'Primária' },
                    { key: 'secondary' as const, label: 'Secundária' },
                    { key: 'accent' as const, label: 'Destaque' },
                    { key: 'background' as const, label: 'Fundo' },
                  ]).map(({ key, label }) => (
                    <div key={key} className="space-y-2">
                      <Label className="text-xs text-zinc-500">{label}</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={kit.colors[key]}
                          onChange={(e) => {
                            const updated = { ...kit, colors: { ...kit.colors, [key]: e.target.value } };
                            updateKit(updated);
                          }}
                          className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                        />
                        <Input
                          value={kit.colors[key]}
                          onChange={(e) => {
                            const updated = { ...kit, colors: { ...kit.colors, [key]: e.target.value } };
                            updateKit(updated);
                          }}
                          className="font-mono text-xs bg-white/[0.02] border-white/[0.06] text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {/* Color preview */}
                <div className="flex gap-2">
                  {[kit.colors.primary, kit.colors.secondary, kit.colors.accent, kit.colors.background].map((color, i) => (
                    <div key={i} className="h-8 flex-1 rounded-md border border-white/10" style={{ backgroundColor: color }} title={color} />
                  ))}
                </div>

                {/* Palette suggestions by niche */}
                <PaletteSuggestions
                  vertical={brand.vertical}
                  onApply={(primary, secondary, accent, background) => {
                    updateKit({ ...kit, colors: { primary, secondary, accent, background } });
                  }}
                />

                {/* Visual Style */}
                <div className="pt-4 border-t border-white/[0.05]">
                  <Label className="text-xs font-bold uppercase text-zinc-400 mb-3 block">Estilo Visual</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {([
                      { id: 'minimalist' as const, label: 'Minimalista', desc: 'Clean, espaço em branco' },
                      { id: 'aggressive' as const, label: 'Agressivo', desc: 'Bold, alto contraste' },
                      { id: 'luxury' as const, label: 'Luxo', desc: 'Elegante, sofisticado' },
                      { id: 'corporate' as const, label: 'Corporativo', desc: 'Profissional, sério' },
                      { id: 'modern' as const, label: 'Moderno', desc: 'Contemporâneo, tech' },
                    ]).map(({ id, label, desc }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => updateKit({ ...kit, visualStyle: id })}
                        className={cn(
                          'p-3 rounded-lg border text-left transition-all',
                          kit.visualStyle === id
                            ? 'border-[#E6B447]/50 bg-[#E6B447]/5 text-[#E6B447]'
                            : 'border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05]'
                        )}
                      >
                        <span className="text-xs font-bold block">{label}</span>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">{desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* ── 5. TIPOGRAFIA ──────────────────────────────────────── */}
          <div id="section-typography" className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <Collapsible open={openSections.typography} onOpenChange={() => toggleSection('typography')}>
              <SectionHeader icon={Type} title="Tipografia" isComplete={sectionComplete.typography} isOpen={openSections.typography} />
              <CollapsibleContent className="px-4 pb-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-500">Fonte Principal (Headlines)</Label>
                    <select
                      value={kit.typography.primaryFont}
                      onChange={(e) => updateKit({ ...kit, typography: { ...kit.typography, primaryFont: e.target.value } })}
                      className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-white text-sm focus:border-[#E6B447] focus:outline-none"
                    >
                      {FONT_CATALOG.map(f => (
                        <option key={f} value={f} className="bg-zinc-900">{f}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-500">Fonte Secundária (Body)</Label>
                    <select
                      value={kit.typography.secondaryFont}
                      onChange={(e) => updateKit({ ...kit, typography: { ...kit.typography, secondaryFont: e.target.value } })}
                      className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-white text-sm focus:border-[#E6B447] focus:outline-none"
                    >
                      {FONT_CATALOG.map(f => (
                        <option key={f} value={f} className="bg-zinc-900">{f}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-500">Fallback do Sistema</Label>
                    <select
                      value={kit.typography.systemFallback}
                      onChange={(e) => updateKit({ ...kit, typography: { ...kit.typography, systemFallback: e.target.value as 'serif' | 'sans-serif' | 'mono' } })}
                      className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-white text-sm focus:border-[#E6B447] focus:outline-none"
                    >
                      <option value="sans-serif" className="bg-zinc-900">Sans-serif</option>
                      <option value="serif" className="bg-zinc-900">Serif</option>
                      <option value="mono" className="bg-zinc-900">Monospace</option>
                    </select>
                  </div>
                </div>
                {/* Typography Preview */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <p className="text-lg text-white font-bold" style={{ fontFamily: `${kit.typography.primaryFont}, ${kit.typography.systemFallback}` }}>
                    Headline com {kit.typography.primaryFont}
                  </p>
                  <p className="text-sm text-zinc-400 mt-1" style={{ fontFamily: `${kit.typography.secondaryFont}, ${kit.typography.systemFallback}` }}>
                    Texto do corpo com {kit.typography.secondaryFont}. Assim ficará o conteúdo da sua marca.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* ── 6. LOGO ────────────────────────────────────────────── */}
          <div id="section-logo" className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <Collapsible open={openSections.logo} onOpenChange={() => toggleSection('logo')}>
              <SectionHeader icon={ImageIcon} title="Logo" isComplete={sectionComplete.logo} isOpen={openSections.logo} />
              <CollapsibleContent className="px-4 pb-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2 text-sm text-white">
                      Logo Lock
                      {kit.logoLock.locked ? (
                        <Lock className="w-4 h-4 text-[#E6B447]" />
                      ) : (
                        <Unlock className="w-4 h-4 text-zinc-500" />
                      )}
                    </Label>
                    <p className="text-xs text-zinc-500">
                      Quando ativo, a IA é proibida de criar variações da logo.
                    </p>
                  </div>
                  <Button
                    variant={kit.logoLock.locked ? 'default' : 'outline'}
                    size="sm"
                    className={kit.logoLock.locked ? 'bg-[#AB8648] hover:bg-[#895F29]' : ''}
                    onClick={() => updateKit({ ...kit, logoLock: { ...kit.logoLock, locked: !kit.logoLock.locked } })}
                  >
                    {kit.logoLock.locked ? 'Ativado' : 'Desativado'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-500">Logo Principal (SVG recomendado)</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="URL da imagem..."
                        value={kit.logoLock.variants.primary?.url || ''}
                        onChange={(e) => updateKit({
                          ...kit,
                          logoLock: {
                            ...kit.logoLock,
                            variants: {
                              ...kit.logoLock.variants,
                              primary: { ...kit.logoLock.variants.primary, url: e.target.value },
                            },
                          },
                        })}
                        className="bg-white/[0.02] border-white/[0.06] text-white"
                      />
                      <div className="relative">
                        <Input
                          type="file"
                          accept="image/*,.svg"
                          className="hidden"
                          id="logo-upload"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                        />
                        <Button variant="outline" asChild disabled={uploadingLogo}>
                          <label htmlFor="logo-upload" className="cursor-pointer">
                            {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          </label>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-4 border border-dashed rounded-xl bg-white/5">
                    {kit.logoLock.variants.primary?.url ? (
                      <>
                        <Image
                          src={kit.logoLock.variants.primary.url}
                          alt="Preview Logo"
                          width={200}
                          height={96}
                          className="max-h-24 object-contain mb-2"
                          unoptimized
                        />
                        <span className="text-xs text-[#E6B447] flex items-center gap-1">
                          <Check className="w-3 h-3" /> Logo Oficial Ativa
                        </span>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <Palette className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                        <p className="text-xs text-zinc-500">Nenhuma logo enviada</p>
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* ── 7. VOZ ─────────────────────────────────────────────── */}
          <div id="section-voice" className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <Collapsible open={openSections.voice} onOpenChange={() => toggleSection('voice')}>
              <SectionHeader icon={Mic} title="Voz" isComplete={sectionComplete.voice} isOpen={openSections.voice} />
              <CollapsibleContent className="px-4 pb-4">
                <VoiceProfileEditor
                  brandId={brandId}
                  currentProfile={brand.voiceProfile}
                  onSaved={() => refresh()}
                />
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* ── 8. PERSONAGENS ─────────────────────────────────────── */}
          <div id="section-characters" className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <Collapsible open={openSections.characters} onOpenChange={() => toggleSection('characters')}>
              <SectionHeader icon={UserCircle} title="Personagens" isComplete={sectionComplete.characters} isOpen={openSections.characters} />
              <CollapsibleContent className="px-4 pb-4">
                <BrandCharactersSection
                  brandId={brandId}
                  characters={kit.characters || []}
                  onUpdate={(characters) => {
                    updateKit({ ...kit, characters });
                  }}
                />
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* ── 9. IA ──────────────────────────────────────────────── */}
          <div id="section-ai" className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <Collapsible open={openSections.ai} onOpenChange={() => toggleSection('ai')}>
              <SectionHeader icon={BrainCircuit} title="Configuração de IA" isComplete={sectionComplete.ai} isOpen={openSections.ai} />
              <CollapsibleContent className="px-4 pb-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    {/* Personality Presets */}
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase text-zinc-400">Personalidade da Marca</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(AI_PRESETS) as Array<keyof typeof AI_PRESETS>).map((p) => (
                          <Button
                            key={p}
                            variant="outline"
                            size="sm"
                            className={cn(
                              'justify-start gap-2 border-white/[0.05] hover:bg-white/[0.05]',
                              aiConfig.profile === p && 'border-[#E6B447]/50 bg-[#E6B447]/5 text-[#E6B447]'
                            )}
                            onClick={() => updateAiConfig(AI_PRESETS[p])}
                          >
                            {p === 'agressivo' && <Zap className="w-3 h-3" />}
                            {p === 'sobrio' && <ShieldCheck className="w-3 h-3" />}
                            {p === 'criativo' && <Sparkles className="w-3 h-3" />}
                            {p === 'equilibrado' && <Activity className="w-3 h-3" />}
                            <span className="capitalize">{p}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Temperature */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-xs font-bold uppercase text-zinc-400">Temperatura</Label>
                        <span className="text-xs font-mono text-[#E6B447]">{aiConfig.temperature}</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={aiConfig.temperature}
                        onChange={(e) => updateAiConfig({ ...aiConfig, temperature: parseFloat(e.target.value), profile: 'equilibrado' })}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#E6B447]"
                      />
                      <div className="flex justify-between text-[10px] text-zinc-600 font-bold uppercase">
                        <span>Preciso (0.1)</span>
                        <span>Criativo (1.0)</span>
                      </div>
                    </div>

                    {/* Top-P */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-xs font-bold uppercase text-zinc-400">Top-P</Label>
                        <span className="text-xs font-mono text-blue-400">{aiConfig.topP}</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={aiConfig.topP}
                        onChange={(e) => updateAiConfig({ ...aiConfig, topP: parseFloat(e.target.value), profile: 'equilibrado' })}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>
                  </div>

                  {/* Impact Panel */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-[#E6B447]/5 to-blue-500/5 border border-white/[0.05] flex flex-col justify-center">
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Activity className="w-3 h-3 text-[#E6B447]" />
                      Impacto na Geração
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {aiConfig.temperature > 0.7
                        ? 'A IA terá mais liberdade criativa, ideal para headlines disruptivas e ângulos agressivos.'
                        : aiConfig.temperature < 0.4
                        ? 'A IA será mais conservadora e factual, seguindo estritamente as diretrizes.'
                        : 'Equilíbrio entre criatividade e precisão, recomendado para a maioria dos casos.'}
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* ── 10. DOCUMENTOS ─────────────────────────────────────── */}
          <div id="section-documents" className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <Collapsible open={openSections.documents} onOpenChange={() => toggleSection('documents')}>
              <SectionHeader icon={FileText} title="Documentos / Assets" isComplete={sectionComplete.documents} isOpen={openSections.documents} />
              <CollapsibleContent className="px-4 pb-4 space-y-4">
                {/* Existing assets count */}
                {assets.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{assets.length} documento{assets.length !== 1 ? 's' : ''} cadastrado{assets.length !== 1 ? 's' : ''}</span>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-[#E6B447] p-0 h-auto"
                      onClick={() => router.push(`/brands/${brandId}/assets`)}
                    >
                      Gerenciar
                    </Button>
                  </div>
                )}
                <AssetUploader
                  brandId={brandId}
                  onUploadComplete={() => refreshAssets()}
                />
              </CollapsibleContent>
            </Collapsible>
          </div>

        </div>
      </main>
    </div>
  );
}

// ─── Palette Suggestions by Niche ────────────────────────────────────
const PALETTE_SUGGESTIONS: Record<string, { name: string; colors: [string, string, string, string] }[]> = {
  'SaaS': [
    { name: 'Indigo Tech', colors: ['#6366F1', '#818CF8', '#F59E0B', '#0F0D1A'] },
    { name: 'Ocean Blue', colors: ['#3B82F6', '#60A5FA', '#F97316', '#0C1929'] },
    { name: 'Violet Pro', colors: ['#7C3AED', '#A78BFA', '#10B981', '#110D1F'] },
  ],
  'Infoprodutos': [
    { name: 'Gold Authority', colors: ['#E6B447', '#F59E0B', '#1E40AF', '#0D0B09'] },
    { name: 'Fire Launch', colors: ['#EF4444', '#F97316', '#FBBF24', '#1A0A0A'] },
    { name: 'Trust Blue', colors: ['#2563EB', '#3B82F6', '#F59E0B', '#0A1628'] },
  ],
  'E-commerce': [
    { name: 'Modern Store', colors: ['#10B981', '#34D399', '#F97316', '#0A1A14'] },
    { name: 'Bold Commerce', colors: ['#EF4444', '#F43F5E', '#FBBF24', '#1A0A0C'] },
    { name: 'Clean Market', colors: ['#0EA5E9', '#38BDF8', '#F59E0B', '#0C1620'] },
  ],
  'Consultoria': [
    { name: 'Corporate Trust', colors: ['#1E40AF', '#2563EB', '#D4AF37', '#0A1028'] },
    { name: 'Executive Gray', colors: ['#374151', '#6B7280', '#E6B447', '#111111'] },
    { name: 'Prestige Navy', colors: ['#1E3A5F', '#2563EB', '#F59E0B', '#0A1220'] },
  ],
  'Saúde': [
    { name: 'Healing Green', colors: ['#10B981', '#34D399', '#3B82F6', '#061A12'] },
    { name: 'Medical Clean', colors: ['#0EA5E9', '#38BDF8', '#10B981', '#0A1620'] },
    { name: 'Wellness Teal', colors: ['#14B8A6', '#5EEAD4', '#F59E0B', '#0A1A18'] },
  ],
  'Fitness': [
    { name: 'Power Red', colors: ['#EF4444', '#F97316', '#FBBF24', '#1A0A0A'] },
    { name: 'Energy Green', colors: ['#22C55E', '#84CC16', '#F97316', '#0A1A05'] },
    { name: 'Dark Force', colors: ['#F97316', '#FBBF24', '#EF4444', '#0D0D0D'] },
  ],
  'Moda': [
    { name: 'Luxury Gold', colors: ['#000000', '#D4AF37', '#FFFFFF', '#0D0D0D'] },
    { name: 'Blush Chic', colors: ['#EC4899', '#F9A8D4', '#1F2937', '#1A0A14'] },
    { name: 'Monochrome', colors: ['#1F2937', '#6B7280', '#F59E0B', '#0D0D0D'] },
  ],
  'Finanças': [
    { name: 'Trust Navy', colors: ['#1E40AF', '#2563EB', '#10B981', '#0A1028'] },
    { name: 'Wealth Green', colors: ['#0F766E', '#14B8A6', '#F59E0B', '#0A1614'] },
    { name: 'Secure Blue', colors: ['#1D4ED8', '#3B82F6', '#FBBF24', '#0A1430'] },
  ],
  'Educação': [
    { name: 'Academic Blue', colors: ['#2563EB', '#60A5FA', '#F59E0B', '#0A1628'] },
    { name: 'Knowledge Purple', colors: ['#7C3AED', '#A78BFA', '#10B981', '#110D1F'] },
    { name: 'Learning Orange', colors: ['#F97316', '#FBBF24', '#2563EB', '#1A0F05'] },
  ],
};

// Find palettes: try exact match, then partial match on vertical
function findPalettes(vertical: string): { name: string; colors: [string, string, string, string] }[] {
  if (!vertical) return [];
  // Exact match
  if (PALETTE_SUGGESTIONS[vertical]) return PALETTE_SUGGESTIONS[vertical];
  // Partial match
  const lower = vertical.toLowerCase();
  for (const [key, palettes] of Object.entries(PALETTE_SUGGESTIONS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return palettes;
    }
  }
  // Default palettes for unknown verticals
  return [
    { name: 'Gold Standard', colors: ['#E6B447', '#F59E0B', '#3B82F6', '#0D0B09'] },
    { name: 'Modern Dark', colors: ['#6366F1', '#818CF8', '#F97316', '#0F0D1A'] },
    { name: 'Clean Minimal', colors: ['#1F2937', '#6B7280', '#E6B447', '#0D0D0D'] },
  ];
}

function PaletteSuggestions({
  vertical,
  onApply,
}: {
  vertical: string;
  onApply: (primary: string, secondary: string, accent: string, background: string) => void;
}) {
  const palettes = findPalettes(vertical);
  if (palettes.length === 0) return null;

  return (
    <div className="pt-3 border-t border-white/[0.05]">
      <Label className="text-xs font-bold uppercase text-zinc-400 mb-2 block">
        Paletas sugeridas {vertical ? `para ${vertical}` : ''}
      </Label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {palettes.map((palette) => (
          <button
            key={palette.name}
            type="button"
            onClick={() => onApply(...palette.colors)}
            className="group p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-[#E6B447]/30 hover:bg-white/[0.04] transition-all text-left"
          >
            <div className="flex gap-1 mb-2">
              {palette.colors.map((color, i) => (
                <div
                  key={i}
                  className="h-6 flex-1 rounded-sm border border-white/10"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <p className="text-[10px] text-zinc-500 group-hover:text-zinc-400 transition-colors">{palette.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Objections Section with AI Suggestions ─────────────────────────
function ObjectionsSection({
  brandId,
  objections,
  vertical,
  offer,
  audience,
  onUpdate,
}: {
  brandId: string;
  objections: string[];
  vertical?: string;
  offer?: string;
  audience?: string;
  onUpdate: (objections: string[]) => void;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const fetchSuggestions = async () => {
    if (!vertical && !offer) {
      toast.error('Preencha a vertical ou oferta primeiro');
      return;
    }
    setLoadingSuggestions(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/brands/${brandId}/suggest-objections`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ vertical, offer, audience }),
      });
      const data = await res.json();
      if (res.ok && data.data?.objections?.length) {
        setSuggestions(data.data.objections);
      } else {
        toast.error('Não foi possível gerar sugestões');
      }
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const toggleSuggestion = (suggestion: string) => {
    if (objections.includes(suggestion)) {
      onUpdate(objections.filter(o => o !== suggestion));
    } else if (objections.length < 5) {
      onUpdate([...objections, suggestion]);
    }
  };

  const addCustom = () => {
    if (objections.length < 5) {
      onUpdate([...objections, '']);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <Label className="text-xs text-zinc-400">Objeções do público (até 5)</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={fetchSuggestions}
          disabled={loadingSuggestions}
          className="text-[#E6B447] hover:text-[#E6B447] hover:bg-[#E6B447]/10 h-7 text-xs"
        >
          {loadingSuggestions ? (
            <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
          ) : (
            <Wand2 className="h-3 w-3 mr-1.5" />
          )}
          Sugerir com IA
        </Button>
      </div>

      {/* AI Suggestions as chips */}
      {suggestions.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-zinc-600 mb-2">Clique para selecionar:</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s, i) => {
              const isSelected = objections.includes(s);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleSuggestion(s)}
                  className={cn(
                    'rounded-lg border px-2.5 py-1.5 text-xs transition-all',
                    isSelected
                      ? 'border-[#E6B447]/50 bg-[#E6B447]/10 text-[#E6B447]'
                      : 'border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:border-white/[0.12] hover:text-zinc-300'
                  )}
                >
                  {isSelected && <Check className="inline h-3 w-3 mr-1" />}
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected objections (editable) */}
      <div className="space-y-2">
        {objections.map((obj, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={obj}
              onChange={(e) => {
                const updated = [...objections];
                updated[i] = e.target.value;
                onUpdate(updated);
              }}
              placeholder={`Objeção ${i + 1}`}
              className="bg-white/[0.02] border-white/[0.06] text-white flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onUpdate(objections.filter((_, idx) => idx !== i))}
              className="text-zinc-500 hover:text-red-400"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {objections.length < 5 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCustom}
            className="w-full border-white/[0.06] text-zinc-400 hover:text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Objeção
          </Button>
        )}
      </div>
      {objections.length > 0 && (
        <p className="text-[10px] text-zinc-600 mt-1.5">{objections.filter(o => o.trim()).length} objeção(ões) selecionada(s)</p>
      )}
    </div>
  );
}

// ─── Awareness Widget (inline version) ──────────────────────────────
const AWARENESS_LABELS: Record<string, { label: string; description: string; emoji: string }> = {
  unaware: { label: 'Inconsciente', description: 'Seu público não sabe que tem o problema', emoji: '😴' },
  problem_aware: { label: 'Consciente do Problema', description: 'Sabem do problema, mas não buscam soluções', emoji: '🤔' },
  solution_aware: { label: 'Consciente da Solução', description: 'Buscam soluções ativamente', emoji: '🔍' },
  product_aware: { label: 'Consciente do Produto', description: 'Já conhecem sua marca/produto', emoji: '👀' },
};

function classifyAwareness(answers: { knowsProblem: boolean | null; seeksSolutions: boolean | null; knowsProduct: boolean | null }): string | null {
  const { knowsProblem, seeksSolutions, knowsProduct } = answers;
  if (knowsProblem === null) return null;
  if (!knowsProblem) return 'unaware';
  if (!seeksSolutions && !knowsProduct) return 'problem_aware';
  if (seeksSolutions && !knowsProduct) return 'solution_aware';
  if (knowsProduct) return 'product_aware';
  return 'solution_aware';
}

function AwarenessWidget({ awareness, onUpdate }: { awareness: string; onUpdate: (value: string) => void }) {
  const [answers, setAnswers] = useState<{ knowsProblem: boolean | null; seeksSolutions: boolean | null; knowsProduct: boolean | null }>({
    knowsProblem: null,
    seeksSolutions: null,
    knowsProduct: null,
  });

  useEffect(() => {
    if (awareness && answers.knowsProblem === null) {
      setAnswers({
        knowsProblem: awareness !== 'unaware',
        seeksSolutions: awareness === 'solution_aware' || awareness === 'product_aware',
        knowsProduct: awareness === 'product_aware',
      });
    }
  }, [awareness]);

  const handleAnswer = (field: keyof typeof answers, value: boolean) => {
    const next = { ...answers, [field]: value };
    setAnswers(next);
    const level = classifyAwareness(next);
    if (level) onUpdate(level);
  };

  const currentLevel = classifyAwareness(answers);
  const levelInfo = currentLevel ? AWARENESS_LABELS[currentLevel] : null;

  const questions = [
    { key: 'knowsProblem' as const, text: 'Seu público sabe que tem o problema que você resolve?' },
    { key: 'seeksSolutions' as const, text: 'Seu público já procura soluções ativamente?' },
    { key: 'knowsProduct' as const, text: 'Seu público já conhece seu produto/marca?' },
  ];

  return (
    <div>
      <Label className="text-xs text-zinc-400 mb-1.5 block">Nível de Consciência *</Label>
      <p className="text-[10px] text-zinc-600 mb-3">Responda 3 perguntas para classificar automaticamente</p>
      <div className="space-y-2">
        {questions.map(q => (
          <div key={q.key} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
            <span className="text-xs text-zinc-300 flex-1 mr-3">{q.text}</span>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleAnswer(q.key, true)}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-all',
                  answers[q.key] === true
                    ? 'bg-[#E6B447]/20 text-[#E6B447] border border-[#E6B447]/40'
                    : 'bg-white/[0.02] text-zinc-500 border border-white/[0.06] hover:border-white/[0.12]'
                )}
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => handleAnswer(q.key, false)}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-all',
                  answers[q.key] === false
                    ? 'bg-zinc-700/50 text-zinc-300 border border-zinc-600/50'
                    : 'bg-white/[0.02] text-zinc-500 border border-white/[0.06] hover:border-white/[0.12]'
                )}
              >
                Não
              </button>
            </div>
          </div>
        ))}
      </div>
      {levelInfo && (
        <div className="mt-3 rounded-lg border border-[#E6B447]/20 bg-[#E6B447]/5 p-3 flex items-center gap-3">
          <span className="text-xl">{levelInfo.emoji}</span>
          <div>
            <p className="text-sm font-medium text-[#E6B447]">{levelInfo.label}</p>
            <p className="text-xs text-zinc-400">{levelInfo.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
