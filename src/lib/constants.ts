import type { Counselor, CounselorId as CounselorIdType } from '@/types';

// Counselors data
export const COUNSELORS: Record<CounselorIdType, Counselor> = {
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
  // ============================================
  // SOCIAL COUNSELORS - Conselho Social (E12)
  // ============================================
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
};

// Update CounselorId type
export type CounselorId = 
  | 'russell_brunson'
  | 'dan_kennedy'
  | 'frank_kern'
  | 'sam_ovens'
  | 'ryan_deiss'
  | 'perry_belcher'
  | 'lia_haberman'
  | 'rachel_karten'
  | 'nikita_beer'
  | 'justin_welsh';

// Navigation items
export const NAV_ITEMS = [
  { id: 'home', label: 'Home', href: '/', icon: 'Home' },
  { id: 'chat', label: 'Chat', href: '/chat', icon: 'MessageSquare' },
  { id: 'funnels', label: 'Funis', href: '/funnels', icon: 'Target' },
  { id: 'social', label: 'Social', href: '/social', icon: 'Share2' },
  { id: 'brands', label: 'Marcas', href: '/brands', icon: 'Building2' },
  { id: 'analytics', label: 'Analytics', href: '/analytics', icon: 'BarChart3' },
  { id: 'library', label: 'Biblioteca', href: '/library', icon: 'Library' },
  { id: 'settings', label: 'Configurações', href: '/settings', icon: 'Settings' },
] as const;

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

// ============================================
// COPY COUNSELORS - Conselho de Copywriting
// ============================================

export type CopywriterId = 
  | 'eugene_schwartz'
  | 'claude_hopkins'
  | 'gary_halbert'
  | 'joseph_sugarman'
  | 'dan_kennedy_copy'
  | 'david_ogilvy'
  | 'john_carlton'
  | 'drayton_bird'
  | 'frank_kern_copy';

export interface Copywriter {
  id: CopywriterId;
  name: string;
  expertise: string;
  specialty: string;
  color: string;
  icon: string;
}

export const COPY_COUNSELORS: Record<CopywriterId, Copywriter> = {
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
};

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
    subtitle: '15 especialistas',
    placeholder: 'Pergunte ao Conselho...',
    footer: 'Pressione Enter para enviar, Shift+Enter para nova linha',
    accentColor: 'emerald',
    counselors: ['Russell Brunson', 'Dan Kennedy', 'Frank Kern', 'Sam Ovens', 'Ryan Deiss', 'Perry Belcher', 'Schwartz', 'Hopkins', 'Halbert', 'Sugarman', 'Ogilvy', 'Carlton', 'Bird'],
  },
  funnel: {
    id: 'funnel',
    label: 'Funil',
    title: 'Conselho de Funil',
    subtitle: '6 especialistas',
    placeholder: 'Pergunte sobre arquitetura de funis...',
    footer: '🎯 Consultando: Russell Brunson, Dan Kennedy, Frank Kern, Sam Ovens, Ryan Deiss, Perry Belcher',
    accentColor: 'indigo',
    counselors: ['Russell Brunson', 'Dan Kennedy', 'Frank Kern', 'Sam Ovens', 'Ryan Deiss', 'Perry Belcher'],
  },
  copy: {
    id: 'copy',
    label: 'Copy',
    title: 'Conselho de Copy',
    subtitle: '9 copywriters',
    placeholder: 'Pergunte sobre copy e persuasão...',
    footer: '✍️ Consultando: Schwartz, Hopkins, Halbert, Sugarman, Ogilvy, Carlton, Bird, Kern',
    accentColor: 'amber',
    counselors: ['Schwartz', 'Hopkins', 'Halbert', 'Sugarman', 'Ogilvy', 'Carlton', 'Bird', 'Kern'],
  },
  social: {
    id: 'social',
    label: 'Social',
    title: 'Conselho Social',
    subtitle: '4 especialistas',
    placeholder: 'Pergunte sobre redes sociais e viralização...',
    footer: '🚀 Consultando: Lia Haberman, Rachel Karten, Nikita Beer, Justin Welsh',
    accentColor: 'rose',
    counselors: ['Lia Haberman', 'Rachel Karten', 'Nikita Beer', 'Justin Welsh'],
  },
} as const;


