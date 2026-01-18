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
import { Loader2, Lock, Unlock, Upload, Check, Palette } from 'lucide-react';

interface BrandKitFormProps {
  brand: Brand;
}

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

  const handleSave = async () => {
    if (!brand?.id) return;
    setLoading(true);
    try {
      await updateBrandKit(brand.id, kit);
      toast.success('BrandKit salvo com sucesso');
    } catch (error) {
      console.error('Erro ao salvar BrandKit:', error);
      toast.error('Não foi possível salvar o BrandKit');
    } finally {
      setLoading(false);
    }
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

