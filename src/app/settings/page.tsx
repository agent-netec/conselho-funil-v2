'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  User,
  Building2,
  Bell,
  Palette,
  Shield,
  LogOut,
  Save,
  Loader2,
  Check,
  LayoutGrid,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useUser } from '@/lib/hooks/use-user';
import { logout } from '@/lib/firebase/auth';
import { saveIntegration, getIntegrations } from '@/lib/firebase/firestore';
import { Integration } from '@/types/database';

import { BrandingSettings } from '@/components/agency/BrandingSettings';

const TABS = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'business', label: 'Negócio', icon: Building2 },
  { id: 'integrations', label: 'Integrações', icon: LayoutGrid },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'appearance', label: 'Aparência', icon: Palette },
  { id: 'security', label: 'Segurança', icon: Shield },
];

export default function SettingsPage() {
  const { user: authUser } = useAuthStore();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Integrations State
  const [integrations, setIntegrations] = useState<Integration[]>([]);
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

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      if (activeTab === 'integrations' && user?.tenantId) {
        await saveIntegration(user.tenantId, 'meta', metaConfig);
        const data = await getIntegrations(user.tenantId);
        setIntegrations(data);
      } else {
        // Simulate other saves
        await new Promise((r) => setTimeout(r, 1000));
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header title="Configurações" />

      <div className="flex-1 p-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex gap-8">
            {/* Sidebar */}
            <div className="w-56 flex-shrink-0">
              <nav className="space-y-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                      activeTab === tab.id
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}

                <div className="pt-4 mt-4 border-t border-white/[0.06]">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div className="card-premium p-6">
                      <h3 className="text-lg font-semibold text-white mb-6">
                        Informações do Perfil
                      </h3>

                      <div className="flex items-start gap-6 mb-8">
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-800 text-2xl font-bold text-white">
                          {authUser?.displayName?.[0]?.toUpperCase() || authUser?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-white">
                            {authUser?.displayName || 'Sem nome'}
                          </h4>
                          <p className="text-sm text-zinc-500">{authUser?.email}</p>
                          <Button variant="ghost" className="mt-3 btn-ghost h-8 text-xs">
                            Alterar foto
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Nome completo
                          </label>
                          <Input
                            defaultValue={authUser?.displayName || ''}
                            placeholder="Seu nome"
                            className="input-premium"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Email
                          </label>
                          <Input
                            value={authUser?.email || ''}
                            disabled
                            className="input-premium opacity-50"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSave} className="btn-accent" disabled={isSaving}>
                        {isSaving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : saved ? (
                          <Check className="mr-2 h-4 w-4" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        {saved ? 'Salvo!' : 'Salvar'}
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === 'business' && (
                  <div className="space-y-6">
                    <div className="card-premium p-6">
                      <h3 className="text-lg font-semibold text-white mb-6">
                        Contexto do Negócio
                      </h3>
                      <p className="text-zinc-500 mb-6">
                        Essas informações ajudam o Conselho a dar recomendações
                        personalizadas para seu contexto específico.
                      </p>

                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Nome da empresa
                          </label>
                          <Input
                            placeholder="Ex: Minha Empresa"
                            className="input-premium"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Mercado/Nicho
                          </label>
                          <Input
                            placeholder="Ex: Educação Online, SaaS, E-commerce..."
                            className="input-premium"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Maturidade
                          </label>
                          <select className="w-full input-premium">
                            <option value="">Selecione...</option>
                            <option value="starting">Iniciando</option>
                            <option value="traction">Em tração</option>
                            <option value="scaling">Escalando</option>
                            <option value="mature">Maduro</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSave} className="btn-accent" disabled={isSaving}>
                        {isSaving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : saved ? (
                          <Check className="mr-2 h-4 w-4" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        {saved ? 'Salvo!' : 'Salvar'}
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === 'integrations' && (
                  <div className="space-y-6">
                    <div className="card-premium p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">
                          Conectar Meta Ads
                        </h3>
                        {integrations.find(i => i.provider === 'meta') && (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                            <div className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                            Ativo
                          </span>
                        )}
                      </div>
                      
                      <p className="text-zinc-500 mb-8 text-sm leading-relaxed">
                        Conecte sua conta de anúncios da Meta para permitir que o Conselho 
                        analise suas métricas de performance e sugira otimizações baseadas em dados reais.
                      </p>

                      <div className="space-y-5">
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
                            Gere um token permanente em Usuários do Sistema.
                            <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline inline-flex items-center gap-1">
                              Configurações do Negócio <ExternalLink className="h-2 w-2" />
                            </a>
                          </p>
                        </div>
                      </div>

                      <div className="mt-8 p-4 rounded-xl bg-zinc-900/50 border border-white/[0.04]">
                        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                          Permissões Necessárias
                        </h4>
                        <ul className="space-y-2">
                          {[
                            'ads_read',
                            'read_insights',
                            'ads_management (opcional para automação)'
                          ].map((perm) => (
                            <li key={perm} className="flex items-center gap-2 text-xs text-zinc-500">
                              <div className="h-1 w-1 rounded-full bg-emerald-500/50" />
                              {perm}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSave} className="btn-accent" disabled={isSaving}>
                        {isSaving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : saved ? (
                          <Check className="mr-2 h-4 w-4" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        {saved ? 'Salvo!' : 'Salvar Integração'}
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="card-premium p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">
                      Preferências de Notificação
                    </h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Funil em revisão', desc: 'Quando um funil precisa de avaliação' },
                        { label: 'Propostas geradas', desc: 'Quando o Conselho gera novas propostas' },
                        { label: 'Atualizações', desc: 'Novidades e melhorias da plataforma' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                          <div>
                            <p className="text-sm font-medium text-white">{item.label}</p>
                            <p className="text-xs text-zinc-500">{item.desc}</p>
                          </div>
                          <label className="relative inline-flex cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-zinc-700 peer-checked:bg-emerald-500 rounded-full peer-focus:ring-2 peer-focus:ring-emerald-500/20 transition-colors"></div>
                            <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'appearance' && (
                  <div className="space-y-6">
                    <div className="card-premium p-6">
                      <h3 className="text-lg font-semibold text-white mb-6">
                        Aparência & Branding
                      </h3>
                      
                      <BrandingSettings />

                      <div className="divider my-8" />

                      <div className="space-y-4">
                        <label className="block text-sm font-medium text-zinc-300 mb-3">
                          Tema da Interface
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {['Dark', 'Light', 'Sistema'].map((theme) => (
                            <button
                              key={theme}
                              className={cn(
                                'px-4 py-3 rounded-xl border text-sm font-medium transition-all',
                                theme === 'Dark'
                                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                                  : 'border-white/[0.06] text-zinc-400 hover:border-white/[0.1] hover:text-zinc-300'
                              )}
                            >
                              {theme}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSave} className="btn-accent" disabled={isSaving}>
                        {isSaving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : saved ? (
                          <Check className="mr-2 h-4 w-4" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        {saved ? 'Salvo!' : 'Salvar Preferências'}
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="card-premium p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">
                      Segurança
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Alterar senha
                        </label>
                        <Input
                          type="password"
                          placeholder="Nova senha"
                          className="input-premium mb-3"
                        />
                        <Input
                          type="password"
                          placeholder="Confirmar nova senha"
                          className="input-premium"
                        />
                      </div>

                      <Button onClick={handleSave} className="btn-accent" disabled={isSaving}>
                        {isSaving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Shield className="mr-2 h-4 w-4" />
                        )}
                        Atualizar Senha
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
