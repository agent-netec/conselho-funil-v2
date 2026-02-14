// ============================================
// TYPES - Conselho de Funil
// ============================================

import { Timestamp } from 'firebase/firestore';

// Conversation & Messages — re-export de database.ts (source of truth)
import type { Message as _Message, SourceReference as _SourceReference, Conversation as _Conversation } from './database';
export type Message = _Message;
export type SourceReference = _SourceReference;
export type Conversation = _Conversation;

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
  | 'justin_welsh'
  | 'eugene_schwartz'
  | 'claude_hopkins'
  | 'gary_halbert'
  | 'joseph_sugarman'
  | 'dan_kennedy_copy'
  | 'david_ogilvy'
  | 'john_carlton'
  | 'drayton_bird'
  | 'frank_kern_copy'
  | 'justin_brooke'
  | 'nicholas_kusmich'
  | 'jon_loomer'
  | 'savannah_sanchez'
  | 'design_director';

export interface Counselor {
  id: CounselorId;
  name: string;
  expertise: string;
  color: string;
  icon: string;
  specialty?: string;
  domain?: 'copy' | 'funnel' | 'social' | 'ads' | 'design';
}

// Funnel — re-export de database.ts (source of truth)
export type { Funnel, FunnelStatus, FunnelContext } from './database';

export type FunnelObjective = 'leads' | 'sales' | 'calls' | 'retention';

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

// ============================================
// CONTRATOS DE SAÍDA ESTRUTURADA (ST-1.5.1)
// ============================================

export interface CouncilOutput {
  strategy: {
    summary: string;
    steps: string[];
    rationale: string;
  };
  market_data: {
    metric: string; // Chave técnica (ex: "CPC", "ROAS")
    label: string;  // Nome amigável para exibição no card
    value: string;  // Valor atual ou sugerido
    benchmark_2026: string; // O benchmark alvo de 2026 para comparação
    unit: "%" | "currency" | "number" | "ratio"; // Define formatação na UI
    status: "success" | "warning" | "danger" | "neutral"; // Define a cor do card/indicador
    source_context: string;
  }[];
  assets: {
    type: "DM_SCRIPT" | "STORY_SEQUENCE" | "AD_COPY" | "HOOK" | "VSL_OUTLINE";
    title: string;
    content: string;
    counselor_reference: string;
  }[];
}

// Decision
export type DecisionType = 'EXECUTAR' | 'AJUSTAR' | 'MATAR';

export interface Decision {
  id: string;
  funnelId: string;
  type: DecisionType;
  rationale: string;
  adjustments?: string[];
  createdAt: Timestamp;
}

export interface DashboardStats {
  activeFunnels: number;
  pendingEvaluations: number;
  decisionsThisMonth: number;
  totalConversations: number;
  performance_benchmarks: {
    metric: string;
    value: string;
    benchmark_2026: string;
    status: 'success' | 'warning' | 'danger' | 'neutral';
  }[];
}


