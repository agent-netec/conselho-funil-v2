# Sprint 05 — Chat Transformation (Conselheiros com Vida)

> **Status:** 🟢 COMPLETO
> **Máxima:** Progressão Contínua — Zero Becos Sem Saída
> **Princípio:** UX First + Diferencial do produto
> **Bloqueado por:** Sprint 04 (Design/Ads saem do chat)
> **Desbloqueia:** Nenhum (pode ser último sprint de UX)
> **Ref doc master:** Seção 14.1-14.12

---

## Contexto

Os 23 conselheiros são o diferencial #1 do MKTHONEY. Mas hoje falam com voz genérica idêntica, sem personalidade visual, sem follow-ups, sem routing inteligente. É como ter 23 atores vestindo a mesma roupa. O Chat também virou "lixeira de features" com 7 modos, e contexto passa por query params frágeis.

**Meta:** Conselheiros com personalidade real, 3 modos limpos, zero query params, follow-ups acionáveis.

---

## Tarefa 05.1 — Simplificar para 3 modos core

**Arquivo:** `app/src/app/(app)/chat/page.tsx`
**Arquivo:** `app/src/app/api/chat/route.ts`
**Ref:** Seção 14.1

### DE (7 modos):
`general`, `funnel`, `copy`, `social`, `design`, `ads`, `party`

### PARA (3 modos):
| Modo | Descrição | Tier |
|------|-----------|------|
| **Geral** | Conversa aberta com qualquer conselheiro | Todos |
| **Campanha** | Contextualizado na campanha ativa (substitui funnel/copy/social) | Starter+ |
| **Party** | Debate formal entre experts selecionados | Pro |

### O que muda:
- `design` e `ads` saem do chat → têm páginas próprias (Sprint 04/06)
- `funnel`, `copy`, `social` consolidam em `campanha` (contexto da campanha ativa)
- UI do seletor: 3 botões/tabs, não dropdown de 7 opções

### No API route:
```typescript
// mode: 'general' | 'campaign' | 'party'
if (mode === 'campaign') {
  // Carrega CampaignContext completo (tarefa 04.2)
  const ctx = await loadCampaignContext(campaignId);
  // Injeta no system prompt
}
```

### Critérios de aceitação:
- [x] 3 modos na UI (Geral, Campanha, Party)
- [x] Design/Ads removidos como modos do chat
- [x] Modo Campanha carrega contexto completo
- [x] Funnel/Copy/Social como modos separados não existem mais

---

## Tarefa 05.2 — Contexto sem query params

**Arquivo:** `app/src/app/(app)/chat/page.tsx`
**Ref:** Seção 14.2

### Hoje:
`/chat?id=xxx&funnelId=xxx&campaignId=xxx&mode=design&from=campaigns`

### Depois:
- Chat geral: `/chat` — contexto do brand ativo via `useActiveBrand()`
- Chat de campanha: `/campaigns/[id]/chat` ou `/chat?campaign=[id]` (apenas 1 param)
- Party: `/chat?mode=party`

### Implementação:
```typescript
// Contexto vem de 2 fontes, ambas confiáveis:
// 1. Brand ativo (hook React, persistido em localStorage/context)
// 2. Campaign ID da URL (quando em modo campanha)

// NUNCA de: funnelId, mode como proxy de contexto, from
```

### Critérios de aceitação:
- [x] Chat funciona sem query params (modo geral)
- [x] Modo campanha aceita 1 param (campaignId)
- [x] `funnelId`, `mode`, `from` não são necessários
- [x] Navegação entre páginas não perde contexto

---

## Tarefa 05.3 — Eixo 1: Voz Individual por Conselheiro

**Arquivo:** `app/src/app/api/chat/route.ts`
**Arquivo:** `app/src/lib/ai/prompts/chat-system.ts`
**Arquivo:** `app/src/lib/intelligence/brains/prompt-builder.ts`
**Arquivo:** `app/src/data/identity-cards/*.md`
**Ref:** Seção 14.11, Eixo 1

### Hoje:
System prompt genérico por conselho (Funnel Council, Copy Council, etc.). Resposta assinada por "o conselho", não por 1 conselheiro.

### Depois:
Quando o sistema identifica o conselheiro mais relevante (via RAG + tema da pergunta):
1. Usa Identity Card COMPLETO como system prompt
2. Instrução: "Você É [Nome]. Responda como essa pessoa falaria."
3. Output assinado por 1 conselheiro, não "o conselho"

