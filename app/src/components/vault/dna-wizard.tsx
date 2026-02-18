'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dna, Loader2, Sparkles, Check, X } from 'lucide-react';
import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import { notify } from '@/lib/stores/notification-store';

interface DNAWizardProps {
  onClose: () => void;
  onSaved?: () => void;
}

export function DNAWizard({ onClose, onSaved }: DNAWizardProps) {
  const activeBrand = useActiveBrand();
  const [text, setText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedDNA, setExtractedDNA] = useState<any>(null);

  const handleExtract = async () => {
    if (!activeBrand?.id || text.trim().length < 20) {
      notify.error('Cole um texto com pelo menos 20 caracteres.');
      return;
    }

    setIsExtracting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/vault/dna/extract', {
        method: 'POST',
        headers,
        body: JSON.stringify({ brandId: activeBrand.id, text }),
      });

      const data = await res.json();
      if (res.ok && data.data) {
        setExtractedDNA(data.data);
        notify.success('DNA extraído com sucesso!');
      } else {
        notify.error(data.error || 'Erro ao extrair DNA');
      }
    } catch {
      notify.error('Erro de conexão ao extrair DNA');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-2xl bg-zinc-900 border-white/[0.06] p-6 mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Dna className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-bold text-zinc-100">Extrair Copy DNA</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {!extractedDNA ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              Cole um exemplo de copy/conteúdo abaixo. A IA vai extrair o padrão (hook, estrutura, tom, CTA) e salvar como DNA Template.
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Cole aqui um exemplo de copy que você quer transformar em template DNA..."
              className="w-full h-48 p-4 rounded-xl bg-zinc-800/50 border border-white/[0.06] text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">{text.length} caracteres (mín. 20)</span>
              <Button
                onClick={handleExtract}
                disabled={isExtracting || text.trim().length < 20}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isExtracting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Extraindo...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" />Extrair DNA</>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
              <h3 className="text-sm font-bold text-blue-400 mb-2">{extractedDNA.extracted?.name || 'DNA Extraído'}</h3>
              <p className="text-xs text-zinc-400 mb-3">{extractedDNA.extracted?.content}</p>
              <div className="flex flex-wrap gap-1.5">
                {extractedDNA.extracted?.tags?.map((tag: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-[10px] border-blue-500/20 text-blue-400 bg-blue-500/5">
                    {tag}
                  </Badge>
                ))}
              </div>
              {extractedDNA.extracted?.structure && (
                <p className="text-[11px] text-zinc-500 mt-2">Estrutura: {extractedDNA.extracted.structure}</p>
              )}
              {extractedDNA.extracted?.tone && (
                <p className="text-[11px] text-zinc-500">Tom: {extractedDNA.extracted.tone}</p>
              )}
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => { setExtractedDNA(null); setText(''); }} className="border-white/[0.06]">
                Extrair Outro
              </Button>
              <Button
                onClick={() => { onSaved?.(); onClose(); }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <Check className="mr-2 h-4 w-4" />
                Salvo no Vault
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
