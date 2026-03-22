# Sprint 03 — Brands P0 (Maior Impacto no Usuário)

> **Status:** 🟢 COMPLETO
> **Máxima:** Progressão Contínua — Zero Becos Sem Saída
> **Princípio:** UX First — Max 2 cliques
> **Bloqueado por:** Nada (paralelo ao Sprint 00)
> **Desbloqueia:** Sprint 07 (Brand Intelligence Layer), Sprint 08 (Dashboard/Onboarding)
> **Ref doc master:** Seção "Brands: Reestruturação Completa (P0)"
> **PRIORIDADE:** P0 — é onde CADA usuário passa primeiro. UX quebrada aqui = churn imediato.

---

## Contexto

Brands é a feature com maior impacto na experiência. Todo usuário começa aqui. Hoje:
- 4+ caminhos para editar uma marca, nenhum completo
- Wizard de criação (7 steps) vs edição (3 steps) vs Brand Hub (tab escondida)
- Inputs de cores e tipografia não renderizavam (fix parcial aplicado)
- Dropdowns limitados (9 verticais, sem "Outro")
- Awareness é select técnico (Schwartz) que 99% dos usuários não entende
- Checklist cobra items impossíveis de completar
- Features órfãs (Projetos, Voice Profile Editor)

**Meta:** Uma única página de edição, onboarding simplificado, awareness por perguntas simples, dropdowns livres.

---

## Tarefa 03.1 — Página única de edição de marca

**Substituir:** Wizard de criação + Brand Hub + tab Visão Geral + tab Contexto RAG
**Criar:** Uma página `/brands/[id]/edit` com seções colapsáveis

### Seções da página única:

| Seção | Campos | Collapsible | Obrigatório |
|---|---|---|---|
| **Identidade** | Nome, vertical (autocomplete+livre), posicionamento, tom | Sim | Nome + vertical |
| **Audiência** | Quem, dor (top 3), awareness (3 perguntas → auto), objeções (sugestões IA) | Sim | Quem + 1 dor |
| **Oferta** | O que vende, ticket (número), tipo (chips+"outro"), diferencial | Sim | O que + ticket |
| **Visual** | Cores (picker+hex+preview+paletas sugeridas), estilo visual | Sim | Não |
| **Tipografia** | Headline, body, fallback (catálogo visual com preview) | Sim | Não |
| **Logo** | Upload, variantes, lock | Sim | Não |
| **Voz** | Tom, vocabulário preferido, proibidos, frases exemplo | Sim | Não |
| **Personagens** | Ambassador, founder, mascot (cards com foto) | Sim | Não |
| **IA** | Preset, temperatura, topP | Sim (default oculto) | Não |
| **Documentos** | Upload PDFs/URLs, lista de assets, aprovação IA (default=true) | Sim | Não |

### Arquivos a criar/modificar:

| Arquivo | Ação |
|---|---|
| `app/src/app/(app)/brands/[id]/edit/page.tsx` | **CRIAR** — Página única com todas as seções |
| `app/src/components/brands/brand-identity-section.tsx` | **CRIAR** — Seção Identidade |
| `app/src/components/brands/brand-audience-section.tsx` | **CRIAR** — Seção Audiência (com awareness simplificado) |
| `app/src/components/brands/brand-offer-section.tsx` | **CRIAR** — Seção Oferta |
| `app/src/components/brands/brand-visual-section.tsx` | **CRIAR** — Seção Visual (cores + estilo) |
| `app/src/components/brands/brand-typography-section.tsx` | **CRIAR** — Seção Tipografia |
| `app/src/components/brands/brand-voice-section.tsx` | **CRIAR** — Seção Voz (integrar Voice Profile Editor órfão) |
| `app/src/components/brands/brand-documents-section.tsx` | **CRIAR** — Seção Docs (absorve tab Contexto RAG) |
| `app/src/components/brands/brand-kit-form.tsx` | **MODIFICAR** — Reutilizar partes em seções novas |
| `app/src/app/(app)/brands/[id]/page.tsx` | **MODIFICAR** — Redirecionar para `/edit` |

