## Bug: Ingestão parcial no Pinecone (namespace `knowledge`)

### Contexto
- Task: ingestão em massa (script `app/src/scripts/bulk-ingest.ts`) para `templates/ads_brain` e `templates/copy`.
- Ambiente: ts-node/ESM, namespace Pinecone `knowledge`.
- Ajustes feitos: payload seguro (url `about:blank`, extractedText <1MB), dedup por `originalName` via query Pinecone, env carregado de `.env.local`.

### Sintoma
- Após ingestões repetidas e logs de sucesso, 4 arquivos não aparecem na query Pinecone filtrando `originalName` (namespace `knowledge`):
  - `ads_strategies.md`
  - `copy_scorecard.md`
  - `eugene_schwartz.md`
  - `gary_halbert.md`
- Checagem usada: script `app/scripts/check-pinecone.ts` (read-only), query por `originalName` no namespace `knowledge`.
- Outros arquivos (ex.: `jon_loomer.md`, `justin_brooke.md`, `nicholas_kusmich.md`, `savannah_sanchez.md`) aparecem normalmente.

### Hipótese
- `metadata.originalName` pode não estar chegando ao Pinecone (upsert sem campo ou namespace divergente).
- Logs do worker não exibem o payload upsertado; difícil confirmar se o metadado foi gravado.

### Próximo passo sugerido (futuro)
1) Adicionar log no `worker.ts` antes do `upsertToPinecone` mostrando `assetId`, `originalName`, `namespace` e `pineconeResult`.
2) Garantir `metadata.originalName` explícito no upsert (mesmo valor de `asset.originalName`).
3) Reprocessar apenas os 4 arquivos acima (dedup permite porque a query não retorna).
4) Se ainda falhar, fazer query sem filtro para inspecionar se caíram em outro namespace ou com metadado diferente.

### Estado atual
- Processo de ingestão considerado concluído/pausado. Pendência registrada para futura expansão do brain.
