# 🔭 Contract: Intelligence Storage Foundation

**Versão:** 1.1.0  
**Status:** Active  
**Responsável:** Athos (Architect)  
**Sprint:** 13 - Intelligence Wing Foundation  
**Data:** 31/01/2026

---

## 1. Visão Geral

Este contrato define as especificações técnicas para a infraestrutura de armazenamento de dados da **Ala de Inteligência** do Agency Engine. Abrange os schemas de Pinecone (vetores), Firestore (documentos) e as interfaces TypeScript para garantir type-safety em toda a implementação.

### 🛡️ Guardrails Arquiteturais

| Guardrail | Regra | Validação |
|:----------|:------|:----------|
| **Multi-Tenant First** | Todo dado inclui `brandId` obrigatório | Lint rule + code review |
| **Graceful Degradation** | Falhas de fonte não quebram o sistema | Circuit breaker patterns |
| **No Admin SDK** | Client SDK only (Windows 11 24H2) | Import check automático |
| **Zero Vazamento** | Isolamento total entre brands | Security rules + namespace separation |

---

## 2. Pinecone: Namespace `intelligence_{brandId}`

### 2.1 Estrutura de Namespaces (Atualizada)

```yaml
pinecone:
  index: cf-dev-assets          # Index existente (768d, serverless)
  namespaces:
    - universal                 # Conhecimento dos Conselheiros (existente)
    - brand_{brandId}           # Ativos da marca (existente)
    - templates                 # Blueprints e Copy DNA (existente)
    - intelligence_{brandId}    # NOVO: Dados de inteligência por marca
```

### 2.2 Schema de Vetores (Intelligence)

```typescript
interface IntelligenceVector {
  id: string;                          // Format: `intel_{brandId}_{sourceHash}_{timestamp}`
  values: number[];                    // 768 dimensions (text-embedding-004)
  metadata: {
    // === OBRIGATÓRIOS (Multi-Tenant) ===
    brandId: string;                   // Isolamento de tenant
    type: 'mention' | 'trend' | 'competitor' | 'news';
    source: string;                    // 'google_news' | 'rss' | 'twitter' | 'instagram'
    
    // === RASTREABILIDADE ===
    collectedAt: number;               // Unix timestamp (ms)
    processedAt?: number;              // Unix timestamp (ms)
    expiresAt: number;                 // TTL timestamp (auto-cleanup)
    
    // === CONTEÚDO INDEXÁVEL ===
    title?: string;                    // Título da menção/notícia
    snippet: string;                   // Primeiros 500 chars do conteúdo
    url?: string;                      // URL original
    author?: string;                   // Autor/fonte
    
    // === ANÁLISE ===
    sentiment?: 'positive' | 'negative' | 'neutral';
    sentimentScore?: number;           // -1.0 a 1.0
    keywords: string[];                // Max 10 keywords
    relevanceScore?: number;           // 0.0 a 1.0 (match com brand keywords)
    
    // === MÉTRICAS ===
    engagement?: number;               // Likes, shares, comments agregados
    reach?: number;                    // Estimativa de alcance
  };
}
```

### 2.3 Regras de ID Generation

```typescript
// Formato: intel_{brandId}_{sourceHash}_{timestamp}
function generateIntelligenceId(
  brandId: string,
  sourceUrl: string,
  collectedAt: number
): string {
  const sourceHash = hashString(sourceUrl).substring(0, 8);
  return `intel_${brandId}_${sourceHash}_${collectedAt}`;
}
```

### 2.4 TTL e Retenção (Pinecone)

| Tipo de Dado | TTL | `expiresAt` Calculation |
|:-------------|:----|:------------------------|
| Menções Raw | 30 dias | `collectedAt + 30 * 24 * 60 * 60 * 1000` |
| Tendências | 90 dias | `collectedAt + 90 * 24 * 60 * 60 * 1000` |
| Competidores | 60 dias | `collectedAt + 60 * 24 * 60 * 60 * 1000` |
| News | 14 dias | `collectedAt + 14 * 24 * 60 * 60 * 1000` |

**Cleanup Strategy:**
```typescript
// Scheduled job (Cloud Functions ou cron local)
async function cleanupExpiredIntelligence(brandId: string): Promise<void> {
  const now = Date.now();
  await pineconeIndex.namespace(`intelligence_${brandId}`).deleteMany({
    filter: { expiresAt: { $lt: now } }
  });
}
```

