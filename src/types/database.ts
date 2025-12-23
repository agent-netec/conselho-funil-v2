import { Timestamp } from 'firebase/firestore';

// ============================================
// USER
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  tenantId?: string;
  role: 'admin' | 'member' | 'viewer';
  createdAt: Timestamp;
  lastLogin: Timestamp;
}

// ============================================
// TENANT (Organization)
// ============================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  context: TenantContext;
  settings: TenantSettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TenantContext {
  business: {
    name: string;
    vertical: string;
    segment: 'B2B' | 'B2C' | 'B2B2C';
    maturity: 'startup' | 'traction' | 'scale';
  };
  product: {
    name: string;
    type: 'course' | 'mentorship' | 'service' | 'saas' | 'ecommerce';
    ticket: number;
    model: 'perpetual' | 'launch' | 'recurring';
  };
  audience: {
    profile: string;
    painPoint: string;
    awareness: 'unaware' | 'problem' | 'solution' | 'product';
    mainObjection: string;
  };
  channels: string[];
  restrictions: string[];
}

export interface TenantSettings {
  defaultCounselors: string[];
  customHeuristics: boolean;
  maxProposals: number;
}

// ============================================
// FUNNEL
// ============================================

export interface Funnel {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  status: FunnelStatus;
  context: FunnelContext;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type FunnelStatus = 
  | 'draft'           // Wizard incompleto
  | 'generating'      // Gerando propostas
  | 'review'          // Aguardando avaliação
  | 'approved'        // EXECUTAR
  | 'adjusting'       // AJUSTAR em andamento
  | 'executing'       // Em execução
  | 'completed'       // Finalizado (com métricas)
  | 'killed';         // MATAR

export interface FunnelContext {
  // Business context
  company: string;
  market: string;
  maturity: 'iniciante' | 'em tração' | 'escala';
  restrictions?: string;
  
  // Objective
  objective: 'leads' | 'sales' | 'calls' | 'retention';
  
  // Audience
  audience: {
    who: string;
    pain: string;
    awareness: 'fria' | 'morna' | 'quente';
    objection?: string;
  };
  
  // Offer
  offer: {
    what: string;
    ticket: string;
    type: 'curso' | 'servico' | 'saas' | 'mentoria' | 'produto_fisico';
  };
  
