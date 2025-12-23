'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useUser } from '@/lib/hooks/use-user';
import { logout } from '@/lib/firebase/auth';

const TABS = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'business', label: 'Negócio', icon: Building2 },
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

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise((r) => setTimeout(r, 1000));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
                  <div className="card-premium p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">
                      Aparência
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-3">
                          Tema
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
