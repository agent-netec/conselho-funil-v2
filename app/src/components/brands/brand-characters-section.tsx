'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { uploadBrandAsset } from '@/lib/firebase/storage';
import { createAsset } from '@/lib/firebase/assets';
import { useUser } from '@/lib/hooks/use-user';
import { Users, Plus, Trash2, Loader2, Upload, UserCircle } from 'lucide-react';
import Image from 'next/image';
import type { BrandCharacter } from '@/types/design-system';
import type { BrandAsset } from '@/types/database';

interface BrandCharactersSectionProps {
  brandId: string;
  characters: BrandCharacter[];
  onUpdate: (characters: BrandCharacter[]) => void;
}

const ROLE_LABELS: Record<BrandCharacter['role'], string> = {
  ambassador: 'Embaixador(a)',
  founder: 'Fundador(a)',
  customer: 'Cliente',
  mascot: 'Mascote',
  model: 'Modelo',
};

const FREQUENCY_LABELS: Record<BrandCharacter['useFrequency'], string> = {
  always: 'Sempre',
  sometimes: 'Às vezes',
  rarely: 'Raramente',
};

const ROLE_COLORS: Record<BrandCharacter['role'], string> = {
  ambassador: 'bg-[#E6B447]/20 text-[#E6B447] border-[#E6B447]/30',
  founder: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  customer: 'bg-green-500/20 text-green-400 border-green-500/30',
  mascot: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  model: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export function BrandCharactersSection({ brandId, characters, onUpdate }: BrandCharactersSectionProps) {
  const { user } = useUser();
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [role, setRole] = useState<BrandCharacter['role']>('ambassador');
  const [description, setDescription] = useState('');
  const [useFrequency, setUseFrequency] = useState<BrandCharacter['useFrequency']>('sometimes');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setRole('ambassador');
    setDescription('');
    setUseFrequency('sometimes');
    setSelectedFile(null);
    setFilePreview(null);
    setShowForm(false);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande', { description: 'O tamanho máximo é 5MB.' });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setFilePreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    multiple: false,
  });

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!selectedFile) {
      toast.error('Foto é obrigatória');
      return;
    }
    if (!user) {
      toast.error('Você precisa estar autenticado');
      return;
    }

    setUploading(true);
    try {
      // 1. Upload photo
      const { url: photoUrl } = await uploadBrandAsset(selectedFile, brandId, user.id);

      // 2. Create asset record
      const assetPayload: Omit<BrandAsset, 'id'> = {
        brandId,
        userId: user.id,
        name: `Personagem: ${name.trim()}`,
        originalName: selectedFile.name,
        type: 'image',
        mimeType: selectedFile.type,
        size: selectedFile.size,
        url: photoUrl,
        status: 'ready',
        isApprovedForAI: true,
        createdAt: Timestamp.now(),
        processedAt: Timestamp.now(),
        metadata: {
          sourceType: 'image',
          originalName: selectedFile.name,
          isApprovedForAI: true,
          extractedAt: new Date().toISOString(),
          processingMethod: 'gemini-vision',
        },
      };
      const assetId = await createAsset(assetPayload);

      // 3. Build new character
      const newCharacter: BrandCharacter = {
        id: crypto.randomUUID(),
        name: name.trim(),
        role,
        photoAssetId: assetId,
        photoUrl,
        description: description.trim() || undefined,
        useFrequency,
        createdAt: Timestamp.now(),
      };

      // 4. Update parent
      onUpdate([...characters, newCharacter]);
      resetForm();
      toast.success('Personagem adicionado!');
    } catch (error) {
      console.error('Erro ao criar personagem:', error);
      toast.error('Erro ao criar personagem', { description: 'Tente novamente.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (characterId: string) => {
    const updated = characters.filter((c) => c.id !== characterId);
    onUpdate(updated);
    toast.success('Personagem removido');
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#E6B447]/10 border border-[#E6B447]/20">
            <Users className="w-5 h-5 text-[#E6B447]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Personagens da Marca</h3>
            <p className="text-xs text-zinc-500">Defina os rostos e personas que representam sua marca nos criativos.</p>
          </div>
        </div>
        {!showForm && (
          <Button
            variant="outline"
            size="sm"
            className="border-[#E6B447]/30 text-[#E6B447] hover:bg-[#E6B447]/10"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar Personagem
          </Button>
        )}
      </div>

      {/* Character Grid */}
      {characters.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((character) => (
            <div
              key={character.id}
              className="group relative p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
            >
              {/* Delete Button */}
              <button
                onClick={() => handleDelete(character.id)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                title="Remover personagem"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Photo */}
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/[0.08] flex-shrink-0 bg-zinc-800">
                  {character.photoUrl ? (
                    <Image
                      src={character.photoUrl}
                      alt={character.name}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserCircle className="w-8 h-8 text-zinc-600" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{character.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn('text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border', ROLE_COLORS[character.role])}>
                      {ROLE_LABELS[character.role]}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Frequência: {FREQUENCY_LABELS[character.useFrequency]}
                  </p>
                </div>
              </div>

              {/* Description */}
              {character.description && (
                <p className="text-xs text-zinc-400 mt-3 line-clamp-2">{character.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {characters.length === 0 && !showForm && (
        <div className="text-center py-8 border border-dashed border-white/[0.06] rounded-xl">
          <UserCircle className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">Nenhum personagem cadastrado</p>
          <p className="text-xs text-zinc-600 mt-1">Adicione fundadores, embaixadores ou modelos da sua marca.</p>
        </div>
      )}

      {/* Inline Add Form */}
      {showForm && (
        <div className="p-5 rounded-xl bg-white/[0.03] border border-[#E6B447]/20 space-y-4">
          <h4 className="text-xs font-bold text-[#E6B447] uppercase tracking-wider">Novo Personagem</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column: Fields */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Nome *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="bg-white/[0.03] border-white/[0.08] text-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Papel</Label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as BrandCharacter['role'])}
                  className="w-full h-9 px-3 rounded-md bg-white/[0.03] border border-white/[0.08] text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#E6B447]/50"
                >
                  <option value="ambassador" className="bg-[#0D0B09]">Embaixador(a)</option>
                  <option value="founder" className="bg-[#0D0B09]">Fundador(a)</option>
                  <option value="customer" className="bg-[#0D0B09]">Cliente</option>
                  <option value="mascot" className="bg-[#0D0B09]">Mascote</option>
                  <option value="model" className="bg-[#0D0B09]">Modelo</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Frequência de Uso</Label>
                <select
                  value={useFrequency}
                  onChange={(e) => setUseFrequency(e.target.value as BrandCharacter['useFrequency'])}
                  className="w-full h-9 px-3 rounded-md bg-white/[0.03] border border-white/[0.08] text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#E6B447]/50"
                >
                  <option value="always" className="bg-[#0D0B09]">Sempre</option>
                  <option value="sometimes" className="bg-[#0D0B09]">Às vezes</option>
                  <option value="rarely" className="bg-[#0D0B09]">Raramente</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Descrição (opcional)</Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: CEO da empresa, aparece em vídeos institucionais..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-md bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#E6B447]/50 resize-none"
                />
              </div>
            </div>

            {/* Right Column: Photo Upload */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Foto *</Label>
              <div
                {...getRootProps()}
                className={cn(
                  'flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors min-h-[200px]',
                  isDragActive
                    ? 'border-[#E6B447] bg-[#E6B447]/5'
                    : 'border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02]',
                  filePreview && 'border-[#E6B447]/30'
                )}
              >
                <input {...getInputProps()} />
                {filePreview ? (
                  <div className="text-center">
                    <Image
                      src={filePreview}
                      alt="Preview"
                      width={120}
                      height={120}
                      className="w-24 h-24 rounded-full object-cover mx-auto mb-2 border-2 border-[#E6B447]/30"
                      unoptimized
                    />
                    <p className="text-xs text-zinc-400 truncate max-w-[180px]">{selectedFile?.name}</p>
                    <p className="text-[10px] text-zinc-600 mt-1">Clique para trocar</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                    <p className="text-xs text-zinc-400">Arraste uma foto ou clique para selecionar</p>
                    <p className="text-[10px] text-zinc-600 mt-1">PNG, JPG ou WEBP (máx. 5MB)</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetForm}
              disabled={uploading}
              className="text-zinc-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={uploading || !name.trim() || !selectedFile}
              className="bg-[#E6B447] hover:bg-[#AB8648] text-black font-semibold"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
