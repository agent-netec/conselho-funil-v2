'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Mic, Plus, X, Loader2, Sparkles, Check, Globe, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import type { VoiceProfile } from '@/types/database';

interface VoiceProfileEditorProps {
  brandId: string;
  currentProfile?: VoiceProfile;
  onSaved?: () => void;
}

export function VoiceProfileEditor({ brandId, currentProfile, onSaved }: VoiceProfileEditorProps) {
  const [profile, setProfile] = useState<VoiceProfile>({
    primaryTone: currentProfile?.primaryTone || '',
    secondaryTone: currentProfile?.secondaryTone || '',
    preferredVocabulary: currentProfile?.preferredVocabulary || [],
    forbiddenTerms: currentProfile?.forbiddenTerms || [],
    samplePhrases: currentProfile?.samplePhrases || [],
    language: currentProfile?.language || 'pt-BR',
  });
  const [newVocab, setNewVocab] = useState('');
  const [newForbidden, setNewForbidden] = useState('');
  const [newPhrase, setNewPhrase] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingSamples, setIsGeneratingSamples] = useState(false);
  const [voiceSamples, setVoiceSamples] = useState<{ context: string; sample: string; approved: boolean }[]>([]);

  useEffect(() => {
    if (currentProfile) {
      setProfile(currentProfile);
    }
  }, [currentProfile]);

  const addItem = (field: 'preferredVocabulary' | 'forbiddenTerms' | 'samplePhrases', value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    setProfile(prev => ({
      ...prev,
      [field]: [...prev[field], value.trim()],
    }));
    setter('');
  };

  const removeItem = (field: 'preferredVocabulary' | 'forbiddenTerms' | 'samplePhrases', index: number) => {
    setProfile(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const brandRef = doc(db, 'brands', brandId);
      await updateDoc(brandRef, {
        voiceProfile: profile,
        updatedAt: Timestamp.now(),
      });
      toast.success('Perfil de voz salvo!');
      onSaved?.();
    } catch (err) {
      console.error('Error saving voice profile:', err);
      toast.error('Erro ao salvar perfil de voz');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateSamples = async () => {
    if (!profile.primaryTone) {
      toast.error('Defina o tom principal primeiro');
      return;
    }

    setIsGeneratingSamples(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/brands/${brandId}/voice-samples`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ brandId, voiceProfile: profile }),
      });

      const data = await res.json();
      if (res.ok && data.data?.samples) {
        setVoiceSamples(data.data.samples.map((s: any) => ({ ...s, approved: false })));
        toast.success('Exemplos de voz gerados!');
      } else {
        toast.error(data.error || 'Erro ao gerar exemplos');
      }
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setIsGeneratingSamples(false);
    }
  };

  const LANGUAGES = [
    { id: 'pt-BR', label: 'Português (BR)' },
    { id: 'en', label: 'English' },
    { id: 'es', label: 'Español' },
  ];

  return (
    <div className="space-y-6">
      {/* Language selector */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="w-4 h-4 text-blue-400" />
            Idioma da Marca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {LANGUAGES.map(lang => (
              <button
                key={lang.id}
                onClick={() => setProfile(p => ({ ...p, language: lang.id }))}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all border',
                  profile.language === lang.id
                    ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                    : 'bg-zinc-800/50 border-white/[0.04] text-zinc-500 hover:text-zinc-300'
                )}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Primary & Secondary Tone */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mic className="w-4 h-4 text-violet-400" />
            Tom de Voz
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 font-medium uppercase mb-1.5 block">Tom Principal</label>
            <Input
              value={profile.primaryTone}
              onChange={(e) => setProfile(p => ({ ...p, primaryTone: e.target.value }))}
              placeholder="Ex: Autoridade com empatia, Direto e provocativo..."
              className="bg-zinc-800/50 border-white/[0.04]"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 font-medium uppercase mb-1.5 block">Tom Secundário (opcional)</label>
            <Input
              value={profile.secondaryTone || ''}
              onChange={(e) => setProfile(p => ({ ...p, secondaryTone: e.target.value }))}
              placeholder="Ex: Humor sutil, Técnico quando necessário..."
              className="bg-zinc-800/50 border-white/[0.04]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferred Vocabulary */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base">Vocabulário Preferido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newVocab}
              onChange={(e) => setNewVocab(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem('preferredVocabulary', newVocab, setNewVocab)}
              placeholder="Adicionar termo..."
              className="bg-zinc-800/50 border-white/[0.04]"
            />
            <Button size="sm" onClick={() => addItem('preferredVocabulary', newVocab, setNewVocab)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {profile.preferredVocabulary.map((term, i) => (
              <Badge key={i} variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/5 gap-1">
                {term}
                <button onClick={() => removeItem('preferredVocabulary', i)}><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Forbidden Terms */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base">Termos Proibidos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newForbidden}
              onChange={(e) => setNewForbidden(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem('forbiddenTerms', newForbidden, setNewForbidden)}
              placeholder="Adicionar termo proibido..."
              className="bg-zinc-800/50 border-white/[0.04]"
            />
            <Button size="sm" variant="destructive" onClick={() => addItem('forbiddenTerms', newForbidden, setNewForbidden)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {profile.forbiddenTerms.map((term, i) => (
              <Badge key={i} variant="outline" className="border-red-500/20 text-red-400 bg-red-500/5 gap-1">
                {term}
                <button onClick={() => removeItem('forbiddenTerms', i)}><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sample Phrases */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base">Frases de Exemplo da Marca</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newPhrase}
              onChange={(e) => setNewPhrase(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem('samplePhrases', newPhrase, setNewPhrase)}
              placeholder="Adicionar frase de exemplo..."
              className="bg-zinc-800/50 border-white/[0.04]"
            />
            <Button size="sm" onClick={() => addItem('samplePhrases', newPhrase, setNewPhrase)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {profile.samplePhrases.map((phrase, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/30 border border-white/[0.03]">
                <p className="text-xs text-zinc-300 flex-1 italic">"{phrase}"</p>
                <button onClick={() => removeItem('samplePhrases', i)} className="text-zinc-500 hover:text-red-400">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Voice Samples (X-3.2) */}
      {voiceSamples.length > 0 && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Exemplos de Voz Gerados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {voiceSamples.map((sample, i) => (
              <div key={i} className={cn(
                'p-3 rounded-lg border',
                sample.approved ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-zinc-800/30 border-white/[0.03]'
              )}>
                <p className="text-[10px] text-zinc-500 uppercase font-medium mb-1">{sample.context}</p>
                <p className="text-xs text-zinc-300 italic">"{sample.sample}"</p>
                <div className="flex justify-end mt-2">
                  <Button
                    size="sm"
                    variant={sample.approved ? 'default' : 'outline'}
                    className={cn('h-7 text-[10px]', sample.approved && 'bg-emerald-500')}
                    onClick={() => {
                      setVoiceSamples(prev => prev.map((s, idx) => idx === i ? { ...s, approved: !s.approved } : s));
                    }}
                  >
                    {sample.approved ? <><Check className="mr-1 h-3 w-3" />Aprovado</> : 'Aprovar'}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
        <Button
          variant="outline"
          onClick={handleGenerateSamples}
          disabled={isGeneratingSamples || !profile.primaryTone}
          className="border-white/[0.05]"
        >
          {isGeneratingSamples ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Gerar Exemplos de Voz
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
          Salvar Perfil de Voz
        </Button>
      </div>
    </div>
  );
}