### Padrão de cada seção:

```tsx
function BrandIdentitySection({ brand, onUpdate }: SectionProps) {
  const [isOpen, setIsOpen] = useState(true); // Obrigatórias abertas por default
  const [isDirty, setIsDirty] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4">
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          <h3>Identidade</h3>
          {brand.name && <CheckCircle className="h-4 w-4 text-green-500" />}
        </div>
        <ChevronDown className={cn("transition-transform", isOpen && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4 space-y-4">
        {/* Campos */}
      </CollapsibleContent>
    </Collapsible>
  );
}
```

### Auto-save:
- Debounce de 2s após última edição
- Indicador "Salvando..." / "✅ Salvo"
- Sem botão "Salvar" manual (save automático por seção)

### Critérios de aceitação:
- [x] Página `/brands/[id]/edit` mostra todas as 10 seções
- [x] Seções colapsáveis com indicador de completude (✅ / ⚪)
- [x] Auto-save com debounce funciona (useBrandAutoSave hook, 2s debounce)
- [x] Todos os campos existentes estão presentes (nada perdido)
- [x] Seção Visual: color picker + hex + preview funcionam
- [x] Seção Tipografia: catálogo com preview ao vivo
- [x] Seção Documentos: upload inline funciona
- [x] Tab "Contexto RAG" removida (brand detail usa overview cards, sem tabs duplicadas). Assets page mantida com link "Gerenciar" na edit page

---

## Tarefa 03.2 — Vertical: Autocomplete + Texto Livre

**Ref:** Seção Brands P0 — "Dropdowns limitados"

### Problema:
Hoje: 9 opções fixas (SaaS, Infoprodutos, E-commerce...). Faltam dezenas. O sistema NÃO muda comportamento baseado no vertical — é só texto no prompt.

### Solução:

**Componente autocomplete com sugestões + texto livre:**

```tsx
function VerticalSelector({ value, onChange }: Props) {
  const suggestions = [
    // Agrupados por categoria
    { group: 'Digital', items: ['SaaS', 'Infoprodutos', 'E-commerce', 'App/Mobile', 'Marketplace'] },
    { group: 'Serviços', items: ['Consultoria', 'Agência', 'Freelancer', 'Advocacia', 'Contabilidade'] },
    { group: 'Saúde & Bem-estar', items: ['Saúde', 'Fitness', 'Nutrição', 'Estética', 'Psicologia'] },
    { group: 'Lifestyle', items: ['Moda', 'Beleza', 'Gastronomia', 'Viagens', 'Pets'] },
    { group: 'Finanças', items: ['Finanças', 'Investimentos', 'Seguros', 'Imobiliário'] },
    { group: 'Educação', items: ['Educação', 'Cursos Online', 'Coaching', 'Mentoria'] },
    { group: 'Outros', items: ['Personal Brand', 'Mídia', 'Varejo Físico', 'Indústria', 'ONG'] },
  ];

  return (
    <Combobox
      value={value}
      onChange={onChange}
      options={suggestions.flatMap(g => g.items)}
      placeholder="Busque ou digite seu segmento..."
      allowCustomValue  // Qualquer valor aceito
    />
  );
}
```

**Onboarding usa o mesmo componente** (hoje tem lista diferente e mais restrita).

### Critérios de aceitação:
- [x] 30+ sugestões organizadas por 7 categorias (VERTICAL_GROUPS)
- [x] Busca/filtro funciona ao digitar (VerticalAutocomplete)
- [x] Texto livre aceito (qualquer valor — onChange aceita input direto)
- [x] Wizard usa o novo componente (step-identity.tsx)
- [x] Valores existentes no Firestore continuam funcionando (aceita qualquer string)

---

## Tarefa 03.3 — Awareness: 3 perguntas simples → classificação automática

**Ref:** Seção Brands P0 — "Awareness no onboarding"

### Problema:
Hoje: select com "Unaware", "Problem Aware", "Solution Aware", "Product Aware", "Most Aware". 99% dos usuários não sabem o que é isso.

### Solução:

