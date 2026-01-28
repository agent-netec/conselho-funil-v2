# 🔍 Contexto Permitido: Document Processing Worker (ST-10.4)

Os arquivos abaixo são as únicas lanes permitidas para alteração nesta story:

- `app/src/lib/ai/worker.ts` (Novo)
- `app/src/app/api/ingest/process/route.ts` (Novo)
- `app/src/lib/firebase/assets.ts`: Para funções de atualização de status/metadados.
- `app/package.json`: Para adição de dependências de parsing se necessário (ex: `pdf-parse`).
- `app/src/lib/ai/chunking.ts`: Ajustes finos se necessário.
