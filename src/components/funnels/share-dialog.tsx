'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Share2, 
  Copy, 
  Check, 
  Link2, 
  X,
  Trash2,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { notify } from '@/lib/stores/notification-store';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  funnelId: string;
  funnelName: string;
  currentShareUrl?: string | null;
}

export function ShareDialog({ 
  isOpen, 
  onClose, 
  funnelId, 
  funnelName,
  currentShareUrl: initialShareUrl,
}: ShareDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(initialShareUrl || null);
  const [copied, setCopied] = useState(false);
  const [expiresIn, setExpiresIn] = useState<number>(0); // 0 = never

  const createShareLink = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/funnels/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funnelId, expiresIn }),
      });

      const data = await response.json();
      
      if (data.success) {
        setShareUrl(data.shareUrl);
        notify.success('Link criado!', 'Compartilhe o link com quem quiser');
      } else {
        notify.error('Erro', data.error);
      }
    } catch (error) {
      notify.error('Erro', 'Não foi possível criar o link');
    } finally {
      setIsLoading(false);
    }
  };

  const removeShareLink = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/funnels/share?funnelId=${funnelId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        setShareUrl(null);
        notify.info('Link removido', 'O compartilhamento foi desativado');
      }
    } catch (error) {
      notify.error('Erro', 'Não foi possível remover o link');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      notify.success('Copiado!');
    } catch {
      notify.error('Erro ao copiar');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Share2 className="h-5 w-5 text-emerald-400" />
            Compartilhar Funil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-sm text-zinc-400">
            Crie um link público para compartilhar <strong className="text-white">&quot;{funnelName}&quot;</strong> com qualquer pessoa.
          </p>

          {!shareUrl ? (
            <>
              {/* Expiration selector */}
              <div className="space-y-2">
                <label className="text-sm text-zinc-400 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Expiração do link
                </label>
                <div className="flex gap-2">
                  {[
                    { label: 'Nunca', value: 0 },
                    { label: '7 dias', value: 7 },
                    { label: '30 dias', value: 30 },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setExpiresIn(option.value)}
                      className={cn(
                        'flex-1 py-2 px-3 rounded-lg text-sm transition-all',
                        expiresIn === option.value
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={createShareLink}
                disabled={isLoading}
                className="w-full btn-accent"
              >
                {isLoading ? 'Criando...' : 'Criar Link de Compartilhamento'}
              </Button>
            </>
          ) : (
            <>
              {/* Share URL display */}
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Link público</label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2 border border-zinc-700">
                    <Link2 className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                    <span className="text-sm text-white truncate">{shareUrl}</span>
                  </div>
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={copyToClipboard}
                  className="flex-1 btn-accent"
                >
                  {copied ? 'Copiado!' : 'Copiar Link'}
                </Button>
                <Button
                  onClick={removeShareLink}
                  variant="outline"
                  className="text-red-400 hover:text-red-300"
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          <p className="text-xs text-zinc-500 text-center">
            Qualquer pessoa com o link poderá ver as propostas do funil.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}


