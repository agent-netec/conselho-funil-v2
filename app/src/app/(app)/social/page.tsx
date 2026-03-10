'use client';

import { useState } from 'react';
import { SocialWizard } from '@/components/social/social-wizard';
import { KnowledgeUploader } from '@/components/social/knowledge-uploader';
import { useBrandStore } from '@/lib/stores/brand-store';

export default function SocialPage() {
  const { selectedBrand } = useBrandStore();
  const [showKB, setShowKB] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="shrink-0 border-b border-white/[0.06]">
        <div className="px-8 pt-8 pb-6 max-w-[1440px] mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[42px] font-black tracking-[-0.02em] text-[#F5E8CE] leading-none">
                Social
              </h1>
              <p className="text-sm text-[#6B5D4A] mt-2 font-mono max-w-xl">
                Configure sua campanha, gere hooks estratégicos e receba avaliação calibrada dos especialistas.
              </p>
            </div>
            <button
              onClick={() => setShowKB(true)}
              className="text-[11px] font-mono font-bold tracking-wider text-[#0D0B09] bg-[#E6B447] hover:bg-[#F0C35C] px-4 py-2 transition-colors"
            >
              ADICIONAR CONHECIMENTO →
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-8 py-6 max-w-[1440px] mx-auto w-full">
        <SocialWizard />
      </main>

      <KnowledgeUploader
        brandId={selectedBrand?.id}
        open={showKB}
        onOpenChange={setShowKB}
      />
    </div>
  );
}
