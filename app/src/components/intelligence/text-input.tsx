'use client';

import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { FileText, Upload, X, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { TextInputType, TextInputFormat } from '@/types/text-analysis';

const TEXT_TYPE_OPTIONS: { value: TextInputType; label: string }[] = [
  { value: 'vsl_transcript', label: 'Transcrição de VSL' },
  { value: 'ad_copy', label: 'Copy de Anúncio' },
  { value: 'landing_page', label: 'Landing Page' },
  { value: 'general', label: 'Texto Geral' },
];

const ACCEPTED_EXTENSIONS = ['.txt', '.srt', '.vtt'];

interface TextInputProps {
  onAnalyze: (params: {
    text: string;
    textType: TextInputType;
    format?: TextInputFormat;
  }) => void;
  loading?: boolean;
  className?: string;
}

export function TextInput({ onAnalyze, loading, className }: TextInputProps) {
  const [text, setText] = useState('');
  const [textType, setTextType] = useState<TextInputType>('general');
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const charCount = text.length;
  const isValid = charCount >= 50 && charCount <= 50_000;

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      toast.error('Formato não suportado. Use .txt, .srt ou .vtt');
      return;
    }

    try {
      const content = await file.text();
      setText(content);
      setFileName(file.name);

      // Auto-detect type by extension
      if (ext === '.srt' || ext === '.vtt') {
        setTextType('vsl_transcript');
      }
    } catch {
      toast.error('Erro ao ler arquivo');
    }

    // Reset input
    if (fileRef.current) fileRef.current.value = '';
  }, []);

  const clearFile = useCallback(() => {
    setFileName(null);
    setText('');
  }, []);

  const handleSubmit = useCallback(() => {
    if (!isValid) {
      toast.error(charCount < 50 ? 'Texto muito curto (mín. 50 caracteres)' : 'Texto muito longo (máx. 50.000 caracteres)');
      return;
    }

    const ext = fileName?.split('.').pop()?.toLowerCase();
    const format: TextInputFormat | undefined =
      ext === 'srt' ? 'srt' : ext === 'vtt' ? 'vtt' : ext === 'txt' ? 'txt' : undefined;

    onAnalyze({ text, textType, format });
  }, [text, textType, fileName, isValid, charCount, onAnalyze]);

  return (
    <Card className={cn('border-zinc-800 bg-zinc-900/60', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-cyan-400" />
          Análise de Texto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Text type selector */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={textType} onValueChange={(v) => setTextType(v as TextInputType)}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Tipo de texto" />
            </SelectTrigger>
            <SelectContent>
              {TEXT_TYPE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* File upload */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={loading}
            >
              <Upload className="h-3.5 w-3.5" />
              Upload
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.srt,.vtt"
              className="hidden"
              onChange={handleFileUpload}
            />
            {fileName && (
              <span className="text-xs text-zinc-400 flex items-center gap-1">
                {fileName}
                <button onClick={clearFile} className="hover:text-zinc-200">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Textarea */}
        <div className="relative">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Cole aqui o texto, transcrição de VSL, copy de anúncio ou conteúdo de landing page..."
            className="min-h-[160px] resize-y text-sm"
            disabled={loading}
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            <span className={cn(
              'text-[10px] tabular-nums',
              charCount > 50_000 ? 'text-red-400' : charCount < 50 ? 'text-zinc-600' : 'text-zinc-500'
            )}>
              {charCount.toLocaleString('pt-BR')} / 50.000
            </span>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analisar Texto
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
