# 📜 Ingestion & RAG Data Contracts

## 🏷️ Lane: Ingestion
**Responsável:** Athos (Architect) / Kai (Integrator)

### 1. Esquema de Metadados de Chunk (Firestore)
Todo chunk salvo na coleção `brand_assets` DEVE seguir rigorosamente esta estrutura:

```typescript
interface IngestionChunk {
  id: string;              // UUID
  brandId: string;         // Referência obrigatória à Marca
  userId: string;          // Proprietário do asset
  content: string;         // Texto limpo extraído (OCR ou Scraping)
  embedding: number[];     // Vetor de 768 dimensões
  metadata: {
    sourceType: 'url' | 'pdf' | 'image' | 'text';
    sourceUrl?: string;
    originalName: string;
    isApprovedForAI: boolean; // Flag de governança
    extractedAt: string;      // ISO Date
    processingMethod: 'jina' | 'gemini-vision' | 'readability';
  }
}
```

### 2. Regras de Integridade
1. **Approval Gate:** O RAG Engine (`rag.ts`) DEVE ignorar qualquer asset onde `isApprovedForAI === false`.
2. **Context Isolation:** As buscas vetoriais DEVEM sempre incluir o filtro `where('brandId', '==', activeBrandId)`.
3. **Anti-Hallucination:** Se o Brand Kit estiver incompleto (sem cores/estilo), o sistema deve usar o prompt de fallback: `[BRAND_FALLBACK_MODE]`.

### 3. Contrato de Ingestão (API)
- **Endpoint:** `/api/ingest/url`
- **Input:** `{ url: string, brandId: string }`
- **Output:** `{ success: boolean, data: ScrapedContent, assetId: string }`

