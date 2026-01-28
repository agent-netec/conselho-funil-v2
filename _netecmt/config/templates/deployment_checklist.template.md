---
deployment_version: "[Versão a ser deployada, ex: v1.1.0]"
environment: "Production" # Staging, Production
date: "YYYY-MM-DD"
deployed_by: "[Nome do Responsável]"
status: "Pending" # Pending, In Progress, Success, Failed, Rolled Back
---

# Checklist de Deploy: Versão [Versão]

*Este checklist deve ser seguido rigorosamente durante o processo de deploy para garantir uma transição segura e bem-sucedida para o ambiente de produção.*

## Fase 1: Pré-Deploy

- [ ] **Comunicação:** O time foi notificado sobre a janela de deploy.
- [ ] **Backup:** Um backup completo do banco de dados de produção foi realizado.
- [ ] **Variáveis de Ambiente:** Todas as novas variáveis de ambiente foram configuradas no ambiente de produção.
- [ ] **Merge:** A branch de release foi aprovada e mesclada na `main`.
- [ ] **Build:** O build de produção foi gerado com sucesso e sem erros.

## Fase 2: Deploy

- [ ] **Modo de Manutenção:** A aplicação foi colocada em modo de manutenção (se aplicável).
- [ ] **Execução do Deploy:** O script de deploy foi executado.
- [ ] **Migrações:** As migrações do banco de dados foram executadas com sucesso.
- [ ] **Verificação do Deploy:** O log de deploy foi verificado e não contém erros.
- [ ] **Remoção do Modo de Manutenção:** A aplicação foi retirada do modo de manutenção.

## Fase 3: Pós-Deploy (Smoke Tests)

- [ ] **Verificação da Home:** A página inicial carrega corretamente.
- [ ] **Fluxo Crítico 1 (Login):** É possível fazer login na aplicação.
- [ ] **Fluxo Crítico 2 (Funcionalidade Principal):** A principal funcionalidade da nova versão está operando como esperado.
- [ ] **Monitoramento:** Os dashboards de monitoramento (Grafana, Sentry) não mostram um aumento significativo de erros.
- [ ] **Comunicação Final:** O time foi notificado que o deploy foi concluído com sucesso.

## Plano de Rollback

*Em caso de falha crítica durante ou após o deploy, o seguinte plano será executado:*

1.  Ativar imediatamente o modo de manutenção.
2.  Reverter o código para a versão estável anterior (tag `[versão_anterior]`).
3.  Restaurar o backup do banco de dados (se a falha envolveu migrações).
4.  Comunicar a falha e o início da investigação post-mortem.
