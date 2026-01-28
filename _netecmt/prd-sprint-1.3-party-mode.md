# PRD: Sprint 1.3 - Party Mode (Multi-Persona Deliberation)

**Status:** Draft 🟢  
**Responsável:** Iuran (PM)  
**Data:** 11/01/2026

## 1. Visão Geral
O **Party Mode** é a funcionalidade de "assinatura" do Conselho de Funil. Ele permite que o usuário invoque múltiplos especialistas simultaneamente para debater um problema estratégico. Em vez de uma resposta linear, o usuário recebe uma deliberação rica em perspectivas divergentes e complementares.

## 2. Objetivos de Negócio
- **Diferenciação Competitiva**: Criar uma experiência de "Mesa Redonda" que nenhum outro chat de IA oferece.
- **Profundidade Estratégica**: Resolver problemas complexos onde a resposta não é binária (ex: Tráfego vs. Conversão).
- **Aumento de Retenção**: Tornar as sessões de consultoria mais dinâmicas e valiosas.

## 3. Requisitos Funcionais (User Stories)

### 3.1. Seletor de Conselho (Agentes Ativos)
- O usuário deve poder selecionar até 3 especialistas para participarem da conversa.
- O sistema deve sugerir combinações (ex: "Dupla de Copy" - Schwartz & Halbert).

### 3.2. Fluxo de Deliberação (O Debate)
- A IA deve gerar uma resposta estruturada onde cada agente selecionado apresenta seu ponto de vista.
- Os agentes devem interagir entre si (ex: "Concordo com o Russell sobre o funil, mas discordo do preço, pois como Dan Kennedy diz...").

### 3.3. Síntese do Moderador (Veredito)
- Toda deliberação deve terminar com um "Veredito do Conselho" (Moderador), resumindo os pontos de acordo e os próximos passos práticos.

## 4. Experiência do Usuário (UX)
- **Visual**: Badges múltiplos no topo da mensagem.
- **Leitura**: Headers claros para cada persona no corpo do texto.
- **Feedback**: Indicador visual de "O Conselho está deliberando..." durante o carregamento.

## 5. Critérios de Aceite
- [ ] Interface permite selecionar múltiplos agentes.
- [ ] A resposta da IA contém pelo menos 2 perspectivas distintas identificadas.
- [ ] O Veredito Final está presente no fim de cada resposta em Party Mode.
