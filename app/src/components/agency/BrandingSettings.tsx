"use client";

import React, { useState } from 'react';
import { useBranding } from '@/components/providers/branding-provider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, Palette, Check, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * @fileoverview Componente de Configurações de Branding (ST-23.3)
 */

export const BrandingSettings = () => {
  const { branding, updateBranding } = useBranding();
  const [logoPreview, setLogoPreview] = useState(branding.logoUrl);

  const handleColorChange = (type: 'primary' | 'secondary', color: string) => {
    updateBranding({
      colors: {
        ...branding.colors,
        [type]: color
      }
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        setLogoPreview(url);
        updateBranding({ logoUrl: url });
      };
      reader.readAsDataURL(file);
    }
  };

  const resetBranding = () => {
    const defaultColors = {
      primary: '#10b981',
      secondary: '#8b5cf6'
    };
    updateBranding({ logoUrl: '', colors: defaultColors });
    setLogoPreview('');
  };

  return (
    <div className="space-y-8 animate-in-up">
      {/* Logo Upload */}
      <div className="space-y-4">
        <Label className="text-zinc-300 text-sm font-medium">Logo da Agência</Label>
        <div className="flex items-center gap-6 p-6 rounded-2xl bg-zinc-900/50 border border-white/[0.05]">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-xl bg-zinc-800 border-2 border-dashed border-white/10 overflow-hidden">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo Preview" className="h-full w-full object-contain p-2" />
            ) : (
              <Upload className="text-zinc-600" size={24} />
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 max-w-[200px]">
              Recomendado: PNG ou SVG com fundo transparente. Tamanho máx: 2MB.
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="btn-ghost h-9 text-xs relative"
                onClick={() => document.getElementById('logo-upload')?.click()}
              >
                Upload Logo
                <input 
                  id="logo-upload" 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleLogoUpload} 
                />
              </Button>
              {logoPreview && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-9 text-xs"
                  onClick={() => {
                    setLogoPreview('');
                    updateBranding({ logoUrl: '' });
                  }}
                >
                  Remover
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Color Palette */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-zinc-300 text-sm font-medium">Paleta de Cores</Label>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-[10px] text-zinc-500 hover:text-white gap-1"
            onClick={resetBranding}
          >
            <RefreshCcw size={10} />
            Resetar Padrão
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Primary Color */}
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.05] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Cor Primária</span>
              <div 
                className="h-4 w-4 rounded-full border border-white/10" 
                style={{ backgroundColor: branding.colors.primary }} 
              />
            </div>
            <div className="flex gap-2">
              <Input 
                type="color" 
                value={branding.colors.primary}
                onChange={(e) => handleColorChange('primary', e.target.value)}
                className="w-12 h-10 p-1 bg-zinc-800 border-zinc-700 cursor-pointer"
              />
              <Input 
                type="text" 
                value={branding.colors.primary.toUpperCase()}
                onChange={(e) => handleColorChange('primary', e.target.value)}
                className="flex-1 h-10 bg-zinc-800 border-zinc-700 text-xs font-mono"
              />
            </div>
          </div>

          {/* Secondary Color */}
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.05] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Cor Secundária</span>
              <div 
                className="h-4 w-4 rounded-full border border-white/10" 
                style={{ backgroundColor: branding.colors.secondary }} 
              />
            </div>
            <div className="flex gap-2">
              <Input 
                type="color" 
                value={branding.colors.secondary}
                onChange={(e) => handleColorChange('secondary', e.target.value)}
                className="w-12 h-10 p-1 bg-zinc-800 border-zinc-700 cursor-pointer"
              />
              <Input 
                type="text" 
                value={branding.colors.secondary.toUpperCase()}
                onChange={(e) => handleColorChange('secondary', e.target.value)}
                className="flex-1 h-10 bg-zinc-800 border-zinc-700 text-xs font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="space-y-4">
        <Label className="text-zinc-300 text-sm font-medium">Preview em Tempo Real</Label>
        <div className="p-6 rounded-2xl bg-[#0a0a0c] border border-white/[0.05] space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: branding.colors.primary }}>
              <Palette size={16} />
            </div>
            <div className="h-2 w-32 rounded bg-zinc-800" />
          </div>
          <div className="space-y-2">
            <div className="h-2 w-full rounded bg-zinc-900" />
            <div className="h-2 w-2/3 rounded bg-zinc-900" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: branding.colors.primary }}>
              Botão Primário
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold uppercase tracking-wider border-2" style={{ borderColor: branding.colors.secondary, color: branding.colors.secondary }}>
              Botão Secundário
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
