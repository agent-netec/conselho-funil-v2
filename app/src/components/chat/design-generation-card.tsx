'use client';

import { useState } from 'react';
import { 
  Palette, 
  Loader2, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Image as ImageIcon,
  Target,
  Shield,
  ChevronDown,
  ChevronUp,
  Layers,
  Type,
  Info,
  Copy,
  Check,
  Globe,
  Facebook,
  Linkedin,
  Instagram,
  Search,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import { createAsset } from '@/lib/firebase/assets';
import { updateCampaignManifesto } from '@/lib/firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import { AdsDesignContract } from '@/types/ads-design';
import { CampaignContext } from '@/types/campaign';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DesignGenerationCardProps {
  promptData: AdsDesignContract & { prompt?: string }; // Adiciona prompt opcional para retrocompatibilidade
  conversationId: string;
  campaignId?: string | null;
}

const platformIcons = {
  meta: Facebook,
  google: Search,
  linkedin: Linkedin,
  universal: Globe,
};

const platformColors = {
  meta: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  google: 'text-red-400 bg-red-500/10 border-red-500/20',
  linkedin: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  universal: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
};

export function DesignGenerationCard({ promptData, conversationId, campaignId }: DesignGenerationCardProps) {
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error' | 'upscaling'>('idle');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUpscaled, setIsUpscaled] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [showCopy, setShowCopy] = useState(false);
  const [showStrategy, setShowStrategy] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const activeBrand = useActiveBrand();

  const PlatformIcon = platformIcons[promptData.platform] || platformIcons.universal;
  const platformStyle = platformColors[promptData.platform] || platformColors.universal;

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    toast.success('Copiado para a área de transferência!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGenerate = async () => {
    if (!activeBrand) {
      toast.error('Selecione uma marca para gerar o criativo');
      return;
    }

    setStatus('generating');
    setError(null);

    try {
      const visualPrompt = promptData.visualPrompt || promptData.prompt
        || `Professional ${promptData.platform || 'social media'} ad creative, ${promptData.strategy?.contrastFocus || 'high contrast'}, ${promptData.assets?.headline || 'marketing visual'}, ${promptData.strategy?.unityTheme || 'modern clean design'}`;
      const type = promptData.platform || promptData.format || 'design';

      const headers = await getAuthHeaders();
      const response = await fetch('/api/design/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: visualPrompt,
          type: type,
          platform: promptData.platform,
          format: promptData.format,
          safeZone: promptData.safeZone,
          aspectRatio: promptData.aspectRatio,
          brandId: activeBrand.id,
          userId: activeBrand.userId,
          brandContext: promptData.brandContext,
          copyHeadline: promptData.assets?.headline || '',
          copyLanguage: 'português brasileiro',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || 'Falha na resposta da API';
        const errorDetails = errorData.details ? ` (${errorData.details})` : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      const data = await response.json();
      const payload = data.data ?? data;

      if (data.success) {
        const finalImageUrl = payload.imageUrl;
        const isStorageUrl = !finalImageUrl?.startsWith('data:');

        // Definimos a URL primeiro e DEPOIS mudamos o status para garantir renderização imediata
        setImageUrl(finalImageUrl);
        setStatus('success');

        // Salvamento automático como BrandAsset (somente URLs do Storage, não base64)
        if (!isStorageUrl) {
          console.warn('⚠️ Upload server-side falhou. Debug:', payload.uploadDebug);
          toast.warning('Imagem gerada, mas upload falhou. Veja console para detalhes.');
        } else try {
          await createAsset({
            brandId: activeBrand.id,
            userId: activeBrand.userId,
            name: `Design: ${promptData.platform || 'universal'} - ${new Date().toLocaleDateString()}`,
            originalName: `design_${payload.processId}.webp`,
            type: 'image',
            mimeType: 'image/webp',
            size: 0, // Informação simulada
            url: finalImageUrl,
            status: 'ready',
            isApprovedForAI: true,
            createdAt: Timestamp.now(),
            description: `Gerado via NanoBanana (${promptData.platform || 'universal'}): ${promptData.visualPrompt || promptData.prompt || 'Sem prompt'}`,
            tags: ['ai-generated', (promptData.platform || 'design').toLowerCase()]
          });
          toast.success('Criativo gerado e salvo na galeria da marca!');
        } catch (saveErr) {
          console.error('Error saving asset:', saveErr);
          toast.error('Criativo gerado, mas houve um erro ao salvar na galeria.');
        }
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (err) {
      console.error('Generation Error:', err);
      setError(String(err));
      setStatus('error');
      toast.error('Erro ao gerar criativo. Tente novamente.');
    }
  };

  const handleUpscale = async () => {
    // ... upscale logic
  };

  const handleDownload = async () => {
    if (!imageUrl) return;
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `conselho_design_${Date.now()}.webp`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Download iniciado!');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Erro ao baixar imagem. Tente abrir em uma nova aba.');
    }
  };

  const handleSelectForCampaign = async () => {
    if (!campaignId || !imageUrl) return;
    if (imageUrl.startsWith('data:')) {
      toast.error('Imagem ainda em base64 — faça upload antes de selecionar para a campanha.');
      return;
    }

    setIsSelecting(true);
    try {
      // US-22.1: Sincronização de Estado (Golden Thread)
      await updateCampaignManifesto(campaignId, {
        design: {
          visualStyle: promptData.brandContext?.style || 'Professional',
          preferredColors: promptData.brandContext?.colors || [],
          visualPrompts: [promptData.visualPrompt || promptData.prompt || ''],
          aspectRatios: [promptData.aspectRatio || '1:1'],
          assetsUrl: [imageUrl]
        },
        status: 'active' // Garante que a campanha está ativa para prosseguir
      });
      
      setIsSelected(true);
      toast.success('Criativo selecionado para a Linha de Ouro!');
    } catch (err) {
      console.error('Error selecting for campaign:', err);
      toast.error('Erro ao selecionar para a campanha.');
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <div className="mt-3 max-w-md overflow-hidden rounded-xl border border-purple-500/20 bg-purple-500/5 transition-all shadow-md">
      <div className="p-3 sm:p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400 shrink-0">
            <Palette className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-[13px] font-bold text-white truncate">
                  NanoBanana AI
                </h3>
                <span className="text-[9px] uppercase tracking-tighter px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                  Motor Visual
                </span>
              </div>
              {promptData.objective && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase">
                  <Target className="w-2.5 h-2.5" />
                  {promptData.objective}
                </div>
              )}
            </div>
          </div>
        </div>

        {status === 'idle' && (
          <div className="space-y-3">
            <div className="grid grid-cols-4 items-center justify-between gap-1 px-2 py-1.5 rounded-lg bg-black/40 border border-white/5 shadow-inner">
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-tight">Plataforma</span>
                <div className={cn("flex items-center gap-1 text-[10px] font-bold px-1 py-0.5 rounded border capitalize", platformStyle)}>
                  <PlatformIcon className="w-2.5 h-2.5" />
                  {promptData.platform || 'Universal'}
                </div>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-tight">Zonas</span>
                <div className="flex items-center gap-1 text-[10px] text-zinc-300 font-bold px-1 py-0.5 rounded bg-white/5 border border-white/5 capitalize">
                  <Shield className="w-2.5 h-2.5 text-emerald-500/70" />
                  {promptData.safeZone || 'Feed'}
                </div>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-tight">Aspecto</span>
                <div className="flex items-center gap-1 text-[10px] text-zinc-300 font-bold px-1 py-0.5 rounded bg-white/5 border border-white/5">
                  <Layers className="w-2.5 h-2.5 text-purple-400/70" />
                  {promptData.aspectRatio || '1:1'}
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-tight">Estratégia</span>
                <button 
                  onClick={() => setShowStrategy(!showStrategy)}
                  className={cn(
                    "flex items-center gap-1 text-[10px] font-bold px-1 py-0.5 rounded border transition-all",
                    showStrategy ? "bg-purple-500/20 border-purple-500/50 text-purple-300" : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
                  )}
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  C.H.A.P.E.U
                </button>
              </div>
            </div>

            {showStrategy && promptData.strategy && (
              <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-1.5 text-purple-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                  <Info className="w-3 h-3" />
                  Racional Estratégico
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-zinc-500 uppercase font-bold">Contraste</span>
                    <p className="text-[9px] text-zinc-300 leading-tight">{promptData.strategy.contrastFocus}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-zinc-500 uppercase font-bold">Equilíbrio</span>
                    <p className="text-[9px] text-zinc-300 leading-tight capitalize">{promptData.strategy.balanceType}</p>
                  </div>
                  <div className="space-y-0.5 col-span-2">
                    <span className="text-[8px] text-zinc-500 uppercase font-bold">Hierarquia de Leitura</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {promptData.strategy.hierarchyOrder.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1 text-[8px] bg-black/40 px-1.5 py-0.5 rounded border border-white/5 text-zinc-400">
                          <span className="text-purple-400 font-bold">{idx + 1}</span>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleGenerate}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white border-0 shadow-lg shadow-purple-900/20 h-9 text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.98]"
            >
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Gerar Criativo Baseado na Intenção
            </Button>
          </div>
        )}

        {status === 'generating' && (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className="relative mb-2">
              <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
            </div>
            <h4 className="text-xs font-medium text-white">Processando sua visão...</h4>
          </div>
        )}

        {status === 'success' && imageUrl && (
          <div className="space-y-3">
            <div className="relative group rounded-lg overflow-hidden border border-purple-500/30 shadow-lg">
              <img 
                src={imageUrl} 
                alt="Criativo Gerado" 
                className="w-full object-cover"
                style={{ aspectRatio: promptData.aspectRatio?.replace(':', '/') || '1/1' }}
              />
              
              {/* Safe Zone Overlays (ST-11.11) */}
              {showSafeZones && (
                <div className="absolute inset-0 pointer-events-none animate-in fade-in duration-300">
                  {/* Instagram/FB Stories & Reels Safe Zones */}
                  {(promptData.safeZone === 'stories' || promptData.safeZone === 'reels') && (
                    <>
                      {/* Top Header Area */}
                      <div className="absolute top-0 left-0 right-0 h-[14%] bg-gradient-to-b from-black/60 to-transparent border-b border-dashed border-red-500/40">
                        <div className="absolute top-4 left-4 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full border border-white/40 bg-white/10" />
                          <div className="w-20 h-2 rounded bg-white/30" />
                        </div>
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[7px] font-black text-red-400 uppercase tracking-widest bg-black/40 px-1.5 py-0.5 rounded">
                          Danger: Header / Profile
                        </div>
                      </div>

                      {/* Bottom Interaction Area */}
                      <div className="absolute bottom-0 left-0 right-0 h-[22%] bg-gradient-to-t from-black/80 to-transparent border-t border-dashed border-red-500/40">
                        <div className="absolute bottom-6 left-4 right-16 space-y-2">
                          <div className="w-1/2 h-2 rounded bg-white/40" />
                          <div className="w-3/4 h-2 rounded bg-white/20" />
                          <div className="w-full h-8 rounded-md border border-white/20 bg-white/10 flex items-center justify-center text-[10px] text-white/40 font-bold">
                            BUTTON / CTA
                          </div>
                        </div>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[7px] font-black text-red-400 uppercase tracking-widest bg-black/40 px-1.5 py-0.5 rounded">
                          Danger: CTA / Caption
                        </div>
                      </div>

                      {/* Side Interaction Icons (Reels) */}
                      {promptData.safeZone === 'reels' && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 flex flex-col items-center gap-4 py-8 bg-black/20 border-l border-dashed border-red-500/40">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full border border-white/30 bg-white/5" />
                          ))}
                          <div className="absolute top-2 right-2 text-[6px] font-black text-red-400 uppercase vertical-rl">Icons</div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Meta/LinkedIn Feed Safe Zones */}
                  {promptData.safeZone === 'feed' && (
                    <>
                      {/* Side Margin Check */}
                      <div className="absolute inset-x-[8%] inset-y-0 border-x border-dashed border-emerald-500/30">
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[7px] text-emerald-400/80 font-black uppercase bg-black/60 px-1 rounded">
                          Optimal Text Margin
                        </div>
                      </div>

                      {/* Bottom Meta-Data Area */}
                      <div className="absolute bottom-0 left-0 right-0 h-[18%] bg-gradient-to-t from-blue-500/20 to-transparent border-t border-dashed border-blue-500/40">
                        <div className="absolute bottom-2 left-4 right-4 flex items-center justify-between gap-4">
                          <div className="flex-1 space-y-1.5">
                            <div className="w-3/4 h-2.5 rounded bg-blue-400/30" />
                            <div className="w-1/2 h-2 rounded bg-blue-400/20" />
                          </div>
                          <div className="w-20 h-7 rounded border border-blue-500/40 bg-blue-500/20 flex items-center justify-center text-[8px] text-blue-300 font-bold uppercase">
                            CTA
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Grid System (Always on when Safe Zone is on) */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20">
                    <div className="border border-white/20" /><div className="border border-white/20" /><div className="border border-white/20" />
                    <div className="border border-white/20" /><div className="border border-white/20" /><div className="border border-white/20" />
                    <div className="border border-white/20" /><div className="border border-white/20" /><div className="border border-white/20" />
                  </div>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" className="h-8 text-[10px]" asChild>
                    <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1 h-3 w-3" />
                      Ver Full
                    </a>
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-purple-600 hover:bg-purple-700 h-8 text-[10px]"
                    onClick={handleDownload}
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Baixar
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className={cn(
                      "h-7 text-[9px] border-white/20 text-white hover:bg-white/10",
                      showSafeZones && "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                    )}
                    onClick={() => setShowSafeZones(!showSafeZones)}
                  >
                    <Shield className="mr-1 h-3 w-3" />
                    Zonas de Segurança
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Copy Reveal (ST-11.11) */}
            {promptData.assets && (
              <div className="rounded-lg bg-black/40 border border-white/5 overflow-hidden shadow-lg shadow-black/40">
                <button 
                  onClick={() => setShowCopy(!showCopy)}
                  className="w-full flex items-center justify-between p-2.5 text-[10px] font-bold text-zinc-400 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Type className="w-3.5 h-3.5 text-purple-400" />
                    COPYWRITING PARA {promptData.platform?.toUpperCase() || 'AD'}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-500 font-medium">
                      {Object.keys(promptData.assets).length} ativos
                    </span>
                    {showCopy ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </div>
                </button>
                
                {showCopy && (
                  <div className="p-3 pt-0 space-y-4 border-t border-white/5 bg-zinc-950/20">
                    {/* Meta/LinkedIn Standard Assets */}
                    {(promptData.assets.headline || promptData.assets.primaryText) && (
                      <div className="space-y-3">
                        {promptData.assets.headline && (
                          <div className="group relative">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-tight">Headline</span>
                              <button 
                                onClick={() => copyToClipboard(promptData.assets.headline!, 'headline')}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                              >
                                {copiedField === 'headline' ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5 text-zinc-400" />}
                              </button>
                            </div>
                            <p className="text-[11px] text-white font-medium leading-snug pr-6">{promptData.assets.headline}</p>
                          </div>
                        )}
                        {promptData.assets.primaryText && (
                          <div className="group relative">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-tight">Primary Text</span>
                              <button 
                                onClick={() => copyToClipboard(promptData.assets.primaryText!, 'primary')}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                              >
                                {copiedField === 'primary' ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5 text-zinc-400" />}
                              </button>
                            </div>
                            <p className="text-[11px] text-zinc-300 leading-relaxed italic pr-6 whitespace-pre-wrap">"{promptData.assets.primaryText}"</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Google Responsive Ads Arrays */}
                    {(promptData.assets.headlines || promptData.assets.descriptions) && (
                      <div className="space-y-4">
                        {promptData.assets.headlines && promptData.assets.headlines.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-tight">Variações de Título (Google)</span>
                            <div className="space-y-1">
                              {promptData.assets.headlines.map((text, idx) => (
                                <div key={idx} className="group flex items-start justify-between gap-2 p-1.5 rounded bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                  <p className="text-[10px] text-white leading-tight flex-1 font-medium">{text}</p>
                                  <button 
                                    onClick={() => copyToClipboard(text, `h-${idx}`)}
                                    className="p-1 hover:bg-white/10 rounded shrink-0"
                                  >
                                    {copiedField === `h-${idx}` ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5 text-zinc-400" />}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {promptData.assets.descriptions && promptData.assets.descriptions.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-tight">Variações de Descrição (Google)</span>
                            <div className="space-y-1">
                              {promptData.assets.descriptions.map((text, idx) => (
                                <div key={idx} className="group flex items-start justify-between gap-2 p-2 rounded bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                  <p className="text-[10px] text-zinc-300 italic leading-snug flex-1">"{text}"</p>
                                  <button 
                                    onClick={() => copyToClipboard(text, `d-${idx}`)}
                                    className="p-1 hover:bg-white/10 rounded shrink-0"
                                  >
                                    {copiedField === `d-${idx}` ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5 text-zinc-400" />}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {promptData.assets.callToAction && (
                      <div className="flex items-center justify-between p-2 rounded bg-purple-500/10 border border-purple-500/20">
                        <div className="flex items-center gap-2">
                          <Target className="w-3 h-3 text-purple-400" />
                          <span className="text-[9px] text-purple-300 font-bold uppercase">CTA: {promptData.assets.callToAction}</span>
                        </div>
                        <button 
                          onClick={() => copyToClipboard(promptData.assets.callToAction!, 'cta')}
                          className="p-1 hover:bg-purple-500/20 rounded"
                        >
                          {copiedField === 'cta' ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5 text-purple-400" />}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold justify-center py-1">
              <CheckCircle2 className="w-3 h-3" />
              {isSelected ? 'CRIATIVO SELECIONADO PARA A CAMPANHA!' : 'CRIATIVO SALVO NA GALERIA!'}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {campaignId && !isSelected ? (
                <Button 
                  onClick={handleSelectForCampaign}
                  disabled={isSelecting}
                  className="col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-900/20 h-9 text-xs font-bold transition-all hover:scale-[1.01]"
                >
                  {isSelecting ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Target className="mr-2 h-3.5 w-3.5" />
                  )}
                  Selecionar para Linha de Ouro
                </Button>
              ) : isSelected && campaignId ? (
                <Button 
                  variant="secondary"
                  className="col-span-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 h-10 text-xs font-black uppercase tracking-widest hover:bg-emerald-500/30"
                  asChild
                >
                  <Link href={`/campaigns/${campaignId}`}>
                    Ir para Estratégia de Ads
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : null}

              {!isUpscaled && (
                <Button 
                  onClick={handleUpscale}
                  className={cn(
                    "bg-zinc-800 hover:bg-zinc-700 text-purple-400 border border-purple-500/20 h-8 text-[10px]",
                    isSelected && "opacity-50 pointer-events-none"
                  )}
                >
                  <Sparkles className="mr-1.5 h-3 w-3" />
                  UPSCALE HD
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => {
                  setStatus('idle');
                  setIsUpscaled(false);
                  setImageUrl(null);
                  setIsSelected(false);
                }}
                className={cn(
                  "border-purple-500/30 text-purple-400 hover:bg-purple-500/10 h-8 text-[10px]",
                  isUpscaled ? "col-span-2" : ""
                )}
              >
                NOVA VARIAÇÃO
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 flex gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <h4 className="text-[11px] font-bold text-red-400 uppercase">Erro na Geração</h4>
                <p className="text-[10px] text-red-400/70 truncate">{error || 'Falha na conexão.'}</p>
              </div>
            </div>
            <Button 
              onClick={handleGenerate}
              variant="outline"
              className="w-full border-zinc-700 text-zinc-400 hover:bg-white/5 h-8 text-[10px]"
            >
              Tentar Novamente
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

