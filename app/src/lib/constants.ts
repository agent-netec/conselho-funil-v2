import type { Counselor, CounselorId } from '@/types';

// ============================================
// COUNSELORS REGISTRY - Fonte Única de Verdade
// ============================================

export const COUNSELORS_REGISTRY: Record<CounselorId, Counselor> = {
  // Funnel Counselors
  russell_brunson: {
    id: 'russell_brunson',
    name: 'Russell Brunson',
    expertise: 'Arquitetura de Funil',
    color: '#6366f1',
    icon: '🎯',
    domain: 'funnel',
  },
  dan_kennedy: {
    id: 'dan_kennedy',
    name: 'Dan Kennedy',
    expertise: 'Oferta & Copy',
    color: '#8b5cf6',
    icon: '✍️',
    domain: 'funnel',
  },
  frank_kern: {
    id: 'frank_kern',
    name: 'Frank Kern',
    expertise: 'Psicologia & Comportamento',
    color: '#ec4899',
    icon: '🧠',
    domain: 'funnel',
  },
  sam_ovens: {
    id: 'sam_ovens',
    name: 'Sam Ovens',
    expertise: 'Aquisição & Qualificação',
    color: '#14b8a6',
    icon: '🎣',
    domain: 'funnel',
  },
  ryan_deiss: {
    id: 'ryan_deiss',
    name: 'Ryan Deiss',
    expertise: 'LTV & Retenção',
    color: '#f97316',
    icon: '📈',
    domain: 'funnel',
  },
  perry_belcher: {
    id: 'perry_belcher',
    name: 'Perry Belcher',
    expertise: 'Monetização Simples',
    color: '#84cc16',
    icon: '💰',
    domain: 'funnel',
  },

  // Social Counselors
  lia_haberman: {
    id: 'lia_haberman',
    name: 'Lia Haberman',
    expertise: 'Algoritmo & Mudanças',
    color: '#06b6d4',
    icon: '📊',
    domain: 'social',
  },
  rachel_karten: {
    id: 'rachel_karten',
    name: 'Rachel Karten',
    expertise: 'Criativo & Hooks',
    color: '#f43f5e',
    icon: '🪝',
    domain: 'social',
  },
  nikita_beer: {
    id: 'nikita_beer',
    name: 'Nikita Beer',
    expertise: 'Viralização & Trends',
    color: '#8b5cf6',
    icon: '🚀',
    domain: 'social',
  },
  justin_welsh: {
    id: 'justin_welsh',
    name: 'Justin Welsh',
    expertise: 'Funil Social',
    color: '#E6B447',
    icon: '⛓️',
    domain: 'social',
  },

  // Copy Counselors
  eugene_schwartz: {
    id: 'eugene_schwartz',
    name: 'Eugene Schwartz',
    expertise: 'Consciência de Mercado',
    specialty: 'Estrutura de copy para diferentes estágios de consciência',
    color: '#6366f1',
    icon: '🎯',
    domain: 'copy',
  },
  claude_hopkins: {
    id: 'claude_hopkins',
    name: 'Claude Hopkins',
    expertise: 'Método Científico',
    specialty: 'Testes, medição, prova social',
    color: '#3b82f6',
    icon: '🔬',
    domain: 'copy',
  },
  gary_halbert: {
    id: 'gary_halbert',
    name: 'Gary Halbert',
    expertise: 'Headlines & Psicologia',
    specialty: 'Headlines que prendem, curiosidade, especificidade',
    color: '#f59e0b',
    icon: '⚡',
    domain: 'copy',
  },
  joseph_sugarman: {
    id: 'joseph_sugarman',
    name: 'Joseph Sugarman',
    expertise: 'Narrativa & Estrutura',
    specialty: 'Storytelling, transições, long-form copy',
    color: '#8b5cf6',
    icon: '📖',
    domain: 'copy',
  },
  dan_kennedy_copy: {
    id: 'dan_kennedy_copy',
    name: 'Dan Kennedy',
    expertise: 'Oferta & Urgência',
    specialty: 'Ofertas irresistíveis, garantia, urgência real',
    color: '#E6B447',
    icon: '💰',
    domain: 'copy',
  },
  david_ogilvy: {
    id: 'david_ogilvy',
    name: 'David Ogilvy',
    expertise: 'Brand Premium',
    specialty: 'Pesquisa, diferenciação, big idea',
    color: '#64748b',
    icon: '👔',
    domain: 'copy',
  },
  john_carlton: {
    id: 'john_carlton',
    name: 'John Carlton',
    expertise: 'Voz Autêntica',
    specialty: 'Autenticidade, fluxo natural, conversação',
    color: '#ec4899',
    icon: '🎤',
    domain: 'copy',
  },
  drayton_bird: {
    id: 'drayton_bird',
    name: 'Drayton Bird',
    expertise: 'Simplicidade & Eficiência',
    specialty: 'Benefício claro, direto, resposta direta',
    color: '#14b8a6',
    icon: '✂️',
    domain: 'copy',
  },
  frank_kern_copy: {
    id: 'frank_kern_copy',
    name: 'Frank Kern',
    expertise: 'Fluxo de Vendas',
    specialty: 'Sequências, automação, comportamento',
    color: '#f97316',
    icon: '🔄',
    domain: 'copy',
  },

  // Ads Counselors
  justin_brooke: {
    id: 'justin_brooke',
    name: 'Justin Brooke',
    expertise: 'Estratégia & Escala',
    color: '#3b82f6',
    icon: '📊',
    domain: 'ads',
  },
  nicholas_kusmich: {
    id: 'nicholas_kusmich',
    name: 'Nicholas Kusmich',
    expertise: 'Meta Ads & Contexto',
    color: '#2563eb',
    icon: '🎯',
    domain: 'ads',
  },
  jon_loomer: {
    id: 'jon_loomer',
    name: 'Jon Loomer',
    expertise: 'Analytics & Técnico',
    color: '#1d4ed8',
    icon: '⚙️',
    domain: 'ads',
  },
  savannah_sanchez: {
    id: 'savannah_sanchez',
    name: 'Savannah Sanchez',
    expertise: 'TikTok & UGC',
    color: '#0ea5e9',
    icon: '📱',
    domain: 'ads',
  },
  design_director: {
    id: 'design_director',
    name: 'Diretor de Design',
    expertise: 'Direção de Arte & Briefing',
    color: '#a855f7',
    icon: '🎨',
    domain: 'design',
  },
};