---

## 3. Firestore: Collection `brands/{brandId}/intelligence`

### 3.1 Estrutura de Collections (Atualizada)

```
firestore/
├── users/                      # (existente)
├── brands/                     # (existente)
│   └── {brandId}/
│       ├── assets/             # (existente) - Brand assets
│       ├── conversations/      # (existente) - Chat history
│       └── intelligence/       # NOVO - Intelligence documents
│           ├── {documentId}/   # Menções, trends, etc.
│           └── _config/        # Configurações de coleta
│               └── keywords    # Keywords da marca
└── funnels/                    # (existente)
```

### 3.2 Interface: IntelligenceDocument

```typescript
import { Timestamp } from 'firebase/firestore';

/**
 * Documento de inteligência armazenado no Firestore
 * Collection: brands/{brandId}/intelligence
 */
export interface IntelligenceDocument {
  // === IDENTIFICAÇÃO ===
  id: string;                           // Auto-generated ou synced com Pinecone
  brandId: string;                      // Redundante para queries diretas
  
  // === CLASSIFICAÇÃO ===
  type: IntelligenceType;
  status: IntelligenceStatus;
  
  // === FONTE ===
  source: IntelligenceSource;
  
  // === CONTEÚDO ===
  content: IntelligenceContent;
  
  // === ANÁLISE ===
  analysis?: IntelligenceAnalysis;
  
  // === MÉTRICAS ===
  metrics?: IntelligenceMetrics;
  
  // === TIMESTAMPS ===
  collectedAt: Timestamp;
  processedAt?: Timestamp;
  archivedAt?: Timestamp;
  expiresAt: Timestamp;                 // Para TTL/cleanup
  
  // === SISTEMA ===
  pineconeId?: string;                  // Referência ao vetor
  version: number;                      // Versionamento otimista
}

// === TIPOS AUXILIARES ===

export type IntelligenceType = 'mention' | 'trend' | 'competitor' | 'news' | 'keyword';

export type IntelligenceStatus = 
  | 'raw'        // Coletado, aguardando processamento
  | 'processing' // Em análise pelo Analyst Agent
  | 'processed'  // Análise completa
  | 'archived'   // Expirado, mantido como resumo
  | 'error';     // Falha no processamento

export interface IntelligenceSource {
  platform: IntelligencePlatform;
  url?: string;
  author?: string;
  authorUrl?: string;
  fetchedVia: 'rss' | 'api' | 'scraping';
}

export type IntelligencePlatform = 
  | 'google_news' 
  | 'rss_feed' 
  | 'twitter' 
  | 'instagram' 
  | 'linkedin'
  | 'reddit'
  | 'google_autocomplete'
  | 'custom';

export type SearchIntent = 'informational' | 'navigational' | 'commercial' | 'transactional';

export interface KeywordMetrics {
  volume: number;
  difficulty: number; // 0 a 100
  cpc?: number;
  opportunityScore: number; // KOS (0 a 100)
  trend?: number; // % de crescimento
}

export interface KeywordIntelligence {
  term: string;
  intent: SearchIntent;
  metrics: KeywordMetrics;
  relatedTerms: string[];
  suggestedBy: 'scout' | 'analyst' | 'manual';
}

export interface IntelligenceContent {
  title?: string;
  text: string;
  textHash: string;                     // Para deduplicação
  language?: string;                    // ISO 639-1 (pt, en, es)
  originalUrl?: string;
  imageUrl?: string;
  publishedAt?: Timestamp;
  keywordData?: KeywordIntelligence;    // Para documentos do tipo 'keyword'
}

export interface IntelligenceAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;               // -1.0 a 1.0
  sentimentConfidence: number;          // 0.0 a 1.0
  keywords: string[];                   // Extraídos do conteúdo
  matchedBrandKeywords: string[];       // Keywords da marca encontradas
  relevanceScore: number;               // 0.0 a 1.0
  summary?: string;                     // Resumo gerado (opcional)
  analyzedBy: 'gemini-flash' | 'heuristics' | 'hybrid';
  analyzedAt: Timestamp;
}

export interface IntelligenceMetrics {
  engagement?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  reach?: number;
  impressions?: number;
}
```

