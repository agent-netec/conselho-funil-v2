'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
  X,
  RefreshCw,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/lib/hooks/use-user';
import { useBrandStore } from '@/lib/stores/brand-store';
import { saveIntegration, getIntegrations } from '@/lib/firebase/firestore';
import { MonaraTokenVault } from '@/lib/firebase/vault';
import { Timestamp } from 'firebase/firestore';
import type { Integration, IntegrationProvider, IntegrationCategory } from '@/types/database';
import { toast } from 'sonner';

// ─── Integration Registry ───

interface IntegrationDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  provider: IntegrationProvider;
  category: IntegrationCategory;
  available: boolean;
  oauthFlow?: boolean;
  setupInstructions?: string[];
  fields: FormField[];
}

interface FormField {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'password' | 'url';
  required: boolean;
  helpText?: string;
  helpLink?: { text: string; url: string };
}

const INTEGRATIONS: IntegrationDef[] = [
  // ─── Ads ───
  {
    id: 'meta',
    name: 'Meta Ads',
    description: 'Sincronize campanhas, conjuntos de anúncios e métricas de performance do Facebook e Instagram Ads.',
    icon: '🔵',
    provider: 'meta',
    category: 'ads',
    available: true,
    oauthFlow: true,
    fields: [
      { key: 'adAccountId', label: 'Ad Account ID', placeholder: 'act_123456789...', type: 'text', required: true, helpText: 'Localizado nas Configurações do Gerenciador de Negócios.', helpLink: { text: 'Abrir Gerenciador', url: 'https://adsmanager.facebook.com/adsmanager/manage/campaigns' } },
      { key: 'accessToken', label: 'Token de Acesso (System User Token)', placeholder: 'EAA...', type: 'password', required: true, helpText: 'Gere um token permanente em Usuários do Sistema.', helpLink: { text: 'Configurações do Negócio', url: 'https://business.facebook.com/settings/system-users' } },
      { key: 'appId', label: 'App ID (para auto-refresh)', placeholder: '123456789012345', type: 'text', required: false, helpText: 'Necessário para renovação automática do token.' },
      { key: 'appSecret', label: 'App Secret (para auto-refresh)', placeholder: 'abc123...', type: 'password', required: false, helpText: 'Encontre em developers.facebook.com > Seu App > Configurações.' },
    ],
  },
  {
    id: 'google',
    name: 'Google Ads',
    description: 'Análise completa de Search, Display e YouTube Ads diretamente no Dashboard.',
    icon: '🟡',
    provider: 'google',
    category: 'ads',
    available: true,
    oauthFlow: false,
    setupInstructions: [
      'Acesse sua conta Google Ads',
      'Vá em Ferramentas e configurações → Acesso e segurança → Usuários',
      'Clique em "+" e adicione o email: conselho-funil-ads@conselho-de-funil.iam.gserviceaccount.com',
      'Selecione nível de acesso "Somente leitura" e salve',
      'Informe seu Customer ID abaixo e clique em Conectar',
    ],
    fields: [
      { key: 'customerId', label: 'Customer ID', placeholder: '123-456-7890', type: 'text', required: true, helpText: 'ID da sua conta Google Ads. Encontre no canto superior direito do Google Ads.' },
    ],
  },
  {
    id: 'tiktok',
    name: 'TikTok Ads',
    description: 'Conecte TikTok for Business para análise de campanhas e criativos.',
    icon: '🎵',
    provider: 'tiktok',
    category: 'ads',
    available: true,
    oauthFlow: true,
    fields: [
      { key: 'advertiserId', label: 'Advertiser ID', placeholder: '7123456789', type: 'text', required: true },
      { key: 'accessToken', label: 'Access Token', placeholder: 'Bearer ...', type: 'password', required: true },
      { key: 'appId', label: 'App ID', placeholder: '7123456789', type: 'text', required: false },
      { key: 'appSecret', label: 'App Secret', placeholder: 'abc123...', type: 'password', required: false },
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Ads',
    description: 'Monitore campanhas de LinkedIn Ads com métricas B2B especializadas.',
    icon: '🔷',
    provider: 'linkedin',
    category: 'ads',
    available: true,
    oauthFlow: true,
    fields: [
      { key: 'accountId', label: 'Ad Account ID', placeholder: '512345678', type: 'text', required: true },
      { key: 'accessToken', label: 'Access Token', placeholder: 'AQV...', type: 'password', required: true },
      { key: 'clientId', label: 'Client ID', placeholder: '78abc...', type: 'text', required: false },
      { key: 'clientSecret', label: 'Client Secret', placeholder: 'xyz123...', type: 'password', required: false },
    ],
  },
  // ─── Redes Sociais ───
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Insights de engajamento, alcance e crescimento de seguidores via Graph API.',
    icon: '📸',
    provider: 'instagram',
    category: 'social',
    available: true,
    oauthFlow: true,
    fields: [
      { key: 'instagramAccountId', label: 'Instagram Business Account ID', placeholder: '17841400...', type: 'text', required: true },
      { key: 'accessToken', label: 'Token de Acesso (Page Token)', placeholder: 'EAA...', type: 'password', required: true, helpText: 'Compartilha Graph API com Meta. Use o token da página vinculada.' },
    ],
  },
  {
    id: 'facebook_pages',
    name: 'Facebook Pages',
    description: 'Métricas de páginas: alcance, engajamento, crescimento de fãs.',
    icon: '📘',
    provider: 'facebook_pages',
    category: 'social',
    available: false,
    fields: [],
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    description: 'Analytics de pins, boards e tráfego orgânico.',
    icon: '📌',
    provider: 'pinterest',
    category: 'social',
    available: false,
    fields: [],
  },
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Métricas de canais, vídeos e audiência via YouTube Analytics API.',
    icon: '▶️',
    provider: 'youtube',
    category: 'social',
    available: false,
    fields: [],
  },
  // ─── Comunicação ───
  {
    id: 'slack',
    name: 'Slack',
    description: 'Receba alertas de performance, aprovações de funil e notificações do Conselho direto no Slack.',
    icon: '💬',
    provider: 'slack',
    category: 'communication',
    available: true,
    fields: [
      { key: 'webhookUrl', label: 'Webhook URL', placeholder: 'https://hooks.slack.com/services/...', type: 'url', required: true, helpText: 'Crie um Incoming Webhook no Slack.', helpLink: { text: 'Criar Webhook', url: 'https://api.slack.com/messaging/webhooks' } },
      { key: 'channelName', label: 'Canal (opcional)', placeholder: '#marketing', type: 'text', required: false },
    ],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Notificações de aprovação de funil e alertas de performance via API oficial.',
    icon: '🟢',
    provider: 'whatsapp',
    category: 'communication',
    available: true,
    fields: [
      { key: 'phoneNumberId', label: 'Phone Number ID', placeholder: '123456789012345', type: 'text', required: true, helpText: 'Encontre no Meta Business Suite > WhatsApp.' },
      { key: 'accessToken', label: 'Access Token (permanente)', placeholder: 'EAA...', type: 'password', required: true },
    ],
  },
  {
    id: 'email',
    name: 'Email (SendGrid/Resend)',
    description: 'Envie relatórios e alertas por email usando SendGrid ou Resend.',
    icon: '📧',
    provider: 'email',
    category: 'communication',
    available: true,
    fields: [
      { key: 'emailProvider', label: 'Provedor', placeholder: 'sendgrid ou resend', type: 'text', required: true },
      { key: 'apiKey', label: 'API Key', placeholder: 'SG.xxx... ou re_xxx...', type: 'password', required: true },
      { key: 'fromAddress', label: 'Email de Envio (From)', placeholder: 'alerts@suaempresa.com', type: 'text', required: true },
      { key: 'fromName', label: 'Nome do Remetente (opcional)', placeholder: 'Conselho de Funil', type: 'text', required: false },
    ],
  },
  // ─── Pesquisa & Dados ───
  {
    id: 'google_analytics',
    name: 'Google Analytics',
    description: 'Importe dados de tráfego, conversões e comportamento do GA4.',
    icon: '📊',
    provider: 'google_analytics',
    category: 'data',
    available: false,
    fields: [],
  },
  {
    id: 'search_console',
    name: 'Search Console',
    description: 'Dados de impressões, cliques e posições orgânicas no Google.',
    icon: '🔍',
    provider: 'search_console',
    category: 'data',
    available: false,
    fields: [],
  },
  {
    id: 'dataforseo',
    name: 'DataForSEO',
    description: 'Volume de busca real, dificuldade de keyword e SERP features.',
    icon: '📈',
    provider: 'dataforseo',
    category: 'data',
    available: false,
    fields: [],
  },
];

