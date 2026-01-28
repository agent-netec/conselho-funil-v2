# Story: Beta Launchpad UI & Structured Output
ID: ST-1.5
Lane: UI/UX + AI Engine

## Contexto do Problema
Atualmente, o Conselho de Funil gera inteligência de alta qualidade (RAG + Playbooks), mas a entrega ao usuário final é via texto bruto, dificultando a aplicação imediata. Precisamos de uma interface que permita ao usuário visualizar estratégias, benchmarks e copiar scripts de venda (DMs/Stories) com um clique, baseada em um contrato de dados estruturado (`CouncilOutput`).

## Critérios de Aceite
- [ ] Definição do esquema JSON `CouncilOutput` (Estratégia, Dados de Mercado, Scripts).
- [x] Implementação de um componente de "Preview de Scripts" com função Copy-to-Clipboard.
- [ ] Refatoração do backend para processar a resposta da IA e preencher o objeto `CouncilOutput`.
- [ ] Exibição de Benchmarks de 2026 em formato de cards ou mini-gráficos na UI.

## Definição de Pronto (DoD)
- [ ] Código revisado pelo System Integrator.
- [ ] Contrato `CouncilOutput` validado pelo Athos (Arch).
- [ ] Testes de UI passando (Framer Motion animations e Clipboard).
- [ ] Documentação de API atualizada em `_netecmt/docs/api/`.

## Referências de Arquivos
- `_netecmt/project-context.md`
- `_netecmt/brain/social/playbooks/dm_selling_playbook.md`
- `_netecmt/solutioning/adr/2026-01-12-sprint-1-5-low-hanging-fruit.md`
