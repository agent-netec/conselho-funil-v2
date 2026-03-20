'use client';

import { useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SocialWizard } from '@/components/social/social-wizard';
import { KnowledgeUploader } from '@/components/social/knowledge-uploader';
import { CalendarContent } from '@/app/(app)/content/calendar/page';
import { useBrandStore } from '@/lib/stores/brand-store';
import { cn } from '@/lib/utils';
import { Sparkles, Calendar, CheckCircle } from 'lucide-react';

type SocialTab = 'create' | 'calendar' | 'approvals';

const TABS: { id: SocialTab; label: string; icon: typeof Sparkles }[] = [
  { id: 'create', label: 'Criar', icon: Sparkles },
  { id: 'calendar', label: 'Calendário', icon: Calendar },
  { id: 'approvals', label: 'Aprovações', icon: CheckCircle },
];

function SocialPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { selectedBrand } = useBrandStore();
  const [showKB, setShowKB] = useState(false);

  const tabParam = searchParams.get('tab') as SocialTab | null;
  const activeTab: SocialTab = tabParam && TABS.some(t => t.id === tabParam) ? tabParam : 'create';

  // Pre-fill topic from trends (passed via query param)
  const initialTopic = searchParams.get('topic') || undefined;

  const setTab = useCallback((tab: SocialTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'create') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    router.replace(`/social${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="shrink-0 border-b border-white/[0.06]">
        <div className="px-8 pt-8 pb-0 max-w-[1440px] mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-[42px] font-black tracking-[-0.02em] text-[#F5E8CE] leading-none">
                Social
              </h1>
              <p className="text-sm text-[#6B5D4A] mt-2 font-mono max-w-xl">
                Crie conteúdo, organize no calendário e aprove para publicação.
              </p>
            </div>
            {activeTab === 'create' && (
              <button
                onClick={() => setShowKB(true)}
                className="text-[11px] font-mono font-bold tracking-wider text-[#0D0B09] bg-[#E6B447] hover:bg-[#F0C35C] px-4 py-2 transition-colors"
              >
                ADICIONAR CONHECIMENTO →
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all border-b-2 -mb-[1px]',
                    isActive
                      ? 'border-[#E6B447] text-[#E6B447]'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="flex-1 px-8 py-6 max-w-[1440px] mx-auto w-full">
        {activeTab === 'create' && (
          <SocialWizard initialTopic={initialTopic} />
        )}
        {activeTab === 'calendar' && (
          <CalendarContent />
        )}
        {activeTab === 'approvals' && (
          <CalendarContent />
        )}
      </main>

      <KnowledgeUploader
        brandId={selectedBrand?.id}
        open={showKB}
        onOpenChange={setShowKB}
      />
    </div>
  );
}

export default function SocialPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-500">Carregando...</div>}>
      <SocialPageInner />
    </Suspense>
  );
}
