'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Sparkles,
  Palette,
  ChevronRight,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useBrandStore } from '@/lib/stores/brand-store';

/**
 * Sprint 06.1 — /design is now a campaign picker that redirects to /campaigns/[id]/design
 * No wizard logic here — DesignWizard lives in the campaign route.
 */
export default function DesignStudioPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { selectedBrand } = useBrandStore();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const brandId = selectedBrand?.id || '';

  useEffect(() => {
    async function loadCampaigns() {
      if (!user?.uid || !brandId) {
        setIsLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, 'campaigns'),
          where('userId', '==', user.uid),
          where('brandId', '==', brandId),
          limit(50)
        );
        const snap = await getDocs(q);
        const items = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .filter((c: any) => c.copywriting || c.social)
          .sort((a: any, b: any) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
          .slice(0, 20);
        setCampaigns(items);
      } catch (err) {
        console.error('[DesignStudio] Error loading campaigns:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCampaigns();
  }, [user?.uid, brandId]);

  if (!brandId) {
    return (
      <div className="flex min-h-screen flex-col bg-[#0D0B09]">
        <Header title="Design Studio" />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Selecione uma marca</h2>
            <p className="text-sm text-zinc-500">Ative uma marca no menu para acessar o Design Studio.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0D0B09]">
      <Header title="Design Studio" />

      <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-[#E6B447]/10 text-[#E6B447]">
            <Palette className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Design Studio</h1>
            <p className="text-zinc-500">Selecione uma campanha para criar o sistema visual</p>
          </div>
        </div>

        {/* Campaign List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-[#E6B447]" />
              Campanhas com copy disponível
            </h2>
          </div>

          {isLoading && (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#E6B447]" />
            </div>
          )}

          {!isLoading && campaigns.length === 0 && (
            <div className="p-12 rounded-xl border border-white/[0.05] bg-white/[0.02] text-center">
              <Sparkles className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Nenhuma campanha disponível</h3>
              <p className="text-sm text-zinc-500 mb-4">
                O Design Studio precisa de uma campanha com Copy ou Social aprovados.
              </p>
              <Button asChild className="bg-[#E6B447] hover:bg-[#F0C35C]">
                <Link href="/campaigns">Ir para Campanhas</Link>
              </Button>
            </div>
          )}

          {!isLoading && campaigns.length > 0 && (
            <div className="grid gap-3">
              {campaigns.map((campaign: any) => (
                <button
                  key={campaign.id}
                  onClick={() => router.push(`/campaigns/${campaign.id}/design`)}
                  className="w-full p-4 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#E6B447]/20 transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {campaign.name || 'Campanha sem nome'}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        {campaign.copywriting?.bigIdea && (
                          <span className="text-[10px] text-zinc-500 truncate max-w-[300px]">
                            {campaign.copywriting.bigIdea}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                          Copy
                        </span>
                        {campaign.social && (
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Social
                          </span>
                        )}
                        {campaign.design && (
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#E6B447]/10 text-[#E6B447] border border-[#E6B447]/20">
                            Design
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-zinc-600 group-hover:text-[#E6B447] transition-colors shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
