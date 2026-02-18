'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Upload,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useUser } from '@/lib/hooks/use-user';
import { logout } from '@/lib/firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getUserPreferences, updateUserPreferences } from '@/lib/firebase/firestore';
import { UserPreferences } from '@/types/database';
import { toast } from 'sonner';
import Link from 'next/link';

import { BrandingSettings } from '@/components/agency/BrandingSettings';
import { useBranding } from '@/components/providers/branding-provider';

// ============================================
// CONSTANTS
// ============================================

const NOTIFICATION_STORAGE_KEY = 'cf-notification-prefs';
const THEME_STORAGE_KEY = 'cf-theme-preference';

interface NotificationPrefs {
  funnelReview: boolean;
  proposalsGenerated: boolean;
  updates: boolean;
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  funnelReview: true,
  proposalsGenerated: true,
  updates: true,
};

type ThemePreference = 'dark' | 'light' | 'system';

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
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // PROFILE STATE (J-1.1)
  // ============================================
  const [displayName, setDisplayName] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authUser?.displayName) {
      setDisplayName(authUser.displayName);
    }
  }, [authUser?.displayName]);

  // ============================================
  // INTEGRATIONS — Moved to /integrations (Sprint U-1.3)
  // ============================================

  // ============================================
  // SECURITY STATE (J-1.3)
  // ============================================
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // ============================================
  // NOTIFICATIONS STATE (J-1.4)
  // ============================================
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);

  const updateNotifPref = useCallback((key: keyof NotificationPrefs, value: boolean) => {
    setNotifPrefs(prev => {
      const next = { ...prev, [key]: value };
      // Cache locally for instant reads
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // ============================================
  // APPEARANCE STATE (J-1.5)
  // ============================================
  const { branding, updateBranding } = useBranding();
  const [theme, setTheme] = useState<ThemePreference>('dark');

  const applyTheme = useCallback((preference: ThemePreference) => {
    setTheme(preference);
    // Cache locally for instant reads on next page load
    localStorage.setItem(THEME_STORAGE_KEY, preference);

    const root = document.documentElement;
    if (preference === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', systemDark);
      root.classList.toggle('light', !systemDark);
    } else {
      root.classList.toggle('dark', preference === 'dark');
      root.classList.toggle('light', preference === 'light');
    }
  }, []);

  // ============================================
  // LOAD ALL PREFERENCES FROM FIRESTORE
  // ============================================
  useEffect(() => {
    async function loadPreferences() {
      const uid = authUser?.uid;
      if (!uid) return;

      try {
        const prefs = await getUserPreferences(uid);

        if (prefs?.notifications) {
          setNotifPrefs(prefs.notifications);
          localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(prefs.notifications));
        } else {
          // Fallback: read from localStorage cache
          try {
            const cached = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
            if (cached) setNotifPrefs(JSON.parse(cached));
          } catch { /* ignore */ }
        }

        if (prefs?.theme) {
          setTheme(prefs.theme);
          localStorage.setItem(THEME_STORAGE_KEY, prefs.theme);
        } else {
          // Fallback: read from localStorage cache
          try {
            const cached = localStorage.getItem(THEME_STORAGE_KEY) as ThemePreference | null;
            if (cached && ['dark', 'light', 'system'].includes(cached)) {
              setTheme(cached);
            }
          } catch { /* ignore */ }
        }

        if (prefs?.branding) {
          updateBranding(prefs.branding);
          localStorage.setItem('cf-branding', JSON.stringify(prefs.branding));
        } else {
          // Fallback: read from localStorage cache
          try {
            const cached = localStorage.getItem('cf-branding');
            if (cached) updateBranding(JSON.parse(cached));
          } catch { /* ignore */ }
        }
      } catch (err) {
        console.error('Error loading preferences from Firestore:', err);
        // Graceful degradation: load from localStorage cache
        try {
          const cachedNotif = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
          if (cachedNotif) setNotifPrefs(JSON.parse(cachedNotif));
          const cachedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemePreference | null;
          if (cachedTheme && ['dark', 'light', 'system'].includes(cachedTheme)) setTheme(cachedTheme);
          const cachedBranding = localStorage.getItem('cf-branding');
          if (cachedBranding) updateBranding(JSON.parse(cachedBranding));
        } catch { /* ignore */ }
      }
    }
    loadPreferences();
  }, [authUser?.uid, updateBranding]);

  // ============================================
  // SAVE HANDLERS
  // ============================================

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const currentUser = auth?.currentUser;
      if (!currentUser) throw new Error('Usuário não autenticado.');

      const { updateProfile } = await import('firebase/auth');
      await updateProfile(currentUser, { displayName: displayName.trim() });
      setSaved(true);
      toast.success('Perfil atualizado!');
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      const msg = err?.code === 'auth/requires-recent-login'
        ? 'Sessão expirada. Faça login novamente.'
        : 'Erro ao atualizar perfil.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 2MB.');
      return;
    }

    const currentUser = auth?.currentUser;
    if (!currentUser) return;

    setAvatarUploading(true);
    try {
      const { ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('@/lib/firebase/config');
      const { updateProfile } = await import('firebase/auth');

      const storagePath = `avatars/${currentUser.uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytesResumable(storageRef, file, { contentType: file.type });
      const photoURL = await getDownloadURL(snapshot.ref);

      await updateProfile(currentUser, { photoURL });
      toast.success('Foto atualizada!');
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast.error('Erro ao fazer upload da foto.');
    } finally {
      setAvatarUploading(false);
      // Reset input
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  // handleSaveIntegrations removed — Sprint U-1.3: integrations managed at /integrations

  const handleSavePassword = async () => {
    setPasswordError(null);
    setIsSaving(true);

    // Validation
    if (!currentPassword) {
      setPasswordError('Informe sua senha atual.');
      setIsSaving(false);
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Nova senha deve ter pelo menos 8 caracteres.');
      setIsSaving(false);
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError('Nova senha deve conter pelo menos 1 letra maiúscula.');
      setIsSaving(false);
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setPasswordError('Nova senha deve conter pelo menos 1 número.');
      setIsSaving(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem.');
      setIsSaving(false);
      return;
    }

    try {
      const currentUser = auth?.currentUser;
      if (!currentUser || !currentUser.email) throw new Error('Usuário não autenticado.');

      const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import('firebase/auth');
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);

      // Clear fields on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Senha atualizada com sucesso!');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setPasswordError('Senha atual incorreta.');
      } else if (code === 'auth/requires-recent-login') {
        setPasswordError('Sessão expirada. Faça login novamente.');
      } else if (code === 'auth/weak-password') {
        setPasswordError('Senha muito fraca. Use uma senha mais forte.');
      } else {
        setPasswordError('Erro ao atualizar senha. Tente novamente.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAppearance = async () => {
    setIsSaving(true);
    try {
      const uid = authUser?.uid;
      if (!uid) throw new Error('Usuário não autenticado.');

      // Persist to Firestore (source of truth) + localStorage (cache)
      await updateUserPreferences(uid, {
        theme,
        branding: {
          logoUrl: branding.logoUrl || '',
          colors: { primary: branding.colors.primary, secondary: branding.colors.secondary },
        },
      });
      localStorage.setItem('cf-branding', JSON.stringify(branding));
      localStorage.setItem(THEME_STORAGE_KEY, theme);

      setSaved(true);
      toast.success('Preferências salvas!');
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Error saving appearance:', err);
      toast.error('Erro ao salvar preferências.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    switch (activeTab) {
      case 'profile':
        return handleSaveProfile();
      case 'integrations':
        return; // Managed at /integrations
      case 'security':
        return handleSavePassword();
      case 'appearance':
        return handleSaveAppearance();
      case 'notifications':
        setIsSaving(true);
        try {
          const uid = authUser?.uid;
          if (!uid) throw new Error('Usuário não autenticado.');
          await updateUserPreferences(uid, { notifications: notifPrefs });
          localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifPrefs));
          setSaved(true);
          toast.success('Notificações salvas!');
          setTimeout(() => setSaved(false), 2000);
        } catch (err) {
          console.error('Error saving notifications:', err);
          toast.error('Erro ao salvar notificações.');
        } finally {
          setIsSaving(false);
        }
        return;
      default:
        return;
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
                        {authUser?.photoURL ? (
                          <img
                            src={authUser.photoURL}
                            alt="Avatar"
                            className="h-20 w-20 rounded-2xl object-cover"
                          />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-800 text-2xl font-bold text-white">
                            {authUser?.displayName?.[0]?.toUpperCase() || authUser?.email?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-white">
                            {authUser?.displayName || 'Sem nome'}
                          </h4>
                          <p className="text-sm text-zinc-500">{authUser?.email}</p>
                          <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                          />
                          <Button
                            variant="ghost"
                            className="mt-3 btn-ghost h-8 text-xs"
                            onClick={() => avatarInputRef.current?.click()}
                            disabled={avatarUploading}
                          >
                            {avatarUploading ? (
                              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                            ) : (
                              <Upload className="mr-1.5 h-3 w-3" />
                            )}
                            {avatarUploading ? 'Enviando...' : 'Alterar foto'}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Nome completo
                          </label>
                          <Input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
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

                      {error && activeTab === 'profile' && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-red-400">
                          <AlertCircle className="h-4 w-4" />
                          {error}
                        </div>
                      )}
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
                  <div className="card-premium p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Contexto do Negócio
                    </h3>
                    <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
                      As informações do seu negócio (nome, mercado, público, oferta) são
                      gerenciadas no <strong className="text-white">Brand Hub</strong>, onde o Conselho
                      usa esses dados para gerar recomendações personalizadas.
                    </p>
                    <Link
                      href="/brand-hub"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
                    >
                      Configurar no Brand Hub
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}

                {activeTab === 'integrations' && (
                  <div className="card-premium p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Central de Integrações
                    </h3>
                    <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
                      Todas as integrações (Ads, Redes Sociais, Comunicação e Dados) são
                      gerenciadas na <strong className="text-white">Central de Integrações</strong>,
                      onde você pode conectar, validar e monitorar a saúde de cada conexão.
                    </p>
                    <Link
                      href="/integrations"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
                    >
                      Abrir Central de Integrações
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div className="card-premium p-6">
                      <h3 className="text-lg font-semibold text-white mb-6">
                        Preferências de Notificação
                      </h3>
                      <div className="space-y-4">
                        {([
                          { key: 'funnelReview' as const, label: 'Funil em revisão', desc: 'Quando um funil precisa de avaliação' },
                          { key: 'proposalsGenerated' as const, label: 'Propostas geradas', desc: 'Quando o Conselho gera novas propostas' },
                          { key: 'updates' as const, label: 'Atualizações', desc: 'Novidades e melhorias da plataforma' },
                        ]).map((item) => (
                          <div key={item.key} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                            <div>
                              <p className="text-sm font-medium text-white">{item.label}</p>
                              <p className="text-xs text-zinc-500">{item.desc}</p>
                            </div>
                            <label className="relative inline-flex cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={notifPrefs[item.key]}
                                onChange={(e) => updateNotifPref(item.key, e.target.checked)}
                              />
                              <div className="w-11 h-6 bg-zinc-700 peer-checked:bg-emerald-500 rounded-full peer-focus:ring-2 peer-focus:ring-emerald-500/20 transition-colors"></div>
                              <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                            </label>
                          </div>
                        ))}
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
                          {([
                            { value: 'dark' as const, label: 'Dark' },
                            { value: 'light' as const, label: 'Light' },
                            { value: 'system' as const, label: 'Sistema' },
                          ]).map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => applyTheme(opt.value)}
                              className={cn(
                                'px-4 py-3 rounded-xl border text-sm font-medium transition-all',
                                theme === opt.value
                                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                                  : 'border-white/[0.06] text-zinc-400 hover:border-white/[0.1] hover:text-zinc-300'
                              )}
                            >
                              {opt.label}
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
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Senha atual
                        </label>
                        <Input
                          type="password"
                          placeholder="Sua senha atual"
                          value={currentPassword}
                          onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(null); }}
                          className="input-premium"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Nova senha
                        </label>
                        <Input
                          type="password"
                          placeholder="Mínimo 8 caracteres, 1 maiúscula, 1 número"
                          value={newPassword}
                          onChange={(e) => { setNewPassword(e.target.value); setPasswordError(null); }}
                          className="input-premium"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Confirmar nova senha
                        </label>
                        <Input
                          type="password"
                          placeholder="Repita a nova senha"
                          value={confirmPassword}
                          onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(null); }}
                          className="input-premium"
                        />
                      </div>

                      {passwordError && (
                        <div className="flex items-center gap-2 text-sm text-red-400">
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          {passwordError}
                        </div>
                      )}

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
