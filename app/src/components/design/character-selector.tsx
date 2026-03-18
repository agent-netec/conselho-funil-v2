'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Check, User } from 'lucide-react';
import type { BrandCharacter } from '@/types/design-system';

const roleLabels: Record<string, string> = {
  ambassador: 'Embaixador',
  founder: 'Fundador',
  customer: 'Cliente',
  mascot: 'Mascote',
  model: 'Modelo',
};

interface CharacterSelectorProps {
  characters: BrandCharacter[];
  selected: string[];
  onSelectionChange: (ids: string[]) => void;
  className?: string;
}

export function CharacterSelector({ characters, selected, onSelectionChange, className }: CharacterSelectorProps) {
  if (characters.length === 0) {
    return (
      <div className={cn('p-6 rounded-xl border border-dashed border-white/10 text-center', className)}>
        <User className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
        <p className="text-xs text-zinc-500">Nenhum personagem cadastrado</p>
        <p className="text-[10px] text-zinc-600 mt-1">Adicione personagens no BrandKit da marca</p>
      </div>
    );
  }

  const toggle = (id: string) => {
    onSelectionChange(
      selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]
    );
  };

  return (
    <div className={cn('space-y-3', className)}>
      <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
        <User className="w-3 h-3 text-[#E6B447]" />
        Personagens da Marca
      </p>
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
        {characters.map((char) => {
          const isSelected = selected.includes(char.id);
          return (
            <button
              key={char.id}
              onClick={() => toggle(char.id)}
              className={cn(
                'relative p-2 rounded-xl border transition-all text-left group',
                isSelected
                  ? 'border-[#E6B447]/50 bg-[#E6B447]/5 shadow-[0_0_12px_rgba(230,180,71,0.1)]'
                  : 'border-white/[0.05] bg-black/30 hover:border-white/10 hover:bg-white/[0.02]'
              )}
            >
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#E6B447] flex items-center justify-center z-10">
                  <Check className="w-3 h-3 text-black" />
                </div>
              )}
              <div className="aspect-square rounded-lg overflow-hidden bg-zinc-900 mb-2">
                {char.photoUrl ? (
                  <Image
                    src={char.photoUrl}
                    alt={char.name}
                    width={120}
                    height={120}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-8 h-8 text-zinc-700" />
                  </div>
                )}
              </div>
              <p className="text-[11px] font-bold text-white truncate">{char.name}</p>
              <p className="text-[9px] text-zinc-500 uppercase font-bold">{roleLabels[char.role] || char.role}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
