# Sprint D — Tier 3 + Deep Brain + Evolucao

> Fases 5 + 6 do plano
> Status: NAO INICIADO
> Dependencia: Sprint C concluido

---

## Resumo
Cobrir engines restantes (Offer Lab, Research, A/B Testing), enriquecer chat/party mode, ingerir material rico no Pinecone com metadata, e criar pipeline de evolucao continua.

---

## Tarefas

### Fase 5: Tier 3 Engines

#### [  ] 5.1 — Offer Lab
- **Arquivo:** `app/src/lib/intelligence/offer-lab/scoring.ts`
- **Mudanca:** Integrar Kennedy offer_architecture + Brunson value_ladder
- **Status:** _aguardando_

#### [  ] 5.2 — Research Engine
- **Arquivo:** `app/src/lib/intelligence/research/engine.ts`
- **Mudanca:** Perspectiva de conselheiros na sintese do dossier
- **Status:** _aguardando_

#### [  ] 5.3 — A/B Testing
- **Arquivo:** `app/src/lib/intelligence/ab-testing/engine.ts`
- **Mudanca:** Avaliacao pela lente dos experts
- **Status:** _aguardando_

#### [  ] 5.4 — Chat System Prompts
- **Arquivo:** `app/src/lib/ai/prompts/chat-system.ts`
- **Mudanca:** Substituir descricoes de 1 linha por resumo dos identity cards (philosophy + principles + catchphrases)
- **Status:** _aguardando_

#### [  ] 5.5 — Party Mode
- **Arquivo:** `app/src/lib/ai/prompts/party-mode.ts`
- **Mudanca:** Enriquecer AGENTS_MAP com frameworks e principios. Debates referenciam frameworks especificos
- **Status:** _aguardando_

---

### Fase 6: Pinecone Deep Brain

#### [  ] 6.1 — Preparar arquivos para ingestao
- **Acao:** Copiar arquivos de `_netecmt/brain/` para `app/src/data/deep-brain/`
- **Conteudo:** ~43 arquivos (heuristicas, anti-padroes, modelos mentais, case studies, playbooks, scorecards)
- **Status:** _aguardando_

#### [  ] 6.2 — Criar script de ingestao com metadata
- **Acao:** Adaptar `bulk-ingest.ts` com metadata enrichment
- **Metadata obrigatoria:** document_id, chunk_number, counselor, counselors_relevant, domain, dataType, content_type, topics, version, updated_at, content_hash, source_file
- **Chunking:** Structure-aware (split por headers, JSON atomico, contexto do pai, 300-800 tokens)
- **Status:** _aguardando_

#### [  ] 6.3 — Ingerir conteudo no Pinecone
- **Namespace:** universal
- **Filtros:** dataType: counselor_knowledge + counselor + domain + content_type
- **Status:** _aguardando_

#### [  ] 6.4 — Verificar retrieval
- **Teste:** Query com filtro counselor retorna chunks relevantes
- **Pipeline:** Query → embedding → topK=10 → rerank → top 3-5 → inject
- **Status:** _aguardando_

#### [  ] 6.5 — Pipeline de evolucao continua
- **Criar:** Endpoint/script para ingestao de novos documentos
- **Fluxo:** Upload → classificacao → chunking → metadata → embedding → upsert → log
- **Auditoria:** Tabela ingestion_log no Firestore
- **Versionamento:** content_hash para detectar mudancas, delete+upsert para atualizar
- **Status:** _aguardando_

---

## Verificacao Sprint D

- [ ] Chat mode injeta identity cards completos no system prompt
- [ ] Party mode debates referenciam frameworks especificos
- [ ] Pinecone query com filter counselor: 'dan_kennedy' retorna chunks relevantes
- [ ] Metadata de cada chunk inclui counselors_relevant, content_type, topics, content_hash
- [ ] Pipeline de ingestao processa novo documento e disponibiliza em <5 min
- [ ] ingestion_log no Firestore registra cada ingestao
- [ ] Offer Lab usa Kennedy + Brunson frameworks
- [ ] Research Engine inclui perspectiva de conselheiros

---

## Changelog

| Data | Tarefa | Status | Observacoes |
|------|--------|--------|-------------|
| — | Sprint D inicio | AGUARDANDO | Depende da Sprint C |