// Retrocompatibilidade (Deprecated)
/** @deprecated Use COUNSELORS_REGISTRY */
export const COUNSELORS = COUNSELORS_REGISTRY;
/** @deprecated Use COUNSELORS_REGISTRY */
export const COPY_COUNSELORS = COUNSELORS_REGISTRY;

// Navigation groups and items
import type { Tier } from '@/lib/tier-system';

export type NavItemStatus = 'active' | 'coming_soon' | 'hidden';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  aliases?: string[];
  sub_items?: string[];
  /** Minimum tier required to access this item. Default: 'free' */
  minTier?: Tier;
  /** Feature status: active (default), coming_soon, or hidden */
  status?: NavItemStatus;
  /** Label shown on coming_soon badge */
  comingSoonLabel?: string;
  /** @deprecated Use status: 'coming_soon' instead */
  comingSoon?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  description?: string;
  icon: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'main',
    label: 'Principal',
    icon: 'Home',
    items: [
      { id: 'dashboard', label: 'Dashboard', href: '/home', icon: 'LayoutDashboard', minTier: 'free' },
      { id: 'chat', label: 'Consultar MKTHONEY', href: '/chat', icon: 'MessageSquare', minTier: 'free' },
    ],
  },
  {
    id: 'strategy',
    label: 'Estratégia',
    icon: 'Compass',
    items: [
      { id: 'funnels', label: 'Funis', href: '/funnels', icon: 'Target', minTier: 'free' },
      { id: 'campaigns', label: 'Campanhas', href: '/campaigns', icon: 'Rocket', aliases: ['/campaign'], minTier: 'starter' },
      { id: 'deep-research', label: 'Deep Research', href: '/intelligence/research', icon: 'Telescope', minTier: 'pro' },
      { id: 'discovery', label: 'Discovery', href: '/intelligence/discovery', icon: 'Search', minTier: 'pro' },
    ],
  },
  {
    id: 'content',
    label: 'Conteúdo',
    icon: 'PencilLine',
    items: [
      { id: 'social', label: 'Social', href: '/social', icon: 'Share2', minTier: 'starter' },
      { id: 'design-studio', label: 'Design Studio', href: '/design', icon: 'Palette', minTier: 'pro' },
      { id: 'vault', label: 'Creative Vault', href: '/vault', icon: 'Database', minTier: 'pro', status: 'coming_soon' },
      { id: 'content-review', label: 'Aprovações', href: '/content/review', icon: 'ClipboardCheck', minTier: 'pro', status: 'hidden' },
      // Hidden: Intelligence Overview, Social Inbox, Automation
      { id: 'intelligence', label: 'Intelligence', href: '/intelligence', icon: 'Brain', minTier: 'pro', status: 'hidden' },
      { id: 'social-inbox', label: 'Social Inbox', href: '/social-inbox', icon: 'Inbox', minTier: 'pro', status: 'hidden' },
      { id: 'automation', label: 'Automação', href: '/automation', icon: 'Cpu', minTier: 'pro', status: 'hidden' },
    ],
  },
  {
    id: 'analysis',
    label: 'Análise',
    icon: 'Activity',
    items: [
      { id: 'offer-lab', label: 'Offer Lab', href: '/intelligence/offer-lab', icon: 'FlaskConical', minTier: 'pro' },
      { id: 'predict', label: 'Predict', href: '/intelligence/predict', icon: 'TrendingUp', minTier: 'pro' },
      { id: 'performance', label: 'Performance', href: '/performance', icon: 'Activity', minTier: 'agency' },
      // Hidden: Page Forensics, Cross-channel
      { id: 'page-forensics', label: 'Forensics', href: '/strategy/autopsy', icon: 'Stethoscope', status: 'hidden' },
    ],
  },
  {
    id: 'config',
    label: 'Configuração',
    icon: 'Settings',
    items: [
      { id: 'brands', label: 'Marcas', href: '/brands', icon: 'Building', minTier: 'free' },
      { id: 'settings', label: 'Configurações', href: '/settings', icon: 'Settings', minTier: 'free' },
      { id: 'billing', label: 'Planos', href: '/settings/billing', icon: 'CreditCard', minTier: 'free' },
    ],
  },
];