### 3.3 Interface: BrandKeywords (Configuração)

```typescript
/**
 * Configuração de keywords para monitoramento
 * Collection: brands/{brandId}/intelligence/_config/keywords
 */
export interface BrandKeywordsConfig {
  brandId: string;
  
  // === KEYWORDS DE MONITORAMENTO ===
  keywords: BrandKeyword[];             // Max 20
  excludeTerms: string[];               // Termos a ignorar
  
  // === CONFIGURAÇÃO DE COLETA ===
  settings: {
    pollingIntervalMinutes: number;     // Default: 15, Min: 5, Max: 60
    maxResultsPerSource: number;        // Default: 50
    enabledSources: IntelligencePlatform[];
    language?: string;                  // Filtro de idioma
  };
  
  // === METADATA ===
  updatedAt: Timestamp;
  updatedBy: string;                    // userId
  version: number;
}

export interface BrandKeyword {
  term: string;                         // Max 50 chars
  type: KeywordType;
  priority: KeywordPriority;
  synonyms?: string[];                  // Variações a incluir
  active: boolean;
}

export type KeywordType = 'brand' | 'competitor' | 'industry' | 'product';
export type KeywordPriority = 'high' | 'medium' | 'low';
```

### 3.4 Firestore Security Rules (Extensão)

```javascript
// firestore.rules (adicionar ao existente)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // === INTELLIGENCE COLLECTION ===
    match /brands/{brandId}/intelligence/{docId} {
      // Leitura: Apenas owner da marca
      allow read: if request.auth != null 
        && get(/databases/$(database)/documents/brands/$(brandId)).data.ownerId == request.auth.uid;
      
      // Escrita: Apenas sistema (via service account ou authenticated)
      allow create, update: if request.auth != null
        && request.resource.data.brandId == brandId
        && request.resource.data.keys().hasAll(['brandId', 'type', 'status', 'source', 'content', 'collectedAt']);
      
      // Delete: Apenas cleanup automático (admin ou TTL)
      allow delete: if false; // Usar Cloud Functions para cleanup
    }
    
    // === INTELLIGENCE CONFIG ===
    match /brands/{brandId}/intelligence/_config/{configId} {
      allow read, write: if request.auth != null
        && get(/databases/$(database)/documents/brands/$(brandId)).data.ownerId == request.auth.uid;
    }
  }
}
```

---

## 4. Interfaces TypeScript Consolidadas

### 4.1 Arquivo: `app/src/types/intelligence.ts`

```typescript
/**
 * @fileoverview Tipos centralizados para o módulo Intelligence Wing
 * @module types/intelligence
 * @version 1.0.0
 */

import { Timestamp } from 'firebase/firestore';

// Re-exportar todas as interfaces
export type {
  IntelligenceDocument,
  IntelligenceType,
  IntelligenceStatus,
  IntelligenceSource,
  IntelligencePlatform,
  IntelligenceContent,
  IntelligenceAnalysis,
  IntelligenceMetrics,
  BrandKeywordsConfig,
  BrandKeyword,
  KeywordType,
  KeywordPriority,
} from './intelligence.types';

// === INTERFACES DE OPERAÇÃO ===

/**
 * Input para criação de documento de inteligência
 */
export interface CreateIntelligenceInput {
  brandId: string;
  type: IntelligenceType;
  source: IntelligenceSource;
  content: Omit<IntelligenceContent, 'textHash'>;
  metrics?: IntelligenceMetrics;
}

/**
 * Filtros para query de inteligência
 */
export interface IntelligenceQueryFilter {
  brandId: string;
  types?: IntelligenceType[];
  status?: IntelligenceStatus[];
  platforms?: IntelligencePlatform[];
  sentiment?: ('positive' | 'negative' | 'neutral')[];
  dateRange?: {
    start: Timestamp;
    end: Timestamp;
  };
  keywords?: string[];
  textHash?: string; // Para deduplicação
  minRelevance?: number;
  limit?: number;
  orderBy?: 'collectedAt' | 'relevanceScore' | 'sentimentScore';
  orderDirection?: 'asc' | 'desc';
}

/**
 * Resultado de query paginada
 */
export interface IntelligenceQueryResult {
  documents: IntelligenceDocument[];
  total: number;
  hasMore: boolean;
  lastDoc?: string;
}

/**
 * Status agregado de inteligência por marca
 */
export interface IntelligenceStats {
  brandId: string;
  totalMentions: number;
  byType: Record<IntelligenceType, number>;
  bySentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  averageSentimentScore: number;
  topKeywords: Array<{ term: string; count: number }>;
  lastCollectedAt?: Timestamp;
  lastProcessedAt?: Timestamp;
}
```

