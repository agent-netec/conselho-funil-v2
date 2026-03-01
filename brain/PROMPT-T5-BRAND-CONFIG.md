# PROMPT — T5: Corrigir 3 GAPs de Brand Config

> Cole este prompt inteiro no agente que vai executar a tarefa.

---

## CONTEXTO

**Produto:** MKTHONEY — SaaS de marketing autônomo com IA.
**Stack:** Next.js 16.1.1, React 19, TypeScript, Firebase, Gemini AI.
**Diretório do app:** `app/` (root do Next.js — build: `cd app && npm run build`)

**Situação:** O sistema de brand config (cores, tipografia, AI config) está conectado parcialmente. Existem 3 GAPs onde configurações da marca são ignoradas pelos engines de IA. Estes GAPs fazem com que designs ignorem tipografia, chat ignore personalidade da IA, e 4 engines ignorem a temperatura/topP configurada pelo usuário.

---

## TIPO DE DADOS DISPONÍVEIS

### Brand Config Shape (já existe no Firestore e nos types):

```typescript
// app/src/types/database.ts — já definido, NÃO alterar
interface Brand {
  // ... outros campos ...
  brandKit?: {
    colors: { primary: string; secondary: string; accent: string; background: string };
    typography: {
      primaryFont: string;      // ex: "Geist Sans"
      secondaryFont: string;    // ex: "Geist Mono"
      systemFallback: 'serif' | 'sans-serif' | 'mono';
    };
    visualStyle: string;
    logoLock?: { locked: boolean; variants: { primary?: { url: string }; icon?: { url: string } } };
  };
  aiConfiguration?: {
    temperature: number;      // 0.1 a 1.0
    topP: number;             // 0.1 a 1.0
    profile: 'agressivo' | 'sobrio' | 'equilibrado' | 'criativo';
  };
}
```

---

## GAP-1: Tipografia não injetada em Design Generation

### Problema
Designs gerados pelo Gemini Vision não respeitam as fontes configuradas da marca. Cores e visual style são injetados, mas tipografia é ignorada.

### Arquivo: `app/src/app/api/design/generate/route.ts`

### O que existe hoje (aprox. linhas 119-138):
```typescript
if (brandData?.brandKit) {
  const kit = brandData.brandKit;
  brandColors = [kit.colors.primary, kit.colors.secondary, kit.colors.accent].filter(Boolean);
  visualStyle = kit.visualStyle || visualStyle;
  isLogoLocked = Boolean(kit.logoLock?.locked);
  // ... logo references ...
}
```

E no prompt (aprox. linhas 216-218):
```
Visual style: "${visualStyle}"
Palette: ${brandColors.join(', ') || 'n/a'}
```

### Fix:

**1. Extrair tipografia junto com cores (na seção de brandKit):**
```typescript
let brandTypography = '';

if (brandData?.brandKit) {
  const kit = brandData.brandKit;
  brandColors = [kit.colors.primary, kit.colors.secondary, kit.colors.accent].filter(Boolean);
  visualStyle = kit.visualStyle || visualStyle;
  isLogoLocked = Boolean(kit.logoLock?.locked);

  // GAP-1 fix: extract typography
  if (kit.typography?.primaryFont) {
    brandTypography = `Heading: ${kit.typography.primaryFont}, Body: ${kit.typography.secondaryFont || kit.typography.primaryFont}`;
  }
  // ... logo references (manter como está) ...
}
```

**2. Injetar no prompt (logo após Palette):**
```
Visual style: "${visualStyle}"
Palette: ${brandColors.join(', ') || 'n/a'}
${brandTypography ? `Typography: ${brandTypography}` : ''}
```

---

## GAP-2: AI Config não injetada no Chat

### Problema
Conselheiros de IA não sabem qual personalidade foi configurada para a marca. Se o usuário configurou "Agressivo", os conselheiros respondem "Equilibrado" por padrão.

### Arquivo: `app/src/lib/ai/formatters.ts`

### Função: `formatBrandContextForChat()`

### O que existe hoje (aprox. linhas 76-107):
A função monta um bloco markdown com: vertical, posicionamento, tom de voz, audiência, oferta, BrandKit (cores, tipografia, visual style, logo). Termina após o bloco de BrandKit.

### Fix:

**Adicionar bloco de AI Config DEPOIS do bloco de BrandKit, antes do `return context`:**

