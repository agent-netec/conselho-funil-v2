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
  agencyId?: string; // ST-23.1: Referência à agência (opcional para usuários solo)
  role: 'admin' | 'member' | 'viewer' | 'agency_admin' | 'agency_manager' | 'agency_viewer';
  credits: number;     // US-16.1
  usage: number;       // US-16.1
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
// BRAND - Sistema Multi-Marcas
// ============================================

export interface BrandKit {
  colors: {
    primary: string;    // HEX
    secondary: string;  // HEX
    accent: string;     // HEX
    background: string; // HEX
    variants?: {        // Para gradientes ou tons alternativos
      primaryLight?: string;
      primaryDark?: string;
    }
  };
  typography: {
    primaryFont: string;   // Headline font (ex: 'Inter')
    secondaryFont: string; // Body font (ex: 'Roboto')
    systemFallback: 'serif' | 'sans-serif' | 'mono';
  };
  visualStyle: 'minimalist' | 'aggressive' | 'luxury' | 'corporate' | 'modern';
  logoLock: {
    variants: {
      primary: LogoAsset;   // Logo principal (Vertical/Standard)
      horizontal?: LogoAsset; // Logo horizontal
      icon?: LogoAsset;      // Símbolo/Favicon
    };
    locked: boolean; // Trava global de governança
  };
  updatedAt: Timestamp;
}

export interface LogoAsset {
  url: string;        // Firebase Storage URL
  storagePath: string; // Path no Storage para deleção
  format: 'svg' | 'png' | 'webp';
  svgRaw?: string;    // Conteúdo da SVG para manipulação em tempo real pela IA (opcional)
}

export interface Brand {
  id: string;
  userId: string;
  name: string;
  vertical: string; // Ex: 'SaaS', 'Education', 'E-commerce'
  positioning: string;
  voiceTone: string;
  
  // Contexto Estratégico (usado pelo RAG)
  audience: {
    who: string;
    pain: string;
    awareness: string;
    objections: string[];
  };
  
  offer: {
    what: string;
    ticket: number;
    type: string;
    differentiator: string;
  };

  brandKit?: BrandKit; // US-18.1 & US-18.2
  
  // ST-12.2: Configuração de IA por Marca
  aiConfiguration?: {
    temperature: number;      // 0.1 a 1.0
    topP: number;             // 0.1 a 1.0
    presencePenalty?: number;
    frequencyPenalty?: number;
    profile: 'agressivo' | 'sobrio' | 'equilibrado' | 'criativo';
  };

  // ST-21.6: Governança de Custos
  usageLimit?: {
    dailyLimit: number;
    currentDailyUsage: number;
    lastUsage: Timestamp;
  };

  // S34-AO-02: Kill-Switch state (DT-11)
  killSwitchState?: {
    active: boolean;
    activatedAt?: Timestamp;
    reason?: string;
  };

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Representa um arquivo de contexto (asset) vinculado a uma marca.
 * Usado para enriquecer o RAG com guidelines, brand books, estratégias, etc.
 */
export interface BrandAsset {
  id: string;
  brandId: string;           // FK para brands collection
  userId: string;            // FK para auth user
  name: string;              // Nome editável pelo usuário
  originalName: string;      // Nome original do arquivo
  type: 'guideline' | 'brand_book' | 'strategy' | 'reference' | 'other' | 'url' | 'image';
  mimeType: string;          // MIME type do arquivo (ex: 'application/pdf', 'image/png')
  size: number;              // Tamanho em bytes
  url: string;               // Firebase Storage download URL (ou URL original para type: 'url')
  sourceUrl?: string;        // URL original (apenas para type: 'url')
  status: 'uploaded' | 'processing' | 'ready' | 'error';
  processingError?: string;  // Mensagem de erro se status = 'error'
  extractedText?: string;    // Texto extraído de PDFs/URLs/OCR
  chunkCount?: number;       // Número de chunks gerados (US-13.3)
  description?: string;      // Descrição opcional do arquivo
  tags?: string[];           // Tags para organização e busca
  isApprovedForAI: boolean;  // Flag de governança (US-18.3)
  createdAt: Timestamp;
  processedAt?: Timestamp;   // Timestamp quando ficou 'ready'
  metadata?: {
    sourceType: 'url' | 'pdf' | 'image' | 'text';
    sourceUrl?: string;
    originalName: string;
    isApprovedForAI: boolean;
    extractedAt: string;
    processingMethod: 'jina' | 'gemini-vision' | 'readability' | 'cheerio' | 'worker-v2' | 'text-direct';
  };
}

// ============================================
// PROJECT - Gestão de Projetos por Marca
// ============================================

export interface Project {
  id: string;
  brandId: string;           // FK para brands collection
  userId: string;            // FK para auth user
  name: string;
  description?: string;
  status: 'active' | 'archived' | 'completed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Representa um pedaço (chunk) de texto de um asset para RAG.
 */
export interface AssetChunk {
  id: string;
  brandId: string;
  assetId: string;
  userId: string;
  content: string;
  embedding?: number[];      // Vetor numérico (768 dimensões para text-embedding-004)
  order: number;             // Índice do chunk no documento original
  createdAt: Timestamp;
  metadata?: {
    sourceType: 'url' | 'pdf' | 'image' | 'text';
    sourceUrl?: string;
    originalName: string;
    isApprovedForAI: boolean;
    extractedAt: string;
    processingMethod: 'jina' | 'gemini-vision' | 'readability' | 'cheerio' | 'worker-v2' | 'text-direct';
  };
}

// ============================================
// FUNNEL
// ============================================

export interface Funnel {
  id: string;
  tenantId: string;
  agencyId?: string; // ST-23.1: Isolamento por Agência
  clientId?: string; // ST-23.1: Isolamento por Cliente da Agência
  userId: string;
  name: string;
  description?: string;
  status: FunnelStatus;
  context: FunnelContext;
  brandId?: string; // Sistema multi-marcas (opcional para retrocompatibilidade)
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
    awareness: 'unaware' | 'problem' | 'solution' | 'product' | 'most_aware';
    objection?: string;
  };
  
  // Offer
  offer: {
    what: string;
    ticket: string;
    type: 'curso' | 'servico' | 'saas' | 'mentoria' | 'produto_fisico';
  };
  
  // URL do funil (opcional, usado para Autopsy)
  url?: string;

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
  brandId?: string; // Sistema multi-marcas (opcional para retrocompatibilidade)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Referência a uma fonte usada pelo RAG na resposta */
export interface SourceReference {
  file: string;
  section?: string;
  content?: string;
  similarity?: number;
  rerankScore?: number;
  counselor?: string;
  type?: string;
}

export interface Message {
  id: string;
  conversationId?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Timestamp;
  metadata?: {
    sources?: Array<string | SourceReference>;
    counselors?: string[];
    scorecard?: Scorecard;
  };
  createdAt?: Timestamp;
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
  isApprovedForAI: boolean; // US-1.2.2
  version: string;
  category?: string;        // US-1.2.2
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
  brandId?: string;          // Sistema multi-marcas (opcional para retrocompatibilidade)
  
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

// ============================================
// INTEGRATION (subcollection de Tenant)
// ============================================

export interface Integration {
  id: string;
  tenantId: string;
  provider: 'meta' | 'google' | 'tiktok';
  status: 'active' | 'expired' | 'revoked';
  config: MetaIntegrationConfig | any;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MetaIntegrationConfig {
  adAccountId: string;
  accessToken: string;
}

// ============================================
// DASHBOARD
// ============================================

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