### 4.2 Arquivo: `app/src/types/intelligence-agents.ts`

```typescript
/**
 * @fileoverview Tipos para os agentes Scout e Analyst
 * @module types/intelligence-agents
 */

import { IntelligencePlatform, CreateIntelligenceInput } from './intelligence';

// === SCOUT AGENT ===

/**
 * Configuração de fonte de coleta
 */
export interface ScoutSourceConfig {
  platform: IntelligencePlatform;
  enabled: boolean;
  endpoint: string;                     // URL base ou feed URL
  credentials?: {
    type: 'api_key' | 'oauth' | 'none';
    keyRef?: string;                    // Referência a secret
  };
  rateLimit: {
    requestsPerHour: number;
    minIntervalMs: number;
  };
  parser: 'rss' | 'json' | 'html' | 'custom';
}

/**
 * Resultado de coleta do Scout
 */
export interface ScoutCollectionResult {
  brandId: string;
  source: IntelligencePlatform;
  success: boolean;
  itemsCollected: number;
  itemsFiltered: number;               // Duplicatas ou irrelevantes
  items: CreateIntelligenceInput[];
  errors?: ScoutError[];
  collectedAt: number;
  durationMs: number;
}

export interface ScoutError {
  code: 'RATE_LIMITED' | 'AUTH_FAILED' | 'PARSE_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN';
  message: string;
  retryable: boolean;
  retryAfterMs?: number;
}

// === ANALYST AGENT ===

/**
 * Configuração de processamento do Analyst
 */
export interface AnalystProcessConfig {
  sentimentModel: 'gemini-flash' | 'heuristics' | 'hybrid';
  extractKeywords: boolean;
  maxKeywordsPerDoc: number;
  generateSummary: boolean;
  summaryMaxLength: number;
  batchSize: number;                    // Docs por batch
  maxConcurrent: number;                // Batches paralelos
}

/**
 * Resultado de processamento do Analyst
 */
export interface AnalystProcessResult {
  brandId: string;
  docsProcessed: number;
  docsSkipped: number;
  docsFailed: number;
  averageProcessingTimeMs: number;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  topKeywords: Array<{ term: string; count: number }>;
  errors?: AnalystError[];
}

export interface AnalystError {
  docId: string;
  code: 'GEMINI_ERROR' | 'PARSE_ERROR' | 'VALIDATION_ERROR' | 'UNKNOWN';
  message: string;
}
```

---

## 5. Regras de TTL e Data Retention

### 5.1 Política de Retenção

| Tipo de Dado | Firestore TTL | Pinecone TTL | Ação após Expiração |
|:-------------|:--------------|:-------------|:--------------------|
| Menções Raw | 30 dias | 30 dias | Arquivar resumo → deletar original |
| Tendências | 90 dias | 90 dias | Manter agregados → deletar detalhes |
| Competidores | 60 dias | 60 dias | Arquivar insights → deletar raw |
| Alertas | 7 dias | N/A | Deletar após visualização |
| Configurações | Permanente | N/A | N/A |

### 5.2 Implementação de Cleanup