**3 perguntas Sim/Não:**

```tsx
function AwarenessQuestions({ onClassify }: Props) {
  const [answers, setAnswers] = useState({ knowsProblem: null, seeksSolutions: null, knowsProduct: null });

  // Classificação automática:
  // NNN = unaware
  // SNN = problem_aware
  // SSN = solution_aware
  // SSS = product_aware (ou most_aware)
  // SNS = product_aware (conhece produto mas não buscou alternativas)

  useEffect(() => {
    if (Object.values(answers).every(v => v !== null)) {
      const level = classifyAwareness(answers);
      onClassify(level);
    }
  }, [answers]);

  return (
    <div className="space-y-4">
      <Question
        text="Seu público sabe que tem o problema que você resolve?"
        value={answers.knowsProblem}
        onChange={(v) => setAnswers(prev => ({ ...prev, knowsProblem: v }))}
      />
      <Question
        text="Seu público já procura soluções ativamente?"
        value={answers.seeksSolutions}
        onChange={(v) => setAnswers(prev => ({ ...prev, seeksSolutions: v }))}
      />
      <Question
        text="Seu público já conhece seu produto/marca?"
        value={answers.knowsProduct}
        onChange={(v) => setAnswers(prev => ({ ...prev, knowsProduct: v }))}
      />

      {awarenessLevel && (
        <AwarenessResult level={awarenessLevel} />
        // "Seu público está no nível: Consciente do Problema"
        // Explicação em 1 frase: "Eles sabem que têm o problema, mas ainda não buscam soluções"
      )}
    </div>
  );
}

function classifyAwareness({ knowsProblem, seeksSolutions, knowsProduct }) {
  if (!knowsProblem) return 'unaware';
  if (!seeksSolutions && !knowsProduct) return 'problem_aware';
  if (seeksSolutions && !knowsProduct) return 'solution_aware';
  if (knowsProduct) return 'product_aware';
  return 'solution_aware'; // fallback
}
```

**Na página de edição:** Mostrar as 3 perguntas + resultado calculado. Opção de override manual para experts.

### Critérios de aceitação:
- [x] 3 perguntas Sim/Não substituem o select técnico (AwarenessQuestions)
- [x] Classificação automática correta (classifyAwareness)
- [x] Resultado mostrado em linguagem simples com emoji + descrição
- [x] Valor salvo no Firestore como antes (`awareness: 'problem_aware'`)
- [x] Compatível com dados existentes (useEffect infere answers de awareness existente)
- [x] Wizard usa o novo componente (step-audience.tsx)

---

## Tarefa 03.4 — Objeções com sugestões por nicho

**Ref:** Seção Brands P0 — "Objeções com sugestões por nicho"

### Problema:
Hoje: campo de texto livre para 1 objeção. Pouco contexto para os conselheiros.

### Solução:

Ao selecionar vertical, gerar 5-8 objeções comuns via Gemini (flash, custo ~0):

```typescript
// API: POST /api/brands/suggest-objections
// Body: { vertical, offer, audience }
// Resposta: { objections: ["É caro demais", "Não sei se funciona pra mim", ...] }

const prompt = `Para o nicho "${vertical}" vendendo "${offer}" para "${audience}",
liste as 8 objeções mais comuns que impedem a compra.
Retorne JSON: { "objections": ["objeção 1", "objeção 2", ...] }`;
```

**UI:**

```tsx
function ObjectionsSelector({ brand, onChange }: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>(brand.objections || []);
  const [custom, setCustom] = useState('');

  // Ao carregar, buscar sugestões
  useEffect(() => { fetchSuggestions(); }, [brand.vertical]);

  return (
    <div>
      <p className="text-sm text-muted">Marque as objeções que seu público tem:</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map(obj => (
          <Chip
            key={obj}
            selected={selected.includes(obj)}
            onClick={() => toggle(obj)}
          >
            {obj}
          </Chip>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        <Input placeholder="Adicionar outra objeção..." value={custom} onChange={...} />
        <Button size="sm" onClick={() => addCustom()}>+</Button>
      </div>
      <p className="text-xs text-muted mt-1">{selected.length} objeções selecionadas</p>
    </div>
  );
}
```

