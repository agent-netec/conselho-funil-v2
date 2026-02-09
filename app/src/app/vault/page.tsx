'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Library, 
  Sparkles, 
  History, 
  Settings2, 
  Plus,
  LayoutDashboard,
  Database,
  CheckCircle2
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ApprovalWorkspace } from '@/components/vault/approval-workspace';
import { VaultExplorer } from '@/components/vault/vault-explorer';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { 
  queryVaultLibrary, 
  getBrandDNA, 
  getVaultAssets,
  saveVaultContent 
} from '@/lib/firebase/vault';
import type { VaultContent, CopyDNA, VaultAsset } from '@/types/vault';

// Mock data para desenvolvimento inicial (será substituído por dados reais do Firebase)
const MOCK_REVIEW_CONTENT: VaultContent = {
  id: 'mock-1',
  brandId: 'brand-1',
  status: 'review',
  variants: [
    {
      platform: 'x',
      copy: '🚀 O futuro do marketing não é mais sobre quem grita mais alto, mas sobre quem ouve melhor.\n\nA IA está transformando o social listening em vantagem competitiva real. Você está pronto para o Autopilot? #MarketingDigital #IA',
      mediaRefs: [],
      metadata: {}
    },
    {
      platform: 'linkedin',
      copy: 'A era do "Content Autopilot" chegou. 🤖\n\nNão se trata apenas de automatizar postagens, mas de criar uma simbiose entre inteligência de dados e criatividade humana.\n\nNo Conselho de Funil, estamos construindo o Creative Vault: a memória de longo prazo da sua marca que alimenta cada interação.\n\nO que você acha dessa evolução? 👇\n\n#SocialListening #ArtificialIntelligence #ContentStrategy',
      mediaRefs: [],
      metadata: {}
    },
    {
      platform: 'instagram',
      copy: 'Sua marca tem memória? 🧠✨\n\nO Creative Vault é onde o DNA da sua cópia encontra a inteligência dos dados. Transformamos insights em conteúdo que converte, em segundos.\n\nConfira no link da bio como estamos revolucionando o fluxo de criação. 🚀',
      mediaRefs: [],
      metadata: {}
    }
  ],
  approvalChain: {},
  createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
};

const MOCK_INSIGHT = "Usuários estão demonstrando alto interesse em como a IA pode automatizar o social listening sem perder o tom de voz da marca. O volume de buscas por 'Social Listening Autopilot' cresceu 45% na última semana.";

export default function VaultPage() {
  const [activeTab, setActiveTab] = useState('review');
  const [reviewItems, setReviewItems] = useState<VaultContent[]>([MOCK_REVIEW_CONTENT]);
  const [libraryItems, setLibraryItems] = useState<VaultContent[]>([]);
  const [dnaItems, setDnaItems] = useState<CopyDNA[]>([]);
  const [assets, setAssets] = useState<VaultAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVaultData();
  }, []);

  const loadVaultData = async () => {
    try {
      setIsLoading(true);
      // Em um cenário real, pegaríamos o brandId do contexto/auth
      const brandId = 'brand-1'; 
      
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
  };

  const handleApprove = async (platform: string, copy: string) => {
    try {
      const brandId = 'brand-1';
      const contentToApprove = reviewItems[0]; // Simplificação para o mock
      
      await saveVaultContent(brandId, {
        ...contentToApprove,
        status: 'approved',
        approvalChain: {
          approvedBy: 'current-user',
          approvedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
        }
      });

      toast.success("Conteúdo Aprovado!", {
        description: `O post para ${platform} foi movido para a biblioteca.`,
      });

      // Atualiza UI local
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header 
        title="Creative Vault" 
        subtitle="Inteligência Criativa & Ativos de Marca"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" className="btn-ghost border-white/[0.05]">
              <History className="mr-2 h-4 w-4" />
              Histórico
            </Button>
            <Button className="btn-accent">
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
                      insightText={MOCK_INSIGHT}
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
                        Não há novos conteúdos aguardando revisão. O Content Autopilot notificará você assim que novos insights forem processados.
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-8 btn-ghost border-white/[0.05]"
                        onClick={() => setActiveTab('explorer')}
                      >
                        Explorar Biblioteca
                      </Button>
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
            </AnimatePresence>
          </Tabs>

        </div>
      </main>
    </div>
  );
}