### Implementação:

**Seleção do conselheiro primário:**
```typescript
// No chat route:
const relevantCounselor = await selectPrimaryCounselor(message, brandContext);
// Baseado em: tema da mensagem, keywords, modo, campanha stage

const identityCard = loadFullIdentityCard(relevantCounselor.id);
const systemPrompt = buildIndividualPrompt(identityCard, brandContext, campaignContext);
```

**System prompt individual:**
```
Você é ${counselor.name} — ${counselor.subtitle}.

## Sua Identidade
${counselor.philosophy}

## Seus Princípios
${counselor.principles}

## Sua Voz
- Tom: ${counselor.voice.tone}
- Estilo: ${counselor.voice.style}
- Frases típicas: ${counselor.voice.catchphrases.join(', ')}
- Formatação: ${counselor.voice.formatting}

## Como Você Responde
- Use SEU tom e SUAS expressões
- Cite seus próprios conceitos e frameworks
- Dê exemplos do seu repertório
- NUNCA fale como narrador genérico — fale como VOCÊ

## Contexto do Usuário
[Brand context + Campaign context]
```

**Enriquecer identity cards:**
Cada `.md` precisa de seção `voice` com:
- `tone`: professoral / agressivo / elegante / energético / etc.
- `style`: parágrafos longos / frases curtas / bullet points / etc.
- `catchphrases`: 3-5 frases típicas
- `formatting`: como organiza a resposta
- `examples`: 2-3 exemplos de como falaria

### Critérios de aceitação:
- [x] Resposta assinada por 1 conselheiro (foto + nome no header)
- [x] Tom visivelmente diferente entre Schwartz e Halbert
- [x] Catchphrases e estilo individual aparecem nas respostas
- [x] Contexto da marca/campanha presente na resposta

---

## Tarefa 05.4 — Eixo 2: Identidade Visual por Conselheiro

**Arquivo:** `app/src/components/chat/chat-message-bubble.tsx`
**Ref:** Seção 14.11, Eixo 2

### Cada resposta de conselheiro tem:

```tsx
function CounselorMessage({ counselor, content, followUps }: Props) {
  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <Avatar src={counselor.avatarUrl} fallback={counselor.initials} />

      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold">{counselor.name}</span>
          <Badge variant="outline" className="text-xs">
            {counselor.specialty}
          </Badge>
        </div>

        {/* Conteúdo com formatação rica */}
        <div className="prose prose-sm">
          <Markdown>{content}</Markdown>
        </div>

        {/* Follow-ups (Eixo 4) */}
        <FollowUpSuggestions suggestions={followUps} />
      </div>
    </div>
  );
}
```

### Assets necessários:
- 23 ilustrações/fotos estilizadas de conselheiros
- Fallback: iniciais + cor accent do conselho
- Badge de especialidade por conselheiro

### Dados por conselheiro:
```typescript
const COUNSELOR_METADATA = {
  eugene_schwartz: {
    name: 'Eugene Schwartz',
    avatarUrl: '/counselors/schwartz.webp',
    initials: 'ES',
    specialty: '🎯 Níveis de Consciência',
    accentColor: '#6366F1', // Roxo - Funnel Council
  },
  gary_halbert: {
    name: 'Gary Halbert',
    avatarUrl: '/counselors/halbert.webp',
    initials: 'GH',
    specialty: '📝 Headlines & Copy Direta',
    accentColor: '#F59E0B', // Amber - Copy Council
  },
  // ... 21 mais
};
```

### Critérios de aceitação:
- [x] Cada resposta tem avatar + nome + badge de especialidade
- [x] Visual diferenciado por conselheiro
- [x] Fallback funciona sem assets (iniciais + cor)
- [x] Formatação rica no conteúdo (negrito, emojis estratégicos, espaçamento)

---

## Tarefa 05.5 — Eixo 3: Formatação Rica

**Arquivo:** `app/src/app/api/chat/route.ts` (instrução no prompt)
**Arquivo:** `app/src/components/chat/chat-message-bubble.tsx` (renderização)
**Ref:** Seção 14.11, Eixo 3

### Instruções no system prompt:

```
## Formatação
- Use **negrito** para conceitos-chave e ações
- Use emojis estratégicos: 🎯 ação, ⚠️ alerta, 💡 insight, 📊 dado, ✅ aprovação
- Separe seções com espaçamento generoso
- Use > quotes quando referenciar outro conselheiro
- Use bullet points para listas
- Máximo 3-4 parágrafos por resposta (não ensaio)
- Finalize com 2-3 sugestões de follow-up entre [FOLLOW_UP]...[/FOLLOW_UP]
```

### Parser de follow-ups:
```typescript
function parseFollowUps(content: string): { cleanContent: string; followUps: string[] } {
  const followUpRegex = /\[FOLLOW_UP\](.*?)\[\/FOLLOW_UP\]/gs;
  const followUps: string[] = [];
  let match;
  while ((match = followUpRegex.exec(content))) {
    followUps.push(match[1].trim());
  }
  const cleanContent = content.replace(followUpRegex, '').trim();
  return { cleanContent, followUps };
}
```

### Critérios de aceitação:
- [x] Respostas usam negrito, emojis, espaçamento
- [x] Markdown renderizado corretamente
- [x] Follow-ups parseados e renderizados como botões

---

## Tarefa 05.6 — Eixo 4: Sugestões de Follow-up

**Arquivo:** `app/src/components/chat/follow-up-suggestions.tsx` (**CRIAR**)
**Ref:** Seção 14.11, Eixo 4

### Toda resposta termina com 2-3 botões clicáveis:

```tsx
function FollowUpSuggestions({ suggestions, onSelect }: Props) {
  if (!suggestions.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
      {suggestions.map((suggestion, i) => (
        <button
          key={i}
          onClick={() => onSelect(suggestion)}
          className="text-sm px-3 py-1.5 rounded-full border hover:bg-accent transition"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
```

**Tipos de follow-up:**
1. Aprofundamento: "Explique mais sobre [conceito mencionado]"
2. Aplicação: "Como aplico isso na minha campanha?"
3. Cross-referência: "💬 Quer ouvir o [outro conselheiro] sobre [tema relacionado]?"

### Critérios de aceitação:
- [x] 2-3 botões de follow-up em cada resposta
- [x] Click envia a sugestão como próxima mensagem
- [x] Cross-referência menciona outro conselheiro pelo nome
- [x] Sugestões são contextuais (não genéricas)

---

## Tarefa 05.7 — Eixo 5: Routing Inteligente

**Arquivo:** `app/src/app/api/chat/route.ts`
**Ref:** Seção 14.11, Eixo 5

### Quando o tema cruza domínios:

```typescript
// Após gerar resposta do conselheiro primário, analisar:
const crossDomainSuggestion = detectCrossDomain(message, primaryCounselor);

if (crossDomainSuggestion) {
  // Adicionar ao final da resposta:
  // "💡 Esse tema cruza com [domínio]. Quer ouvir [conselheiro X] sobre [aspecto]?"
  // Botão que inicia nova mensagem com o conselheiro sugerido
}
```

**Regras de routing:**
| Se o tema menciona... | Sugerir... |
|---|---|
| Copy + Ads | Kusmich (Meta Ads targeting) |
| Copy + Social | Rachel Karten (hooks para Instagram) |
| Funil + Design | Design Director (visual do funil) |
| Oferta + Copy | Dan Kennedy (oferta irresistível) |
| Público + Research | Schwartz (awareness levels) |

### Critérios de aceitação:
- [x] Sistema sugere conselheiro complementar quando tema cruza domínios
- [x] Sugestão é contextual (não aleatória)
- [x] Click ativa o conselheiro sugerido

---

## Tarefa 05.8 — Eixo 6: Card de Apresentação (primeira vez)

**Arquivo:** `app/src/components/chat/counselor-card.tsx` (**CRIAR**)
**Ref:** Seção 14.11, Eixo 6

### Na primeira vez que cada conselheiro fala ao usuário:

```tsx
function CounselorIntroCard({ counselor }: Props) {
  return (
    <div className="bg-card border rounded-lg p-4 mb-4">
      <div className="flex items-center gap-3">
        <Avatar src={counselor.avatarUrl} size="lg" />
        <div>
          <h4 className="font-bold">{counselor.name}</h4>
          <p className="text-xs text-muted">{counselor.dates}</p>
        </div>
      </div>
      <p className="text-sm mt-2">{counselor.bio}</p>
      <div className="mt-2">
        <span className="text-xs font-medium">Por que ouvir:</span>
        <p className="text-sm">{counselor.whyListen}</p>
      </div>
      <Badge className="mt-2">{counselor.specialty}</Badge>
    </div>
  );
}
```