### Critérios de aceitação:
- [x] Sugestões geradas via botão "Sugerir com IA" (POST /api/brands/[brandId]/suggest-objections)
- [x] Chips clicáveis para selecionar/deselecionar (toggle com visual amarelo)
- [x] Campo para adicionar objeção custom (botão "Adicionar Objeção")
- [x] Múltiplas objeções — até 5 (array editável)
- [x] Salvas como array no Firestore (via auto-save debounce)
- [x] Custo: ~0 (Gemini Flash, prompt pequeno, maxOutputTokens: 512)

---

## Tarefa 03.5 — Tipo de oferta: Chips + "Outro"

**Ref:** Seção Brands P0 — "Dropdowns limitados"

### Hoje: 6 opções fixas sem "Outro"
### Solução:

```tsx
const OFFER_TYPES = [
  'Curso Online', 'Mentoria', 'Consultoria', 'SaaS/App',
  'E-book/Digital', 'Serviço', 'Produto Físico', 'Comunidade',
  'Evento/Workshop', 'Assinatura', 'Franquia', 'Outro',
];

function OfferTypeSelector({ value, onChange }) {
  const [customType, setCustomType] = useState('');
  const isCustom = value && !OFFER_TYPES.includes(value);

  return (
    <div className="flex flex-wrap gap-2">
      {OFFER_TYPES.map(type => (
        <Chip
          key={type}
          selected={value === type || (type === 'Outro' && isCustom)}
          onClick={() => type === 'Outro' ? setShowCustom(true) : onChange(type)}
        >
          {type}
        </Chip>
      ))}
      {(showCustom || isCustom) && (
        <Input
          placeholder="Descreva o tipo..."
          value={isCustom ? value : customType}
          onChange={(e) => onChange(e.target.value)}
          className="w-48"
        />
      )}
    </div>
  );
}
```

### Critérios de aceitação:
- [x] 12 chips de tipos comuns (OFFER_TYPES expandido)
- [x] "Outro" abre campo de texto livre (showCustom + isCustomType)
- [x] Wizard usa o novo componente (step-offer.tsx)
- [x] Valores existentes continuam funcionando (isCustomType detecta valores fora da lista)

---

## Tarefa 03.6 — Ticket como número (não string)

**Ref:** Seção Funis 11.5 — "Ticket é string, não número"

### Problema:
`brand.offer.ticket` é string. Em algum lugar o código tenta `.toLocaleString()` e pode quebrar.

### Solução:
- Input `type="number"` com máscara de moeda (R$)
- Salvar como número no Firestore
- Migração: converter strings existentes para número

```tsx
<CurrencyInput
  value={ticket}
  onChange={setTicket}
  prefix="R$ "
  decimalSeparator=","
  groupSeparator="."
/>
```

### Critérios de aceitação:
- [x] Input aceita apenas números (CurrencyInput com inputMode="decimal", filtro de caracteres)
- [x] Formato visual R$ X.XXX,XX (toLocaleString pt-BR no blur)
- [x] Salva como número no Firestore (parseBRL → float)
- [x] Valores string existentes parseados corretamente (CurrencyInput aceita string ou number)

---

## Tarefa 03.7 — Onboarding/Wizard melhorado

**Ref:** Seção Brands P0 — "Onboarding/Wizard melhorado"

### Fluxo novo:

```
Step 1: Identidade (Nome + Vertical + Posicionamento)     ← OBRIGATÓRIO
Step 2: Audiência (Quem + Dor + Awareness 3 perguntas)    ← OBRIGATÓRIO
Step 3: Oferta (O que + Ticket + Tipo + Diferencial)      ← OBRIGATÓRIO
Step 4: Visual + Logo (cores, estilo, logo upload)         ← OPCIONAL (pulável)
Step 5: Documentos (PDFs, URLs da marca)                   ← OPCIONAL (pulável)
Step 6: Confirmação (resumo + "Criar Marca")               ← OBRIGATÓRIO
```

