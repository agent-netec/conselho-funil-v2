import type { Counselor, CounselorId } from '@/types';

// Counselors data
export const COUNSELORS: Record<CounselorId, Counselor> = {
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
};

// Navigation items
export const NAV_ITEMS = [
  { id: 'home', label: 'Home', href: '/', icon: 'Home' },
  { id: 'chat', label: 'Chat', href: '/chat', icon: 'MessageSquare' },
  { id: 'funnels', label: 'Funis', href: '/funnels', icon: 'Target' },
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


