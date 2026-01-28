# ADR: Sprint 1.5 - Foco em "Low Hanging Fruit" para Beta Testers

**Data:** 12/01/2026  
**Status:** Decidido  
**Participantes:** [IURAN], [ATHOS], [LETICIA], [ALTO CONSELHO]

## Contexto
O projeto finalizou a Sprint 1.4 com sucesso, consolidando a inteligência de RAG, Benchmarks de 2026 e Playbooks de Social Selling. Agora, é necessário priorizar entregas tangíveis que permitam que usuários de teste (beta testers) validem o valor do produto.

## Decisão
A Sprint 1.5 será focada no **"Beta Launchpad"**, transformando o conhecimento técnico em saídas acionáveis através de uma UI dedicada.

### Pontos Chave:
1.  **Priorização**: Em vez de expandir a lógica interna do Party Mode (deliberação multi-agente complexa), o foco será na **Exposição de Ativos** (Playbooks e Scripts).
2.  **Arquitetura**: Criação do contrato `CouncilOutput` para padronizar as respostas da IA, separando Estratégia, Dados e Scripts.
3.  **UI/UX**: Implementação de uma tela de "Preview de Ativos" onde o usuário pode copiar scripts de DM e Stories prontos para uso.

## Consequências
- **Positivas**: Feedback rápido de usuários reais sobre a utilidade dos scripts gerados.
- **Negativas**: Adiamento de features de infraestrutura mais complexas (como integrações profundas de múltiplos agentes).

## Próximos Passos
1. Leticia (SM) criará o Story Pack para a Sprint 1.5.
2. Iuran (PM) definirá os critérios de aceite para a tela de Preview.
3. Athos (Arch) desenhará o contrato `CouncilOutput`.