### O que muda vs hoje:
- Steps 1-3: obrigatórios (mesmos dados, componentes novos das tarefas anteriores)
- Step 4: Visual + Logo juntos (era separado)
- Step 5: Documentos/Assets inline (**NOVO** — hoje não existe no wizard)
- Step 6: Confirmação com resumo editável
- **REMOVIDO do wizard:** AI Config (default "equilibrado", editar depois na página)
- Steps opcionais mostram "Pular →" como botão secundário

### Critérios de aceitação:
- [x] 6 steps com indicador de progresso (WizardProgress atualizado)
- [x] Steps 1-3 obrigatórios (botão desabilitado sem dados mínimos)
- [x] Steps 4-5 puláveis com botão "Pular por enquanto"
- [x] Componentes compartilhados com página de edição (mesmos step components)
- [x] Vertical: autocomplete (tarefa 03.2 — StepIdentity com VERTICAL_GROUPS)
- [x] Awareness: 3 perguntas (tarefa 03.3 — StepAudience com AwarenessQuestions)
- [x] Objeções: editable array (tarefa 03.4 — endpoint criado, disponível na edit page)
- [x] Tipo oferta: chips (tarefa 03.5 — StepOffer com 12 chips)
- [x] Ticket: número (tarefa 03.6 — Input type=number)
- [x] Step 6 mostra resumo completo (StepConfirm reescrito)
- [x] Step 4: Visual + Logo combinados (StepVisualLogo criado)
- [x] Step 5: Documentos — upload com queue (StepDocuments criado)
- [x] AI Config removido do wizard (default equilibrado, editável depois)
- [x] Dead code limpo: step-ai-config, step-visual-identity, step-logo, brand-kit-form, project-list deletados

---

## Tarefa 03.8 — Checklist: Justo e Acionável

**Ref:** Seção Brands P0 — "Checklist psicologicamente negativo"

### Problemas:
- 45% é o máximo para quem completou TODO o wizard
- Assets RAG como critério é injusto
- Alerta amarelo permanente

### Solução:

**Novo cálculo de completude:**

```typescript
const COMPLETENESS_CRITERIA = {
  // Obrigatórios (70% do peso)
  name: { weight: 10, check: (b) => !!b.name },
  vertical: { weight: 10, check: (b) => !!b.vertical },
  audience: { weight: 15, check: (b) => !!b.audience?.who },
  offer: { weight: 15, check: (b) => !!b.offer?.what && !!b.offer?.ticket },
  awareness: { weight: 10, check: (b) => !!b.audience?.awareness },
  objections: { weight: 10, check: (b) => (b.audience?.objections?.length || 0) >= 1 },

  // Opcionais (30% do peso)
  colors: { weight: 8, check: (b) => (b.brandKit?.colors?.length || 0) >= 1 },
  logo: { weight: 7, check: (b) => !!b.brandKit?.logoUrl },
  typography: { weight: 5, check: (b) => !!b.brandKit?.typography?.headline },
  voiceTone: { weight: 5, check: (b) => !!b.voiceTone },
  documents: { weight: 5, check: (b) => (b.assets?.length || 0) >= 1 },
};
```

**Regras:**
- Completar steps 1-3 do wizard = **70%** (não 45%)
- Mostrar checklist **só se < 70%** (dados obrigatórios incompletos)
- Cada item é **link clicável** para a seção correspondente na página de edição
- `isApprovedForAI` default = **true** (não false)
- Assets RAG **removido** como critério obrigatório (peso apenas 5%)

### Critérios de aceitação:
- [x] Quem completa wizard (steps 1-3) tem ≥ 70% (obrigatórios = 70% do peso)
- [x] Cada item do checklist tem href para edição
- [x] Checklist só aparece se < 70% (DetailedView retorna null quando score >= 70)
- [x] Sem alerta amarelo permanente (visual neutro: border-white/[0.06], bg-white/[0.02], ícone zinc-500)
- [x] `isApprovedForAI` default = true (wizard step-documents + brand-characters-section usam true)

---

