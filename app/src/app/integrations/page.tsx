'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  LayoutGrid,
  ExternalLink,
  Save,
  Loader2,
  Check,
  AlertCircle,
  Link2,
  Settings2,
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/lib/hooks/use-user';
import { saveIntegration, getIntegrations } from '@/lib/firebase/firestore';
import { Integration } from '@/types/database';

interface IntegrationCardProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  provider: 'meta' | 'google' | 'tiktok' | 'whatsapp';
  isConnected: boolean;
  onConnect: () => void;
  status?: string;
}

function IntegrationCard({
  name,
  description,
  icon,
  isConnected,
  onConnect,
  status,
}: IntegrationCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="card-premium p-6 flex flex-col h-full border-white/[0.04] hover:border-emerald-500/30 transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06] group-hover:border-emerald-500/20 transition-colors">
          <span className="text-2xl">{icon}</span>
        </div>
        {isConnected ? (
          <div className="badge-success">
            <div className="glow-dot" />
            Ativo
          </div>
        ) : (
          <div className="badge-warning">Pendente</div>
        )}
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">{name}</h3>
      <p className="text-sm text-zinc-500 mb-6 flex-1 leading-relaxed">
        {description}
      </p>

      <Button
        onClick={onConnect}
        variant="ghost"
        className={cn(
          "w-full group/btn",
          isConnected 
            ? "bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300" 
            : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
        )}
      >
        {isConnected ? 'Configurar' : 'Conectar'}
        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
      </Button>
    </motion.div>
  );
}

export default function IntegrationsPage() {
  const { user } = useUser();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeConfig, setActiveConfig] = useState<'meta' | null>(null);

  // Meta Config State
  const [metaConfig, setMetaConfig] = useState({ adAccountId: '', accessToken: '' });

  useEffect(() => {
    async function loadIntegrations() {
      if (user?.tenantId) {
        const data = await getIntegrations(user.tenantId);
        setIntegrations(data);
        
        const meta = data.find(i => i.provider === 'meta');
        if (meta) {
          setMetaConfig(meta.config);
        }
      }
    }
    loadIntegrations();
  }, [user?.tenantId]);

  const handleSaveMeta = async () => {
    if (!user?.tenantId) return;
    setIsSaving(true);
    
    try {
      await saveIntegration(user.tenantId, 'meta', metaConfig);
      const data = await getIntegrations(user.tenantId);
      setIntegrations(data);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setActiveConfig(null);
      }, 2000);
    } catch (error) {
      console.error('Error saving Meta integration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const isMetaConnected = integrations.some(i => i.provider === 'meta');

  return (
    <div className="flex min-h-screen flex-col bg-dot-pattern">
      <Header title="Central de Integrações" />

      <main className="flex-1 p-8">
        <div className="mx-auto max-w-6xl">
          {/* Hero Section */}
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-white mb-3">Conecte seu Ecossistema</h1>
            <p className="text-zinc-500 max-w-2xl leading-relaxed">
              Integre o Conselho de Funil com suas ferramentas de anúncios e comunicação 
              para que os especialistas analisem dados em tempo real e gerem ativos muito 
              mais precisos para o seu contexto.
            </p>
          </div>

          {/* Grid de Integrações */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <IntegrationCard
              id="meta"
              name="Meta Ads"
              provider="meta"
              description="Sincronize campanhas, conjuntos de anúncios e métricas de performance para análise do Conselho de Ads."
              icon="🔵"
              isConnected={isMetaConnected}
              onConnect={() => setActiveConfig('meta')}
            />

            <IntegrationCard
              id="google"
              name="Google Ads"
              provider="google"
              description="Em breve: Análise completa de Search, Display e YouTube Ads diretamente no seu Dashboard."
              icon="🟡"
              isConnected={false}
              onConnect={() => {}}
            />

            <IntegrationCard
              id="whatsapp"
              name="WhatsApp"
              provider="whatsapp"
              description="Em breve: Notificações de aprovação de funil e alertas de performance via API oficial."
              icon="🟢"
              isConnected={false}
              onConnect={() => {}}
            />
          </div>

          {/* Configuração Ativa (Slide-in / Modal-like) */}
          <AnimatePresence>
            {activeConfig === 'meta' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="card-premium p-8 border-emerald-500/20"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 flex text-2xl">
                      🔵
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Configurar Meta Ads</h2>
                      <p className="text-sm text-zinc-500">Insira suas credenciais da Marketing API</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={() => setActiveConfig(null)}
                    className="text-zinc-500 hover:text-white"
                  >
                    Cancelar
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        ID da Conta de Anúncios (Ad Account ID)
                      </label>
                      <Input
                        placeholder="act_123456789..."
                        value={metaConfig.adAccountId}
                        onChange={(e) => setMetaConfig({ ...metaConfig, adAccountId: e.target.value })}
                        className="input-premium"
                      />
                      <p className="mt-2 text-[11px] text-zinc-500 flex items-center gap-1.5">
                        <AlertCircle className="h-3 w-3" />
                        Localizado nas Configurações do Gerenciador de Negócios.
                        <a href="https://adsmanager.facebook.com/adsmanager/manage/campaigns" target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline inline-flex items-center gap-1">
                          Abrir Gerenciador <ExternalLink className="h-2 w-2" />
                        </a>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Token de Acesso (System User Token)
                      </label>
                      <Input
                        type="password"
                        placeholder="EAA..."
                        value={metaConfig.accessToken}
                        onChange={(e) => setMetaConfig({ ...metaConfig, accessToken: e.target.value })}
                        className="input-premium"
                      />
                      <p className="mt-2 text-[11px] text-zinc-500 flex items-center gap-1.5">
                        <ShieldCheck className="h-3 w-3" />
                        Gere um token permanente em Usuários do Sistema.
                        <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline inline-flex items-center gap-1">
                          Configurações do Negócio <ExternalLink className="h-2 w-2" />
                        </a>
                      </p>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button onClick={handleSaveMeta} className="btn-accent px-8" disabled={isSaving}>
                        {isSaving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : saved ? (
                          <Check className="mr-2 h-4 w-4" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        {saved ? 'Conectado!' : 'Salvar Integração'}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/[0.04] space-y-4">
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <Zap className="h-3 w-3 text-emerald-500" />
                        O que o Conselho pode fazer?
                      </h4>
                      <ul className="space-y-3">
                        {[
                          'Analisar métricas de CPC, CPM e ROAS',
                          'Sugerir melhorias em criativos estagnados',
                          'Detectar fadiga de audiência automaticamente',
                          'Criar novos hooks baseados no que já funciona'
                        ].map((item) => (
                          <li key={item} className="flex items-start gap-3 text-sm text-zinc-400">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/50 mt-1.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                      <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">
                        Segurança de Dados
                      </h4>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        Suas chaves de API são criptografadas e nunca compartilhadas. 
                        O Conselho utiliza apenas acesso de leitura para extrair insights 
                        estratégicos de performance.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State / Future Integrations */}
          {!activeConfig && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-12 text-center p-12 rounded-3xl border border-dashed border-white/[0.08]"
            >
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.02] mb-4">
                <Plus className="h-8 w-8 text-zinc-700" />
              </div>
              <h3 className="text-lg font-medium text-zinc-400">Mais integrações em breve</h3>
              <p className="text-sm text-zinc-600 mt-2">
                Estamos trabalhando para conectar TikTok, Pinterest e CRM.
              </p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
