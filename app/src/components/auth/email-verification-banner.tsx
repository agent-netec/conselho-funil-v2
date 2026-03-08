'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Mail, X } from 'lucide-react';

interface EmailVerificationBannerProps {
  onResend: () => Promise<void>;
}

const COOLDOWN_SECONDS = 60;

export function EmailVerificationBanner({ onResend }: EmailVerificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sent, setSent] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleResend = useCallback(async () => {
    if (cooldown > 0) return;
    try {
      await onResend();
      setSent(true);
      setCooldown(COOLDOWN_SECONDS);
      intervalRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setSent(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      // Silently fail
    }
  }, [cooldown, onResend]);

  if (dismissed) return null;

  return (
    <div className="bg-[#E6B447]/10 border-b border-[#E6B447]/20 px-4 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <Mail className="h-4 w-4 text-[#E6B447] shrink-0" />
        <span className="text-sm text-[#F5E8CE]/80 truncate">
          Verifique seu email para ativar todos os recursos.
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleResend}
          disabled={cooldown > 0}
          className="text-sm font-medium text-[#E6B447] hover:text-[#F0C35C] transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {sent && cooldown > 0
            ? `Reenviado (${cooldown}s)`
            : 'Reenviar email'}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
          aria-label="Fechar banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
