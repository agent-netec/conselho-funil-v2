import { Timestamp } from 'firebase/firestore';

export interface AutopsyRunRequest {
  brandId: string;          // ID da marca no tenant
  url: string;              // URL do funil a ser analisado
  depth: 'quick' | 'deep';  // Profundidade da análise (default: quick)
  context?: {
    targetAudience?: string; // Público-alvo esperado (opcional)
    mainOffer?: string;      // Oferta principal declarada (opcional)
  };
}

export interface AutopsyRunResponse {
  id: string;               // ID do diagnóstico gerado
  status: 'completed' | 'processing' | 'failed';
  url: string;
  timestamp: number;
  report: AutopsyReport;
}

export interface AutopsyReport {
  score: number;            // 0 a 10 (Funnel Health Score)
  summary: string;          // Resumo executivo do diagnóstico
  heuristics: {
    hook: HeuristicResult;
    story: HeuristicResult;
    offer: HeuristicResult;
    friction: HeuristicResult;
    trust: HeuristicResult;
  };
  recommendations: Recommendation[];
  metadata: {
    screenshotUrl?: string; // Screenshot da página analisada
    loadTimeMs: number;
    techStack: string[];    // Tecnologias detectadas (ex: ClickFunnels, Elementor)
  };
}

export interface HeuristicResult {
  score: number;            // 0 a 10
  status: 'pass' | 'fail' | 'warning';
  findings: string[];       // Observações específicas
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  type: 'copy' | 'design' | 'offer' | 'technical';
  action: string;           // O que deve ser feito
  impact: string;           // Por que deve ser feito
}

export interface AutopsyDocument {
  id: string;
  brandId: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  request: AutopsyRunRequest;
  result?: AutopsyReport;
  error?: {
    code: string;
    message: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt: Timestamp;     // TTL: 30 dias
}
