'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import {
  LogOut, Save, Loader2, Check, ExternalLink, Upload, AlertCircle, ArrowRight, Shield,
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
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BrandingSettings } from '@/components/agency/BrandingSettings';
import { useBranding } from '@/components/providers/branding-provider';

const NOTIFICATION_STORAGE_KEY = 'cf-notification-prefs';
const THEME_STORAGE_KEY = 'cf-theme-preference';

interface NotificationPrefs { funnelReview: boolean; proposalsGenerated: boolean; updates: boolean; }
const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = { funnelReview: true, proposalsGenerated: true, updates: true };
type ThemePreference = 'dark' | 'light' | 'system';

const TABS = [
  { id: 'profile', label: 'Perfil' },
  { id: 'business', label: 'Negócio' },
  { id: 'billing', label: 'Planos e Pagamento', href: '/settings/billing' },
  { id: 'integrations', label: 'Integrações' },
  { id: 'notifications', label: 'Notificações' },
  { id: 'appearance', label: 'Aparência' },
  { id: 'security', label: 'Segurança' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user: authUser } = useAuthStore();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const { branding, updateBranding } = useBranding();
  const [theme, setTheme] = useState<ThemePreference>('dark');

  useEffect(() => { if (authUser?.displayName) setDisplayName(authUser.displayName); }, [authUser?.displayName]);

  const updateNotifPref = useCallback((key: keyof NotificationPrefs, value: boolean) => {
    setNotifPrefs(prev => { const next = { ...prev, [key]: value }; localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(next)); return next; });
  }, []);

  const applyTheme = useCallback((preference: ThemePreference) => {
    setTheme(preference); localStorage.setItem(THEME_STORAGE_KEY, preference);
    const root = document.documentElement;
    if (preference === 'system') { const d = window.matchMedia('(prefers-color-scheme: dark)').matches; root.classList.toggle('dark', d); root.classList.toggle('light', !d); }
    else { root.classList.toggle('dark', preference === 'dark'); root.classList.toggle('light', preference === 'light'); }
  }, []);

  useEffect(() => {
    async function loadPreferences() {
      const uid = authUser?.uid; if (!uid) return;
      try {
        const prefs = await getUserPreferences(uid);
        if (prefs?.notifications) { setNotifPrefs(prefs.notifications); localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(prefs.notifications)); }
        else { try { const c = localStorage.getItem(NOTIFICATION_STORAGE_KEY); if (c) setNotifPrefs(JSON.parse(c)); } catch {} }
        if (prefs?.theme) { setTheme(prefs.theme); localStorage.setItem(THEME_STORAGE_KEY, prefs.theme); }
        else { try { const c = localStorage.getItem(THEME_STORAGE_KEY) as ThemePreference | null; if (c && ['dark','light','system'].includes(c)) setTheme(c); } catch {} }
        if (prefs?.branding) { updateBranding(prefs.branding); localStorage.setItem('cf-branding', JSON.stringify(prefs.branding)); }
        else { try { const c = localStorage.getItem('cf-branding'); if (c) updateBranding(JSON.parse(c)); } catch {} }
      } catch {
        try { const cn = localStorage.getItem(NOTIFICATION_STORAGE_KEY); if (cn) setNotifPrefs(JSON.parse(cn)); const ct = localStorage.getItem(THEME_STORAGE_KEY) as ThemePreference|null; if (ct && ['dark','light','system'].includes(ct)) setTheme(ct); const cb = localStorage.getItem('cf-branding'); if (cb) updateBranding(JSON.parse(cb)); } catch {}
      }
    }
    loadPreferences();
  }, [authUser?.uid, updateBranding]);

  const handleSaveProfile = async () => {
    setIsSaving(true); setError(null);
    try { const cu = auth?.currentUser; if (!cu) throw new Error('Não autenticado.'); const { updateProfile } = await import('firebase/auth'); await updateProfile(cu, { displayName: displayName.trim() }); setSaved(true); toast.success('Perfil atualizado!'); setTimeout(() => setSaved(false), 2000); }
    catch (err: any) { const msg = err?.code === 'auth/requires-recent-login' ? 'Sessão expirada.' : 'Erro ao atualizar perfil.'; setError(msg); toast.error(msg); }
    finally { setIsSaving(false); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem.'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Máximo 2MB.'); return; }
    const cu = auth?.currentUser; if (!cu) return;
    setAvatarUploading(true);
    try { const { ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage'); const { storage } = await import('@/lib/firebase/config'); const { updateProfile } = await import('firebase/auth'); const sr = ref(storage, `avatars/${cu.uid}/${Date.now()}_${file.name}`); const snap = await uploadBytesResumable(sr, file, { contentType: file.type }); const url = await getDownloadURL(snap.ref); await updateProfile(cu, { photoURL: url }); toast.success('Foto atualizada!'); }
    catch { toast.error('Erro no upload.'); }
    finally { setAvatarUploading(false); if (avatarInputRef.current) avatarInputRef.current.value = ''; }
  };

  const handleSavePassword = async () => {
    setPasswordError(null); setIsSaving(true);
    if (!currentPassword) { setPasswordError('Informe a senha atual.'); setIsSaving(false); return; }
    if (newPassword.length < 8) { setPasswordError('Mínimo 8 caracteres.'); setIsSaving(false); return; }
    if (!/[A-Z]/.test(newPassword)) { setPasswordError('1 letra maiúscula obrigatória.'); setIsSaving(false); return; }
    if (!/[0-9]/.test(newPassword)) { setPasswordError('1 número obrigatório.'); setIsSaving(false); return; }
    if (newPassword !== confirmPassword) { setPasswordError('Senhas não coincidem.'); setIsSaving(false); return; }
    try { const cu = auth?.currentUser; if (!cu || !cu.email) throw new Error('Não autenticado.'); const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import('firebase/auth'); await reauthenticateWithCredential(cu, EmailAuthProvider.credential(cu.email, currentPassword)); await updatePassword(cu, newPassword); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); toast.success('Senha atualizada!'); }
    catch (err: any) { const c = err?.code || ''; if (c === 'auth/wrong-password' || c === 'auth/invalid-credential') setPasswordError('Senha atual incorreta.'); else if (c === 'auth/requires-recent-login') setPasswordError('Sessão expirada.'); else setPasswordError('Erro ao atualizar senha.'); }
    finally { setIsSaving(false); }
  };

  const handleSaveAppearance = async () => {
    setIsSaving(true);
    try { const uid = authUser?.uid; if (!uid) throw new Error('Não autenticado.'); await updateUserPreferences(uid, { theme, branding: { logoUrl: branding.logoUrl || '', colors: { primary: branding.colors.primary, secondary: branding.colors.secondary } } }); localStorage.setItem('cf-branding', JSON.stringify(branding)); localStorage.setItem(THEME_STORAGE_KEY, theme); setSaved(true); toast.success('Preferências salvas!'); setTimeout(() => setSaved(false), 2000); }
    catch { toast.error('Erro ao salvar.'); }
    finally { setIsSaving(false); }
  };

  const handleSave = async () => {
    if (activeTab === 'profile') return handleSaveProfile();
    if (activeTab === 'security') return handleSavePassword();
    if (activeTab === 'appearance') return handleSaveAppearance();
    if (activeTab === 'notifications') {
      setIsSaving(true);
      try { const uid = authUser?.uid; if (!uid) throw new Error(''); await updateUserPreferences(uid, { notifications: notifPrefs }); localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifPrefs)); setSaved(true); toast.success('Notificações salvas!'); setTimeout(() => setSaved(false), 2000); }
      catch { toast.error('Erro ao salvar.'); }
      finally { setIsSaving(false); }
    }
  };

  const SaveBtn = ({ label = 'Salvar' }: { label?: string }) => (
    <button onClick={handleSave} disabled={isSaving} className="text-[11px] font-mono font-bold tracking-wider text-[#0D0B09] bg-[#E6B447] hover:bg-[#F0C35C] px-4 py-2 transition-colors disabled:opacity-50 flex items-center gap-2">
      {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
      {saved ? 'SALVO' : label.toUpperCase()}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* ═══ HEADER ══════════════════════════════════════════════════════ */}
      <header className="shrink-0 border-b border-white/[0.06]">
        <div className="px-8 pt-8 pb-0 max-w-[1440px] mx-auto">
          <h1 className="text-[42px] font-black tracking-[-0.02em] text-[#F5E8CE] leading-none mb-8">
            Configurações
          </h1>
        </div>
      </header>

      {/* ═══ CONTENT ═════════════════════════════════════════════════════ */}
      <main className="flex-1 px-8 py-8 max-w-[1440px] mx-auto w-full">
        <div className="flex gap-8">
          {/* Sidebar nav — text only, border-left active */}
          <nav className="w-48 shrink-0 space-y-0 border-r border-white/[0.06] pr-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if ('href' in tab && tab.href) { router.push(tab.href); return; }
                  setActiveTab(tab.id);
                }}
                className={cn(
                  'w-full text-left px-3 py-2.5 text-[12px] font-mono tracking-wider transition-colors border-l-2',
                  activeTab === tab.id
                    ? 'text-[#E6B447] border-[#E6B447] bg-[#E6B447]/5'
                    : 'text-[#6B5D4A] border-transparent hover:text-[#CAB792]'
                )}
              >
                {tab.label}
              </button>
            ))}

            <div className="pt-4 mt-4 border-t border-white/[0.06]">
              <button
                onClick={() => logout()}
                className="w-full text-left px-3 py-2.5 text-[12px] font-mono tracking-wider text-[#C45B3A] hover:text-[#C45B3A]/80 transition-colors border-l-2 border-transparent"
              >
                Sair
              </button>
            </div>
          </nav>

          {/* Content area */}
          <div className="flex-1 min-w-0">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <Section title="Perfil">
                  <div className="flex items-start gap-6 mb-6">
                    {authUser?.photoURL ? (
                      <Image src={authUser.photoURL} alt="Avatar" width={64} height={64} className="h-16 w-16 object-cover" unoptimized />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center bg-[#1A1612] text-xl font-black text-[#F5E8CE] border border-white/[0.06]">
                        {authUser?.displayName?.[0]?.toUpperCase() || authUser?.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div>
                      <p className="text-[15px] font-bold text-[#F5E8CE]">{authUser?.displayName || 'Sem nome'}</p>
                      <p className="text-[12px] text-[#6B5D4A] font-mono">{authUser?.email}</p>
                      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                      <button onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading} className="text-[10px] font-mono tracking-wider text-[#AB8648] hover:text-[#E6B447] transition-colors mt-2 disabled:opacity-50">
                        {avatarUploading ? 'ENVIANDO...' : 'ALTERAR FOTO →'}
                      </button>
                    </div>
                  </div>

                  <Field label="Nome completo">
                    <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Seu nome" className="bg-[#0D0B09] border-white/[0.06] text-[#F5E8CE] placeholder:text-[#6B5D4A] font-mono text-sm focus:border-[#E6B447]/40 focus:ring-0" />
                  </Field>
                  <Field label="Email">
                    <Input value={authUser?.email || ''} disabled className="bg-[#0D0B09] border-white/[0.06] text-[#6B5D4A] font-mono text-sm opacity-50" />
                  </Field>
                  {error && activeTab === 'profile' && <p className="text-xs text-[#C45B3A] font-mono">{error}</p>}
                </Section>
                <div className="flex justify-end"><SaveBtn /></div>
              </div>
            )}

            {activeTab === 'business' && (
              <Section title="Contexto do Negócio">
                <p className="text-[13px] text-[#CAB792] leading-relaxed mb-4">
                  As informações do seu negócio são gerenciadas no <strong className="text-[#F5E8CE]">Brand Hub</strong>.
                </p>
                <Link href="/brand-hub" className="text-[11px] font-mono font-bold tracking-wider text-[#AB8648] hover:text-[#E6B447] transition-colors">
                  CONFIGURAR NO BRAND HUB →
                </Link>
              </Section>
            )}

            {activeTab === 'integrations' && (
              <Section title="Central de Integrações">
                <p className="text-[13px] text-[#CAB792] leading-relaxed mb-4">
                  Todas as integrações são gerenciadas na <strong className="text-[#F5E8CE]">Central de Integrações</strong>.
                </p>
                <Link href="/integrations" className="text-[11px] font-mono font-bold tracking-wider text-[#AB8648] hover:text-[#E6B447] transition-colors">
                  ABRIR INTEGRAÇÕES →
                </Link>
              </Section>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <Section title="Notificações">
                  <div className="divide-y divide-white/[0.04]">
                    {([
                      { key: 'funnelReview' as const, label: 'Funil em revisão', desc: 'Quando um funil precisa de avaliação' },
                      { key: 'proposalsGenerated' as const, label: 'Propostas geradas', desc: 'Quando o MKTHONEY gera propostas' },
                      { key: 'updates' as const, label: 'Atualizações', desc: 'Novidades da plataforma' },
                    ]).map((item) => (
                      <div key={item.key} className="flex items-center justify-between py-4">
                        <div>
                          <p className="text-[13px] font-bold text-[#F5E8CE]">{item.label}</p>
                          <p className="text-[11px] text-[#6B5D4A]">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={notifPrefs[item.key]} onChange={(e) => updateNotifPref(item.key, e.target.checked)} />
                          <div className="w-10 h-5 bg-white/[0.06] peer-checked:bg-[#E6B447] transition-colors" />
                          <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-[#0D0B09] transition-transform peer-checked:translate-x-5" />
                        </label>
                      </div>
                    ))}
                  </div>
                </Section>
                <div className="flex justify-end"><SaveBtn /></div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <Section title="Aparência & Branding">
                  <BrandingSettings />
                  <div className="border-t border-white/[0.04] mt-6 pt-6">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A] mb-3">Tema</p>
                    <div className="flex gap-2">
                      {(['dark', 'light', 'system'] as const).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => applyTheme(opt)}
                          className={cn(
                            'px-4 py-2 text-[11px] font-mono tracking-wider border transition-colors',
                            theme === opt
                              ? 'border-[#E6B447] text-[#E6B447] bg-[#E6B447]/5'
                              : 'border-white/[0.06] text-[#6B5D4A] hover:text-[#CAB792]'
                          )}
                        >
                          {opt === 'dark' ? 'Dark' : opt === 'light' ? 'Light' : 'Sistema'}
                        </button>
                      ))}
                    </div>
                  </div>
                </Section>
                <div className="flex justify-end"><SaveBtn label="Salvar Preferências" /></div>
              </div>
            )}

            {activeTab === 'security' && (
              <Section title="Segurança">
                <div className="space-y-4">
                  <Field label="Senha atual">
                    <Input type="password" placeholder="Sua senha atual" value={currentPassword} onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(null); }} className="bg-[#0D0B09] border-white/[0.06] text-[#F5E8CE] placeholder:text-[#6B5D4A] font-mono text-sm focus:border-[#E6B447]/40 focus:ring-0" />
                  </Field>
                  <Field label="Nova senha">
                    <Input type="password" placeholder="Mínimo 8 chars, 1 maiúscula, 1 número" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setPasswordError(null); }} className="bg-[#0D0B09] border-white/[0.06] text-[#F5E8CE] placeholder:text-[#6B5D4A] font-mono text-sm focus:border-[#E6B447]/40 focus:ring-0" />
                  </Field>
                  <Field label="Confirmar">
                    <Input type="password" placeholder="Repita a nova senha" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(null); }} className="bg-[#0D0B09] border-white/[0.06] text-[#F5E8CE] placeholder:text-[#6B5D4A] font-mono text-sm focus:border-[#E6B447]/40 focus:ring-0" />
                  </Field>
                  {passwordError && <p className="text-xs text-[#C45B3A] font-mono">{passwordError}</p>}
                  <SaveBtn label="Atualizar Senha" />
                </div>
              </Section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-white/[0.06] bg-[#0D0B09]">
      <div className="px-6 py-4 border-b border-white/[0.04]">
        <h2 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A]">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-[#6B5D4A]">{label}</label>
      {children}
    </div>
  );
}
