'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  getDocs,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { updateCampaignManifesto } from '@/lib/firebase/firestore';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Loader2,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Share2,
  Twitter,
  Instagram,
  Facebook,
  Linkedin,
  Zap,
  Target,
  ChevronRight,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useBrandStore } from '@/lib/stores/brand-store';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import { notify } from '@/lib/stores/notification-store';
import { MarkdownRenderer } from '@/components/chat/markdown-renderer';
import type { Funnel } from '@/types/database';
import type { CampaignContext } from '@/types/campaign';

const PLATFORMS = [
  { id: 'meta', label: 'Meta (FB/IG)', icon: Instagram, color: 'text-pink-500' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-600' },
  { id: 'twitter', label: 'X / Twitter', icon: Twitter, color: 'text-zinc-200' },
  { id: 'tiktok', label: 'TikTok', icon: Zap, color: 'text-cyan-400' },
];

export default function SocialCouncilPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { selectedBrand } = useBrandStore();
  
  const funnelId = params.id as string;
  const campaignId = searchParams.get('campaignId');
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [campaign, setCampaign] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hooks, setHooks] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!funnelId) return;
      try {
        const funnelDoc = await getDoc(doc(db, 'funnels', funnelId));
        if (funnelDoc.exists()) {
          const funnelData = funnelDoc.data();
          setFunnel({ id: funnelDoc.id, ...funnelData } as Funnel);

          // ST-11.6: Scanner de Emergência de Copy (INC-005)
          // Se campaignId existir, priorizamos ele. Se não, usamos o funnelId (legacy)
          const docId = campaignId || funnelId;
          const campaignDoc = await getDoc(doc(db, 'campaigns', docId));
          let currentCampaign = campaignDoc.exists() ? campaignDoc.data() : null;

          if (!currentCampaign || !currentCampaign.copywriting) {
            const copyRef = collection(db, 'funnels', funnelId, 'copyProposals');
            const copySnap = await getDocs(query(copyRef, where('status', '==', 'approved'), limit(1)));
            
            if (copySnap.docs.length > 0) {
              const approvedCopy = copySnap.docs[0].data();
              // Monta um manifesto temporário para liberar o acesso
              currentCampaign = {
                ...currentCampaign,
                copywriting: {
                  bigIdea: approvedCopy.content.primary?.slice(0, 500) || 'Big Idea aprovada',
                  headlines: approvedCopy.content.headlines || [],
                  mainScript: approvedCopy.content.primary || '',
                  tone: approvedCopy.awarenessStage || 'problem_aware',
                  counselor_reference: approvedCopy.copywriterInsights?.[0]?.copywriterName || 'Conselho de Copy',
                }
              };
            }
          }

          setCampaign(currentCampaign);
          if (Array.isArray(currentCampaign?.social?.hooks)) {
            setHooks(currentCampaign.social.hooks);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [funnelId]);

  const handleGenerateHooks = async () => {
    if (!funnel || !campaign?.copywriting) {
      notify.error('Erro', 'Aprove uma copy antes de gerar hooks sociais.');
      return;
    }

    setIsGenerating(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/social/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          funnelId,
          userId: user?.uid,
          brandId: selectedBrand?.id,
          context: {
            objective: funnel.context?.objective || '',
            copy: campaign.copywriting.mainScript || '',
            targetAudience: funnel.context?.audience?.who || ''
          }
        }),
      });

      const data = await response.json();
      if (data.success) {
        setHooks(data.data?.hooks ?? data.hooks ?? []);
        notify.success('Hooks gerados com sucesso!');
      } else {
        notify.error('Erro', data.error || 'Falha ao gerar hooks');
      }
    } catch (error) {
      notify.error('Erro', 'Falha ao convocar Conselho de Social');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveHooks = async () => {
    if (!funnelId || hooks.length === 0) return;
    
    setIsLoading(true);
    try {
      const docId = campaignId || funnelId;
      await updateCampaignManifesto(docId, {
        social: {
          hooks: hooks,
          platforms: ['Instagram', 'Facebook', 'LinkedIn'],
        }
      });

      notify.success('Estratégia Social Aprovada!');
      router.push(`/campaigns/${docId}`);
    } catch (error) {
      notify.error('Erro', 'Falha ao salvar estratégia social');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-black">
        <Header title="Conselho de Social" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <Header title="Social Media & Hooks" showBack />

      <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
        <Link href={`/campaigns/${campaignId || funnelId}`} className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Comando
        </Link>

        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-pink-500/10 text-pink-500">
              <Share2 className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Conselho de Social</h1>
              <p className="text-zinc-500">Transformando sua copy em atenção imparável.</p>
            </div>
          </div>

          {!campaign?.copywriting ? (
            <div className="card-premium p-8 text-center border-dashed border-amber-500/30">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Copywriting Pendente</h3>
              <p className="text-zinc-500 mb-6">Você precisa aprovar uma copy na etapa anterior para que o Conselho de Social tenha base estratégica.</p>
              <Link href={`/funnels/${funnelId}/copy`}>
                <Button className="btn-accent">Ir para Copywriting</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {PLATFORMS.map(p => (
                  <div key={p.id} className="card-premium p-4 flex items-center gap-3">
                    <p.icon className={cn("h-5 w-5", p.color)} />
                    <span className="text-sm font-medium text-zinc-300">{p.label}</span>
                  </div>
                ))}
              </div>

              {hooks.length === 0 ? (
                <div className="card-premium p-12 text-center">
                  <Zap className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-4">Pronto para capturar atenção?</h3>
                  <Button 
                    onClick={handleGenerateHooks} 
                    disabled={isGenerating}
                    className="btn-accent h-12 px-8"
                  >
                    {isGenerating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                    Gerar Hooks Estratégicos
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Target className="h-5 w-5 text-emerald-400" />
                      Hooks Sugeridos
                    </h2>
                    <Button variant="ghost" onClick={handleGenerateHooks} disabled={isGenerating} className="text-zinc-500 hover:text-white">
                      <RefreshCw className={cn("h-4 w-4 mr-2", isGenerating && "animate-spin")} />
                      Recriar Hooks
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    {hooks.map((hook, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="card-premium p-6 group hover:border-emerald-500/30 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                                {hook.style || 'Padrão'}
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                                {hook.platform || 'Multi-channel'}
                              </span>
                            </div>
                            <p className="text-lg text-white font-medium leading-relaxed">
                              "{hook.content}"
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="pt-8 border-t border-white/[0.05] flex justify-end">
                    <Button onClick={handleApproveHooks} className="btn-accent h-12 px-12 text-lg font-bold shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                      Aprovar e Seguir para Design
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
