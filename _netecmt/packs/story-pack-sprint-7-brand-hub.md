# 📦 Story Pack: Sprint 7 - Brand Hub & Logo Governance

**Status:** Draft 🟠  
**Sprint:** 7 (E18: Brand Hub Foundation)  
**Épicos:** E18 (Brand Hub & Logo Governance)  
**Responsável:** Leticia (SM)

---

## 🎯 Objetivo
Estabelecer a fundação de identidade visual da marca para garantir consistência em todos os conselhos. O foco é garantir que os agentes de IA utilizem apenas ativos autorizados e respeitem rigorosamente o BrandKit visual e estratégico do cliente.

---

## 📝 User Stories

### US-7.1: Implementação do Schema de BrandKit ✅
**Como** arquiteto, **quero** definir e implementar o schema de BrandKit no Firestore, **para** que cores, tipografia e estilos visuais sejam persistidos e acessíveis por todos os agentes.
- **Critérios de Aceite:**
    - [x] Atualizar o tipo `Brand` em `app/src/types/database.ts` para incluir o objeto `BrandKit` conforme `brand-hub-spec.md`.
    - [x] Criar estrutura de cores: primária, secundária, accent, background e variants (Light/Dark).
    - [x] Criar campos de tipografia com `systemFallback`.
    - [x] Adicionar campo `visualStyle` (Minimalist, Aggressive, Luxury, etc.).
    - [x] Validar a leitura deste schema no `formatBrandContextForChat`.
- **Responsável:** Athos (Arch)
- **Status:** ✅ Concluído

### US-7.2: Sistema de Persistência Logo Lock 🔒 ✅
**Como** sistema de governança, **quero** permitir o upload e o bloqueio de variantes do logo (Principal, Horizontal, Ícone), **para** garantir fidelidade vetorial e proteção de ativos.
- **Critérios de Aceite:**
    - [x] Implementar objeto `LogoAsset` com `storagePath`, `format` e `svgRaw`.
    - [x] Suporte a 3 variantes: `primary`, `horizontal` e `icon`.
    - [x] Implementar flag `locked` global no `logoLock`.
    - [x] Criar lógica de sanitização de SVG para o campo `svgRaw`.
    - [x] Integrar com Firebase Storage para persistência física.
- **Responsável:** Darllyson (Dev)
- **Status:** ✅ Concluído

### US-7.3: Motor de Asset Whitelist (RAG Filter) 🛡️ ✅
**Como** motor de busca, **quero** filtrar os chunks recuperados do RAG para incluir apenas arquivos autorizados, **para** evitar alucinações baseadas em ativos não oficiais.
- **Critérios de Aceite:**
    - [x] Adicionar filtro `isApprovedForAI: true` nas queries de `brand_assets`.
    - [x] Validar status `ready` antes da injeção de contexto.
    - [x] Implementar log de auditoria simples para alterações de whitelist.
- **Responsável:** Monara (Integrator)
- **Status:** ✅ Concluído

### US-7.4: UI Dashboard do Brand Hub 🎨 ✅
**Como** usuário admin, **quero** uma interface intuitiva para configurar meu BrandKit e gerenciar meus logos bloqueados, **para** ter controle total sobre minha identidade visual no sistema.
- **Critérios de Aceite:**
    - [x] Criar novo componente `BrandHubDashboard` na rota `/brand-hub`.
    - [x] Adicionar seletores de cores (Color Picker) e visualização de tipografia.
    - [x] Interface para upload e "Locking" de logos com suporte a SVG.
    - [x] Implementar visualizador de logos com toggle Light/Dark mode.
- **Responsável:** Victor/Beto
- **Status:** ✅ Concluído

---

## 🛠️ Contratos Técnicos
- **Database**: Atualização da coleção `brands`.
- **RAG**: Filtros dinâmicos em `knowledge` collection.
- **Security**: Verificação de role para desbloqueio de logos.

---

## 🏁 Readiness Checklist (Leticia)
- [x] Arquivamento da Sprint 6 realizado.
- [x] Objetivo da Sprint 7 definido.
- [ ] PRD da Sprint 7 (Iuran) validado.
- [ ] Contratos de Schema (Athos) validados.

---
**Ação:** Time, foco total na US-7.1 para desbloquear as demais. Athos, por favor, valide o schema no Firestore.
