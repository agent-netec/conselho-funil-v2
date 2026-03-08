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
    <html lang="pt-BR" className="dark">
      <body className="bg-[#0D0B09]">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E6B447]/10">
              <span className="text-3xl" role="img" aria-label="warning">&#9888;&#65039;</span>
            </div>
            <h2 className="mb-2 text-xl font-bold text-[#F5E8CE]">Algo deu errado</h2>
            <p className="mb-6 text-sm text-[#A89B84]">Ocorreu um erro inesperado.</p>
            <button
              onClick={reset}
              className="rounded-lg bg-[#E6B447] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#F0C35C]"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