## Tarefa 03.9 — Eliminar rotas e componentes mortos

**Ref:** Seção Brands P0 — "Eliminar"

### O que deletar/consolidar:

| Item | Ação |
|---|---|
| `/brands/{id}/assets` (página separada) | Redirect → `/brands/{id}/edit#documents` |
| Tab "Contexto RAG" | Absorvido pela seção Documentos |
| Tab "Visão Geral" (read-only) | Desnecessário — página de edição é completa |
| Projetos (na brand detail) | Esconder até ter integração real |
| Voice Profile Editor (componente órfão) | Integrar na seção Voz (tarefa 03.1) |

### Critérios de aceitação:
- [x] `/brands/{id}/assets` mantida (tem funcionalidade de gestão), edit page linka para ela
- [x] Nenhuma tab duplicada na brand detail (tabs removidas, agora é overview com cards)
- [x] Projetos escondidos da UI (ProjectList removido da brand detail, sem consumidores)
- [x] Voice Profile Editor acessível via seção Voz (integrado na edit page, seção 7)
- [x] `/brand-hub` redireciona para `/brands/{id}/edit#visual` (não mais ?tab=brandhub)
- [x] BrandKitForm sem consumidores (pode ser deletado — dead code)

---

## Tarefa 03.10 — Cores: duas personas

**Ref:** Seção Brands P0 — "Cores — duas personas"

### Quem já tem marca:
- Color picker + input hex + preview do par (fundo + texto)
- Até 5 cores (primária, secundária, accent, fundo, texto)

### Quem está criando:
- Paletas sugeridas por nicho:

```typescript
const PALETTE_SUGGESTIONS: Record<string, string[][]> = {
  'SaaS': [['#6366F1', '#818CF8', '#1E1B4B'], ['#3B82F6', '#60A5FA', '#1E3A5F']],
  'Saúde': [['#10B981', '#34D399', '#064E3B'], ['#14B8A6', '#5EEAD4', '#134E4A']],
  'Moda': [['#000000', '#D4AF37', '#FFFFFF'], ['#1F2937', '#F59E0B', '#FEF3C7']],
  'Fitness': [['#EF4444', '#F97316', '#1F2937'], ['#22C55E', '#84CC16', '#1A2E05']],
  'Finanças': [['#1E40AF', '#2563EB', '#EFF6FF'], ['#0F766E', '#14B8A6', '#F0FDFA']],
  // ... mais nichos
};
```

- Click em paleta → aplica as 3 cores
- Sempre editável depois

### Critérios de aceitação:
- [x] Color picker funcional com hex input (4 cores: primária, secundária, accent, fundo)
- [x] Preview visual do par de cores (strip horizontal)
- [x] Paletas sugeridas por nicho (9 nichos + fallback, 3 paletas cada)
- [x] Click na paleta aplica as 4 cores automaticamente
- [x] 4 cores editáveis (primária, secundária, accent, fundo)

---

## Check de Progressão Contínua (Máxima do Projeto)

Após Sprint 03:

```
Novo usuário chega
  ↓ Wizard de 6 steps (simples, sem jargão técnico)
  ↓ Steps 1-3 obrigatórios (~2 min): nome, público, oferta
  ↓ Steps 4-5 opcionais: visual, docs
  ↓ AHA: 70%+ da marca configurada!
  ↓ CELEBRAÇÃO: Confirmação com resumo visual
  ↓ PRÓXIMO PASSO: "Gerar diagnóstico da marca →" (verdict)
```

```
Usuário quer editar marca depois
  ↓ 1 click na sidebar → Brand
  ↓ 1 click na marca → Página de edição completa
  ↓ Seções colapsáveis, auto-save
  ↓ Cada seção tem indicador ✅/⚪
  ↓ ZERO necessidade de navegar para outra página
```

**Zero becos sem saída:**
- Wizard completo → "Gerar diagnóstico"
- Edição → auto-save (sem "Salvar" manual)
- Checklist → links diretos para a seção que falta
- Awareness classificado sem saber Schwartz
- Objeções sugeridas (não precisa inventar do zero)
