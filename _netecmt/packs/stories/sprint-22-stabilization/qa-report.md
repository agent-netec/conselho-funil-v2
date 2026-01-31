# ST-22-00 — Relatorio QA final (P0)

Data: 2026-01-31
Responsavel: Dandara (QA)

## Escopo
Validacao pos-deploy dos endpoints P0 definidos em `smoke-tests.md`, com referencia cruzada ao `failure-map.md`.

## Ambiente e pre-condicoes
Ambiente: nao informado (assumido pos-deploy).
Bloqueios atuais:
- Base URL/host do deploy nao informado.
- Tokens/credenciais de teste nao fornecidos (admin/brand/user).
- Logs de runtime (Sentry/Vercel) nao fornecidos para cruzar 4xx/5xx.
- Vercel envs nao confirmadas em `env-validation-checklist.md`.

## Status por endpoint (P0)
| Endpoint | Metodo | Status QA | Evidencia/observacao |
|---|---|---|---|
| `/api/intelligence/keywords` | POST | BLOQUEADO | Sem acesso ao ambiente pos-deploy e dados de teste. |
| `/api/intelligence/autopsy/run` | POST | BLOQUEADO | Sem acesso ao ambiente pos-deploy e dados de teste. |
| `/api/intelligence/spy` | POST | BLOQUEADO | Sem acesso ao ambiente pos-deploy e dados de teste. |
| `/api/chat` | POST | BLOQUEADO | Sem acesso ao ambiente pos-deploy e dados de teste. |
| `/api/ingest/url` | POST | BLOQUEADO | Sem acesso ao ambiente pos-deploy e dados de teste. |
| `/api/assets/metrics` | GET | BLOQUEADO | Sem acesso ao ambiente pos-deploy e dados de teste. |

## Regresssoes
- Nenhuma regressao registrada (execucao bloqueada).
- Riscos mais provaveis (ver `failure-map.md`): env ausente (Firebase/Gemini/Pinecone), scraping falho, persistencia Firestore.

## Recomendacao imediata para destravar
- Fornecer base URL do deploy e credenciais de teste (brandId/userId/competitorId/conversationId).
- Confirmar envs no Vercel conforme `env-validation-checklist.md`.
- Exportar logs de runtime usando `log-export-template.md` para correlacionar 4xx/5xx.

## Conclusao
Validacao P0 pos-deploy pendente por falta de acesso a ambiente e dados. Assim que os insumos forem fornecidos, executo o smoke test e atualizo este relatorio com evidencias.
