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
    color: '#6366f1', // indigo
    icon: '🎯',
  },
  dan_kennedy: {
    id: 'dan_kennedy',
    name: 'Dan Kennedy',
    expertise: 'Oferta & Copy',
    color: '#8b5cf6', // violet
    icon: '✍️',
  },
  frank_kern: {
    id: 'frank_kern',
    name: 'Frank Kern',
    expertise: 'Psicologia & Comportamento',
    color: '#ec4899', // pink
    icon: '🧠',
  },
  sam_ovens: {
    id: 'sam_ovens',
    name: 'Sam Ovens',
    expertise: 'Aquisição & Qualificação',
    color: '#14b8a6', // teal
    icon: '🎣',
  },
  ryan_deiss: {
    id: 'ryan_deiss',
    name: 'Ryan Deiss',
    expertise: 'LTV & Retenção',
    color: '#f97316', // orange
    icon: '📈',
  },
  perry_belcher: {
    id: 'perry_belcher',
    name: 'Perry Belcher',
    expertise: 'Monetização Simples',
    color: '#84cc16', // lime
    icon: '💰',
  },

  // Social Counselors
  lia_haberman: {
    id: 'lia_haberman',
    name: 'Lia Haberman',
    expertise: 'Algoritmo & Mudanças',
    color: '#06b6d4', // cyan
    icon: '📊',
  },
  rachel_karten: {
    id: 'rachel_karten',
    name: 'Rachel Karten',
    expertise: 'Criativo & Hooks',
    color: '#f43f5e', // rose
    icon: '🪝',
  },
  nikita_beer: {
    id: 'nikita_beer',
    name: 'Nikita Beer',
    expertise: 'Viralização & Trends',
    color: '#8b5cf6', // violet
    icon: '🚀',
  },
  justin_welsh: {
    id: 'justin_welsh',
    name: 'Justin Welsh',
    expertise: 'Funil Social',
    color: '#10b981', // emerald
    icon: '⛓️',
  },

  // Copy Counselors
  eugene_schwartz: {
    id: 'eugene_schwartz',
    name: 'Eugene Schwartz',
    expertise: 'Consciência de Mercado',
    specialty: 'Estrutura de copy para diferentes estágios de consciência',
    color: '#6366f1', // indigo
    icon: '🎯',
  },
  claude_hopkins: {
    id: 'claude_hopkins',
    name: 'Claude Hopkins',
    expertise: 'Método Científico',
    specialty: 'Testes, medição, prova social',
    color: '#3b82f6', // blue
    icon: '🔬',
  },
  gary_halbert: {
    id: 'gary_halbert',
    name: 'Gary Halbert',
    expertise: 'Headlines & Psicologia',
    specialty: 'Headlines que prendem, curiosidade, especificidade',
    color: '#f59e0b', // amber
    icon: '⚡',
  },
  joseph_sugarman: {
    id: 'joseph_sugarman',
    name: 'Joseph Sugarman',
    expertise: 'Narrativa & Estrutura',
    specialty: 'Storytelling, transições, long-form copy',
    color: '#8b5cf6', // violet
    icon: '📖',
  },
  dan_kennedy_copy: {
    id: 'dan_kennedy_copy',
    name: 'Dan Kennedy',
    expertise: 'Oferta & Urgência',
    specialty: 'Ofertas irresistíveis, garantia, urgência real',
    color: '#10b981', // emerald
    icon: '💰',
  },
  david_ogilvy: {
    id: 'david_ogilvy',
    name: 'David Ogilvy',
    expertise: 'Brand Premium',
    specialty: 'Pesquisa, diferenciação, big idea',
    color: '#64748b', // slate
    icon: '👔',
  },
  john_carlton: {
    id: 'john_carlton',
    name: 'John Carlton',
    expertise: 'Voz Autêntica',
    specialty: 'Autenticidade, fluxo natural, conversação',
    color: '#ec4899', // pink
    icon: '🎤',
  },
  drayton_bird: {
    id: 'drayton_bird',
    name: 'Drayton Bird',
    expertise: 'Simplicidade & Eficiência',
    specialty: 'Benefício claro, direto, resposta direta',
    color: '#14b8a6', // teal
    icon: '✂️',
  },
  frank_kern_copy: {
    id: 'frank_kern_copy',
    name: 'Frank Kern',
    expertise: 'Fluxo de Vendas',
    specialty: 'Sequências, automação, comportamento',
    color: '#f97316', // orange
    icon: '🔄',
  },

  // Ads Counselors
  justin_brooke: {
    id: 'justin_brooke',
    name: 'Justin Brooke',
    expertise: 'Estratégia & Escala',
    color: '#3b82f6', // blue
    icon: '📊',
  },
  nicholas_kusmich: {
    id: 'nicholas_kusmich',
    name: 'Nicholas Kusmich',
    expertise: 'Meta Ads & Contexto',
    color: '#2563eb', // blue-600
    icon: '🎯',
  },
  jon_loomer: {
    id: 'jon_loomer',
    name: 'Jon Loomer',
    expertise: 'Analytics & Técnico',
    color: '#1d4ed8', // blue-700
    icon: '⚙️',
  },
  savannah_sanchez: {
    id: 'savannah_sanchez',
    name: 'Savannah Sanchez',
    expertise: 'TikTok & UGC',
    color: '#0ea5e9', // sky
    icon: '📱',
  },
  design_director: {
    id: 'design_director',
    name: 'Diretor de Design',
    expertise: 'Direção de Arte & Briefing',
    color: '#a855f7', // purple-500
    icon: '🎨',
  },
};

