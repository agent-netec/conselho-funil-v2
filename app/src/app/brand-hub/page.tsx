'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import { useBrands } from '@/lib/hooks/use-brands';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Lock, 
  Unlock, 
  Upload, 
  Type, 
  Palette, 
  Image as ImageIcon, 
  Check, 
  AlertCircle,
  Loader2,
  Sun,
  Moon,
  Sparkles,
  ShieldCheck,
  FileSearch
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { uploadLogo } from '@/lib/firebase/storage';
import { useAuthStore } from '@/lib/stores/auth-store';
import { BrandKit, LogoAsset } from '@/types/database';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StrategicContext } from '@/components/brands/strategic-context';

/**
 * Brand Hub Dashboard - US-7.4
 * Gerenciamento de Identidade Visual e Governança de Marca (Logo Lock)
 */
export default function BrandHubDashboard() {
  const activeBrand = useActiveBrand();
  const { update } = useBrands();
  const { user } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreviewMode, setLogoPreviewMode] = useState<'light' | 'dark'>('dark');
  
  // Local state for the form
  const [formData, setFormData] = useState<BrandKit>({
    colors: {
      primary: '#10b981',
      secondary: '#3b82f6',
      accent: '#f59e0b',
      background: '#09090b',
    },
    typography: {
      primaryFont: 'Inter',
      secondaryFont: 'Inter',
      systemFallback: 'sans-serif',
    },
    visualStyle: 'modern',
    logoLock: {
      variants: {
        primary: { url: '', storagePath: '', format: 'png' } as LogoAsset,
      },
      locked: true,
    },
    updatedAt: new Date() as any,
  });

  // Sync with active brand
  useEffect(() => {
    if (activeBrand?.brandKit) {
      setFormData(activeBrand.brandKit);
    }
  }, [activeBrand]);

  const handleInputChange = (section: keyof BrandKit, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value
      }
    }));
  };

  const handleColorChange = (key: keyof BrandKit['colors'], value: string) => {
    setFormData(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [key]: value
      }
    }));
  };

  const handleLogoUpload = async (variant: 'primary' | 'horizontal' | 'icon', file: File) => {
    if (!activeBrand || !user) return;

    try {
      const url = await uploadLogo(file, activeBrand.id, user.uid);
      const format = file.name.split('.').pop() as any;
      
      const newLogo: LogoAsset = {
        url,
        storagePath: `brands/${user.uid}/${activeBrand.id}/logos/${file.name}`, // Simplificado para exemplo
        format: format === 'svg' ? 'svg' : (format === 'webp' ? 'webp' : 'png'),
      };

      // Se for SVG, poderíamos ler o conteúdo e salvar em svgRaw aqui se necessário

      setFormData(prev => ({
        ...prev,
        logoLock: {
          ...prev.logoLock,
          variants: {
            ...prev.logoLock.variants,
            [variant]: newLogo
          }
        }
      }));
      
      toast.success(`Logo ${variant} atualizada com sucesso!`);
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Erro ao fazer upload da logo.');
    }
  };

  const handleSave = async () => {
    if (!activeBrand) return;
    
    setIsSaving(true);
    try {
      await update(activeBrand.id, { brandKit: formData });
      toast.success('Identidade visual salva com sucesso!');
    } catch (error) {
      console.error('Error saving brand kit:', error);
      toast.error('Erro ao salvar as alterações.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!activeBrand) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Header title="Brand Hub" showBrandSelector={true} />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="h-12 w-12 text-zinc-500 mb-4" />
          <h2 className="text-xl font-semibold text-white">Nenhuma marca selecionada</h2>
          <p className="text-zinc-500 mt-2">Selecione uma marca no menu superior para gerenciar seu Brand Hub.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <Header 
        title="Brand Hub" 
        subtitle={`Identidade Visual de ${activeBrand.name}`}
        showBrandSelector={true}
        actions={
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[100px]"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
            Salvar Alterações
          </Button>
        }
      />

      <main className="mx-auto max-w-6xl px-6 py-6">
        <Tabs defaultValue="identity" className="space-y-8">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
            <TabsList className="bg-white/[0.02] border border-white/[0.05]">
              <TabsTrigger value="identity" className="px-6 gap-2">
                <Palette className="h-4 w-4" />
                Identidade Visual
              </TabsTrigger>
              <TabsTrigger value="context" className="px-6 gap-2">
                <ShieldCheck className="h-4 w-4" />
                Contexto Estratégico
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 bg-white/[0.02] px-3 py-1.5 rounded-full border border-white/[0.05]">
              <Sparkles className="h-3 w-3 text-emerald-500" />
              <span>RAG v2.0 Ativo</span>
            </div>
          </div>

          <TabsContent value="identity" className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Coluna Esquerda: Cores e Tipografia */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Seção 1: Cores Oficiais */}
                <Card className="bg-white/[0.02] border-white/[0.06] overflow-hidden">
                  <CardHeader className="border-b border-white/[0.04] bg-white/[0.01]">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Palette className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg">Paleta de Cores Oficiais</CardTitle>
                        <CardDescription>Defina as cores que os agentes de IA devem usar.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {Object.entries(formData.colors).map(([key, value]) => {
                        if (key === 'variants') return null;
                        return (
                          <div key={key} className="space-y-3">
                            <Label className="text-zinc-400 capitalize">{key === 'accent' ? 'Destaque' : (key === 'background' ? 'Fundo' : (key === 'primary' ? 'Primária' : 'Secundária'))}</Label>
                            <div className="flex gap-3">
                              <div 
                                className="h-10 w-10 rounded-lg border border-white/[0.1] shrink-0 shadow-lg"
                                style={{ backgroundColor: value as string }}
                              />
                              <Input 
                                value={value as string}
                                onChange={(e) => handleColorChange(key as any, e.target.value)}
                                className="bg-white/[0.03] border-white/[0.08] text-white font-mono"
                              />
                              <input 
                                type="color" 
                                value={value as string}
                                onChange={(e) => handleColorChange(key as any, e.target.value)}
                                className="sr-only"
                                id={`color-${key}`}
                              />
                              <label 
                                htmlFor={`color-${key}`}
                                className="h-10 px-3 flex items-center justify-center rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] cursor-pointer transition-colors"
                              >
                                <Palette className="h-4 w-4 text-zinc-400" />
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Seção 2: Tipografia e Estilo */}
                <Card className="bg-white/[0.02] border-white/[0.06] overflow-hidden">
                  <CardHeader className="border-b border-white/[0.04] bg-white/[0.01]">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Type className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg">Tipografia & Estilo Visual</CardTitle>
                        <CardDescription>A "vibe" e as fontes principais da sua marca.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-zinc-400">Fonte para Headlines</Label>
                        <Input 
                          value={formData.typography.primaryFont}
                          onChange={(e) => handleInputChange('typography', 'primaryFont', e.target.value)}
                          placeholder="Ex: Inter, Montserrat"
                          className="bg-white/[0.03] border-white/[0.08] text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-zinc-400">Fonte para Corpo de Texto</Label>
                        <Input 
                          value={formData.typography.secondaryFont}
                          onChange={(e) => handleInputChange('typography', 'secondaryFont', e.target.value)}
                          placeholder="Ex: Roboto, Open Sans"
                          className="bg-white/[0.03] border-white/[0.08] text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-zinc-400">Estilo Visual Dominante</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {['minimalist', 'aggressive', 'luxury', 'corporate', 'modern'].map((style) => (
                          <button
                            key={style}
                            onClick={() => handleInputChange('visualStyle', '', style)} // visualStyle é string direta
                            className={cn(
                              "px-4 py-2 rounded-lg text-xs font-medium border transition-all capitalize",
                              formData.visualStyle === style 
                                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]"
                                : "bg-white/[0.03] border-white/[0.08] text-zinc-500 hover:text-white hover:bg-white/[0.05]"
                            )}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Preview de Tipografia */}
                    <div className="mt-6 p-6 rounded-xl bg-white/[0.01] border border-dashed border-white/[0.08]">
                      <h3 className="text-xs font-medium text-zinc-600 uppercase tracking-widest mb-4">Preview em Tempo Real</h3>
                      <div className="space-y-2">
                        <h1 
                          className="text-3xl font-bold text-white tracking-tight"
                          style={{ fontFamily: formData.typography.primaryFont }}
                        >
                          Isto é uma Headline de Impacto
                        </h1>
                        <p 
                          className="text-zinc-400 leading-relaxed"
                          style={{ fontFamily: formData.typography.secondaryFont }}
                        >
                          O corpo de texto será renderizado desta forma. A IA utilizará estas diretrizes para manter a consistência visual em todos os materiais gerados.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Coluna Direita: Logo Lock */}
              <div className="space-y-8">
                <Card className="bg-white/[0.02] border-white/[0.06] overflow-hidden sticky top-24">
                  <CardHeader className="border-b border-white/[0.04] bg-white/[0.01]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <Lock className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                          <CardTitle className="text-white text-lg">Logo Lock</CardTitle>
                          <CardDescription>Governança de ativos imutáveis.</CardDescription>
                        </div>
                      </div>
                      <button
                        onClick={() => handleInputChange('logoLock', 'locked', !formData.logoLock.locked)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          formData.logoLock.locked 
                            ? "bg-emerald-500/10 text-emerald-500" 
                            : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                        )}
                      >
                        {formData.logoLock.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                    
                    {/* Variant Selector & Upload */}
                    <div className="space-y-6">
                      {(['primary', 'horizontal', 'icon'] as const).map((variant) => (
                        <div key={variant} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-zinc-400 capitalize">{variant === 'primary' ? 'Principal' : (variant === 'horizontal' ? 'Horizontal' : 'Ícone / Favicon')}</Label>
                            {formData.logoLock.variants[variant]?.url && (
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                                Locked
                              </span>
                            )}
                          </div>

                          <div 
                            className={cn(
                              "relative group aspect-[16/9] rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden",
                              logoPreviewMode === 'light' ? "bg-white" : "bg-black",
                              formData.logoLock.variants[variant]?.url 
                                ? "border-emerald-500/20" 
                                : "border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.01]"
                            )}
                          >
                            {formData.logoLock.variants[variant]?.url ? (
                              <>
                                <img 
                                  src={formData.logoLock.variants[variant]?.url} 
                                  alt={`Logo ${variant}`}
                                  className="max-h-[70%] max-w-[80%] object-contain"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <label className="cursor-pointer bg-white text-black px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-zinc-200 transition-colors">
                                    Alterar
                                    <input 
                                      type="file" 
                                      accept=".svg,.png,.webp" 
                                      className="hidden" 
                                      onChange={(e) => e.target.files?.[0] && handleLogoUpload(variant, e.target.files[0])}
                                    />
                                  </label>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="h-10 w-10 rounded-full bg-white/[0.03] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                  <Upload className="h-5 w-5 text-zinc-500" />
                                </div>
                                <p className="text-xs text-zinc-500">SVG, PNG ou WebP</p>
                                <input 
                                  type="file" 
                                  accept=".svg,.png,.webp" 
                                  className="absolute inset-0 opacity-0 cursor-pointer" 
                                  onChange={(e) => e.target.files?.[0] && handleLogoUpload(variant, e.target.files[0])}
                                />
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Preview Contrast Toggle */}
                    <div className="pt-6 border-t border-white/[0.04] flex items-center justify-between">
                      <span className="text-xs text-zinc-500 font-medium">Visualização de Contraste</span>
                      <div className="flex p-1 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                        <button
                          onClick={() => setLogoPreviewMode('light')}
                          className={cn(
                            "p-1.5 rounded-md transition-all",
                            logoPreviewMode === 'light' ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-white"
                          )}
                        >
                          <Sun className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setLogoPreviewMode('dark')}
                          className={cn(
                            "p-1.5 rounded-md transition-all",
                            logoPreviewMode === 'dark' ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-white"
                          )}
                        >
                          <Moon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                      <div className="flex gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                        <p className="text-[11px] text-amber-200/70 leading-relaxed">
                          Ativos em "Lock" são prioritários. O motor de IA será forçado a ignorar qualquer tentativa de alteração nestes arquivos.
                        </p>
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="context" className="animate-in fade-in duration-500">
            <StrategicContext brandId={activeBrand.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
