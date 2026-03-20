# Sprint 06 — Design Studio Consolidation

> **Máxima:** Progressão Contínua — Zero Becos Sem Saída
> **Princípio:** UX First — 1 rota, zero duplicação
> **Bloqueado por:** Sprint 04 (namespace `/campaigns/[id]/design`)
> **Desbloqueia:** Nenhum (melhoria de qualidade)
> **Ref doc master:** Seção 13.0-13.12
> **Estimativa:** 5-7 dias

---

## Contexto

Design Studio é a feature mais completa do produto (6 fases implementadas). Mas tem 3 rotas duplicadas, framework C.H.A.P.E.U engessando outputs, plan sem campaign context, geração de 1 imagem (hardcoded), zero avaliação pós-geração, e upscale quebrado.

---

## Tarefa 06.1 — Consolidar 3 rotas → 1 componente

**Ref:** Seção 13.0 + 13.5

### DE (1620 linhas duplicadas):
```
/funnels/[id]/design/page.tsx  (682 linhas)
/design/page.tsx               (938 linhas)
/chat?mode=design              (dentro do chat)
```

### PARA:
```
/campaigns/[id]/design/page.tsx → renderiza <DesignWizard campaignId={id} />
```

### Arquivos:

| Arquivo | Ação |
|---|---|
| `app/src/components/design/design-wizard.tsx` | **CRIAR** — Componente unificado extraído das 2 páginas |
| `app/src/app/(app)/campaigns/[id]/design/page.tsx` | **CRIAR** — Wrapper que renderiza DesignWizard |
| `app/src/app/(app)/funnels/[id]/design/page.tsx` | **DELETAR** ou redirect |
| `app/src/app/(app)/design/page.tsx` | **DELETAR** ou redirect |

### `DesignWizard` recebe:
```tsx
interface DesignWizardProps {
  campaignId: string;
}

function DesignWizard({ campaignId }: DesignWizardProps) {
  const context = useCampaignContext(campaignId);
  // 4 etapas: Análise → Inputs → Planejamento → Geração
}
```

### Critérios de aceitação:
- [ ] 1 único componente `DesignWizard`
- [ ] Rota única: `/campaigns/[id]/design`
- [ ] Rotas antigas redirecionam
- [ ] Funcionalidade preservada (4 etapas do wizard)
- [ ] Zero código duplicado

---

## Tarefa 06.2 — Flexibilizar C.H.A.P.E.U

**Ref:** Seção 13.10

### Mudanças em 8 arquivos:

**1. `lib/ai/prompts/design.ts`:**
- Remover `CHAPEU_PROFILES` (4 perfis hardcoded)
- Remover `getChapeuProfilePrompt()`
- System prompt: "Considere hierarquia visual, atmosfera e ação desejada" (não "6 pilares RIGOROSO")

**2. `types/ads-design.ts`:**
- `strategy` block → opcional ou texto livre (não 5 campos obrigatórios)

**3. `types/design-system.ts`:**
- `chapeuProfile: string` → `artDirection?: string` (opcional)

**4. `lib/ai/prompts/design-brain-context.ts`:**
- Manter brain loading, remover enforcement "RIGOROSO"

**5. `api/design/plan/route.ts`:**
- Remover bloco "INSTRUÇÕES C.H.A.P.E.U — RIGOROSO"
- Substituir por: "Aplique princípios de direção de arte adequados ao formato e objetivo."

**6. `data/identity-cards/design_director.md`:**
- Princípios continuam, nome muda, tom menos prescritivo

**7. `components/design/analysis-result.tsx`:**
- Label "C.H.A.P.E.U" → remover ou "Direção de Arte"

**8. `components/chat/design-generation-card.tsx`:**
- Label "C.H.A.P.E.U" → "Estratégia Visual"

### Regra nova:
"Princípios de arte **informam**, preferências do usuário **decidem**."

### Critérios de aceitação:
- [ ] Nenhuma referência a "C.H.A.P.E.U" na UI
- [ ] Nenhuma referência a "RIGOROSO" nos prompts
- [ ] Outputs mais variados (não sempre o mesmo padrão)
- [ ] Strategy block não é obrigatório no schema
- [ ] Build passa

---

## Tarefa 06.3 — Plan carrega Campaign Context

**Ref:** Seção 13.2

### Problema:
`/api/design/plan` não chama `loadCampaignContext()`. Prompts visuais planejados sem Big Idea, hooks, tom de copy, awareness.

### Fix:
```typescript
// Em api/design/plan/route.ts:
const campaignContext = campaignId ? await loadCampaignContext(campaignId) : null;

// Injetar no prompt:
if (campaignContext) {
  prompt += `\n## CONTEXTO DA CAMPANHA
- Big Idea: ${campaignContext.stages.copy?.bigIdea || 'não definida'}
- Awareness: ${campaignContext.funnel.awareness || 'não definido'}
- Tom: ${campaignContext.stages.copy?.tone || campaignContext.brand.tone || 'não definido'}
- Hooks aprovados: ${campaignContext.stages.social?.hooks?.filter(h => h.approved).map(h => h.text).join(', ') || 'nenhum'}
- Público: ${campaignContext.funnel.targetAudience}
`;
}
```

