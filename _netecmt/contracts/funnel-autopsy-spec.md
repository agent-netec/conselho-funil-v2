# 🔭 Contract: Funnel Autopsy Engine

**Versão:** 1.0  
**Status:** Active  
**Responsável:** Athos (Architect)  
**Sprint:** 19 - Funnel Autopsy & Offer Lab  
**Data:** 29/01/2026

---

## 1. Visão Geral

Este contrato define as especificações técnicas para o motor de **Funnel Autopsy**, responsável por realizar diagnósticos forenses em páginas de funis externos via URL. O motor utiliza o **Browser MCP** para scraping e o **Analyst Agent** para aplicar heurísticas do Brain Council.

### 🛡️ Guardrails Arquiteturais

| Guardrail | Regra | Validação |
|:----------|:------|:----------|
| **Multi-Tenant** | Todo diagnóstico é vinculado a um `brandId` | Middleware de API |
| **Scraping Ethics** | Respeitar robots.txt e limites de taxa | Browser MCP Config |
| **Heuristic-Driven** | Análise baseada estritamente nos playbooks do Wilder | Prompt Engineering |
| **Async First** | Processamentos longos (>10s) devem ser via worker/status | API Response Pattern |

---

## 2. API Specification: `POST /api/intelligence/autopsy/run`

### 2.1 Request Body
```typescript
interface AutopsyRunRequest {
  brandId: string;          // ID da marca no tenant
  url: string;              // URL do funil a ser analisado
  depth: 'quick' | 'deep';  // Profundidade da análise (default: quick)
  context?: {
    targetAudience?: string; // Público-alvo esperado (opcional)
    mainOffer?: string;      // Oferta principal declarada (opcional)
  };
}
```

### 2.2 Response (Success - 200 OK)
```typescript
interface AutopsyRunResponse {
  id: string;               // ID do diagnóstico gerado
  status: 'completed' | 'processing' | 'failed';
  url: string;
  timestamp: number;
  report: AutopsyReport;
}

interface AutopsyReport {
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

interface HeuristicResult {
  score: number;            // 0 a 10
  status: 'pass' | 'fail' | 'warning';
  findings: string[];       // Observações específicas
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  type: 'copy' | 'design' | 'offer' | 'technical';
  action: string;           // O que deve ser feito
  impact: string;           // Por que deve ser feito
}
```

---

## 3. Data Schema: Firestore `brands/{brandId}/autopsies`

### 3.1 AutopsyDocument
```typescript
interface AutopsyDocument {
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
```

---

## 4. Integração com Browser MCP (Monara)

O Agente Monara deve ser invocado para realizar o scraping inicial.

**Comandos Permitidos:**
- `browser_navigate(url)`
- `browser_snapshot()`
- `browser_screenshot()`

**Output esperado para o Analyst:**
- HTML sanitizado (apenas tags estruturais e texto).
- Lista de CTAs e links.
- Metadados de SEO (Title, Description, OG Tags).

---

## 5. Heurísticas de Análise (Wilder Mapping)

O motor deve validar os seguintes pontos baseados no `autopsy_engine_knowledge.md`:

1.  **Hook (Gancho):** A headline captura a atenção em < 5s?
2.  **Story (Conexão):** O copy quebra as objeções principais do avatar?
3.  **Offer (Oferta):** Existe um empilhamento de valor (stack) claro?
4.  **Friction (Fricção):** O checkout/formulário é excessivamente longo?
5.  **Trust (Confiança):** Existem depoimentos ou selos de garantia?

---

## 6. Paths Autorizados (Lane Contract)

```yaml
funnel_autopsy:
  paths:
    - "app/src/app/api/intelligence/autopsy/**"
    - "app/src/lib/intelligence/autopsy/**"
    - "app/src/components/funnel-autopsy/**"
    - "app/src/types/autopsy.ts"
```

---

*Contract definido por Athos (Architect) - NETECMT v2.0*  
*Sprint 19 | Funnel Autopsy & Offer Lab | Versão 1.0*
