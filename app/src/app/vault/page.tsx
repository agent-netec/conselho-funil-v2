'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Library,
  Sparkles,
  History,
  Settings2,
  Plus,
  Database,
  CheckCircle2,
  Loader2,
  Play,
  Clock,
  Zap,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApprovalWorkspace } from '@/components/vault/approval-workspace';
import { VaultExplorer } from '@/components/vault/vault-explorer';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import {
  queryVaultLibrary,
  getBrandDNA,
  getVaultAssets,
  saveVaultContent
} from '@/lib/firebase/vault';
import type { VaultContent, CopyDNA, VaultAsset } from '@/types/vault';
import { DNAWizard } from '@/components/vault/dna-wizard';
import { Dna } from 'lucide-react';

export default function VaultPage() {
  const activeBrand = useActiveBrand();
  const { user } = useAuthStore();
  const brandId = activeBrand?.id;
  const [activeTab, setActiveTab] = useState('review');
  const [reviewItems, setReviewItems] = useState<VaultContent[]>([]);
  const [libraryItems, setLibraryItems] = useState<VaultContent[]>([]);
  const [dnaItems, setDnaItems] = useState<CopyDNA[]>([]);
  const [assets, setAssets] = useState<VaultAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [runningAutopilot, setRunningAutopilot] = useState(false);
  const [showDNAWizard, setShowDNAWizard] = useState(false);

  const loadVaultData = useCallback(async () => {
    if (!brandId) return;
    try {
      setIsLoading(true);
      const [approved, dna, media] = await Promise.all([
        queryVaultLibrary(brandId, 'approved'),
        getBrandDNA(brandId),
        getVaultAssets(brandId)
      ]);

      setLibraryItems(approved);
      setDnaItems(dna);
      setAssets(media);
    } catch (error) {
      console.error('Error loading vault data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    if (brandId) {
      loadVaultData();
    }
  }, [brandId, loadVaultData]);

  const handleApprove = async (platform: string, copy: string) => {
    if (!brandId) return;
    try {
      const contentToApprove = reviewItems[0];

      await saveVaultContent(brandId, {
        ...contentToApprove,
        status: 'approved',
        approvalChain: {
          approvedBy: user?.uid || 'unknown',
          approvedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
        }
      });

      toast.success("Conteúdo Aprovado!", {
        description: `O post para ${platform} foi movido para a biblioteca.`,
      });

      setReviewItems([]);
      loadVaultData();
    } catch (error) {
      toast.error("Erro ao aprovar", {
        description: "Não foi possível salvar a aprovação no Firestore.",
      });
    }
  };

  const handleEdit = (platform: string, copy: string) => {
    toast.info("Modo de Edição", {
      description: `Abrindo editor para ${platform}...`,
    });
  };

  // N-5.2: Manual Autopilot trigger
  const handleRunAutopilot = async () => {
    if (!brandId) {
      toast.error('Selecione uma marca ativa primeiro.');
      return;
    }
    setRunningAutopilot(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/content/autopilot', {
        method: 'POST',
        headers,
        body: JSON.stringify({ brandId }),
      });
      const data = await res.json();
      if (res.ok) {
        const adapted = data.data?.adapted || 0;
        toast.success(`Autopilot concluído! ${adapted} conteúdo(s) gerado(s).`);
        if (adapted > 0) {
          loadVaultData();
        }
      } else {
        toast.error(data.error || 'Erro ao executar autopilot');
      }
    } catch {
      toast.error('Erro de conexão ao executar autopilot');
    } finally {
      setRunningAutopilot(false);
    }
  };

  // N-5.3: Stub button handlers
  const handleNewAsset = () => {
    toast.info('Em breve: Upload de novos ativos de marca (imagens, logos, vídeos).');
  };

  const handleHistory = () => {
    toast.info('Em breve: Histórico de aprovações e versões de conteúdo.');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        title="Creative Vault"
        subtitle="Inteligência Criativa & Ativos de Marca"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="btn-ghost border-white/[0.05]"
              onClick={handleRunAutopilot}
              disabled={runningAutopilot}
            >
              {runningAutopilot ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {runningAutopilot ? 'Processando...' : 'Run Autopilot'}
            </Button>
            <Button variant="outline" className="btn-ghost border-white/[0.05]" onClick={handleHistory}>
              <History className="mr-2 h-4 w-4" />
              Histórico
            </Button>
            <Button
              variant="outline"
              className="btn-ghost border-white/[0.05]"
              onClick={() => setShowDNAWizard(true)}
            >
              <Dna className="mr-2 h-4 w-4" />
              Novo DNA
            </Button>
            <Button className="btn-accent" onClick={handleNewAsset}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Ativo
            </Button>
          </div>
        }
      />

      <main className="flex-1 p-6 sm:p-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">

          {/* Tabs Principais */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-8 border-b border-white/[0.03] pb-4">
              <TabsList className="bg-zinc-900/50 border border-white/[0.05]">
                <TabsTrigger value="review" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Review Queue
                  {reviewItems.length > 0 && (
                    <Badge className="ml-2 bg-emerald-500 text-white border-none h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                      {reviewItems.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="explorer" className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400">
                  <Database className="h-4 w-4 mr-2" />
                  Vault Explorer
                </TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-zinc-800">
                  <Settings2 className="h-4 w-4 mr-2" />
                  Configurações
                </TabsTrigger>
              </TabsList>

              <div className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-500 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  {libraryItems.length} Aprovados
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  {dnaItems.length} DNA Templates
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <TabsContent value="review" className="m-0 outline-none">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {reviewItems.length > 0 ? (
                    <ApprovalWorkspace
                      content={reviewItems[0]}
                      insightText=""
                      onApprove={handleApprove}
                      onEdit={handleEdit}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/20 rounded-3xl border border-dashed border-white/[0.05]">
                      <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Tudo em ordem!</h3>
                      <p className="text-zinc-500 text-center max-w-md">
                        Não há novos conteúdos aguardando revisão. Use o botão &ldquo;Run Autopilot&rdquo; para gerar novos conteúdos a partir de insights.
                      </p>
                      <div className="flex gap-3 mt-8">
                        <Button
                          variant="outline"
                          className="btn-ghost border-white/[0.05]"
                          onClick={() => setActiveTab('explorer')}
                        >
                          Explorar Biblioteca
                        </Button>
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={handleRunAutopilot}
                          disabled={runningAutopilot}
                        >
                          {runningAutopilot ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                          Run Autopilot
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </TabsContent>

              <TabsContent value="explorer" className="m-0 outline-none">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <VaultExplorer
                    dnaItems={dnaItems}
                    libraryItems={libraryItems}
                    assets={assets}
                    onUseItem={(item) => {
                      toast.info("Item Selecionado", {
                        description: "Preparando conteúdo para uso...",
                      });
                    }}
                  />
                </motion.div>
              </TabsContent>

              {/* N-5.4: Settings Tab */}
              <TabsContent value="settings" className="m-0 outline-none">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-zinc-900/50 border-zinc-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Zap className="w-4 h-4 text-emerald-400" />
                          Content Autopilot
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-zinc-400">
                          O Autopilot coleta insights do Social Monitor, Spy Agent e Keywords Miner para gerar conteúdo adaptado automaticamente.
                        </p>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                            <div className="flex items-center gap-2">
                              <Play className="w-4 h-4 text-zinc-500" />
                              <span className="text-sm text-zinc-300">Execução Manual</span>
                            </div>
                            <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">Ativo</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-zinc-500" />
                              <span className="text-sm text-zinc-300">CRON Automático</span>
                            </div>
                            <Badge variant="outline" className="text-zinc-500 border-zinc-700">Em breve</Badge>
                          </div>
                        </div>
                        <p className="text-[11px] text-zinc-600">
                          CRON automático será habilitado via vercel.json com CRON_SECRET. Cada execução consome 2 créditos por conteúdo adaptado.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/50 border-zinc-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Library className="w-4 h-4 text-blue-400" />
                          Preferências do Vault
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-zinc-400">
                          Configurações de aprovação automática e integração com redes sociais.
                        </p>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                            <span className="text-sm text-zinc-300">Aprovação automática</span>
                            <Badge variant="outline" className="text-zinc-500 border-zinc-700">Desativada</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                            <span className="text-sm text-zinc-300">Publicação direta</span>
                            <Badge variant="outline" className="text-zinc-500 border-zinc-700">Requer OAuth</Badge>
                          </div>
                        </div>
                        <p className="text-[11px] text-zinc-600">
                          Publicação direta para Instagram/LinkedIn será habilitada após integração OAuth (Sprint L).
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>

        </div>
      </main>

      {/* X-2.1: DNA Wizard Modal */}
      {showDNAWizard && (
        <DNAWizard
          onClose={() => setShowDNAWizard(false)}
          onSaved={() => loadVaultData()}
        />
      )}
    </div>
  );
}