// Retrocompatibilidade (Deprecated)
/** @deprecated Use COUNSELORS_REGISTRY */
export const COUNSELORS = COUNSELORS_REGISTRY;
/** @deprecated Use COUNSELORS_REGISTRY */
export const COPY_COUNSELORS = COUNSELORS_REGISTRY;

// Navigation groups and items
export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  aliases?: string[];
  sub_items?: string[];
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
    id: 'intelligence',
    label: 'Inteligência',
    description: 'Dados e insights que alimentam a estratégia',
    icon: 'Brain',
    items: [
      { id: 'intelligence-dashboard', label: 'Dashboard', href: '/intelligence', icon: 'LayoutDashboard' },
      { id: 'discovery', label: 'Discovery', href: '/intelligence/discovery', icon: 'Search', sub_items: ['Keywords', 'Spy Agent'] },
      { id: 'attribution', label: 'Atribuição', href: '/intelligence/attribution', icon: 'GitBranch' },
      { id: 'ltv', label: 'LTV & Retenção', href: '/intelligence/ltv', icon: 'TrendingUp' },
      { id: 'journey', label: 'Jornada do Lead', href: '/intelligence/journey', icon: 'Map' },
    ],
  },
  {
    id: 'strategy',
    label: 'Estratégia',
    description: 'Planejamento e arquitetura de conversão',
    icon: 'Compass',
    items: [
      { id: 'funnels', label: 'Funis', href: '/funnels', icon: 'Target' },
      { id: 'offer-lab', label: 'Offer Lab', href: '/intelligence/offer-lab', icon: 'Beaker' },
      { id: 'funnel-autopsy', label: 'Funnel Autopsy', href: '/strategy/autopsy', icon: 'Stethoscope' },
      { id: 'copy-chat', label: 'Copywriting', href: '/chat?mode=copy', icon: 'PencilLine' },
    ],
  },
  {
    id: 'execution',
    label: 'Execução',
    description: 'Operação e implementação de ativos',
    icon: 'Zap',
    items: [
      { id: 'campaigns', label: 'Campanhas', href: '/campaigns', icon: 'Rocket', aliases: ['/campaign'] },
      { id: 'ads-chat', label: 'Ads & Tráfego', href: '/chat?mode=ads', icon: 'Megaphone' },
      { id: 'social', label: 'Social', href: '/social', icon: 'Share2' },
      { id: 'social-inbox', label: 'Social Inbox', href: '/social-inbox', icon: 'Inbox' },
      { id: 'automation', label: 'Automação', href: '/automation', icon: 'Cpu' },
    ],
  },
  {
    id: 'management',
    label: 'Gestão',
    description: 'Governança de marca e ativos',
    icon: 'ShieldCheck',
    items: [
      { id: 'brands', label: 'Marcas', href: '/brands', icon: 'Building' },
      { id: 'brand-hub', label: 'Brand Hub', href: '/brand-hub', icon: 'Palette' },
      { id: 'assets', label: 'Biblioteca de Ativos', href: '/assets', icon: 'FolderKanban' },
      { id: 'vault', label: 'Vault', href: '/vault', icon: 'Database' },
    ],
  },
  {
    id: 'system',
    label: 'Sistema',
    icon: 'Settings',
    items: [
      { id: 'settings', label: 'Configurações', href: '/settings', icon: 'Settings' },
      { id: 'integrations', label: 'Integrações', href: '/integrations', icon: 'PlugZap' },
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
  executing: 'bg-purple-500',
  completed: 'bg-emerald-500',
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
    label: 'Conselho',
    title: 'Conselho',
    subtitle: '23 especialistas',
    placeholder: 'Pergunte ao Conselho...',
    footer: 'Pressione Enter para enviar, Shift+Enter para nova linha',
    accentColor: 'emerald',
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
    title: 'Conselho de Funil',
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
    title: 'Conselho de Copy',
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
    title: 'Conselho Social',
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
    title: 'Conselho de Ads',
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
    title: 'Conselho de Design',
    subtitle: 'Diretor de Design',
    placeholder: 'Peça um briefing de design ou prompt para o NanoBanana...',
    footer: '🎨 Consultando: Diretor de Design especializado em Thumbnails, Carrosséis e Estáticos',
    accentColor: 'purple',
    counselors: [
      'design_director'
    ] as CounselorId[],
  },
  party: {
    id: 'party',
    label: 'Party Mode',
    title: 'Alto Conselho',
    subtitle: 'Múltiplos Especialistas',
    placeholder: 'Inicie uma deliberação entre especialistas...',
    footer: '🎉 Party Mode: Selecione os especialistas para o debate',
    accentColor: 'purple',
    counselors: [] as CounselorId[], // Será preenchido dinamicamente
  },
} as const;