// Retrocompatibilidade para NAV_ITEMS (Flattened list)
export const NAV_ITEMS = NAV_GROUPS.flatMap(group => group.items);

// Status badges
export const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500',
  generating: 'bg-blue-500',
  review: 'bg-yellow-500',
  approved: 'bg-green-500',
  adjusting: 'bg-orange-500',
  executing: 'bg-[#E6B447]',
  completed: 'bg-[#E6B447]',
  killed: 'bg-red-500',
};

// Decision colors
export const DECISION_COLORS = {
  EXECUTAR: 'bg-green-500 text-white',
  AJUSTAR: 'bg-amber-500 text-white',
  MATAR: 'bg-red-500 text-white',
} as const;

// Copy Types with labels
export const COPY_TYPES = {
  headline: { label: 'Headlines', icon: '📰', description: 'Headlines por estágio de consciência' },
  email_sequence: { label: 'Emails', icon: '📧', description: 'Sequência de emails de follow-up' },
  offer_copy: { label: 'Oferta', icon: '💰', description: 'Copy de oferta completa' },
  vsl_script: { label: 'VSL Script', icon: '🎬', description: 'Script de Video Sales Letter' },
  ad_creative: { label: 'Anúncios', icon: '📱', description: 'Copy para Meta, Google, etc' },
  landing_page: { label: 'Landing Page', icon: '🛬', description: 'Copy de página de vendas' },
} as const;

// Awareness stages with labels
export const AWARENESS_STAGES = {
  unaware: { label: 'Inconsciente', description: 'Não sabe que tem problema', copyLength: 'Muito longa' },
  problem_aware: { label: 'Consciente do Problema', description: 'Sabe que tem problema', copyLength: 'Média' },
  solution_aware: { label: 'Consciente da Solução', description: 'Sabe que existem soluções', copyLength: 'Média' },
  product_aware: { label: 'Consciente do Produto', description: 'Conhece seu produto', copyLength: 'Curta' },
  most_aware: { label: 'Mais Consciente', description: 'Já conhece bem', copyLength: 'Muito curta' },
} as const;

// Chat modes configuration
// Sprint 05.1: Simplified to 3 core modes (general, campaign, party)
// Legacy modes (funnel, copy, social, ads, design) mapped internally for backward compat
export const CHAT_MODES = {
  general: {
    id: 'general',
    label: 'Geral',
    title: 'MKTHONEY',
    subtitle: '23 especialistas',
    placeholder: 'Pergunte ao MKTHONEY...',
    footer: 'Pressione Enter para enviar, Shift+Enter para nova linha',
    accentColor: 'gold',
    counselors: [
      'russell_brunson', 'dan_kennedy', 'frank_kern', 'sam_ovens', 'ryan_deiss', 'perry_belcher',
      'eugene_schwartz', 'claude_hopkins', 'gary_halbert', 'joseph_sugarman', 'dan_kennedy_copy',
      'david_ogilvy', 'john_carlton', 'drayton_bird', 'frank_kern_copy', 'lia_haberman',
      'rachel_karten', 'nikita_beer', 'justin_welsh', 'justin_brooke', 'nicholas_kusmich',
      'jon_loomer', 'savannah_sanchez'
    ] as CounselorId[],
  },
  campaign: {
    id: 'campaign',
    label: 'Campanha',
    title: 'Campanha',
    subtitle: 'Contexto da Linha de Ouro',
    placeholder: 'Pergunte sobre sua campanha ativa...',
    footer: '🎯 Todos os 23 especialistas com contexto da sua campanha',
    accentColor: 'amber',
    counselors: [
      'russell_brunson', 'dan_kennedy', 'frank_kern', 'sam_ovens', 'ryan_deiss', 'perry_belcher',
      'eugene_schwartz', 'claude_hopkins', 'gary_halbert', 'joseph_sugarman', 'dan_kennedy_copy',
      'david_ogilvy', 'john_carlton', 'drayton_bird', 'frank_kern_copy', 'lia_haberman',
      'rachel_karten', 'nikita_beer', 'justin_welsh', 'justin_brooke', 'nicholas_kusmich',
      'jon_loomer', 'savannah_sanchez'
    ] as CounselorId[],
  },
  party: {
    id: 'party',
    label: 'Party Mode',
    title: 'Party Mode',
    subtitle: 'Debate entre Especialistas',
    placeholder: 'Inicie uma deliberação entre especialistas...',
    footer: '🎉 Party Mode: Selecione os especialistas para o debate (2 créditos)',
    accentColor: 'gold',
    counselors: [] as CounselorId[], // Será preenchido dinamicamente
  },
} as const;