```typescript
  // GAP-2 fix: inject AI personality into chat context
  if (brand.aiConfiguration) {
    const profileLabels: Record<string, string> = {
      agressivo: 'Agressivo — direto, provocativo, urgente',
      sobrio: 'Sóbrio — formal, técnico, dados',
      equilibrado: 'Equilibrado — profissional com personalidade',
      criativo: 'Criativo — ousado, metáforas, storytelling',
    };
    const profileDesc = profileLabels[brand.aiConfiguration.profile] || 'Equilibrado';
    context += `\n#### Personalidade da IA
- **Perfil**: ${profileDesc}
- **Temperatura**: ${brand.aiConfiguration.temperature} (${brand.aiConfiguration.temperature >= 0.8 ? 'alta criatividade' : brand.aiConfiguration.temperature <= 0.4 ? 'conservador' : 'balanceado'})
`;
  }
```

**Efeito:** Agora quando o usuário pergunta algo ao MKTHONEY, o conselheiro sabe que a marca quer respostas "Agressivas" ou "Sóbrias" e adapta o tom.

---

## GAP-3: Temperature/TopP hardcoded em 4 engines

### Problema
4 API routes usam temperatura hardcoded em vez de ler `brand.aiConfiguration`. Isso invalida a configuração de personalidade feita pelo usuário.

### REGRA GERAL PARA TODOS OS FIXES:

```typescript
// Onde hoje tem:
temperature: 0.8,  // hardcoded

// Trocar por:
temperature: brand?.aiConfiguration?.temperature || 0.8,  // fallback mantém o valor original
topP: brand?.aiConfiguration?.topP || 0.95,
```

O fallback (`|| 0.8`) DEVE ser o mesmo valor que estava hardcoded antes, para manter o comportamento default igual.

---

### GAP-3A: Funnel Generation

**Arquivo:** `app/src/app/api/funnels/generate/route.ts`

**Localizar** (aprox. linhas 114-119):
```typescript
const response = await generateWithGemini(fullPrompt, {
  model: DEFAULT_GEMINI_MODEL,
  temperature: 0.8,
  maxOutputTokens: 16384,
  responseMimeType: 'application/json',
});
```

**Substituir por:**
```typescript
const response = await generateWithGemini(fullPrompt, {
  model: DEFAULT_GEMINI_MODEL,
  temperature: brand?.aiConfiguration?.temperature || 0.8,
  topP: brand?.aiConfiguration?.topP || 0.95,
  maxOutputTokens: 16384,
  responseMimeType: 'application/json',
});
```

**Nota:** `brand` já está carregado nesta rota (via `getBrand(funnel.brandId)`).

---

### GAP-3B: Social Hooks Generation

**Arquivo:** `app/src/app/api/social/hooks/route.ts`

**Localizar** (aprox. linhas 76-79):
```typescript
const response = await generateWithGemini(fullPrompt, {
  model: DEFAULT_GEMINI_MODEL,
  temperature: 0.85,
});
```

**Substituir por:**
```typescript
const response = await generateWithGemini(fullPrompt, {
  model: DEFAULT_GEMINI_MODEL,
  temperature: brand?.aiConfiguration?.temperature || 0.85,
  topP: brand?.aiConfiguration?.topP || 0.95,
});
```

**Nota:** `brand` já está carregado nesta rota (via `getBrand(brandId)`).

---

### GAP-3C: Copy Generation

**Arquivo:** `app/src/app/api/copy/generate/route.ts`

**Situação:** Gemini é chamado SEM `generationConfig`. O model.generateContent() usa defaults internos.

**Localizar** a chamada ao Gemini (aprox. linhas 262-266):
```typescript
const model = genAI.getGenerativeModel({ model: modelName });
const result = await model.generateContent(prompt);
```

**Substituir por:**
```typescript
const model = genAI.getGenerativeModel({
  model: modelName,
  generationConfig: {
    temperature: brand?.aiConfiguration?.temperature || 0.8,
    topP: brand?.aiConfiguration?.topP || 0.95,
  },
});
const result = await model.generateContent(prompt);
```

**Nota:** `brand` já está carregado nesta rota (via `getBrand(funnel.brandId)`).

---

### GAP-3D: Design Plan

**Arquivo:** `app/src/app/api/design/plan/route.ts`

**Localizar** (aprox. linhas 37-40):
```typescript
const model = genAI.getGenerativeModel({
  model: modelName,
  generationConfig: { responseMimeType: "application/json" }
});
```

