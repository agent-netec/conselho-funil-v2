'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/home');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 border-2 border-[#E6B447] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zinc-500 text-sm">Carregando...</p>
      </div>
    </div>
  );
}