```typescript
// app/src/lib/intelligence/cleanup.ts

import { Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getPineconeIndex } from '@/lib/ai/pinecone';

/**
 * Executa cleanup de dados expirados (chamar via cron ou scheduled function)
 */
export async function runIntelligenceCleanup(brandId: string): Promise<CleanupResult> {
  const now = Timestamp.now();
  const results: CleanupResult = {
    brandId,
    firestoreDeleted: 0,
    firestoreArchived: 0,
    pineconeDeleted: 0,
    errors: [],
  };
  
  // 1. Query documentos expirados
  const expiredDocs = await db
    .collection(`brands/${brandId}/intelligence`)
    .where('expiresAt', '<=', now)
    .where('status', '!=', 'archived')
    .limit(100)
    .get();
  
  // 2. Arquivar ou deletar baseado no tipo
  for (const doc of expiredDocs.docs) {
    const data = doc.data();
    
    if (shouldArchive(data.type)) {
      // Arquivar resumo
      await doc.ref.update({
        status: 'archived',
        content: { summary: data.analysis?.summary || 'No summary' },
        archivedAt: now,
      });
      results.firestoreArchived++;
    } else {
      // Deletar completamente
      await doc.ref.delete();
      results.firestoreDeleted++;
    }
    
    // 3. Deletar vetor correspondente no Pinecone
    if (data.pineconeId) {
      try {
        const index = await getPineconeIndex();
        await index.namespace(`intelligence_${brandId}`).deleteOne(data.pineconeId);
        results.pineconeDeleted++;
      } catch (error) {
        results.errors.push({ docId: doc.id, error: String(error) });
      }
    }
  }
  
  return results;
}

function shouldArchive(type: string): boolean {
  return ['trend', 'competitor'].includes(type);
}

interface CleanupResult {
  brandId: string;
  firestoreDeleted: number;
  firestoreArchived: number;
  pineconeDeleted: number;
  errors: Array<{ docId: string; error: string }>;
}
```

---

## 6. Paths Autorizados (Lane Contract)

### 6.1 Arquivos Permitidos para Intelligence Wing

```yaml
intelligence_wing:
  paths:
    # === STORAGE & DATA ACCESS ===
    - "app/src/lib/intelligence/**"
    - "app/src/lib/firebase/intelligence.ts"
    
    # === TYPES ===
    - "app/src/types/intelligence.ts"
    - "app/src/types/intelligence-agents.ts"
    
    # === AGENTS ===
    - "app/src/lib/agents/scout/**"
    - "app/src/lib/agents/analyst/**"
    
    # === UI COMPONENTS ===
    - "app/src/components/intelligence/**"
    - "app/src/app/intelligence/**"
    
    # === API ROUTES ===
    - "app/src/app/api/intelligence/**"
    
    # === HOOKS ===
    - "app/src/lib/hooks/use-intelligence*.ts"
```

### 6.2 Dependências Externas Permitidas

| Pacote | Versão | Uso |
|:-------|:-------|:----|
| `rss-parser` | ^3.x | Parse de feeds RSS |
| `cheerio` | ^1.x | Scraping de HTML (já na stack) |
| `@pinecone-database/pinecone` | existing | Vector storage |
| `firebase` | existing | Firestore operations |

---

## 7. Validação de Implementação

### 7.1 Checklist de Code Review

- [ ] Todo documento inclui `brandId` não-nulo
- [ ] Namespace Pinecone segue padrão `intelligence_{brandId}`
- [ ] TTL calculado corretamente (`expiresAt` presente)
- [ ] Hash de conteúdo para deduplicação (`textHash`)
- [ ] Sem imports de `firebase-admin` ou `@google-cloud/*`
- [ ] Tratamento de erros com graceful degradation
- [ ] Logs não expõem dados sensíveis

### 7.2 Testes Obrigatórios

```typescript
// Exemplos de assertions para QA
describe('Intelligence Multi-Tenant Isolation', () => {
  it('should not leak data between brands', async () => {
    // Query de brandA não deve retornar docs de brandB
  });
  
  it('should enforce brandId on all writes', async () => {
    // Rejeitar writes sem brandId
  });
  
  it('should respect TTL expiration', async () => {
    // Docs expirados devem ser arquivados/deletados
  });
});
```

---

## 8. Referências

- **PRD:** `_netecmt/prd-sprint-13-intelligence-wing.md`
- **ADR:** `_netecmt/solutioning/adr/adr-001-polling-strategy.md`
- **Project Context:** `_netecmt/project-context.md`
- **Pinecone Docs:** `_netecmt/docs/tools/pinecone.md`
- **Firestore Docs:** `_netecmt/docs/tools/firestore.md`

---

*Contract definido por Athos (Architect) - NETECMT v2.0*  
*Sprint 13 | Intelligence Wing Foundation | Versão 1.0*