### Critérios de aceitação:
- [ ] `/api/design/plan` carrega campaign context
- [ ] Prompts visuais incluem Big Idea, awareness, hooks, tom
- [ ] Dados reais do manifesto têm prioridade sobre inputs do frontend
- [ ] Fallback funciona quando não há campanha

---

## Tarefa 06.4 — Gerar 2 variações (não 1)

**Ref:** Seção 13.1

### Problema:
`isSingleGeneration = true` hardcoded. Usuário gasta 5 créditos e recebe 1 imagem.

### Solução:
- Gerar 2 variações por prompt (não 3, evita timeout)
- Se timeout persistir, gerar sequencialmente com progress indicator
- Custo permanece 5 créditos
- Escolha alimenta sistema de preferências

```typescript
// Em api/design/generate/route.ts:
const isSingleGeneration = false; // ERA true

// Se sequential (fallback timeout):
const results = [];
for (let i = 0; i < 2; i++) {
  const result = await generateImage(prompt, { variation: i + 1 });
  results.push(result);
  // Enviar progress via SSE ou polling
}
```

### Critérios de aceitação:
- [ ] 2 imagens geradas por geração
- [ ] Custo: 5 créditos (não 10)
- [ ] Se timeout em 1: mostra a que conseguiu + botão "Gerar mais 1"
- [ ] UI mostra 2 cards lado a lado para comparação
- [ ] "Escolher" alimenta preferências

---

## Tarefa 06.5 — Avaliação pós-geração (opt-in)

**Ref:** Seção 13.3

### Botão "Avaliar com o Director" em cada imagem gerada:

```typescript
// POST /api/design/evaluate
// Body: { imageUrl, prompt, campaignId, brandId }
// Usa Gemini Vision (Flash model, custo ~0)
// Frameworks do brain: visual_impact_score + chapeu_compliance
// Retorna: score 0-100 + feedback específico

const evaluation = await generateWithGemini(evaluationPrompt, {
  model: DEFAULT_GEMINI_MODEL, // Flash, barato
  image: imageUrl,
});
```

### UI:
```tsx
function DesignEvaluation({ score, feedback }: Props) {
  return (
    <div className="border rounded-lg p-3 mt-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">{score}</span>
        <span className="text-sm text-muted">/100</span>
      </div>
      <p className="text-sm mt-1">{feedback}</p>
    </div>
  );
}
```

**Custo:** 0 créditos (informacional, Flash model)

### Critérios de aceitação:
- [ ] Botão "Avaliar com o Director" em cada imagem
- [ ] Score 0-100 retornado
- [ ] Feedback específico (não genérico)
- [ ] Custo: 0 créditos
- [ ] Opt-in (não automático)

---

## Tarefa 06.6 — Director: 2-3 abordagens na análise

**Ref:** Seção 13.4

### Na etapa 1 (análise), ao invés de 1 recomendação:

```
O Director apresenta 2-3 abordagens diferentes:

🎬 Abordagem Editorial
Cenário lifestyle, luz natural, storytelling visual.
"Para tráfego frio que não conhece o produto, precisamos criar conexão emocional antes do CTA."

📈 Abordagem Conversão
Produto em destaque, CTA bold, urgência.
"Para tráfego quente (product_aware), podemos ir direto ao ponto com oferta visual clara."

✨ Abordagem Minimalista
Fundo limpo, tipografia protagonista.
"Quando o texto é forte (copy aprovada tem hook 93/100), o visual apoia, não compete."
```

Usuário escolhe → direcionamento para etapas 2-4.

### Critérios de aceitação:
- [ ] Análise apresenta 2-3 abordagens
- [ ] Cada abordagem tem justificativa contextual
- [ ] Escolha do usuário direciona prompts
- [ ] Baseado no awareness e campaign context

---

## Tarefa 06.7 — Remover Upscale quebrado + texto na imagem

**Ref:** Seções 13.6 e 13.7

### Upscale:
- Remover botão "Upscale HD" da UI
- Handler vazio/quebrado → não mostrar feature que não funciona

### Texto na imagem:
- Gerar imagem SEM texto embutido
- Remover instrução de `copyHeadline` no prompt de imagem
- Entregar texto formatado separadamente como overlay no card
- Nota: "Adicione o texto no seu editor (Canva, Figma)"

### Critérios de aceitação:
- [ ] Botão "Upscale HD" removido
- [ ] Imagens geradas sem texto embutido (menos erros)
- [ ] Copy mostrada como texto separado no card
- [ ] Nota sobre editor externo

---

## Check de Progressão Contínua

```
Campanha com copy aprovada
  ↓ Navega para Design (stepper, 1 click)
  ↓ Director analisa contexto automaticamente
  ↓ 2-3 abordagens com justificativa
  ↓ Escolhe abordagem
  ↓ Seleciona personagens + inspirações
  ↓ Gera: 2 variações para comparar
  ↓ "Avaliar com o Director" → score + feedback
  ↓ Escolhe favorita → alimenta preferências
  ↓ PRÓXIMO PASSO: "Avançar para Ads →" ou "Revisar no Launch Pad →"
```
