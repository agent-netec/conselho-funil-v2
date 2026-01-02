// ============================================
// TYPES - Conselho de Funil
// ============================================

// Conversation & Messages
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    sources?: string[];
    counselors?: string[];
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// Counselors
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

export interface Counselor {
  id: CounselorId;
  name: string;
  expertise: string;
  color: string;
  icon: string;
}

// Funnel
export type FunnelStatus = 
  | 'draft'
  | 'generating'
  | 'review'
  | 'approved'
  | 'adjusting'
  | 'executing'
  | 'completed'
  | 'killed';

export type FunnelObjective = 'leads' | 'sales' | 'calls' | 'retention';

export interface FunnelContext {
  objective: FunnelObjective;
  audience: {
    who: string;
    pain: string;
    awareness: 'unaware' | 'problem' | 'solution' | 'product';
    objection: string;
  };
  offer: {
    what: string;
    ticket: number;
    type: string;
    differential: string;
  };
  channels: {
    primary: string;
    secondary?: string;
    owned?: string[];
  };
}

export interface FunnelStage {
  order: number;
  name: string;
  type: 'traffic' | 'capture' | 'qualify' | 'nurture' | 'convert' | 'upsell';
  function: string;
  psychologicalGoal: string;
}

export interface Scorecard {
  dimensions: {
    name: string;
    counselor: CounselorId;
    score: number;
    weight: number;
    feedback: string;
  }[];
  totalScore: number;
  recommendation: 'execute' | 'adjust' | 'kill';
}

export interface Funnel {
  id: string;
  name: string;
  status: FunnelStatus;
  context: FunnelContext;
  architecture?: {
    stages: FunnelStage[];
  };
  scorecard?: Scorecard;
  createdAt: Date;
  updatedAt: Date;
}

// Decision
export type DecisionType = 'EXECUTAR' | 'AJUSTAR' | 'MATAR';

export interface Decision {
  id: string;
  funnelId: string;
  type: DecisionType;
  rationale: string;
  adjustments?: string[];
  createdAt: Date;
}