  // Channels (channel é o novo padrão, channels é legado)
  channel?: {
    main: string;
    secondary?: string;
    owned?: string;
  };
  channels?: {
    primary: string;
    secondary?: string;
  };
}

// ============================================
// PROPOSAL (subcollection de Funnel)
// ============================================

export interface Proposal {
  id: string;
  funnelId: string;
  version: number;
  name: string;
  summary: string;
  architecture: FunnelArchitecture;
  strategy: FunnelStrategy;
  assets: FunnelAssets;
  scorecard?: Scorecard | ProposalScorecard;
  status: 'pending' | 'evaluated' | 'selected' | 'rejected';
  createdAt: Timestamp;
  // Campos para propostas ajustadas
  parentProposalId?: string;
  appliedAdjustments?: string[];
}

// Scorecard simplificado para propostas geradas
export interface ProposalScorecard {
  clarity: number;
  offerStrength: number;
  qualification: number;
  friction: number;
  ltvPotential: number;
  expectedRoi: number;
  overall: number;
}

export interface FunnelArchitecture {
  stages: FunnelStage[];
  flow?: string; // Mermaid diagram
}

export interface FunnelStage {
  order: number;
  name: string;
  type: string; // ad, landing, quiz, vsl, checkout, email, call, webinar, etc.
  objective?: string;
  description?: string;
  function?: string;
  psychologicalGoal?: string;
  metrics?: {
    target?: string;
    benchmark?: string;
    expectedConversion?: string;
    kpi?: string;
  };
}

export interface FunnelStrategy {
  rationale: string;
  counselorInsights?: CounselorInsight[];
  filterPoints?: string[];
  monetizationPoint?: string;
  ltvStrategy?: string;
  risks: string[];
  recommendations?: string[];
  antiPatterns?: string[];
}

export interface CounselorInsight {
  counselor: string;
  insight: string;
}

export interface FunnelAssets {
  headlines: string[];
  hooks?: string[];
  ctas?: string[];
  vslStructure?: string;
  emailSequence?: EmailOutline[];
  qualificationScript?: string;
  creativeDirection?: string;
}

export interface EmailOutline {
  day: number;
  subject: string;
  goal: string;
  cta: string;
}

// ============================================
// SCORECARD & DECISION
// ============================================

export interface Scorecard {
  dimensions: ScorecardDimension[];
  totalScore: number;
  recommendation: 'execute' | 'adjust' | 'kill';
}

export interface ScorecardDimension {
  name: string;
  counselor: string;
  score: number;
  weight: number;
  feedback: string;
}

export interface Decision {
  id: string;
  funnelId: string;
  proposalId: string;
  type: 'EXECUTAR' | 'AJUSTAR' | 'MATAR';
  parecer: CouncilParecer;
  adjustments?: string[];
  createdAt: Timestamp;
  createdBy: string;
}

export interface CouncilParecer {
  counselors: CounselorParecer[];
  consolidated: Scorecard;
  summary: string;
  nextSteps: string[];
}

export interface CounselorParecer {
  counselorId: string;
  counselorName: string;
  dimension: string;
  score: number;
  feedback: string;
  concerns: string[];
  suggestions: string[];
}

// ============================================
// CONVERSATION
// ============================================

export interface Conversation {
  id: string;
  tenantId?: string;
  userId: string;
  title: string;
  context?: {
    funnelId?: string;
    mode: 'general' | 'funnel_review' | 'creation';
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    sources?: string[];
    counselors?: string[];
    scorecard?: Scorecard;
  };
  createdAt: Timestamp;
}

// ============================================
// KNOWLEDGE (RAG)
// ============================================

export interface KnowledgeChunk {
  id: string;
  content: string;
  embedding: number[]; // 768 dimensions
  metadata: ChunkMetadata;
  source: {
    file: string;
    section: string;
    lineStart: number;
    lineEnd: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ChunkMetadata {
  counselor?: string;
  docType: string;
  scope?: string;
  channel?: string;
  stage?: string;
  tenantId?: string;
  status: 'draft' | 'approved';
  version: string;
}

// ============================================
// LIBRARY
// ============================================

export interface LibraryTemplate {
  id: string;
  tenantId?: string;
  type: 'funnel' | 'campaign' | 'asset';
  name: string;
  description: string;
  content: LibraryTemplateContent | string;
  metadata?: {
    objective?: string;
    vertical?: string;
    ticket?: string | number;
    tags?: string[];
    sourceContext?: {
      audience?: FunnelContext['audience'];
      offer?: FunnelContext['offer'];
      channel?: FunnelContext['channel'];
    };
  };
  usageCount: number;
  createdAt: Timestamp;
  createdBy: string;
}

export interface LibraryTemplateContent {
  architecture?: FunnelArchitecture;
  strategy?: FunnelStrategy;
  assets?: FunnelAssets;
  scorecard?: Scorecard | ProposalScorecard;
}

// ============================================
// COPY COUNCIL - Conselho de Copywriting
// ============================================

export type CopyType = 
  | 'headline'        // Headlines por estágio de consciência
  | 'email_sequence'  // Sequência de emails de follow-up
  | 'offer_copy'      // Copy de oferta completa
  | 'vsl_script'      // Script de VSL
  | 'ad_creative'     // Copy de anúncios (Meta, Google, etc)
  | 'landing_page';   // Copy de landing page

export type AwarenessStage = 
  | 'unaware'         // Não sabe que tem problema
  | 'problem_aware'   // Sabe que tem problema
  | 'solution_aware'  // Sabe que existem soluções
  | 'product_aware'   // Conhece seu produto
  | 'most_aware';     // Já conhece bem, quer variações

export interface CopyProposal {
  id: string;
  funnelId: string;
  proposalId: string;        // Proposta de funil aprovada
  type: CopyType;
  name: string;
  version: number;
  status: 'pending' | 'approved' | 'rejected';
  
  // Copy content
  content: CopyContent;
  
  // Scorecard de copy
  scorecard: CopyScorecard;
  
  // Metadata
  awarenessStage?: AwarenessStage;
  funnelStage?: string;      // Nome do stage do funil (se aplicável)
  
  // Reasoning from copywriters
  reasoning: string;
  copywriterInsights?: CopywriterInsight[];
  
  // Versioning
  parentCopyId?: string;
  appliedAdjustments?: string[];
  
  createdAt: Timestamp;
}

export interface CopyContent {
  // Main copy
  primary: string;
  
  // Variations (A/B testing)
  variations?: string[];
  
  // Structured content (depends on type)
  structure?: {
    headline?: string;
    subheadline?: string;
    bullets?: string[];
    cta?: string;
    guarantee?: string;
    urgency?: string;
    proof?: string;
  };
  
  // For email sequences
  emails?: CopyEmail[];
  
  // For VSL scripts
  vslSections?: VslSection[];
}

export interface CopyEmail {
  day: number;
  subject: string;
  preheader?: string;
  body: string;
  cta: string;
  goal: string;
}

export interface VslSection {
  order: number;
  name: string;
  duration?: string;
  content: string;
  notes?: string;
}

export interface CopyScorecard {
  // 5 dimensões do scorecard de copy
  headlines: number;         // Peso 20% - Prende atenção, benefício específico, curiosidade
  structure: number;         // Peso 20% - Clareza, fluxo natural, transições
  benefits: number;          // Peso 20% - Benefícios vs features, especificidade, voz
  offer: number;             // Peso 20% - Clareza de oferta, garantia, urgência
  proof: number;             // Peso 20% - Prova social, validação, CTA
  overall: number;           // Score consolidado
}

export interface CopywriterInsight {
  copywriterId: string;
  copywriterName: string;
  expertise: string;
  insight: string;
  suggestions?: string[];
}

export interface CopyDecision {
  id: string;
  funnelId: string;
  copyProposalId: string;
  type: 'approve' | 'adjust' | 'kill';
  userId: string;
  feedback?: string;
  adjustments?: string[];
  createdAt: Timestamp;
}


