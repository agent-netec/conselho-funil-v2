# Story: Sprint 22 - Estabilização do Produto (Online)
ID: ST-22-00

## Distilled Requirements
Estabilizar o ambiente online e reduzir erros 500/400/404 com foco em endpoints críticos de Inteligência.

## Acceptance Criteria
- Endpoints de Inteligência retornam sucesso ou erro tratado (sem crash de UI).
- Keywords Miner retorna resultados mesmo se persistência falhar.
- Spy Agent não quebra em respostas não JSON.
- Redirecionamentos críticos continuam ativos (analytics/campaign).
- Checklist de envs mínimas validado em local e Vercel.

## Technical Snippets
- Revisar `app/src/app/api/intelligence/*` para resiliência de resposta.
- Garantir uso do `auth-store` para obter `user.uid` em páginas críticas.
- Evitar `response.json()` em respostas não JSON.
- Manter `.env.example` como referência sem segredos.
