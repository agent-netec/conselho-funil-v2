# Story Pack: Ads Design Engine Overhaul
ID: ST-11.9 & ST-11.10

## 🎯 Visão Geral
Esta entrega redefine como o Conselho de Funil gera criativos e anúncios. Saímos de um modelo genérico de "Imagem + Texto" para um motor especializado em multi-formatos (Meta, Google, LinkedIn) que respeita as travas técnicas de cada plataforma e utiliza o framework C.H.A.P.E.U de design estratégico.

---

## 🧩 ST-11.9: Contract Refactor (Multi-Format Design)

### Distilled Requirements
Refatorar o contrato de saída do `NANOBANANA_PROMPT` para suportar especificidades de plataformas de anúncios, garantindo que a IA gere metadados precisos (Headlines, Textos, Descrições) além do prompt da imagem.

### Acceptance Criteria
- [ ] O contrato JSON deve incluir o campo `platform` (meta | google | linkedin | universal).
- [ ] Implementar campos de texto específicos por plataforma:
    - **Meta**: `primaryText`, `headline`, `description`.
    - **Google**: `headlines` (array), `descriptions` (array).
    - **LinkedIn**: `introductoryText`, `headline`.
- [ ] Adicionar campo `safeZones` indicando se o design é para `feed`, `stories/reels` ou `search`.
- [ ] Validar limites de caracteres no prompt do sistema para evitar truncamento nas plataformas.

### Technical Snippets
Novo formato esperado do `[NANOBANANA_PROMPT]`:
```json
{
  "platform": "meta",
  "format": "square",
  "safeZone": "feed",
  "assets": {
    "primaryText": "Texto persuasivo de 125 caracteres...",
    "headline": "Título chamativo de 40 caracteres...",
    "description": "Descrição auxiliar de 30 caracteres..."
  },
  "visualPrompt": "Prompt detalhado para Midjourney/DALL-E...",
  "aspectRatio": "1:1",
  "brandContext": { "colors": ["#HEX"], "style": "Minimalist" }
}
```

---

## 🌀 ST-11.10: Engine (Prompt Builder Modular)

### Distilled Requirements
Implementar a lógica modular de construção de prompts no NanoBanana, permitindo que a IA "monte" seu comportamento baseando-se na intenção do usuário e no conhecimento dos especialistas de Ads (Justin Brooke, Nicholas Kusmich).

### AI Behavior (Comportamento da IA)
Ao receber um comando de Ads, a IA deve se comportar seguindo estas fases:

1. **Fase de Identificação (Intent Mapping)**:
   - Detectar a plataforma solicitada. Se não houver, assumir `universal`.
   - Identificar o objetivo: Direto (Venda), Indireto (Engajamento), Branding.

2. **Fase de Injeção de Sabedoria (Knowledge Injection)**:
   - Ativar o framework **C.H.A.P.E.U** (Contraste, Hierarquia, Antropomorfismo, Proximidade, Equilíbrio, Unidade).
   - Aplicar a "Voz do Especialista":
     - **Meta**: Foco em interrupção de padrão (Pattern Interrupt) e "Hook".
     - **Google**: Foco em intenção clara e relevância de busca.
     - **LinkedIn**: Foco em autoridade e contexto profissional.

3. **Fase de Geração (Multi-Variant Generation)**:
   - Gerar 3 variações baseadas em ângulos diferentes (ex: Prova Social, Dor/Problema, Benefício Direto).
   - Cada variação deve obrigatoriamente seguir o contrato refatorado na ST-11.9.

### Acceptance Criteria
- [ ] O sistema deve ser capaz de concatenar blocos de prompt dinamicamente (Base + Platform + Brand + Specialist).
- [ ] A IA deve recusar gerar anúncios que violem políticas básicas de Ads (ex: promessas irreais, conteúdo proibido) se detectado.
- [ ] O output deve conter a explicação estratégica baseada no framework C.H.A.P.E.U.

### Technical Requirements
- Integração com o namespace `knowledge` no Pinecone para recuperar insights de Justin Brooke/Nicholas Kusmich durante a montagem do prompt.
- Uso do modelo `gemini-2.0-flash` para garantir baixa latência na montagem modular.

---

**Assinado:** Iuran (PM)
**Data:** 16/01/2026
