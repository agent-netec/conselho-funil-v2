# Changelog - Conselho de Funil 🎯

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.17.0] - 2026-01-29

### 🚀 Sprint 17: Social Command Center

Esta sprint foca na centralização da gestão de redes sociais através do Unified Inbox e na garantia de fidelidade de marca em todas as interações via BrandVoiceTranslator.

### Adicionado
- **Unified Inbox**:
  - Interface centralizada para Instagram, WhatsApp, X e LinkedIn.
  - Filtros dinâmicos e sistema de tags para gestão de conversas.
  - Indicadores visuais de crise baseados em análise de sentimento.
- **BrandVoiceTranslator Middleware**:
  - Motor de "Style Transfer" para garantir conformidade de tom de voz.
  - Sistema de sugestões de resposta "Brand-Aware" com cálculo de `toneMatch`.
- **Sentiment Gate**:
  - Bloqueio automático de interações com sentimento inferior a 0.3.
  - Alertas em tempo real para o time de social media.

### Melhorias
- **IA Response Suggestions**:
  - Geração de 3 variantes de resposta por interação.
  - Integração profunda com o BrandKit para extração de diretrizes de voz.

### Segurança
- **Security Guardrails**:
  - Trava de segurança para interações críticas.
  - Neutralidade segura (0.5) aplicada em casos de dados omissos.

---

## [1.12.0] - 2026-01-22

### 🚀 Sprint 12: Deep Intelligence

Esta sprint foca na otimização da inteligência de decisão do Conselho através de feedback loops automatizados, personalização profunda de modelos e integração de métricas de conversão reais no processo criativo.

### Adicionado
- **Automated Feedback Loop**:
  - Integração de métricas de performance (CTR/CVR) diretamente no pipeline de RAG para otimização contínua.
  - Sistema de aprendizado contínuo baseado em resultados reais de campanhas.
- **Multi-Agent Consensus Logic**:
  - Implementação da lógica de `[VEREDITO_DO_CONSELHO]` para deliberações mais assertivas.
  - Novo motor de síntese de deliberação entre múltiplos especialistas.
- **Advanced Analytics Deep Dive**:
  - Novos gráficos de drop-off e análise de funil em profundidade.
  - Configuração de IA personalizada dentro do BrandKit.

### Melhorias
- **Brand Voice Hyper-Personalization**:
  - Parâmetros de modelo (temperatura, top-p) agora são ajustados dinamicamente com base na identidade da marca.
  - Refinamento do tom de voz para maior alinhamento com o público-alvo.
- **Engine Resilience**:
  - Implementação de caching avançado para resultados de RAG.
  - Validação de truncamento de contexto (Context Truncation) para 30k tokens, garantindo estabilidade em conversas longas.

### Corrigido
- Estabilização de loops de feedback que causavam latência na geração de respostas.
- Ajustes finos na lógica de consenso para evitar conflitos entre personas de especialistas.

---

## [1.11.0] - 2026-01-22

### 🚀 Sprint 11: Brain Expansion & Visual Intelligence

Esta sprint marca a consolidação da "Golden Thread" operacional, integrando análise visual profunda, expansão massiva de conhecimento e um centro de comando unificado para campanhas.

### Adicionado
- **Visual Intelligence Engine**:
  - Integração com **Gemini Vision** para análise técnica de criativos (anúncios e landing pages).
  - Novo namespace `visual` no Pinecone para armazenamento de metadados de ativos visuais.
  - Heurísticas automáticas de design: Contraste, Legibilidade, Hook Strength e Congruência.
- **Campaign Command Center** (`/campaign/[id]`):
  - Interface de alta fidelidade para visualização sistêmica da estratégia.
  - Monitoramento em tempo real da "Golden Thread" (congruência entre Funil, Copy e Design).
  - Dashboard de performance integrado com métricas de CTR, Conversão e ROI.
- **Party Mode Evolution**:
  - Novo componente `counselor-selector.tsx` com suporte a combos de especialistas (ex: "Direct Response Masters").
  - Modos de interação: **Debate** vs **Consenso**.
  - Seleção dinâmica de até 3 especialistas com feedback visual em tempo real.
- **Asset Detail View**:
  - Modal detalhado para inspeção de ativos com insights estratégicos e métricas de performance.
  - Atalho direto para consultar o Conselho sobre ativos específicos.

### Melhorias
- **RAG & Knowledge Engine**:
  - Migração completa do RAG Firestore Legacy para **Pinecone Serverless**.
  - Implementação de `batch embeddings` para evitar limites de taxa do Gemini.
  - Injeção de RAG Global e Brand Assets na geração de anúncios (NanoBanana).
- **Arquitetura de Dados**:
  - Implementação de persistência atômica e lógica de retry (backoff) para Manifesto e Métricas.
  - Separação clara entre `CampaignId` e `FunnelId` para suporte a múltiplas variações estratégicas.

### Corrigido
- Erro "at most 100 requests" no processamento de embeddings em lote.
- Mapeamento de namespaces e deduplicação no Dashboard de Ativos.
- Falha de `userId` e `campaignId` undefined durante a geração de designs.
- Estabilização do prompt [NANOBANANA_PROMPT] para maior fidelidade visual.

### Removido
- Código legado de busca vetorial via Firestore (Firestore Vector Search deprecado).

---
*Changelog gerado por Luke (Release Agent) - Sprint 11 Handoff.*
