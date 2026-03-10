'use client';

import { useEffect } from 'react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AppError]', error.message, error.digest);
  }, [error]);

  return (
    <div className="flex h-full items-center justify-center bg-[#0D0B09] px-4">
      <div className="max-w-md">
        <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A] mb-2">SYSTEM ERROR</p>
        <h2 className="text-2xl font-black text-[#F5E8CE] mb-2">Algo deu errado</h2>
        <p className="text-sm text-[#A89B84] mb-6">
          Ocorreu um erro inesperado. Tente recarregar ou volte ao inicio.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="bg-[#E6B447] text-black px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider hover:bg-[#F0C35C] transition-colors"
          >
            Tentar novamente
          </button>
          <a
            href="/home"
            className="border border-white/10 text-[#F5E8CE] px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider hover:bg-white/5 transition-colors"
          >
            Ir ao inicio
          </a>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <pre className="mt-6 max-h-40 overflow-auto bg-white/5 p-3 text-[10px] font-mono text-[#C45B3A]">
            {error.message}
            {'\n'}
            {error.stack}
          </pre>
        )}
      </div>
    </div>
  );
}
