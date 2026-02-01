# ADR: Estabilizacao definitiva de erros 400/404/500

## Contexto
Projeto em brownfield com regressões recorrentes (400/404/500). Sprint atual focada em estabilizacao, porem sem protocolo unificado de diagnostico e contrato de API.

## Decisao
Adotar um protocolo de estabilizacao em 3 fases: (1) congelar features por 48h, (2) mapear rotas + contratos e matriz de erros, (3) instituir padroes de tratamento de erro e checklist de regressao antes de qualquer novo deploy.

## Consequencias
- Reduz regressões repetitivas.
- Torna causas rastreaveis por endpoint.
- Evita "corrige e quebra" sem diagnostico.
- Requer esforço inicial de mapeamento e disciplina de checklist.

## Referencias
- Next.js docs via Context7 (padroes de handlers com status e try/catch).
