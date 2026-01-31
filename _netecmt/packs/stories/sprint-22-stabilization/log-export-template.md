# ST-22-00 — Template de exportação de logs (Sentry/Runtime)

> Preencha e envie para cruzamento rápido (top erros por endpoint).

## Janela de tempo
- Início:
- Fim:
- Ambiente: `dev` | `staging` | `prod`

## Top 5xx por endpoint
| Endpoint | Status | Count | Último erro (mensagem curta) | Exemplo traceId/requestId |
|---|---|---|---|---|
|  |  |  |  |  |

## Top 4xx por endpoint
| Endpoint | Status | Count | Motivo (validação/assinatura/etc) | Exemplo traceId/requestId |
|---|---|---|---|---|
|  |  |  |  |  |

## Erros críticos (amostra)
Para cada erro, inclua:
- Endpoint:
- Status:
- Timestamp:
- Mensagem:
- Stack trace (resumo):
- Payload (sanitizado):
- `brandId` / `userId` (se houver):
- Latência:

## Sinais de env ausente
Liste ocorrências de mensagens:
- `Gemini API not configured`
- `Firebase não inicializado`
- `Pinecone health failed`
- `Invalid signature`
- `Configuration missing`

