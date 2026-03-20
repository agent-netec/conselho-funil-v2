// Sprint 05.3 + 05.4: Counselor Metadata Registry
// Typed metadata for all 24 counselors with visual identity

export interface CounselorMeta {
  id: string;
  name: string;
  initials: string;
  specialty: string;
  accentColor: string;
  domain: 'funnel' | 'copy' | 'social' | 'ads' | 'design';
  avatarUrl: string;
}

export const COUNSELOR_METADATA: Record<string, CounselorMeta> = {
  // ── Funnel Council (indigo #6366F1) ──────────────────────────────
  russell_brunson: {
    id: 'russell_brunson',
    name: 'Russell Brunson',
    initials: 'RB',
    specialty: '🔧 Funnels & Offers',
    accentColor: '#6366F1',
    domain: 'funnel',
    avatarUrl: '/counselors/russell_brunson.png',
  },
  dan_kennedy: {
    id: 'dan_kennedy',
    name: 'Dan Kennedy',
    initials: 'DK',
    specialty: '💰 Direct Response',
    accentColor: '#6366F1',
    domain: 'funnel',
    avatarUrl: '/counselors/dan_kennedy.png',
  },
  frank_kern: {
    id: 'frank_kern',
    name: 'Frank Kern',
    initials: 'FK',
    specialty: '🎯 Behavioral Dynamics',
    accentColor: '#6366F1',
    domain: 'funnel',
    avatarUrl: '/counselors/frank_kern.png',
  },
  sam_ovens: {
    id: 'sam_ovens',
    name: 'Sam Ovens',
    initials: 'SO',
    specialty: '📊 Consulting Funnels',
    accentColor: '#6366F1',
    domain: 'funnel',
    avatarUrl: '/counselors/sam_ovens.png',
  },
  ryan_deiss: {
    id: 'ryan_deiss',
    name: 'Ryan Deiss',
    initials: 'RD',
    specialty: '🧲 Customer Value Journey',
    accentColor: '#6366F1',
    domain: 'funnel',
    avatarUrl: '/counselors/ryan_deiss.png',
  },
  perry_belcher: {
    id: 'perry_belcher',
    name: 'Perry Belcher',
    initials: 'PB',
    specialty: '📦 Offer Architecture',
    accentColor: '#6366F1',
    domain: 'funnel',
    avatarUrl: '/counselors/perry_belcher.png',
  },

  // ── Copy Council (amber #F59E0B) ─────────────────────────────────
  eugene_schwartz: {
    id: 'eugene_schwartz',
    name: 'Eugene Schwartz',
    initials: 'ES',
    specialty: '🧠 Awareness Levels',
    accentColor: '#F59E0B',
    domain: 'copy',
    avatarUrl: '/counselors/eugene_schwartz.png',
  },
  claude_hopkins: {
    id: 'claude_hopkins',
    name: 'Claude Hopkins',
    initials: 'CH',
    specialty: '📐 Scientific Advertising',
    accentColor: '#F59E0B',
    domain: 'copy',
    avatarUrl: '/counselors/claude_hopkins.png',
  },
  gary_halbert: {
    id: 'gary_halbert',
    name: 'Gary Halbert',
    initials: 'GH',
    specialty: '📝 Headlines & Cartas',
    accentColor: '#F59E0B',
    domain: 'copy',
    avatarUrl: '/counselors/gary_halbert.png',
  },
  joseph_sugarman: {
    id: 'joseph_sugarman',
    name: 'Joe Sugarman',
    initials: 'JS',
    specialty: '🔗 Triggers & Slides',
    accentColor: '#F59E0B',
    domain: 'copy',
    avatarUrl: '/counselors/joseph_sugarman.png',
  },
  dan_kennedy_copy: {
    id: 'dan_kennedy_copy',
    name: 'Dan Kennedy',
    initials: 'DK',
    specialty: '✍️ Copy Direta',
    accentColor: '#F59E0B',
    domain: 'copy',
    avatarUrl: '/counselors/dan_kennedy_copy.png',
  },
  david_ogilvy: {
    id: 'david_ogilvy',
    name: 'David Ogilvy',
    initials: 'DO',
    specialty: '👔 Brand Copy',
    accentColor: '#F59E0B',
    domain: 'copy',
    avatarUrl: '/counselors/david_ogilvy.png',
  },
  john_carlton: {
    id: 'john_carlton',
    name: 'John Carlton',
    initials: 'JC',
    specialty: '🎭 Story Selling',
    accentColor: '#F59E0B',
    domain: 'copy',
    avatarUrl: '/counselors/john_carlton.png',
  },
  drayton_bird: {
    id: 'drayton_bird',
    name: 'Drayton Bird',
    initials: 'DB',
    specialty: '📬 Direct Mail',
    accentColor: '#F59E0B',
    domain: 'copy',
    avatarUrl: '/counselors/drayton_bird.png',
  },
  frank_kern_copy: {
    id: 'frank_kern_copy',
    name: 'Frank Kern',
    initials: 'FK',
    specialty: '🎬 Mass Control',
    accentColor: '#F59E0B',
    domain: 'copy',
    avatarUrl: '/counselors/frank_kern_copy.png',
  },

  // ── Social Council (rose #F43F5E) ────────────────────────────────
  lia_haberman: {
    id: 'lia_haberman',
    name: 'Lia Haberman',
    initials: 'LH',
    specialty: '📱 Creator Economy',
    accentColor: '#F43F5E',
    domain: 'social',
    avatarUrl: '/counselors/lia_haberman.png',
  },
  rachel_karten: {
    id: 'rachel_karten',
    name: 'Rachel Karten',
    initials: 'RK',
    specialty: '🪝 Hooks & Engagement',
    accentColor: '#F43F5E',
    domain: 'social',
    avatarUrl: '/counselors/rachel_karten.png',
  },
  nikita_beer: {
    id: 'nikita_beer',
    name: 'Nikita Beer',
    initials: 'NB',
    specialty: '🔥 Viral Content',
    accentColor: '#F43F5E',
    domain: 'social',
    avatarUrl: '/counselors/nikita_beer.png',
  },
  justin_welsh: {
    id: 'justin_welsh',
    name: 'Justin Welsh',
    initials: 'JW',
    specialty: '💼 LinkedIn Growth',
    accentColor: '#F43F5E',
    domain: 'social',
    avatarUrl: '/counselors/justin_welsh.png',
  },

  // ── Ads Council (blue #3B82F6) ───────────────────────────────────
  justin_brooke: {
    id: 'justin_brooke',
    name: 'Justin Brooke',
    initials: 'JB',
    specialty: '🎯 Media Buying',
    accentColor: '#3B82F6',
    domain: 'ads',
    avatarUrl: '/counselors/justin_brooke.png',
  },
  nicholas_kusmich: {
    id: 'nicholas_kusmich',
    name: 'Nicholas Kusmich',
    initials: 'NK',
    specialty: '📘 Facebook Ads',
    accentColor: '#3B82F6',
    domain: 'ads',
    avatarUrl: '/counselors/nicholas_kusmich.png',
  },
  jon_loomer: {
    id: 'jon_loomer',
    name: 'Jon Loomer',
    initials: 'JL',
    specialty: '🧪 Advanced Targeting',
    accentColor: '#3B82F6',
    domain: 'ads',
    avatarUrl: '/counselors/jon_loomer.png',
  },
  savannah_sanchez: {
    id: 'savannah_sanchez',
    name: 'Savannah Sanchez',
    initials: 'SS',
    specialty: '📱 TikTok & UGC Ads',
    accentColor: '#3B82F6',
    domain: 'ads',
    avatarUrl: '/counselors/savannah_sanchez.png',
  },

  // ── Design Council (gold #E6B447) ────────────────────────────────
  design_director: {
    id: 'design_director',
    name: 'Diretor de Design',
    initials: 'DD',
    specialty: '🎨 Direção de Arte',
    accentColor: '#E6B447',
    domain: 'design',
    avatarUrl: '/counselors/design_director.png',
  },
};

// Helper: get metadata with fallback
export function getCounselorMeta(id: string): CounselorMeta {
  return (
    COUNSELOR_METADATA[id] ?? {
      id,
      name: 'MKTHONEY',
      initials: 'MK',
      specialty: '🐝 Conselho de Funil',
      accentColor: '#E6B447',
      domain: 'design' as const,
      avatarUrl: '',
    }
  );
}

// Helper: get all counselors for a domain
export function getCounselorsByDomain(domain: CounselorMeta['domain']): CounselorMeta[] {
  return Object.values(COUNSELOR_METADATA).filter((c) => c.domain === domain);
}
