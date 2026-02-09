'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Brand, BrandKit } from '@/types/database';
import { Timestamp } from 'firebase/firestore';
import { updateBrandKit } from '@/lib/firebase/brands';
import { uploadLogo } from '@/lib/firebase/storage';
import { useUser } from '@/lib/hooks/use-user';
import { toast } from 'sonner';
import { Loader2, Lock, Unlock, Upload, Check, Palette, BrainCircuit, Sparkles, Zap, ShieldCheck, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandKitFormProps {
  brand: Brand;
}

const AI_PRESETS = {
  agressivo: { temperature: 0.9, topP: 0.95, profile: 'agressivo' as const },
  sobrio: { temperature: 0.3, topP: 0.7, profile: 'sobrio' as const },
  criativo: { temperature: 0.8, topP: 0.9, profile: 'criativo' as const },
  equilibrado: { temperature: 0.6, topP: 0.85, profile: 'equilibrado' as const },
};

export function BrandKitForm({ brand }: BrandKitFormProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [kit, setKit] = useState<BrandKit>(() => ({
    colors: {
      primary: brand.brandKit?.colors.primary || '#16a34a',
      secondary: brand.brandKit?.colors.secondary || '#0ea5e9',
      accent: brand.brandKit?.colors.accent || '#a855f7',
      background: brand.brandKit?.colors.background || '#0b0f19',
    },
    typography: {
      primaryFont: brand.brandKit?.typography.primaryFont || 'Inter',
      secondaryFont: brand.brandKit?.typography.secondaryFont || 'Inter',
      systemFallback: brand.brandKit?.typography.systemFallback || 'sans-serif',
    },
    visualStyle: brand.brandKit?.visualStyle || 'modern',
    logoLock: {
      variants: {
        primary: brand.brandKit?.logoLock.variants.primary || { url: '', storagePath: '', format: 'png' },
        horizontal: brand.brandKit?.logoLock.variants.horizontal,
        icon: brand.brandKit?.logoLock.variants.icon,
      },
      locked: brand.brandKit?.logoLock.locked ?? false,
    },
    updatedAt: brand.brandKit?.updatedAt || Timestamp.now(),
  }));

  const [aiConfig, setAiConfig] = useState(brand.aiConfiguration || {
    temperature: 0.7,
    topP: 0.95,
    profile: 'equilibrado' as const
  });

  const handleSave = async () => {
    if (!brand?.id) return;
    setLoading(true);
    try {
      // Atualizar tanto o BrandKit quanto a configuração de IA
      const { updateBrand } = await import('@/lib/firebase/brands');
      await Promise.all([
        updateBrandKit(brand.id, kit),
        updateBrand(brand.id, { aiConfiguration: aiConfig })
      ]);
      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Não foi possível salvar as alterações');
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (presetKey: keyof typeof AI_PRESETS) => {
    setAiConfig(AI_PRESETS[presetKey]);
    toast.info(`Perfil "${presetKey}" aplicado`, {
      description: `Temperatura: ${AI_PRESETS[presetKey].temperature}, Top-P: ${AI_PRESETS[presetKey].topP}`
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingLogo(true);
    try {
      const url = await uploadLogo(file, brand.id, user.id);
      const updatedKit: BrandKit = { 
        ...kit, 
        logoLock: { 
          ...kit.logoLock, 
          variants: {
            ...kit.logoLock.variants,
            primary: {
              url,
              storagePath: `brands/${brand.id}/logos/${file.name}`,
              format: file.type.split('/')[1] as any || 'png'
            }
          },
          locked: true // Trava automaticamente ao subir logo oficial
        },
        updatedAt: Timestamp.now()
      };
      
      setKit(updatedKit);
      
      // AUTO-SAVE (Dandara/Darllyson): Salvando automaticamente no Firestore 
      // para evitar que o usuário perca o upload ao navegar ou atualizar a página.
      await updateBrandKit(brand.id, updatedKit);
      
      toast.success("Logo enviada e salva!", {
        description: "A logo foi vinculada à marca e o Logo Lock foi ativado.",
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error("Erro no upload", {
        description: "Não foi possível enviar a logo.",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  // ... handleSave ...

  return (
    <div className="space-y-6">
      <Card>
        {/* ... Header ... */}
        <CardContent className="space-y-6">
          {/* ... Cores ... */}

          {/* ... Estilo Visual ... */}

          {/* LOGO LOCK */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  Governança de Logo (Logo Lock)
                  {kit.logoLock.locked ? (
                    <Lock className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Unlock className="w-4 h-4 text-muted-foreground" />
                  )}
                </Label>
                <p className="text-sm text-muted-foreground">
                  Quando ativo, a IA é proibida de criar variações da sua logo original.
                </p>
              </div>
              <Button 
                variant={kit.logoLock.locked ? "default" : "outline"}
                size="sm"
                className={kit.logoLock.locked ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                onClick={() => setKit({ ...kit, logoLock: { ...kit.logoLock, locked: !kit.logoLock.locked } })}
              >
                {kit.logoLock.locked ? "Ativado" : "Desativado"}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Logo Principal (SVG recomendado)</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="URL da imagem..." 
                      value={kit.logoLock.variants.primary.url}
                      onChange={(e) => setKit({ 
                        ...kit, 
                        logoLock: { 
                          ...kit.logoLock, 
                          variants: {
                            ...kit.logoLock.variants,
                            primary: { ...kit.logoLock.variants.primary, url: e.target.value }
                          }
                        } 
                      })}
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
                      <Button
                        variant="outline"
                        asChild
                        disabled={uploadingLogo}
                      >
                        <label htmlFor="logo-upload" className="cursor-pointer">
                          {uploadingLogo ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                        </label>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview da Logo */}
              <div className="flex flex-col items-center justify-center p-4 border border-dashed rounded-xl bg-white/5">
                {kit.logoLock.variants.primary.url ? (
                  <>
                    <img 
                      src={kit.logoLock.variants.primary.url} 
                      alt="Preview Logo" 
                      className="max-h-24 object-contain mb-2"
                    />
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
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
          </div>

          {/* CONFIGURAÇÃO DE IA (ST-12.3) */}
          <div className="pt-8 border-t border-white/[0.05]">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <BrainCircuit className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Configuração de IA (Deep Intelligence)</h3>
                <p className="text-xs text-zinc-500">Personalize como o Conselho deve se comportar para esta marca.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold uppercase text-zinc-400">Personalidade da Marca</Label>
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(AI_PRESETS).map((p) => (
                      <Button
                        key={p}
                        variant="outline"
                        size="sm"
                        className={cn(
                          "justify-start gap-2 border-white/[0.05] hover:bg-white/[0.05]",
                          aiConfig.profile === p && "border-emerald-500/50 bg-emerald-500/5 text-emerald-400"
                        )}
                        onClick={() => applyPreset(p as keyof typeof AI_PRESETS)}
                      >
                        {p === 'agressivo' && <Zap className="w-3 h-3" />}
                        {p === 'sobrio' && <ShieldCheck className="w-3 h-3" />}
                        <span className="capitalize">{p}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Label className="text-xs font-bold uppercase text-zinc-400">Temperatura</Label>
                    <span className="text-xs font-mono text-emerald-400">{aiConfig.temperature}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="1.0" 
                    step="0.1" 
                    value={aiConfig.temperature}
                    onChange={(e) => setAiConfig({ ...aiConfig, temperature: parseFloat(e.target.value), profile: 'equilibrado' })}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-600 font-bold uppercase">
                    <span>Preciso (0.1)</span>
                    <span>Criativo (1.0)</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Label className="text-xs font-bold uppercase text-zinc-400">Top-P (Amostragem)</Label>
                    <span className="text-xs font-mono text-blue-400">{aiConfig.topP}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="1.0" 
                    step="0.05" 
                    value={aiConfig.topP}
                    onChange={(e) => setAiConfig({ ...aiConfig, topP: parseFloat(e.target.value), profile: 'equilibrado' })}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-blue-500/5 border border-white/[0.05] flex flex-col justify-center">
                <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  Impacto na Geração
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {aiConfig.temperature > 0.7 
                    ? "A IA terá mais liberdade criativa, ideal para headlines disruptivas e ângulos de marketing agressivos." 
                    : aiConfig.temperature < 0.4
                    ? "A IA será mais conservadora e factual, seguindo estritamente as diretrizes e evitando alucinações."
                    : "Equilíbrio entre criatividade e precisão, recomendado para a maioria dos casos de uso."}
                </p>
                <div className="mt-4 pt-4 border-t border-white/[0.05] flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-zinc-500" />
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">Conselho Otimizado</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={loading || uploadingLogo} className="bg-emerald-600 hover:bg-emerald-700">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar BrandKit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

