# 📜 Mapeamento de Legado: Transição para o Manifesto Atômico

Este documento mapeia o estado atual dos dados (esparsos) e como eles devem ser consolidados no novo Manifesto da Campanha (v4.0).

## 1. Estado Atual (Brownfield)

Atualmente, os dados da "Linha de Ouro" estão distribuídos em:

| Componente | Localização Legacy | Campo de Vínculo |
| :--- | :--- | :--- |
| **Funil (Estratégia)** | `funnels/{id}` | `docId` |
| **Propostas (Funil)** | `funnels/{id}/proposals/{id}` | `funnelId` |
| **Copy (Propostas)** | `funnels/{id}/copyProposals/{id}` | `funnelId` |
| **Decisões de Copy** | `copyDecisions/{id}` | `funnelId` |
| **Social (Hooks)** | `campaigns/{id}.social.hooks` | `docId` (Instável) |

## 2. Pontos de Falha Identificados (Dandara/Wilder)

- **Desincronia de Coleção:** A coleção `copyDecisions` grava a aprovação, mas não atualiza o objeto `copywriting` dentro de `campaigns`.
- **Navegação Cega:** A página `/social` tentava ler `campaigns/{id}`, mas se a aprovação da copy não tivesse "carimbado" o manifesto, a página entrava em loop de erro ou mostrava pendente.

## 3. Estratégia de Scanner Passivo (Emergência)

Para evitar que o usuário perca o que já fez, o sistema deve adotar o seguinte scanner se o Manifesto estiver vazio:

1.  **Look into `funnels/{id}/copyProposals`**: Procurar por `status == 'approved'`. Se achar, injetar no Manifesto em tempo de execução (Memory Only) e tentar persistir (Sync).
2.  **Look into `copyDecisions`**: Validar se o ID da copy aprovada confere com a proposta selecionada.

## 4. Plano de Consolidação

- **Ação 1:** Refatorar a API `/api/copy/decisions` para usar o contrato `CampaignContext` de Athos.
- **Ação 2:** Criar um script de migração silenciosa (Run-once) que varre as campanhas pendentes e tenta reconstruir o Manifesto a partir dos dados do Funil.

---
*Assinado: Wilder (Analyst)*
