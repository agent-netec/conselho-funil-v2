# 🎯 PRD: Automation & Personalization (Sprint 20)

**Versão:** 1.0  
**Responsável:** Iuran (PM)  
**Status:** Draft / Ready for Architecture Review

## 1. Problema & Oportunidade
Atualmente, o Conselho de Funil gera inteligência estratégica de alto nível (diagnósticos forenses via Autopsy e ofertas irresistíveis via Offer Lab), mas a execução dessa inteligência ainda é manual ou desconectada das plataformas de tráfego e engajamento. 

**Objetivo:** Transformar o Conselho em uma "Ala de Operações" ativa, onde a inteligência se traduz em automação de anúncios e personalização em tempo real, fechando o ciclo entre análise e execução (The Golden Thread).

## 2. Requisitos Funcionais

### RF-01: Personalization Engine ("O Maestro")
- O sistema deve atuar como um middleware que conecta os ativos da Biblioteca (Creative Vault) às APIs de Operações.
- Deve permitir a seleção dinâmica de criativos e cópias baseada em triggers de comportamento do lead.
- **Integração Context Assembler:** Injetar variáveis de personalização (nome, estágio de consciência, dor principal) em tempo real.

### RF-02: Integração Autopsy + Offer Lab (Closed-Loop Automation)
- **Triggers de Diagnóstico:** Se o `Funnel Autopsy` detectar um gargalo de "Retenção", o sistema deve disparar automaticamente uma campanha de retargeting focada em "Conteúdo de Valor" ou "Prova Social".
- **Triggers de Oferta:** Se o `Offer Lab` identificar baixa conversão em uma oferta específica, o sistema deve sugerir ou aplicar automaticamente um "Downsell" ou "Payment Plan" pré-configurado.
- **Real-time Response:** Automação de respostas em DMs e comentários baseada na intenção detectada.

### RF-03: Framework de Eugene Schwartz (Níveis de Consciência)
- O motor de personalização deve classificar cada lead em um dos 5 níveis de consciência:
    1. Inconsciente (Unaware)
    2. Consciente do Problema (Problem Aware)
    3. Consciente da Solução (Solution Aware)
    4. Consciente do Produto (Product Aware)
    5. Totalmente Consciente (Most Aware)
- A entrega de conteúdo (Ads/DMs) deve respeitar estritamente o framework, alterando o ângulo da copy conforme o nível detectado.

### RF-04: Escopo de APIs (Ala de Operações MVP)
- **Meta Ads API:** Criação e atualização de anúncios, leitura de métricas de performance (ROAS, CTR).
- **Instagram Graph API:** Monitoramento de DMs e comentários para automação de engajamento proativo.
- **Google Ads API:** Sincronização de conversões offline e otimização de lances baseada no LTV.

## 3. Requisitos Técnicos
- **Middleware Architecture:** O `Personalization Engine` deve ser isolado para suportar múltiplas APIs de tráfego.
- **Lead State Management:** Armazenamento do estado de consciência e histórico de interações no Firestore (`leads/{leadId}/context`).
- **Webhooks:** Implementação de endpoints para receber eventos em tempo real da Meta/Google.
- **Segurança:** Gestão centralizada de tokens via `Monara` (System User Access Tokens).

## 4. Métricas de Sucesso
- Redução de 30% no tempo entre "Detecção de Gargalo" e "Ação Corretiva" (Automação).
- Aumento de 20% no CTR de anúncios personalizados vs. genéricos.
- 100% de cobertura dos 5 níveis de consciência no motor de personalização.
- Zero falhas na sincronização de tokens de API durante a sprint.

---
*PRD gerado por Iuran (PM) com base no Discovery do Wilder - 29/01/2026*