**Tracking:** Salvar `seenCounselors: string[]` no user doc ou localStorage. Mostrar card uma vez por conselheiro.

### Critérios de aceitação:
- [x] Card de apresentação aparece na primeira interação com cada conselheiro
- [x] Bio é "por que ouvir" (não Wikipedia)
- [x] Aparece uma vez, depois só foto + nome + badge
- [x] 23 bios escritas

---

## Tarefa 05.9 — Smart Suggestions (conselheiros recomendados)

**Ref:** Seção 14.3

### Hoje: Grid de 23 cards para Party Mode. 3 combos pré-montados.

### Depois:
- Sistema recomenda 2-3 conselheiros baseado no contexto
- Combos expandidos por objetivo

```typescript
const SMART_COMBOS = {
  'Quero lançar produto': ['russell_brunson', 'jeff_walker', 'dan_kennedy'],
  'Quero escalar tráfego': ['nicholas_kusmich', 'rachel_karten', 'gary_vee'],
  'Quero criar conteúdo viral': ['rachel_karten', 'nikita_beer', 'justin_welsh'],
  'Quero melhorar minha oferta': ['dan_kennedy', 'russell_brunson', 'alex_hormozi'],
  'Quero escrever copy que vende': ['gary_halbert', 'eugene_schwartz', 'joe_sugarman'],
  // ... mais combos
};
```

### Na tela de Party Mode:
```
"Baseado na sua campanha de [objetivo] para [público]:
 Recomendamos: Schwartz (consciência) + Halbert (headline) + Brunson (funil)
 [Usar recomendação] ou [Escolher manualmente]"
```

### Critérios de aceitação:
- [x] Recomendação contextual no Party Mode
- [x] 8+ combos pré-montados por objetivo
- [x] Botão "Usar recomendação" (1 click)
- [x] Opção de escolher manualmente (mantém grid atual)

---

## Tarefa 05.10 — Conversas agrupadas por marca/campanha

**Ref:** Seção 14.8

### Hoje: Lista plana por data na sidebar do chat.

### Depois:
- Conversas agrupadas automaticamente:
  - Por marca (quando tem brand context)
  - Por campanha (quando vinculadas a campanha)
  - Gerais (sem vínculo)
- Busca por conteúdo

### Critérios de aceitação:
- [x] Sidebar agrupa conversas por marca
- [x] Conversas de campanha aparecem sob a campanha
- [ ] Busca funciona
- [x] < 5 conversas: lista plana (sem agrupamento desnecessário)

---

## Tarefa 05.11 — Party Mode: 2 créditos

**Ref:** Seção 14.4

### Mudar custo do Party Mode de 1 para 2 créditos.

**Arquivo:** Route do chat ou `consumeCredits` call.

### Critérios de aceitação:
- [x] Party Mode consome 2 créditos
- [x] Chat normal consome 1 crédito
- [x] Badge de custo visível antes de enviar ("Este debate custa 2 créditos")

---

## Check de Progressão Contínua (Máxima do Projeto)

Após Sprint 05:

```
Usuário abre Chat
  ↓ Escolhe modo: Geral, Campanha ou Party
  ↓ Digita pergunta
  ↓ AHA: Resposta de UM conselheiro com personalidade, foto, badge
  ↓ Formatação rica (negrito, emojis, espaçamento)
  ↓ FOLLOW-UPS: 2-3 botões clicáveis para continuar
  ↓ CROSS-REFERENCE: "Quer ouvir [outro conselheiro]?" (se tema cruza)
  ↓ PRÓXIMO PASSO: Sempre tem para onde ir
```

```
Primeira vez com conselheiro
  ↓ Card de apresentação: quem é, por que ouvir
  ↓ CONTEXTO: "Especialista em [área]"
  ↓ Depois: só foto + nome (não repete)
```

**Zero becos sem saída:**
- Resposta → follow-ups → mais profundidade
- Tema cruza domínios → routing para outro conselheiro
- Party Mode → combos recomendados (não precisa conhecer 23 pessoas)
- Conversa → agrupada por marca/campanha (acha depois)
