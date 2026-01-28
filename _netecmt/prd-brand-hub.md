# PRD: Brand Hub & Logo Governance (E18) 🛡️

**Status:** 📝 DRAFT (Aguardando Aprovação de Arquitetura)  
**Épico:** E18  
**Versão:** 1.0  
**Data:** 2026-01-12  
**Autor:** Iuran (PM)

---

## 1. Visão Geral
O **Brand Hub** é o coração da identidade visual do "Conselho de Funil". Ele serve como a "Fonte Única da Verdade" (SSoT) para todos os ativos de marca, garantindo que o Conselho de Design, Copy e Ads operem com consistência absoluta, evitando alucinações visuais da IA.

## 2. Objetivos de Negócio
- **Consistência de Marca**: Impedir que a IA gere criativos com cores ou fontes fora do manual da marca.
- **Proteção de Ativos (Logo Lock)**: Garantir que logos oficiais não sejam modificadas ou "reinventadas" sem permissão.
- **Eficiência Operacional**: Centralizar em um único lugar tudo o que a IA precisa saber sobre a "cara" da marca.

## 3. Requisitos Funcionais

### 3.1 BrandKit Centralizado (Foundation)
- **Cores Oficiais**: Armazenamento de códigos HEX (Primary, Secondary, Accent, Background).
- **Tipografia**: Definição de fontes principais e secundárias (Tokens de sistema).
- **Estilo Visual**: Seletor de "Vibe" da marca (Minimalist, Aggressive, Luxury, Corporate, Modern).
- **Versionamento**: Histórico de alterações no BrandKit.

### 3.2 Logo Lock System 🔒
- **Armazenamento de Variantes**: Suporte para 3 arquivos (Logo Principal, Logo Secundária/Horizontal e Ícone/Favicon).
- **Trava de Segurança**: Flag `locked` que sinaliza ao motor de IA que aquele ativo é IMUTÁVEL.
- **Formatos Aceitos**: Prioridade absoluta para **SVG** (para manipulação vetorial segura) e fallback para PNG/WebP de alta resolução.

### 3.3 Asset Whitelist (Governança)
- **Biblioteca de Ativos Aprovados**: Galeria de imagens, fotos de produtos e ícones que a IA está "autorizada" a usar nos criativos.
- **Status de Aprovação**: Apenas arquivos com status `whitelisted` podem ser injetados no contexto de geração do NanoBanana.

### 3.4 Interface de Gerenciamento (UI/UX)
- **Página Brand Hub**: Nova rota `/brand-hub` ou expansão das configurações de marca.
- **Visualizador de Logo**: Preview em tempo real das logos sobre diferentes fundos (Claro/Escuro).
- **Color Picker**: Interface amigável para seleção e validação de cores da marca.

## 4. Requisitos Não-Funcionais
- **Performance**: O carregamento do contexto da marca não deve adicionar mais de 200ms ao tempo de resposta inicial da IA.
- **Segurança**: Apenas usuários com permissão de `Admin` da marca podem editar o BrandKit e o Logo Lock.
- **Escalabilidade**: Preparado para suportar múltiplas marcas por usuário (Multi-tenant).

## 5. Critérios de Aceite (Gerais)
1. O usuário deve conseguir salvar sua paleta de cores e tipografia.
2. Ao subir uma logo, o sistema deve marcar automaticamente como `Locked`.
3. O seletor global de marca deve atualizar instantaneamente o contexto visual do workspace.
4. Qualquer tentativa da IA de sugerir cores fora do BrandKit deve ser bloqueada ou alertada no QA.

---
*Documento gerado sob a metodologia NETECMT v2.0*
