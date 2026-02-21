'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { SocialWizard } from '@/components/social/social-wizard';
import { KnowledgeUploader } from '@/components/social/knowledge-uploader';
import { Sparkles, BookOpen } from 'lucide-react';
import { useBrandStore } from '@/lib/stores/brand-store';

export default function SocialPage() {
  const { selectedBrand } = useBrandStore();
  const [showKBUploader, setShowKBUploader] = useState(false);

  return (
    <AppShell>
      <div className="flex flex-col gap-8 p-6 lg:p-10">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-rose-400">
              <Sparkles className="h-5 w-5 fill-current" />
              <span className="text-sm font-bold uppercase tracking-wider">Conselho Social</span>
            </div>
            <h1 className="text-3xl font-bold text-zinc-100 sm:text-4xl tracking-tight">
              Geração de Conteúdo Social
            </h1>
            <p className="text-zinc-400 max-w-2xl">
              Configure sua campanha, gere hooks estratégicos, assista ao debate do Conselho Social
              e receba uma avaliação calibrada com frameworks reais dos 4 conselheiros.
            </p>
          </div>
          <button
            onClick={() => setShowKBUploader(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors border border-zinc-700"
          >
            <BookOpen className="h-4 w-4 text-rose-400" />
            Adicionar Conhecimento
          </button>
        </div>

        <div className="w-full">
          <SocialWizard />
        </div>
      </div>

      <KnowledgeUploader
        brandId={selectedBrand?.id}
        open={showKBUploader}
        onOpenChange={setShowKBUploader}
      />
    </AppShell>
  );
}






