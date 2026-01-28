# NETECMT User Rule — Security Baseline (Nunca “vazar”)

## Objetivo
Evitar vazamento de credenciais, reduzir superfície de ataque e manter disciplina de segurança no ciclo de desenvolvimento.

## Regras de ouro
- **Nunca commitar secrets**: `.env*`, tokens, chaves privadas, JSON de credenciais.
- **Princípio do menor privilégio**: qualquer integração deve operar com permissões mínimas.
- **PII/privacidade**: dados pessoais devem ser tratados como sensíveis por padrão.

## Boas práticas obrigatórias
- **Variáveis de ambiente** para segredos e configs sensíveis.
- **Sanitização** em logs (não logar payloads com PII).
- **Dependências**:
  - Preferir libs ativas e bem mantidas.
  - Rodar auditoria quando alterar deps (ex.: `npm audit` / Snyk se disponível).

## “Stop conditions”
Pare e sinalize antes de prosseguir se:
- houver risco de expor credenciais;
- o pedido exigir bypass de segurança (ex.: desabilitar auth, ignorar validações);
- não existir contrato de dados/integração para uma feature sensível.