const CATEGORIES: { id: IntegrationCategory; label: string; icon: string }[] = [
  { id: 'ads', label: 'Ads', icon: '📢' },
  { id: 'social', label: 'Redes Sociais', icon: '🌐' },
  { id: 'communication', label: 'Comunicação', icon: '💬' },
  { id: 'data', label: 'Pesquisa & Dados', icon: '📊' },
];

// ─── Integration Card ───

function IntegrationCard({
  def,
  integration,
  onConfigure,
}: {
  def: IntegrationDef;
  integration?: Integration;
  onConfigure: () => void;
}) {
  const isConnected = integration?.status === 'active';
  const isError = integration?.status === 'error';
  const isExpired = integration?.status === 'expired';

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={cn(
        'card-premium p-5 flex flex-col h-full border-white/[0.04] transition-all group',
        !def.available && 'opacity-50',
        isConnected && 'hover:border-emerald-500/30',
        isError && 'border-red-500/20',
        isExpired && 'border-amber-500/20'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.06] group-hover:border-emerald-500/20 transition-colors">
          <span className="text-xl">{def.icon}</span>
        </div>
        {isConnected && (
          <div className="badge-success">
            <div className="glow-dot" />
            Ativo
          </div>
        )}
        {isError && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider">
            <AlertCircle className="h-2.5 w-2.5" />
            Erro
          </div>
        )}
        {isExpired && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
            <AlertTriangle className="h-2.5 w-2.5" />
            Expirado
          </div>
        )}
        {!isConnected && !isError && !isExpired && def.available && (
          <div className="badge-warning">Pendente</div>
        )}
        {!def.available && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
            Em breve
          </div>
        )}
      </div>

      <h3 className="text-sm font-semibold text-white mb-1">{def.name}</h3>
      <p className="text-xs text-zinc-500 mb-4 flex-1 leading-relaxed line-clamp-2">
        {def.description}
      </p>

      {integration?.lastSyncAt && (
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 mb-3">
          <Clock className="h-2.5 w-2.5" />
          Sync: {new Date(integration.lastSyncAt.toMillis()).toLocaleDateString('pt-BR')}
        </div>
      )}

      <Button
        onClick={onConfigure}
        variant="ghost"
        size="sm"
        disabled={!def.available}
        className={cn(
          'w-full text-xs group/btn',
          isConnected
            ? 'bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300'
            : def.available
              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
              : 'bg-white/[0.02] text-zinc-600 cursor-not-allowed'
        )}
      >
        {isConnected ? 'Configurar' : def.available ? 'Conectar' : 'Em breve'}
        {def.available && <ArrowRight className="ml-1.5 h-3 w-3 transition-transform group-hover/btn:translate-x-1" />}
      </Button>
    </motion.div>
  );
}