**Substituir por:**
```typescript
const model = genAI.getGenerativeModel({
  model: modelName,
  generationConfig: {
    responseMimeType: "application/json",
    temperature: brand?.aiConfiguration?.temperature || 0.7,
    topP: brand?.aiConfiguration?.topP || 0.95,
  }
});
```

**Nota:** Verificar se `brand` já está carregado nesta rota. Se não estiver:
1. Verificar se o request body tem `brandId`
2. Se sim, importar `getBrand` e carregar: `const brand = brandId ? await getBrand(brandId) : null;`
3. Se não tem brandId no request, usar só os fallback defaults (não alterar nada)

---

### BÔNUS: Design Generate (temperature também)

**Arquivo:** `app/src/app/api/design/generate/route.ts`

**Localizar** a chamada ao Gemini com temperature hardcoded (procurar `temperature: 0.8` ou similar).

**Aplicar o mesmo padrão:**
```typescript
temperature: brandData?.aiConfiguration?.temperature || 0.8,
topP: brandData?.aiConfiguration?.topP || 0.95,
```

**Nota:** Neste arquivo a variável é `brandData` (não `brand`).

---

## BUSCA EXTRA: Outros engines com temperature hardcoded

Antes de finalizar, buscar TODOS os pontos com temperature hardcoded:

```bash
cd app && grep -rn "temperature:" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".next" | grep -v "aiConfiguration"
```

Para cada resultado que NÃO esteja lendo de `brand.aiConfiguration`, avaliar:
- Se a rota tem acesso a `brand` → aplicar o fix
- Se a rota NÃO tem acesso a `brand` → ignorar (provavelmente é um endpoint genérico)

---

## O QUE NÃO FAZER

1. **NÃO alterar** os types em `database.ts` ou `index.ts` — a shape já está correta
2. **NÃO alterar** a UI do wizard de brand config — é outra tarefa
3. **NÃO alterar** os valores fallback — eles DEVEM manter o mesmo valor que estava hardcoded antes
4. **NÃO alterar** a lógica de chat/RAG/embeddings — só o contexto e a temperature
5. **NÃO instalar** dependências
6. **NÃO alterar** lógica de credits, persistência ou billing

---

## ORDEM DE EXECUÇÃO

1. **GAP-2** (formatters.ts) — mais simples, adicionar bloco de texto
2. **GAP-1** (design/generate) — extrair typography, injetar no prompt
3. **GAP-3A** (funnels/generate) — trocar temperature hardcoded
4. **GAP-3B** (social/hooks) — trocar temperature hardcoded
5. **GAP-3C** (copy/generate) — adicionar generationConfig
6. **GAP-3D** (design/plan) — adicionar temperature ao generationConfig existente
7. **BÔNUS** (design/generate) — temperature do design gen
8. **Busca extra** — verificar se há outros engines afetados

---

## VERIFICAÇÃO

### Grep de resíduos:
```bash
cd app && grep -rn "temperature: 0\." src/app/api/ --include="*.ts" | grep -v node_modules | grep -v ".next" | grep -v "aiConfiguration"
```

**Deve retornar ZERO resultados** em routes que têm acesso a `brand`. Routes sem acesso a brand (endpoints genéricos) podem manter hardcoded.

### Build:
```bash
cd app && npm run build
```

### Checklist de aceitação T5:

- [ ] GAP-1: Design generation injeta tipografia no prompt quando configurada
- [ ] GAP-2: `formatBrandContextForChat()` inclui personalidade da IA
- [ ] GAP-3A: `funnels/generate` lê temperature/topP do brand
- [ ] GAP-3B: `social/hooks` lê temperature/topP do brand
- [ ] GAP-3C: `copy/generate` passa generationConfig com temperature/topP
- [ ] GAP-3D: `design/plan` inclui temperature/topP no generationConfig
- [ ] BÔNUS: `design/generate` lê temperature do brand
- [ ] Fallbacks mantêm os valores originais hardcoded
- [ ] Build passa: `cd app && npm run build`

---

## COMMIT

```
fix: wire brand config into all AI engines (GAP-1/2/3)

- GAP-1: Inject brand typography into design generation prompts
- GAP-2: Add AI personality (profile/temperature) to chat context
- GAP-3: Replace hardcoded temperature/topP in 5 engines with brand.aiConfiguration
  - funnels/generate, social/hooks, copy/generate, design/plan, design/generate
- All fallback defaults preserve original hardcoded values

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```
