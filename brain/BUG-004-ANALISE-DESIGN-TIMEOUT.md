# BUG-004: Análise Técnica — Design Generation Timeout

> **Data:** 2026-02-19
> **Bug:** Geração de design retorna 504 Gateway Timeout
> **Severidade:** P0 (BLOCKER)

---

## 📊 Diagnóstico

### Configuração Atual
- **Vercel timeout**: 60s (`vercel.json` → `maxDuration: 60`)
- **Memória**: 1GB
- **Região**: GRU1 (São Paulo)

### Fluxo da Rota `/api/design/generate`

```
1. Validação de parâmetros (~100ms)
2. requireBrandAccess() (~200ms)
3. getBrand(brandId) — Firestore (~300ms)
4. getBrandAssets(brandId) — Firestore (~500ms)
5. Fetch de 3 image references + conversão base64 (~2-5s)
6. Gemini Flash: Gera 3 variações de prompts (~3-5s)
7. **Gemini Pro Image: Gera 3 imagens em paralelo (~30-45s cada = 30-45s total)**
8. Upload de 3 imagens para Firebase Storage (~3-6s)
9. updateUserUsage() (~200ms)

TOTAL: ~40-60s (quando tudo funciona bem)
TIMEOUT: 10s (default Vercel sem config) ou 60s (com config)
```

### Causa Raiz

**Problema 1: Gemini Pro Image é MUITO lento**
- Cada geração de imagem leva **10-30 segundos**
- Mesmo em paralelo, pode demorar 30-45s total
- **Região GRU1 → us-central1 (Google AI)** = latência adicional

**Problema 2: Upload para Storage adiciona 3-6s**
- 3 imagens de ~2MB cada
- Upload via REST API do Firebase

**Problema 3: Timeout mal configurado?**
- `vercel.json` define `maxDuration: 60`
- Mas erro é **504 Gateway Timeout**
- Possíveis causas:
  - Vercel proxy/CDN tem limite de 30s?
  - Path pattern `src/app/api/**/*.ts` não está matchando?
  - Plano free/hobby ignora config de timeout?

---

## 🔧 Soluções Propostas

### ✅ HOTFIX 1: Forçar Single Generation (RECOMENDADO)

**Mudança:**
- Forçar `isSingleGeneration = true` **sempre**
- Reduz de **3 gerações** para **1 geração**

**Impacto:**
- ⏱️ Tempo: ~40-60s → ~15-25s
- ✅ Dentro do limite de 30s (seguro)
- ⚠️ Usuário perde opção de 3 variações

**Código:**
```typescript
// Em route.ts linha ~61
const isSingleGeneration = true; // HOTFIX: força 1 imagem apenas
```

**Prós:**
- Fix imediato (1 linha)
- Funciona com plano atual
- Não requer infra mudança

**Contras:**
- UX degradada (só 1 variação)
- Não resolve problema de fundo

---

### ✅ HOTFIX 2: Timeout + Retry na Gemini API

**Mudança:**
- Adicionar timeout de 25s na chamada do Gemini
- Se falhar, retry 1x com timeout de 20s
- Se falhar de novo, retornar erro amigável

**Código:**
```typescript
// Wrapper com timeout
const fetchWithTimeout = (url, options, timeoutMs) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    ),
  ]);
};

// No fetch do Gemini (linha ~291)
const response = await fetchWithTimeout(imageEndpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
}, 25000); // 25s timeout
```

**Prós:**
- Detecta timeout antes do Vercel
- Retry aumenta taxa de sucesso

**Contras:**
- Ainda pode falhar se Gemini estiver lento
- Não resolve problema de fundo

---

### 🔄 SOLUÇÃO MÉDIO PRAZO: Job Queue Async

**Arquitetura:**
1. **Endpoint retorna imediatamente** com `jobId`
2. **Job queue processa** em background (Inngest, Trigger.dev, BullMQ)
3. **Webhook/polling** notifica quando pronto
4. **UI mostra progress** "Gerando imagem... 30%"

**Prós:**
- ✅ Não sofre timeout
- ✅ Melhor UX (feedback de progresso)
- ✅ Escalável

**Contras:**
- Requer setup de infra (Inngest/Redis)
- Mudança maior de código
- ~1-2 dias de trabalho

---

### 💰 SOLUÇÃO LONGO PRAZO: Upgrade Vercel Pro

**Mudança:**
- Upgrade para Vercel Pro ($20/mês)
- Aumenta `maxDuration` para **300s** (5 minutos)
- Região otimizada

**Prós:**
- Resolve timeout completamente
- Sem mudança de código
- Performance melhor

**Contras:**
- Custo recorrente ($20/mês)
- Não resolve lentidão da Gemini
- Workaround, não solução

---

## 🎯 Recomendação

### Implementar AGORA (hoje):
**HOTFIX 1** — Forçar single generation (1 linha de código)

### Implementar DEPOIS (Sprint Y):
**HOTFIX 2** — Timeout + retry (30 minutos de trabalho)

### Planejar (Sprint futuro):
**Job Queue Async** — Solução definitiva (1-2 dias)

---

## 📝 Checklist de Implementação

### HOTFIX 1 (Imediato)
- [ ] Alterar linha 61: `const isSingleGeneration = true;`
- [ ] Testar em produção
- [ ] Verificar se gera 1 imagem com sucesso
- [ ] Tempo < 30s

### HOTFIX 2 (Depois)
- [ ] Criar função `fetchWithTimeout()`
- [ ] Adicionar retry logic
- [ ] Mensagem de erro amigável
- [ ] Testar edge cases

### Job Queue (Futuro)
- [ ] Escolher ferramenta (Inngest vs Trigger.dev vs BullMQ)
- [ ] Setup de infra
- [ ] Refatorar rota para async
- [ ] UI de progresso
- [ ] Webhook/polling

---

## 🧪 Como Testar

```bash
# Após hotfix, testar em produção
curl -X POST https://app-rho-flax-25.vercel.app/api/design/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "prompt": "Modern tech website hero section",
    "brandId": "...",
    "userId": "...",
    "aspectRatio": "16:9",
    "imageSize": "2K"
  }'

# Deve retornar em < 30s com 1 imagem
```

---

## 📚 Referências

- `app/src/app/api/design/generate/route.ts` — Rota principal
- `app/vercel.json` — Config de timeout
- Gemini Pro Image docs: https://ai.google.dev/gemini-api/docs/imagen

---

> **Próximo passo:** Implementar HOTFIX 1 agora?
