'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBrandStore } from '@/lib/stores/brand-store';

/**
 * Brand Hub Redirect — L-3
 * Redireciona /brand-hub para /brands/{selectedBrandId}?tab=brandhub
 * Se nenhuma marca selecionada, redireciona para /brands
 */
export default function BrandHubRedirect() {
  const router = useRouter();
  const { selectedBrand } = useBrandStore();

  useEffect(() => {
    if (selectedBrand?.id) {
      router.replace(`/brands/${selectedBrand.id}?tab=brandhub`);
    } else {
      router.replace('/brands');
    }
  }, [selectedBrand, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
    </div>
  );
}
