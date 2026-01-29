# 🎯 PRD: Performance War Room (Sprint 18)

**Versão:** 1.0  
**Responsável:** Iuran (PM)  
**Status:** DRAFT  
**Data:** 2026-01-29

## 1. Problema & Oportunidade
Com a expansão da **Ala de Inteligência** e o início da **Ala de Operações**, o Conselho de Funil agora gera e monitora uma vasta quantidade de dados. No entanto, o usuário ainda não possui uma visão consolidada e "acionável" da performance global da marca.

**Objetivo:** Criar o **Performance War Room**, um dashboard de comando central que não apenas exibe métricas, mas atua como um "Sentinela", detectando anomalias e sugerindo otimizações em tempo real para maximizar o ROAS e a eficiência operacional.

## 2. Requisitos Funcionais

### RF-01: Dashboard Unificado de Performance
- **Consolidação Multicanal**: Visualização de métricas agregadas de Meta Ads, Google Ads e tráfego orgânico (via Mocks/APIs integradas).
- **Métricas Core**: Exibição em destaque de ROAS, CAC, LTV, CTR e Taxa de Conversão.
- **Gráficos de Tendência**: Visualização temporal de gastos vs. retorno.

### RF-02: Sistema de Alerta de Anomalias (The Sentry)
- **Detecção Automática**: O sistema deve identificar desvios significativos (ex: queda de 30% no CTR ou aumento de 50% no CPC em 24h).
- **Notificações Críticas**: Alertas visuais no dashboard e via sistema de logs para anomalias detectadas.
- **Contextualização**: A IA deve tentar explicar a anomalia com base nos dados da Ala de Inteligência (ex: "Anomalia detectada: CPC subiu devido ao aumento de concorrência na keyword X").

### RF-03: Painel de Integrações (BYO Keys)
- **Gestão de Chaves**: Interface para o usuário inserir e gerenciar suas próprias chaves de API (Meta, Google, etc.).
- **Status de Conexão**: Indicador visual de saúde das conexões externas.

## 3. Requisitos Técnicos
- **Lane de Performance**: Criação de `app/src/lib/performance/**` para lógica de agregação.
- **IA de Análise**: Uso do Gemini 1.5 Pro para análise de correlação entre anomalias e dados de mercado.
- **Segurança**: Isolamento total de chaves de API por `brandId` no Firestore (criptografado).
- **Contratos**: Definição de `/api/performance/metrics` e `/api/performance/anomalies`.

## 4. Métricas de Sucesso
- **Tempo de Diagnóstico**: Redução de horas para minutos na identificação de falhas em campanhas.
- **Adoção**: 100% das marcas configuradas com pelo menos uma integração ativa.
- **Precisão de Alerta**: >85% de taxa de acerto na detecção de anomalias reais vs. ruído.

## 5. Critérios de Aceite
1. O dashboard carrega dados de pelo menos duas fontes (Meta/Google) simultaneamente.
2. Um alerta é gerado visualmente quando um dado de mock simula uma queda brusca de performance.
3. O usuário consegue salvar uma chave de API e o sistema valida a conexão (mock success).

---
*Documento gerado sob a metodologia NETECMT v2.0*
