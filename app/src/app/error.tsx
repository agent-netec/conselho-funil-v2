'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error.message, error.digest);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0B09] px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E6B447]/10">
          <span className="text-3xl" role="img" aria-label="warning">&#9888;&#65039;</span>
        </div>
        <h2 className="mb-2 text-xl font-bold text-[#F5E8CE]">
          Algo deu errado
        </h2>
        <p className="mb-6 text-sm text-[#A89B84]">
          Ocorreu um erro inesperado. Tente novamente ou volte para o inicio.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-[#E6B447] px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#F0C35C]"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-semibold text-[#F5E8CE] transition-colors hover:bg-white/5"
          >
            Ir para o inicio
          </a>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <pre className="mt-6 max-h-40 overflow-auto rounded-lg bg-white/5 p-3 text-left text-xs text-red-400">
            {error.message}
            {'\n'}
            {error.stack}
          </pre>
        )}
      </div>
    </div>
  );
}
