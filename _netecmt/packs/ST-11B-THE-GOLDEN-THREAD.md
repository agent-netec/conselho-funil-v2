# 🧶 Mission Pack: ST-11-B "The Golden Thread"

> **Status:** Released for Development (ST-11.14 to ST-11.18)  
> **Target:** Victor (UI), Beto (UX), Justin/Savannah (Ads), Darllyson (Dev)

## 🎯 Objetivo
Transformar o "Conselho de Funil" em um sistema de campanhas integradas, onde a informação flui sem perdas do Funil (Estratégia) até o Ads (Escala), mantendo a **Congruência Estratégica**.

## 🏗️ Arquitetura de Contexto
A "Fonte Única de Verdade" é o objeto `CampaignContext` definido em `app/src/types/campaign.ts`.

### O Fluxo da Informação:
1.  **Funil** define o *Blueprint* (Tipo de funil, objetivo e público).
2.  **Copy** lê o *Blueprint* e gera a *Big Idea* e as *Headlines*.
3.  **Social** lê a *Big Idea* e gera os *Hooks*.
4.  **Design** lê as *Headlines* e *Hooks* e gera os *Visual Prompts* (C.H.A.P.E.U).
5.  **Ads** lê todo o manifesto acima e gera a estrutura de campanha e canais.
6.  **Monitoring** lê os resultados reais e a IA sugere ajustes no manifesto.

---

## 📋 Detalhamento das Tarefas

### ST-11.14: UI: Campaign Command Center (Victor/Beto)
- **Requisito**: Criar uma interface de "Dashboard de Campanha".
- **Visual**: Uma timeline ou stepper mostrando: `Funil ➔ Copy ➔ Design ➔ Social ➔ Ads`.
- **Funcionalidade**: Botões para expandir o resumo de cada etapa e um botão de ação "Próximo Passo" que invoca o agente correto.

### ST-11.15: Feature: Agent Handoff Logic (Darllyson)
- **Requisito**: Implementar o botão "Gerar Criativos desta Copy".
- **Backend**: Capturar o `campaignId` e passar os outputs da etapa anterior como `knowledgeContext` para a próxima.

### ST-11.16: Engine: Ads Strategy Generator (Athos/Justin)
- **Requisito**: Prompt sênior para o Conselho de Ads.
- **Input**: Manifesto completo da campanha.
- **Output**: JSON com estrutura de CBO/ABO, segmentação sugerida e distribuição de verba por canal.

### ST-11.17: UI: Monitoring & Tracking Dashboard (Victor/Beto)
- **Requisito**: Tela de acompanhamento de métricas (CTR, CPC, Conversão).
- **Integração**: Conectar com a coleção `campaign_metrics` (mock ou real).

### ST-11.18: AI: Feedback Loop & Optimization (Darllyson)
- **Requisito**: Função de análise de "Anomalia Estratégica".
- **Exemplo**: Se CTR < 0.8%, a IA deve sugerir: *"O Design não está parando o scroll, vamos testar uma variação com mais Contraste (Framework C.H.A.P.E.U)."*

---

## 🛑 Regras Inquebráveis
1. **NÃO criar silos**: Qualquer nova informação deve ser persistida no `CampaignContext`.
2. **Contract First**: Mudanças na estrutura de dados exigem atualização prévia no arquivo de tipos.
3. **Congruência**: O Designer NÃO pode escolher cores ou estilos que o Copywriter proibiu no briefing.