// ─── Health Dashboard ───

function HealthDashboard({ integrations }: { integrations: Integration[] }) {
  const active = integrations.filter(i => i.status === 'active').length;
  const errors = integrations.filter(i => i.status === 'error').length;
  const expired = integrations.filter(i => i.status === 'expired').length;
  const total = integrations.length;

  if (total === 0) return null;

  const expiringSoon = integrations.filter(i => {
    if (!i.expiresAt) return false;
    const daysUntilExpiry = (i.expiresAt.toMillis() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  });

  return (
    <div className="card-premium p-5 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-4 w-4 text-emerald-500" />
        <h3 className="text-sm font-semibold text-white">Status das Integrações</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
          <div className="text-2xl font-bold text-emerald-400">{active}</div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Ativas</div>
        </div>
        <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
          <div className="text-2xl font-bold text-red-400">{errors}</div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Com Erro</div>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
          <div className="text-2xl font-bold text-amber-400">{expired}</div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Expiradas</div>
        </div>
        <div className="p-3 rounded-xl bg-zinc-500/5 border border-zinc-500/10">
          <div className="text-2xl font-bold text-zinc-400">{total}</div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Total</div>
        </div>
      </div>

      {expiringSoon.length > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-medium mb-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            Tokens expirando em breve
          </div>
          {expiringSoon.map(i => {
            const def = INTEGRATIONS.find(d => d.provider === i.provider);
            const daysLeft = Math.ceil((i.expiresAt!.toMillis() - Date.now()) / (1000 * 60 * 60 * 24));
            return (
              <div key={i.id} className="flex items-center justify-between text-xs text-zinc-400 py-1">
                <span>{def?.icon} {def?.name || i.provider}</span>
                <span className="text-amber-400">{daysLeft} dias restantes</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Configuration Panel ───

function ConfigPanel({
  def,
  integration,
  brandId,
  tenantId,
  onClose,
  onSaved,
}: {
  def: IntegrationDef;
  integration?: Integration;
  brandId: string;
  tenantId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    def.fields.forEach(f => { initial[f.key] = ''; });
    if (integration?.config) {
      Object.keys(integration.config).forEach(k => {
        if (typeof integration.config[k] === 'string') {
          initial[k] = integration.config[k];
        }
      });
    }
    return initial;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ ok: boolean; message: string } | null>(null);

  const updateField = useCallback((key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setValidationResult(null);
  }, []);

  const requiredFieldsFilled = def.fields
    .filter(f => f.required)
    .every(f => formData[f.key]?.trim());

  // U-3.1: Pre-save validation
  const handleValidate = async () => {
    setIsValidating(true);
    setValidationResult(null);
    try {
      const provider = def.provider;
      // Only Meta and Google have real validation endpoints
      if (provider === 'meta' || provider === 'google') {
        const res = await fetch('/api/performance/integrations/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brandId,
            platform: provider,
            apiKey: formData.accessToken,
            accountId: formData.adAccountId || formData.customerId || '',
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setValidationResult({ ok: true, message: data.data?.message || 'Validação OK!' });
        } else {
          setValidationResult({ ok: false, message: data.error || 'Validação falhou.' });
        }
      } else if (provider === 'slack') {
        // Validate Slack webhook URL format
        try {
          const parsed = new URL(formData.webhookUrl);
          if (parsed.hostname === 'hooks.slack.com' || parsed.hostname === 'hooks.slack-gov.com') {
            setValidationResult({ ok: true, message: 'URL de webhook válida!' });
          } else {
            setValidationResult({ ok: false, message: 'URL deve ser hooks.slack.com' });
          }
        } catch {
          setValidationResult({ ok: false, message: 'URL inválida.' });
        }
      } else {
        // For other providers, just check required fields
        setValidationResult({ ok: true, message: 'Campos preenchidos corretamente.' });
      }
    } catch (err) {
      setValidationResult({ ok: false, message: 'Erro ao validar. Verifique sua conexão.' });
    } finally {
      setIsValidating(false);
    }
  };

  // U-3.3: Dual storage save
  const handleSave = async () => {
    if (!requiredFieldsFilled) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    setIsSaving(true);
    try {
      const provider = def.provider;

      // 1. Save to MonaraTokenVault (for providers with tokens)
      const hasToken = formData.accessToken;
      if (hasToken && (provider === 'meta' || provider === 'google')) {
        const tokenData: any = {
          brandId,
          provider,
          accessToken: formData.accessToken,
          expiresAt: Timestamp.fromMillis(
            Date.now() + (provider === 'meta' ? 60 * 24 * 60 * 60 * 1000 : 3600 * 1000)
          ),
          scopes: provider === 'meta'
            ? ['ads_read', 'read_insights', 'ads_management']
            : ['https://www.googleapis.com/auth/adwords'],
          metadata: provider === 'meta'
            ? {
                adAccountId: formData.adAccountId || '',
                appId: formData.appId || '',
                appSecret: formData.appSecret || '',
              }
            : {
                customerId: (formData.customerId || '').replace(/-/g, ''),
                developerToken: formData.developerToken || '',
                clientId: formData.clientId || '',
                clientSecret: formData.clientSecret || '',
              },
        };

        if (formData.refreshToken) {
          tokenData.refreshToken = formData.refreshToken;
        }

        await MonaraTokenVault.saveToken(brandId, tokenData);
      }

      // 2. Save to Firestore integration doc (UI status)
      await saveIntegration(tenantId, provider, formData);

      toast.success(`${def.name} conectado com sucesso!`);
      onSaved();

      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error(`Error saving ${def.name} integration:`, error);
      toast.error('Erro ao salvar integração. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // OAuth button
  const handleOAuth = (provider: string) => {
    const callbackUrl = `${window.location.origin}/api/auth/${provider}/callback`;
    let authUrl = '';

    switch (provider) {
      case 'meta':
        authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${formData.appId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=ads_read,read_insights,ads_management&state=${brandId}`;
        break;
      case 'google':
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${formData.clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=https://www.googleapis.com/auth/adwords&access_type=offline&prompt=consent&state=${brandId}`;
        break;
      case 'linkedin':
        authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${formData.clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=r_ads,r_ads_reporting&state=${brandId}`;
        break;
      case 'tiktok':
        authUrl = `https://business-api.tiktok.com/portal/auth?app_id=${formData.appId}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${brandId}`;
        break;
      case 'instagram':
        authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${formData.appId || formData.accessToken?.slice(0,15)}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=instagram_basic,instagram_manage_insights,pages_show_list&state=${brandId}`;
        break;
    }

    if (authUrl) {
      window.open(authUrl, '_blank', 'width=600,height=700');
    } else {
      toast.error('Configure o App ID/Client ID primeiro para usar OAuth.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="card-premium p-8 border-emerald-500/20"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04] flex text-2xl border border-white/[0.06]">
            {def.icon}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Configurar {def.name}</h2>
            <p className="text-sm text-zinc-500">
              {def.oauthFlow ? 'Insira suas credenciais ou use OAuth' : 'Insira as credenciais de acesso'}
            </p>
          </div>
        </div>
        <Button variant="ghost" onClick={onClose} className="text-zinc-500 hover:text-white">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-5">
          {/* Setup instructions (e.g. Google SA flow) */}
          {def.setupInstructions && def.setupInstructions.length > 0 && (
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 space-y-2">
              <p className="text-sm font-semibold text-blue-400 flex items-center gap-2">
                <span>📋</span> Como conectar
              </p>
              <ol className="space-y-1.5">
                {def.setupInstructions.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center font-bold mt-0.5">
                      {i + 1}
                    </span>
                    {/* Highlight SA email */}
                    {step.includes('@') ? (
                      <span>
                        {step.split(/(conselho-funil-ads@conselho-de-funil\.iam\.gserviceaccount\.com)/g).map((part, j) =>
                          part.includes('@') ? (
                            <code key={j} className="text-xs bg-zinc-800 text-emerald-400 px-1.5 py-0.5 rounded font-mono break-all">
                              {part}
                            </code>
                          ) : part
                        )}
                      </span>
                    ) : step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {def.fields.map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              <Input
                type={field.type === 'url' ? 'text' : field.type}
                placeholder={field.placeholder}
                value={formData[field.key] || ''}
                onChange={(e) => updateField(field.key, e.target.value)}
                className="input-premium"
              />
              {(field.helpText || field.helpLink) && (
                <p className="mt-1.5 text-[11px] text-zinc-500 flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  {field.helpText}
                  {field.helpLink && (
                    <a href={field.helpLink.url} target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline inline-flex items-center gap-1">
                      {field.helpLink.text} <ExternalLink className="h-2 w-2" />
                    </a>
                  )}
                </p>
              )}
            </div>
          ))}

          {/* Validation result */}
          {validationResult && (
            <div className={cn(
              'flex items-center gap-2 p-3 rounded-xl text-sm',
              validationResult.ok
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            )}>
              {validationResult.ok ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
              {validationResult.message}
            </div>
          )}

          <div className="flex items-center gap-3 pt-4">
            {/* Validate button */}
            <Button
              onClick={handleValidate}
              variant="ghost"
              className="bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300"
              disabled={!requiredFieldsFilled || isValidating}
            >
              {isValidating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              Validar
            </Button>

            {/* OAuth button (if applicable) */}
            {def.oauthFlow && (
              <Button
                onClick={() => handleOAuth(def.provider)}
                variant="ghost"
                className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                OAuth
              </Button>
            )}

            {/* Save button */}
            <Button
              onClick={handleSave}
              className="btn-accent flex-1"
              disabled={!requiredFieldsFilled || isSaving}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar Integração
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/[0.04] space-y-4">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Zap className="h-3 w-3 text-emerald-500" />
              O que o Conselho pode fazer com {def.name}?
            </h4>
            <ul className="space-y-3">
              {getCapabilities(def.provider).map((item) => (
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
              Suas chaves de API são criptografadas com AES-256 e nunca compartilhadas.
              O Conselho utiliza apenas acesso de leitura para extrair insights estratégicos.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function getCapabilities(provider: IntegrationProvider): string[] {
  switch (provider) {
    case 'meta':
      return [
        'Analisar métricas de CPC, CPM e ROAS',
        'Sugerir melhorias em criativos estagnados',
        'Detectar fadiga de audiência automaticamente',
        'Criar novos hooks baseados no que já funciona',
      ];
    case 'google':
      return [
        'Analisar performance de Search e Display Ads',
        'Otimizar Quality Score e Ad Rank',
        'Identificar keywords de alto potencial',
        'Sugerir estrutura de campanhas otimizada',
      ];
    case 'tiktok':
      return [
        'Analisar métricas de vídeo e engajamento',
        'Identificar tendências de criativos',
        'Otimizar targeting por interesse e comportamento',
      ];
    case 'linkedin':
      return [
        'Analisar campanhas B2B de Sponsored Content',
        'Otimizar Lead Gen Forms e InMail',
        'Segmentar por cargo, empresa e setor',
      ];
    case 'instagram':
      return [
        'Insights de engajamento e alcance de posts',
        'Análise de crescimento de seguidores',
        'Identificar melhores horários de publicação',
      ];
    case 'slack':
      return [
        'Alertas de performance em tempo real',
        'Notificações de aprovação de funil',
        'Resumos semanais de métricas',
      ];
    case 'whatsapp':
      return [
        'Alertas de performance urgentes',
        'Notificações de aprovação de funil',
        'Resumos de métricas por mensagem',
      ];
    case 'email':
      return [
        'Relatórios semanais de performance',
        'Alertas de anomalias e oportunidades',
        'Summaries executivos personalizados',
      ];
    default:
      return ['Em breve: funcionalidades específicas para esta plataforma.'];
  }
}

// ─── Main Page ───

export default function IntegrationsPage() {
  const { user } = useUser();
  const { selectedBrand } = useBrandStore();
  const brandId = selectedBrand?.id || '';
  const tenantId = user?.tenantId || user?.id || '';
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [activeConfig, setActiveConfig] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<IntegrationCategory | 'all'>('all');

  const loadIntegrations = useCallback(async () => {
    if (tenantId) {
      try {
        const data = await getIntegrations(tenantId);
        setIntegrations(data);
      } catch (err) {
        console.warn('[Integrations] Failed to load:', err);
      }
    }
  }, [tenantId]);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  const getIntegrationStatus = (provider: IntegrationProvider): Integration | undefined => {
    return integrations.find(i => i.provider === provider);
  };

  const activeDef = activeConfig ? INTEGRATIONS.find(d => d.id === activeConfig) : null;

  const filteredIntegrations = INTEGRATIONS.filter(def => {
    if (filterCategory !== 'all' && def.category !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return def.name.toLowerCase().includes(q) || def.description.toLowerCase().includes(q);
    }
    return true;
  });

  const groupedByCategory = CATEGORIES.map(cat => ({
    ...cat,
    items: filteredIntegrations.filter(d => d.category === cat.id),
  })).filter(g => g.items.length > 0);

  return (
    <div className="flex min-h-screen flex-col bg-dot-pattern">
      <Header title="Central de Integrações" />

      <main className="flex-1 p-8">
        <div className="mx-auto max-w-6xl">
          {/* Hero Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-3">Conecte seu Ecossistema</h1>
            <p className="text-zinc-500 max-w-2xl leading-relaxed">
              Integre o Conselho de Funil com suas ferramentas de anúncios, redes sociais,
              comunicação e dados para análises em tempo real e ativos precisos.
            </p>
          </div>

          {/* U-1.4: Health Dashboard */}
          <HealthDashboard integrations={integrations} />

          {/* Search + Filter Bar */}
          <div className="flex items-center gap-4 mb-8">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Buscar integração..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-premium pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterCategory('all')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  filterCategory === 'all'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                Todas
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    filterCategory === cat.id
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-zinc-500 hover:text-zinc-300'
                  )}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Panel */}
          <AnimatePresence>
            {activeDef && (
              <div className="mb-8">
                <ConfigPanel
                  def={activeDef}
                  integration={getIntegrationStatus(activeDef.provider)}
                  brandId={brandId}
                  tenantId={tenantId}
                  onClose={() => setActiveConfig(null)}
                  onSaved={loadIntegrations}
                />
              </div>
            )}
          </AnimatePresence>

          {/* Integration Cards by Category */}
          {!activeConfig && groupedByCategory.map(group => (
            <div key={group.id} className="mb-10">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>{group.icon}</span>
                {group.label}
                <span className="text-zinc-600">({group.items.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {group.items.map(def => (
                  <IntegrationCard
                    key={def.id}
                    def={def}
                    integration={getIntegrationStatus(def.provider)}
                    onConfigure={() => setActiveConfig(def.id)}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Empty Search State */}
          {filteredIntegrations.length === 0 && (
            <div className="text-center p-12 rounded-3xl border border-dashed border-white/[0.08]">
              <Search className="h-8 w-8 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-400">Nenhuma integração encontrada</h3>
              <p className="text-sm text-zinc-600 mt-2">
                Tente buscar por outro nome ou limpe os filtros.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
