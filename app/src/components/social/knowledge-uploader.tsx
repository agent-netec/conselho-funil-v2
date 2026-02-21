'use client';

/**
 * S1: Knowledge Base Uploader for Social module
 * Allows uploading docs (URL, text, PDF) to the Social KB via RAG pipeline.
 *
 * @component
 * @story S1-KB-UPLOAD
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import { toast } from 'sonner';
import {
  BookOpen,
  Link2,
  FileText,
  Upload,
  Loader2,
  X,
} from 'lucide-react';

interface KnowledgeUploaderProps {
  brandId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type InputMode = 'url' | 'text' | 'file';

const CHANNEL_OPTIONS = [
  { value: 'general', label: 'Geral' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'twitter', label: 'X / Twitter' },
] as const;

const DOC_TYPE_OPTIONS = [
  { value: 'social_best_practices', label: 'Best Practices' },
  { value: 'social_policy', label: 'Política de Canal' },
] as const;

export function KnowledgeUploader({ brandId, open, onOpenChange }: KnowledgeUploaderProps) {
  const [mode, setMode] = useState<InputMode>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [channel, setChannel] = useState('general');
  const [docType, setDocType] = useState('social_best_practices');
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setUrl('');
    setChannel('general');
    setDocType('social_best_practices');
  };

  const handleSubmit = async () => {
    if (!brandId) {
      toast.error('Selecione uma marca ativa.');
      return;
    }
    if (!title.trim()) {
      toast.error('Título é obrigatório.');
      return;
    }

    let finalContent = content;

    if (mode === 'url') {
      if (!url.trim()) {
        toast.error('URL é obrigatória.');
        return;
      }
      // For URL mode, pass the URL as content — the backend will process it
      finalContent = `URL: ${url}\n\nConteúdo extraído do link acima.`;
    }

    if (!finalContent.trim()) {
      toast.error('Conteúdo não pode estar vazio.');
      return;
    }

    setUploading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/social/knowledge', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brandId,
          docType,
          channel,
          title: title.trim(),
          content: finalContent.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Conhecimento adicionado! ${data.data?.uploaded || 0} chunk(s) processado(s).`);
        resetForm();
        onOpenChange(false);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erro ao fazer upload.');
      }
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-rose-400" />
            Adicionar Conhecimento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Mode selector */}
          <div className="flex gap-2">
            {([
              { key: 'url' as const, icon: Link2, label: 'URL' },
              { key: 'text' as const, icon: FileText, label: 'Texto' },
              { key: 'file' as const, icon: Upload, label: 'PDF' },
            ]).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === key
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Guia de boas práticas Instagram 2026"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          {/* Mode-specific input */}
          {mode === 'url' && (
            <div>
              <label className="block text-sm text-zinc-400 mb-1">URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>
          )}

          {mode === 'text' && (
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Conteúdo</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                placeholder="Cole aqui as best practices, políticas de canal, ou qualquer conhecimento relevante..."
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
              />
            </div>
          )}

          {mode === 'file' && (
            <div className="p-6 border-2 border-dashed border-zinc-700 rounded-lg text-center">
              <Upload className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-400 mb-1">Upload de PDF</p>
              <p className="text-xs text-zinc-600">Em breve — use o modo Texto por enquanto</p>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Tipo</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
              >
                {DOC_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Canal</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
              >
                {CHANNEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-zinc-400"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={uploading || mode === 'file'}
              className="bg-rose-600 hover:bg-rose-500 text-white"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Enviar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
