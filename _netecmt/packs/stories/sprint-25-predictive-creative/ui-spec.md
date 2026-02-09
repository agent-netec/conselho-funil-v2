# 🎨 UI/UX Spec: Painel de Predição + Ad Preview (ST-10)

**Versão**: 1.0.0  
**Status**: Ready for Implementation  
**Agentes**: Beto (UX) & Victor (UI)

---

## 🧠 1. UX Strategy (Beto)

### 1.1 Fluxo do Usuário
O fluxo foi desenhado para ser uma extensão natural do **Discovery Hub**, movendo o usuário da exploração passiva para a validação ativa.

1.  **Entrada (Discovery Hub)**: Novo card "Predictive Engine" com tabs para `URL Scan` ou `Text Analysis`.
2.  **Input**: Usuário cola transcrição de VSL ou Copy de Ad.
3.  **Processamento (Skeleton)**: Feedback visual imediato enquanto o `Text Analyzer` e o `Predictor` rodam em paralelo.
4.  **Resultado Hero**: Exibição do CPS Score + Grade Badge.
5.  **Deep Dive**: Exploração das 6 dimensões e recomendações contextuais.
6.  **Ação Proativa**: Botão "Generate Optimized Ads" baseado nos pontos fracos detectados.
7.  **Preview**: Visualização dos anúncios gerados em múltiplos formatos.

### 1.2 Hierarquia de Informação
-   **Nível 1 (Hero)**: CPS Score (0-100) + Grade (S-F). É o veredito instantâneo.
-   **Nível 2 (Diagnóstico)**: Dimension Bars. Mostra *onde* o copy está falhando.
-   **Nível 3 (Ação)**: Recommendations List. O que mudar para subir o score.
-   **Nível 4 (Output)**: Ad Previews. O resultado tangível da inteligência.

### 1.3 Estados de Interface
-   **Idle**: Empty state incentivando o input de texto.
-   **Loading (Scoring)**: Skeleton de Gauge + 6 barras pulsantes (~3-5s).
-   **Loading (Ads)**: Skeleton de Cards (Meta/Google) (~5-8s).
-   **Error**: Toast notification (Sonner) + Retenção do texto no input para nova tentativa.

---

## 💎 2. UI Design System (Victor)

### 2.1 Design Tokens: CPS & Grading
| Grade | Faixa | Cor (Tailwind) | Significado |
| :--- | :--- | :--- | :--- |
| **S** | 90-100 | `text-yellow-400` / `bg-yellow-500/20` | Elite (Golden) |
| **A** | 75-89 | `text-emerald-400` | Excelente |
| **B** | 60-74 | `text-blue-400` | Bom |
| **C** | 45-59 | `text-orange-400` | Médio |
| **D** | 30-44 | `text-red-400` | Fraco |
| **F** | 0-29 | `text-zinc-600` | Falha Crítica |

### 2.2 Componentes Customizados

#### A. CPS Gauge (Hero)
-   **Visual**: Semicírculo (SVG) com gradiente cônico.
-   **Animação**: `framer-motion` para o ponteiro/fill subir do 0 ao score.
-   **Destaque**: Grade Badge (S/A/B/C/D/F) flutuando no centro do gauge.

#### B. Dimension Bars
-   **Layout**: Label à esquerda, Score à direita, Barra de progresso ao centro.
-   **Interatividade**: Hover na barra revela o `explanation` e `evidence` em um Tooltip.

#### C. Ad Preview Cards
-   **Meta Feed**:
    -   Header: Avatar da Marca + Nome (BrandId) + "Patrocinado".
    -   Body: Texto principal (limitado a 125 chars).
    -   Media: Placeholder cinza `aspect-square` com ícone `Image`.
    -   Footer: Headline em negrito + Botão CTA (shadcn Button).
-   **Meta Stories**:
    -   Container: `aspect-[9/16]` max-width 320px.
    -   Overlay: Hook em destaque no topo, Body no centro, CTA na base.
-   **Google Search**:
    -   Visual: Estilo clássico Google (URL verde/azul, Headlines azuis, Descrição cinza).

#### D. Brand Voice Badge
-   **Indicador**: Pequeno dot ou badge ao lado do Ad Preview.
-   **Lógica**: `toneMatch > 0.8` (Verde), `0.6-0.8` (Amarelo), `< 0.6` (Vermelho).

---

## 🛠️ 3. Especificações Técnicas (ST-10)

-   **Framework**: Next.js 14 (App Router).
-   **Componentes UI**: `shadcn/ui` (Progress, Card, Tabs, Badge, Button, Skeleton).
-   **Ícones**: `lucide-react`.
-   **Animações**: `framer-motion` (entrada de cards e contagem de score).
-   **Responsividade**: 
    -   Mobile: Stack vertical de Previews.
    -   Desktop: Grid 2 colunas (Score/Dimensions | Recommendations) + Full width Ad Previews.

---

## 📝 4. Checklist de Implementação
- [ ] Implementar `PredictorDashboard` em `app/src/components/intelligence/predictor/`.
- [ ] Criar `AdPreviewSystem` com tabs para formatos.
- [ ] Integrar `AnalyzeTextRequest` ao clicar em "Analisar" no Discovery Hub.
- [ ] Garantir que o `brandId` seja passado em todos os requests.
- [ ] Adicionar skeletons específicos para cada seção.
