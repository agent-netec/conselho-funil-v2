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

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  aliases?: string[];
  sub_items?: string[];
  /** R4.1: Minimum tier required to access this item. Default: 'starter' */
  minTier?: Tier;
  /** R4.2: Is this a Coming Soon feature? */
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
      { id: 'dashboard', label: 'Dashboard', href: '/home', icon: 'LayoutDashboard', minTier: 'starter' },
      { id: 'chat', label: 'Consultar MKTHONEY', href: '/chat', icon: 'MessageSquare', minTier: 'starter' },
    ],
  },
  {
    id: 'strategy',
    label: 'Estratégia',
    icon: 'Compass',
    items: [
      { id: 'funnels', label: 'Funis', href: '/funnels', icon: 'Target', minTier: 'starter' },
      { id: 'campaigns', label: 'Campanhas', href: '/campaigns', icon: 'Rocket', aliases: ['/campaign'], minTier: 'starter' },
      { id: 'intelligence', label: 'Intelligence', href: '/intelligence', icon: 'Brain', minTier: 'starter' },
      { id: 'discovery', label: 'Discovery', href: '/intelligence/discovery', icon: 'Search', minTier: 'pro' },
    ],
  },
  {
    id: 'content',
    label: 'Conteúdo',
    icon: 'PencilLine',
    items: [
      { id: 'social', label: 'Social', href: '/social', icon: 'Share2', minTier: 'starter' },
      { id: 'design-studio', label: 'Design Studio', href: '/design', icon: 'Palette', minTier: 'starter' },
      { id: 'vault', label: 'Creative Vault', href: '/vault', icon: 'Database', minTier: 'starter' },
      { id: 'content-calendar', label: 'Calendário', href: '/content/calendar', icon: 'Calendar', minTier: 'pro', comingSoon: true },
      { id: 'social-inbox', label: 'Social Inbox', href: '/social-inbox', icon: 'Inbox', minTier: 'pro', comingSoon: true },
      { id: 'content-review', label: 'Aprovações', href: '/content/review', icon: 'ClipboardCheck', minTier: 'pro', comingSoon: true },
      { id: 'automation', label: 'Automação', href: '/automation', icon: 'Cpu', minTier: 'pro', comingSoon: true },
    ],
  },
  {
    id: 'analysis',
    label: 'Análise',
    icon: 'Activity',
    items: [
      { id: 'performance', label: 'Performance', href: '/performance', icon: 'Activity', minTier: 'starter' },
      { id: 'page-forensics', label: 'Forensics', href: '/strategy/autopsy', icon: 'Stethoscope', minTier: 'starter' },
    ],
  },
  {
    id: 'config',
    label: 'Configuração',
    icon: 'Settings',
    items: [
      { id: 'brands', label: 'Marcas', href: '/brands', icon: 'Building', minTier: 'starter' },
      { id: 'integrations', label: 'Integrações', href: '/integrations', icon: 'PlugZap', minTier: 'starter' },
      { id: 'settings', label: 'Configurações', href: '/settings', icon: 'Settings', minTier: 'starter' },
      { id: 'billing', label: 'Planos', href: '/settings/billing', icon: 'CreditCard', minTier: 'starter' },
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
      'eugene_schwartz', 'claude_hopkins', 'gary_halbert', 'joseph_sugarman', 'david_ogilvy', 
      'john_carlton', 'drayton_bird', 'frank_kern_copy', 'lia_haberman', 'rachel_karten', 
      'nikita_beer', 'justin_welsh', 'justin_brooke', 'nicholas_kusmich', 'jon_loomer', 
      'savannah_sanchez'
    ] as CounselorId[],
  },
  funnel: {
    id: 'funnel',
    label: 'Funil',
    title: 'Funil',
    subtitle: '6 especialistas',
    placeholder: 'Pergunte sobre arquitetura de funis...',
    footer: '🎯 Consultando: Russell Brunson, Dan Kennedy, Frank Kern, Sam Ovens, Ryan Deiss, Perry Belcher',
    accentColor: 'indigo',
    counselors: [
      'russell_brunson', 'dan_kennedy', 'frank_kern', 'sam_ovens', 'ryan_deiss', 'perry_belcher'
    ] as CounselorId[],
  },
  copy: {
    id: 'copy',
    label: 'Copy',
    title: 'Copywriting',
    subtitle: '9 copywriters',
    placeholder: 'Pergunte sobre copy e persuasão...',
    footer: '✍️ Consultando: Schwartz, Hopkins, Halbert, Sugarman, Ogilvy, Carlton, Bird, Kern',
    accentColor: 'amber',
    counselors: [
      'eugene_schwartz', 'claude_hopkins', 'gary_halbert', 'joseph_sugarman', 'david_ogilvy', 
      'john_carlton', 'drayton_bird', 'frank_kern_copy', 'dan_kennedy_copy'
    ] as CounselorId[],
  },
  social: {
    id: 'social',
    label: 'Social',
    title: 'Social',
    subtitle: '4 especialistas',
    placeholder: 'Pergunte sobre redes sociais e viralização...',
    footer: '🚀 Consultando: Lia Haberman, Rachel Karten, Nikita Beer, Justin Welsh',
    accentColor: 'rose',
    counselors: [
      'lia_haberman', 'rachel_karten', 'nikita_beer', 'justin_welsh'
    ] as CounselorId[],
  },
  ads: {
    id: 'ads',
    label: 'Ads',
    title: 'Ads & Tráfego',
    subtitle: '4 especialistas',
    placeholder: 'Pergunte sobre tráfego e escala...',
    footer: '📊 Consultando: Justin Brooke, Nicholas Kusmich, Jon Loomer, Savannah Sanchez',
    accentColor: 'blue',
    counselors: [
      'justin_brooke', 'nicholas_kusmich', 'jon_loomer', 'savannah_sanchez'
    ] as CounselorId[],
  },
  design: {
    id: 'design',
    label: 'Design',
    title: 'Design',
    subtitle: 'Diretor de Design',
    placeholder: 'Peça um briefing de design ou prompt para o NanoBanana...',
    footer: '🎨 Consultando: Diretor de Design especializado em Thumbnails, Carrosséis e Estáticos',
    accentColor: 'gold',
    counselors: [
      'design_director'
    ] as CounselorId[],
  },
  party: {
    id: 'party',
    label: 'Party Mode',
    title: 'Party Mode',
    subtitle: 'Múltiplos Especialistas',
    placeholder: 'Inicie uma deliberação entre especialistas...',
    footer: '🎉 Party Mode: Selecione os especialistas para o debate',
    accentColor: 'gold',
    counselors: [] as CounselorId[], // Será preenchido dinamicamente
  },
} as const;
