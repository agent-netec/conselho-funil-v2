# 📦 Story Pack: Sprint 17 - Social Command Center

**Versão:** 1.0.0  
**Responsável:** Leticia (SM)  
**Status:** 🟢 Ready for Execution  
**Data:** 2026-01-29

## 📋 Resumo do Pack
Este pacote de histórias foca na centralização das interações sociais e na garantia de que toda resposta automática ou sugerida siga rigorosamente a identidade da marca através do `BrandVoiceTranslator`.

---

## 🚀 Histórias de Entrega

### ST-17.1: Implementação da interface SocialInteraction (Ingestão)
**Persona:** Darllyson (Dev) / Athos (Arch)  
**Contrato:** `_netecmt/contracts/social-api-spec.md`  
**Escopo:** Implementar a camada de tipos e os adaptadores de ingestão para as plataformas sociais.

**Critérios de Aceite (AC):**
1. [ ] Implementar interface `SocialInteraction` conforme `@_netecmt/contracts/social-api-spec.md`.
2. [ ] Criar mocks funcionais para Instagram (DM/Comentário) e WhatsApp.
3. [ ] Garantir que o `externalId` seja único e persistido corretamente.
4. [ ] Implementar o "Gate de Sentimento" na ingestão: interações com sentimento < 0.3 devem ser marcadas com a flag `requires_human_review`.
5. [ ] Testes unitários validando a normalização de dados de diferentes plataformas para o formato `SocialInteraction`.

---

### ST-17.2: Desenvolvimento do Middleware BrandVoiceTranslator
**Persona:** Darllyson (Dev) / Athos (Arch)  
**Contrato:** `_netecmt/contracts/brand-voice-spec.md`  
**Escopo:** Desenvolver o middleware de "Style Transfer" que reescreve respostas técnicas no tom de voz da marca.

**Critérios de Aceite (AC):**
1. [ ] Implementar interface `VoiceGuidelines` e `TranslationInput` conforme `@_netecmt/contracts/brand-voice-spec.md`.
2. [ ] Integrar com o `BrandKit` para extrair `tone`, `forbiddenWords` e `preferredTerms`.
3. [ ] Criar o prompt de sistema de "Style Transfer" que garanta a preservação dos fatos técnicos enquanto altera o tom.
4. [ ] **RIGOR DE VOZ:** Validar que 100% das `forbiddenWords` são removidas ou substituídas na saída final.
5. [ ] Implementar métrica `toneMatch` (0.0 a 1.0) comparando a saída com as diretrizes do BrandKit.
6. [ ] Garantir latência de tradução < 2s para manter o SLA global de 30s.

---

### ST-17.3: UI do Inbox Unificado (Victor/Beto)
**Persona:** Victor (UI) / Beto (UX)  
**Contrato:** `_netecmt/contracts/social-api-spec.md`  
**Escopo:** Interface de alta densidade para gestão de conversas multicanal com suporte a sugestões de IA.

**Critérios de Aceite (AC):**
1. [ ] Lista de conversas com filtros por plataforma (`instagram`, `whatsapp`, etc) e status (`Pendente`, `Respondido`).
2. [ ] Indicador visual de sentimento (cores/ícones) baseado no score da ingestão.
3. [ ] Área de chat com exibição de contexto do lead (nome, tags, última interação).
4. [ ] Componente de "Sugestões de Resposta": exibir 3 opções geradas pela IA.
5. [ ] Botão de "Escala para Especialista" e "Edição Rápida" integrados ao fluxo de resposta.
6. [ ] Responsividade: A interface deve ser funcional em desktop e tablets (mínimo 1024px).

---

## 🛠️ Contexto Permitido (Allowed Context)
Os desenvolvedores atuando neste pack devem se limitar aos seguintes documentos:
- `_netecmt/prd-sprint-17-social-command-center.md`
- `_netecmt/contracts/social-api-spec.md`
- `_netecmt/contracts/brand-voice-spec.md`
- `_netecmt/core/contract-map.yaml`
- `app/src/types/social.ts` (a ser criado/editado)
- `app/src/lib/intelligence/social/**`

---
*NETECMT v2.0 | Orquestração de Sprint por Leticia (SM)*
