'use client';

import { use } from 'react';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Header } from '@/components/layout/header';
import { SocialWizard } from '@/components/social/social-wizard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useActiveBrand } from '@/lib/hooks/use-active-brand';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function FunnelSocialPage({ params }: PageProps) {
  const { id: funnelId } = use(params);
  const activeBrand = useActiveBrand();
  const [funnelName, setFunnelName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFunnel() {
      try {
        const funnelRef = doc(db, 'funnels', funnelId);
        const snap = await getDoc(funnelRef);
        if (snap.exists()) {
          setFunnelName(snap.data().name || 'Funil');
        }
      } catch (err) {
        console.error('Error loading funnel:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadFunnel();
  }, [funnelId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header title="Social — Funil" />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        title={`Social — ${funnelName}`}
        subtitle="Gere conteúdo social integrado ao pipeline de campanha"
        actions={
          <Link href={`/funnels/${funnelId}`}>
            <Button variant="outline" className="btn-ghost border-white/[0.05]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Funil
            </Button>
          </Link>
        }
      />

      <main className="flex-1 p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Card className="p-4 bg-zinc-900/50 border-white/[0.04]">
            <div className="flex items-center gap-3">
              <Share2 className="h-5 w-5 text-rose-400" />
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Pipeline de Campanha</h3>
                <p className="text-xs text-zinc-500">
                  O conteúdo gerado será automaticamente vinculado ao funil <span className="text-zinc-300">{funnelName}</span>
                </p>
              </div>
              <Badge variant="outline" className="ml-auto border-rose-500/20 text-rose-400 bg-rose-500/5 text-[10px]">
                Funil #{funnelId.slice(0, 8)}
              </Badge>
            </div>
          </Card>

          <SocialWizard />
        </div>
      </main>
    </div>
  );
}
