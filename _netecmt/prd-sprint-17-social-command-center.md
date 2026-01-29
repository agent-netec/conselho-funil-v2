# 🎯 PRD: Social Command Center (Sprint 17)

**Versão:** 1.0  
**Responsável:** Iuran (PM)  
**Status:** DRAFT (Aguardando Validação de Arquitetura)  
**Data:** 2026-01-29

## 1. Problema & Oportunidade
Atualmente, a gestão de redes sociais no Conselho de Funil está fragmentada. O usuário precisa alternar entre diferentes plataformas para responder leads, e as respostas muitas vezes carecem da "voz da marca" definida no BrandKit, resultando em uma comunicação inconsistente e lenta.

**Objetivo:** Centralizar a comunicação social em um **Inbox Unificado** e potencializar as interações com **Sugestões de Resposta Inteligentes** que respeitem rigorosamente a identidade da marca (BrandKit).

## 2. Requisitos Funcionais

### RF-01: Inbox Unificado (Social Command Center)
- **Centralização**: O sistema deve consolidar mensagens e comentários de múltiplas origens (Instagram, Facebook, WhatsApp - via API/Mocks para esta sprint) em uma única interface.
- **Filtros e Status**: Capacidade de filtrar por canal, status da conversa (Pendente, Respondido, Arquivado) e sentimento do lead (detectado via IA).
- **Contexto do Lead**: Exibição de informações básicas do lead ao lado da conversa (nome, última interação, tags de interesse).

### RF-02: Sugestões de Resposta "Brand-Aware"
- **Geração de Respostas**: A IA deve sugerir 3 opções de resposta para cada mensagem recebida.
- **Alinhamento com BrandKit**: As sugestões DEVEM seguir o tom de voz, estilo visual (vibe) e restrições de linguagem definidos no `BrandKit` da marca ativa.
- **Edição Rápida**: O usuário deve poder editar a sugestão da IA antes de enviar.
- **Aprendizado de Contexto**: A IA deve considerar o histórico da conversa atual para manter a coerência.

### RF-03: Quick Actions de Engajamento
- **Tags Automáticas**: Sugestão de tags para o lead com base no conteúdo da mensagem (ex: "Dúvida de Preço", "Reclamação", "Elogio").
- **Escala para Especialista**: Botão para marcar conversas que exigem atenção humana imediata ou de um especialista específico.

## 3. Requisitos Técnicos
- **Integração de Dados**: Consumo dos dados do `BrandKit` (Cores, Tipografia, Vibe) para alimentar o prompt de geração de resposta.
- **Modelos**: Gemini 2.0 Flash para análise de sentimento e geração de respostas rápidas.
- **Interface**: Componentes de chat otimizados para alta densidade de informação, seguindo o design system do projeto.
- **Contratos**: Atualização do `contract-map.yaml` para incluir os novos endpoints de `/api/social/inbox` e `/api/social/suggest`.

## 4. Métricas de Sucesso
- **Tempo de Resposta**: Redução de 50% no tempo médio para formular uma resposta inicial.
- **Consistência**: 90% das respostas sugeridas classificadas como "On-Brand" em testes de QA.
- **Engajamento**: Aumento na taxa de conversão de conversas em leads qualificados.

## 5. Critérios de Aceite
1. O usuário visualiza mensagens de pelo menos 2 canais diferentes no mesmo painel.
2. Ao clicar em uma mensagem, a IA gera automaticamente sugestões de resposta.
3. As sugestões mudam visivelmente de tom quando o "Estilo Visual/Vibe" no BrandKit é alterado.
4. É possível enviar uma resposta (mock) e ver o status da conversa mudar para "Respondido".

---
*Documento gerado sob a metodologia NETECMT v2.0*
