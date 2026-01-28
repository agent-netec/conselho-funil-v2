# Spec: Social-to-Sale Scripts Playbooks (ST-1.4.3)

**Responsável:** Iuran (PM)  
**Objetivo:** Injetar inteligência prática de conversão no Conselho Social (Justin Welsh, Lia Haberman, etc.) para que o RAG entregue roteiros acionáveis em vez de apenas conselhos teóricos.

---

## 🎯 1. Visão Geral
O Conselho de Funil já é bom em dar "diretrizes". Agora, ele precisa ser capaz de escrever o código (neste caso, o texto) que gera a venda direta em canais sociais (DMs e Stories). 

Este playbook transformará o comportamento dos agentes:
- **Antes**: "Você deve usar DMs para construir relacionamento."
- **Depois**: "Justin Welsh sugere este roteiro de 3 passos para converter um seguidor em uma chamada de consultoria via DM: [Script]."

## 🏗️ 2. Estrutura dos Novos Ativos

### A. Playbook: DM Selling Masterclass
Focado em conversão 1-para-1.
- **Módulos**:
  - **The Opener**: Scripts de abertura baseados em gatilhos (comentário em post, novo seguidor, menção nos stories).
  - **The Qualification**: Como perguntar sobre a dor sem parecer um vendedor chato.
  - **The Pivot**: Transição natural da conversa para a oferta/chamada.
  - **The Close**: Scripts de fechamento direto e tratamento de objeções "vapt-vupt".

### B. Playbook: Story Selling Frameworks
Focado em conversão 1-para-muitos via Stories (Instagram/LinkedIn/Facebook).
- **Sequências (Story Arcs)**:
  - **The Educational Bridge**: 3-5 stories ensinando algo + CTA.
  - **The Case Study Reveal**: Prova social → Resultado → "Como você pode ter isso".
  - **The Lifestyle/Authority Mix**: Mostrar o "backstage" e ancorar a oferta na rotina.
  - **The Flash/Direct Offer**: Sequência agressiva de 24h para vendas rápidas.

## 👤 3. Atribuição por Especialista (Injeção de Personalidade)

| Especialista | Foco do Script | Tom de Voz |
| :--- | :--- | :--- |
| **Justin Welsh** | LinkedIn DMs & Solo Business | Minimalista, direto, focado em sistemas. |
| **Lia Haberman** | Story Selling & Newsletters | Analítico, "curadoria", autoridade de mercado. |
| **Rachel Karten** | Instagram DMs & Community | Conversacional, "cool", humano, engajador. |
| **Nikita Beer** | Viral DMs & Loops | Psicológico, focado em incentivos e crescimento. |

## 🛠️ 4. Localização de Implementação
Os playbooks serão criados em:
- `_netecmt/brain/social/playbooks/dm_selling_playbook.md`
- `_netecmt/brain/social/playbooks/story_selling_playbook.md`

E replicados para `templates/social_media/social_brain/playbooks/` após validação.

---

## ✅ Próximos Passos
1. [ ] Criar o arquivo `dm_selling_playbook.md` com os primeiros 3 frameworks.
2. [ ] Criar o arquivo `story_selling_playbook.md` com as 4 sequências principais.
3. [ ] Atualizar o `identity.md` dos especialistas sociais para referenciar que eles agora usam estes playbooks.
