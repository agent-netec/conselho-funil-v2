# MKTHONEY — Mapa de Arquitetura Completo

> Documento de referência para o refurbish completo do produto.
> Gerado: 2026-02-25 | Atualizar conforme evolução.

---

## Decisões Tomadas

| # | Decisão | Status |
|---|---------|--------|
| 1 | Nome final: **MKTHONEY** | Decidido |
| 2 | Copy landing: será enviada em pasta separada | Pendente envio |
| 3 | Pricing: 1 tier ou 3 tiers? | **Pendente** |
| 4 | Paleta de cores: nova (buscando inspiração) | **Pendente** |
| 5 | Features stub: mostrar como "Coming Soon" | Decidido |
| 6 | Embedding migration: text-embedding-004 → gemini-embedding-001 | **COMPLETO (Sprint A)** |
| 7 | Plano mestre: `brain/PLANO-MESTRE-REFURBISH.md` | Criado 2026-02-25 |

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        CAMADA DE DADOS                          │
│                                                                 │
│  Firestore (20 collections raiz + 26 subcols por brand)         │
│  Pinecone  (11 namespaces: universal, brand_*, vault_*, etc)    │
│  Storage   (2 paths: vault/assets + brand-assets)               │
│  Gemini    (Flash = bulk, Pro = scoring/chat/autopsy)           │
└─────────┬───────────────────────────────────────┬───────────────┘
          │                                       │
┌─────────▼──────────┐              ┌─────────────▼───────────────┐
│   BRAIN SYSTEM     │              │      RAG PIPELINE           │
│   23 Identity Cards│──────────────│  Pinecone → Embedding →     │
│   5 Domains        │   alimenta   │  Context Assembly → Prompt  │
│   Loader + Cache   │              │  Scoped: brand/funnel/camp  │
└─────────┬──────────┘              └─────────────┬───────────────┘
          │                                       │
┌─────────▼───────────────────────────────────────▼───────────────┐
│                    119 API ROUTES                                │
│                                                                 │
│  Chat(1) → Copy(2) → Social(11) → Ads(5) → Design(3)          │
│  Funnels(6) → Calendar(8) → Automation(5) → Intelligence(14)   │
│  Auth(8) → Webhooks(7) → Cron(5) → Admin(6) → Assets(6)       │
│  Attribution(7) → Brand(5) → Pinecone(2) → Other(6)            │
└─────────┬───────────────────────────────────────┬───────────────┘
          │                                       │
┌─────────▼──────────┐              ┌─────────────▼───────────────┐
│   HOOKS & STORES   │              │      PAGES (Frontend)       │
│   6 Zustand Stores │              │   ~52 rotas no app router   │
│   27+ Custom Hooks │              │   Sidebar com 22-27 itens   │
│   3 Context Provid.│              │   3 tiers planejados        │
└────────────────────┘              └─────────────────────────────┘
```

---

## 2. Fluxo Central (Golden Thread)

O fluxo que gera valor e que o usuário paga para usar:

```
Brand Briefing ──→ Chat (Council) ──→ Funnel Generation ──→ Copy Generation
     │                   │                    │                    │
     │              Brain Context         Proposals            Scorecard
     │              RAG + Keywords        Scoring              Insights
     │                   │                    │                    │
     ▼                   ▼                    ▼                    ▼
  Brand Hub          Conversation         Campaign          Copy Decisions
  (Firestore)        (Real-time)         (Manifesto)       (approve/kill)
                                              │
                         ┌────────────────────┤
                         ▼                    ▼
                    Social Gen          Design Gen ──→ Assets
                    (Hooks/Plan)        (Imagen/Nano)    (Visual Pipeline)
```

---

## 3. Dependências Entre Módulos

```
                    ┌──────────┐
                    │  BRAND   │ ← TUDO depende de Brand
                    │   HUB    │
                    └────┬─────┘
            ┌────────────┼────────────────┐
            ▼            ▼                ▼
      ┌──────────┐ ┌──────────┐    ┌──────────┐
      │   CHAT   │ │ FUNNELS  │    │  ASSETS  │
      │ (Council)│ │          │    │          │
      └────┬─────┘ └────┬─────┘    └────┬─────┘
           │             │               │
           │        ┌────┼────┐          │
           │        ▼    ▼    ▼          │
           │   ┌────┐ ┌────┐ ┌────┐     │
           │   │COPY│ │SOC.│ │DES.│     │
           │   └──┬─┘ └──┬─┘ └──┬─┘     │
           │      │      │      │        │
           │      ▼      ▼      ▼        │
           │   ┌──────────────────┐      │
           └──→│    CAMPAIGNS     │←─────┘
               │ (Golden Thread)  │
               └────────┬────────┘
                        │
              ┌─────────┼──────────┐
              ▼         ▼          ▼
        ┌──────────┐ ┌──────┐ ┌──────────┐
        │AUTOMATION│ │VAULT │ │CALENDAR  │
        └──────────┘ └──────┘ └──────────┘
              │         │          │
              ▼         ▼          ▼
        ┌─────────────────────────────────┐
        │      INTEGRATIONS (OAuth)       │ ← BLOQUEADOR
        │   Meta · Google · TikTok · etc  │
        └─────────────────────────────────┘

   INDEPENDENTES:
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │OFFER LAB │ │DISCOVERY │ │SETTINGS  │
   └──────────┘ └──────────┘ └──────────┘
```

---

## 4. Estado Real vs Fake vs Stub

| Componente | Real | Fake/Hardcoded | Stub/Morto |
|---|---|---|---|
| **Chat Council** | IA real, 23 conselheiros, RAG, brain context | — | — |
| **Funnel Generation** | Proposals, scoring, stuck detection | — | — |
| **Copy Generation** | 6 tipos, scorecard 5D, brain por awareness | — | — |
| **Design Generation** | Gemini Image, retry, asset creation | — | — |
| **Assets** | Upload, vectorizacao, visual analysis | Metricas "+2.4%" trend | — |
| **Campaigns** | Manifesto, congruence score | — | — |
| **Brand Hub** | CRUD, brandKit, AI config UI | Temp/TopP ignorados 3 engines | — |
| **Settings** | Tab Integrations | **5 tabs fake save** | — |
| **Automation** | Rules engine, DLQ, evaluation | **"142 acoes", "R$12.450"** | Actions reais (OAuth) |
| **Calendar** | UI, generate-week API | — | **Bug 500, sem publish** |
| **Vault** | Engines existem (Curation, Adaptation) | — | **Zero triggers ativos** |
| **Offer Lab** | UI wizard completo | **IA nunca chamada, modelo errado** | — |
| **Social** | Generate, structure, hooks APIs | — | Debate, trends, inbox |
| **Intelligence** | Attribution, Discovery, Spy | — | **A/B, Predict, LTV, Creative = stubs** |
| **Onboarding** | Store com 5 steps fixos | — | **Sem wizard, sem email** |

---

## 5. Brain System — 23 Identity Cards

### Copy Council (9 cards)
| ID | Expert | Framework Principal |
|---|---|---|
| gary_halbert | Headlines & Psicologia | headline_score, full_copy_score |
| eugene_schwartz | Consciencia de Mercado | awareness_alignment |
| joseph_sugarman | Narrativa & Estrutura | slippery_slide |
| dan_kennedy_copy | Oferta & Urgencia | offer_architecture |
| david_ogilvy | Brand Premium & Big Idea | big_idea_test |
| claude_hopkins | Metodo Cientifico | scientific_rigor |
| john_carlton | Voz Autentica & Hooks | hook_and_fascinations |
| drayton_bird | Simplicidade & Eficiencia | simplicity_efficiency |
| frank_kern_copy | Fluxo de Vendas | sequence_logic |

### Funnel Council (6 cards)
| ID | Expert | Framework Principal |
|---|---|---|
| russell_brunson | Arquitetura de Funil | value_ladder_score |
| dan_kennedy | Oferta (visao funil) | funnel_offer_score |
| frank_kern | Psicologia & Comportamento | behavioral_funnel_score |
| sam_ovens | Aquisicao & Qualificacao | qualification_score |
| ryan_deiss | LTV & Retencao | ltv_optimization |
| perry_belcher | Monetizacao Simples | monetization_score |

### Social Council (4 cards)
| ID | Expert | Framework Principal |
|---|---|---|
| lia_haberman | Algoritmo & Mudancas | algorithm_alignment |
| rachel_karten | Criativo & Hooks | hook_effectiveness |
| nikita_beer | Viralizacao & Trends | viral_potential |
| justin_welsh | Funil Social | social_funnel_score |

### Ads Council (4 cards)
| ID | Expert | Framework Principal |
|---|---|---|
| justin_brooke | Estrategia & Escala | ad_strategy_score |
| nicholas_kusmich | Meta Ads & Contexto | meta_ads_score |
| jon_loomer | Analytics & Tecnico | technical_setup_score |
| savannah_sanchez | TikTok & UGC | creative_native_score |

### Design Council (1 card)
| ID | Expert | Framework Principal |
|---|---|---|
| design_director | Direcao Visual & UX | visual_impact_score, chapeu_compliance |

### Mapeamento por Awareness Stage (Copy)
```
unaware       → eugene_schwartz + gary_halbert
problem_aware → joseph_sugarman + john_carlton
solution_aware→ dan_kennedy_copy + david_ogilvy
product_aware → dan_kennedy_copy + david_ogilvy
most_aware    → claude_hopkins + drayton_bird
[transversal] → frank_kern_copy (sequence_logic)
```

### Mapeamento por Funnel Stage
```
Awareness  → russell_brunson + frank_kern
Interest   → sam_ovens + dan_kennedy
Decision   → dan_kennedy + perry_belcher
Retention  → ryan_deiss + russell_brunson
```

---

## 6. Stores & Hooks (Estado Compartilhado)

### 6 Zustand Stores
| Store | Persistencia | Usado por |
|---|---|---|
| **AuthStore** | Nao | Todos os hooks de data |
| **BrandStore** | localStorage (brand-storage) | useActiveBrand, todos componentes scoped |
| **ChatStore** | Nao | Chat UI, mode selector |
| **ContextStore** | localStorage (context-storage) | Scope selector, scoped queries |
| **NotificationStore** | Nao | Toasts globais |
| **OnboardingStore** | localStorage (onboarding-storage) | Wizard, welcome screen |

### Hooks Criticos (27+)
| Hook | Funcao | API Route |
|---|---|---|
| useUser | Auth + auto-create user | — (Firebase direto) |
| useActiveBrand | Brand selecionada | — (store selector) |
| useBrands | CRUD brands | — (Firebase direto) |
| useBrandAssets | Real-time assets listener | — (onSnapshot) |
| useAssetMetrics | Metricas Pinecone | GET /api/assets/metrics |
| useFunnels | CRUD funnels | — (Firebase direto) |
| useCampaignData | 3-table join campaign | — (Firebase direto) |
| useConversations | Lista conversas | — (Firebase direto) |
| useConversation | Mensagens + send | POST /api/chat |
| useAttributionData | Multi-model attribution | POST /api/intelligence/attribution/sync |
| useCrossChannelMetrics | Metricas consolidadas | GET /api/intelligence/attribution/stats |
| usePredictiveData | Churn, LTV, Forecast | POST /api/intelligence/predictive/* |
| useSegmentPerformance | Hot/warm/cold breakdown | — (lazy import) |
| usePersonalizedContent | Conteudo personalizado | POST /api/personalization/resolve |

### 3 Providers
| Provider | Responsabilidade |
|---|---|
| AuthProvider | Firebase Auth init + rehydrate stores |
| BrandingProvider | CSS vars (--primary-brand, --secondary-brand) + sync Firestore |
| PostHogProvider | Analytics + feature flags |

---

## 7. Firebase Collections (Completo)

### Root Level (20 collections)
```
users, tenants, brands, funnels, conversations, campaigns,
library, knowledge, knowledge_chunks, brand_assets, leads,
events, transactions, predictions, alerts, reports, agencies,
decisions, copyDecisions, integrations, projects
```

### Brand-Scoped Subcollections (26 por brand)
```
vault_dna, vault_assets, vault_library, publisher_jobs, secrets,
integrations, assets, generated_ads, conversion_events,
dead_letter_queue, intelligence, competitors (+nested assets),
performance_metrics, performance_anomalies, content_calendar,
copy_dna, case_studies, offers, notifications, social_interactions,
social_cases, audience_scans, personalization_rules, research,
voice_profiles, automation_rules, automation_logs
```

---

## 8. Pinecone Namespaces (11+)

| Namespace | Conteudo | Sync Source |
|---|---|---|
| universal | Knowledge global | knowledge_chunks |
| templates | Templates publicos | library |
| knowledge | Assets aprovados | brand_assets (isApprovedForAI) |
| visual | Analise visual de imagens | Visual pipeline |
| vault_{brandId} | Copy DNA + vault content | vault_dna, vault_library |
| brand_{brandId} | Assets estrategicos da brand | brand_assets processados |
| brand-{brandId} | **LEGACY** (backward compat) | Mesmo que brand_ |
| intelligence_{brandId} | Intel de competidores | intelligence docs |
| social_{brandId} | Cases sociais | social_cases |
| context_{brandId}_funnel_{funnelId} | Contexto scoped funil | Scoped data |
| context_{brandId}_campaign_{campaignId} | Contexto scoped campanha | Scoped data |

---

## 9. API Routes por Categoria (119 total)

| Categoria | Qtd | Rotas Principais |
|---|---|---|
| Chat & Intelligence | 14 | /api/chat, /api/intelligence/research/* |
| Copy | 2 | /api/copy/generate, /api/copy/decisions |
| Design | 3 | /api/design/generate, upscale, plan |
| Funnels & Campaigns | 6 | /api/funnels/generate, export, share |
| Assets | 6 | /api/assets/delete, import, metrics, reanalyze |
| Admin | 6 | /api/admin/check-knowledge, ingest, upload |
| Social | 11 | /api/social/generate, structure, hooks, debate, trends |
| Calendar | 8 | /api/content/calendar/*, generate-week, publish |
| Auth & Integrations | 8 | /api/auth/meta/callback, google, instagram, linkedin, tiktok |
| Automation | 5 | /api/automation/evaluate, execute, suggestions |
| Webhooks | 7 | /api/webhooks/ads-metrics, meta-capi, google-conversions |
| Cron | 5 | /api/cron/ads-sync, social-sync, content-autopilot |
| Attribution | 7 | /api/intelligence/attribution/*, /api/performance/* |
| Brand & Voice | 5 | /api/brands/*/duplicate, export, logo-lock |
| Pinecone | 2 | /api/pinecone/health, migrate |
| Other | 6 | /api/ai/analyze-visual, /api/library, /api/mcp/execute |

---

## 10. Gemini Models & Temperature

| Task | Model | Temperature | Justificativa |
|---|---|---|---|
| OCR / Vision | Flash | 0.4 | Precisao maxima |
| Scoring (CPS) | Pro | 0.1-0.2 | Consistencia critica |
| Chat response | Flash | 0.5 | Balanco precisao/personalidade |
| Copy generation | Flash | 0.7 | Criatividade + fundamentacao |
| Social generation | Flash | 0.7 | Apelo viral |
| Design direction | Nanobanana | N/A | Geracao de imagem |
| Party mode | Flash | 0.8 | Personalidade + divergencia |

---

## 11. Riscos Tecnicos Criticos

| # | Risco | Impacto | Prazo | Esforco |
|---|---|---|---|---|
| 1 | Gemini 2.0 depreca 31/03/2026 | TUDO para | 34 dias | 5min (env var) |
| 2 | text-embedding-004 deprecated | RAG quebra | Iminente | 1h |
| 3 | Namespace brand- vs brand_ | 295 vetores invisiveis | — | 2-4h |
| 4 | Cascade delete nao limpa Pinecone/Storage | Dados orfaos | — | 4h |
| 5 | Funnel→Campaign denormalizacao stale | Dados antigos | — | 2h |
| 6 | 5 tabs Settings com fake save | Confianca destruida | — | 8-12h |
| 7 | Content Autopilot sem triggers | Feature morta | — | 8h |
| 8 | Offer Lab IA nunca chamada + modelo errado | Feature falsa | — | 3h |

---

## 12. Plano de Execucao (Fases)

### FASE 0 — "Stop the Bleeding" (1-2 semanas)
- [ ] Fix Settings fake saves (5 tabs)
- [ ] Remover dados hardcoded (Automation, Assets metrics)
- [ ] Fix Calendar Error 500
- [ ] Fix Offer Lab (chamar IA real + modelo Pro)
- [ ] Fix temperatura/topP ignorados em 3 engines
- [ ] Migrar Gemini 2.0 → 2.5 (env var)
- [ ] Migrar embedding model
- [ ] Fix namespace Pinecone

### FASE 1 — "First Impression" (2-3 semanas)
- [ ] Landing Page MKTHONEY (aguardando assets)
- [ ] Onboarding Wizard 2 fases (1A obrigatorio + 1B opcional)
- [ ] Veredito Proativo (council debate pos-wizard)
- [ ] Dashboard contextual (3 estados)
- [ ] Sidebar progressiva por tier
- [ ] Email verification
- [ ] Renomear produto → MKTHONEY em toda UI

### FASE 2 — "Depth" (3-4 semanas)
- [ ] Content Autopilot ativar triggers (Vault Phase 1)
- [ ] Brand Hub wizard unificado (6-7 steps)
- [ ] Tier system + feature flags
- [ ] Features stub → "Coming Soon" com lock icon
- [ ] Email sequence 14 dias (trial nurturing)
- [ ] Cascade delete fix (Pinecone + Storage)

### FASE 3 — "Scale" (pos-launch)
- [ ] OAuth real (Sprint L)
- [ ] Social publishing
- [ ] Automation com dados reais
- [ ] Calendar publishing
- [ ] Meta Advanced Access (App Review)

---

## 13. Cross-References

| Documento | Path | Conteudo |
|---|---|---|
| UX Journey | brain/conselho-funil-v2-ux-journey.md | Jornada completa do usuario |
| Product Launch | brain/roadmap-product-launch.md | Roadmap de lancamento |
| Landing Copy V1 | _netecmt/docs/landpage/COPY-LANDING-PAGE-V1.md | Copy agressiva (produto-centrica) |
| Landing Copy V2 | _netecmt/docs/landpage/COPY-LANDING-PAGE-V2.md | Copy "Army of One" (usuario-centrica) |
| Master Roadmap | _netecmt/ROADMAP.md | Sprints 11-34+ |
| Brain Integration | brain/GUIA-INTEGRACAO-BRAINS.md | Como integrar brain em engines |
| Platform Guide | brain/GUIA-USO-PLATAFORMA.md | Guia de uso atual |
| Social v2 | brain/roadmap-social-v2.md | 6 fases |
| Automation v2 | brain/roadmap-automation-v2.md | 5 fases |
| Calendar v2 | brain/roadmap-calendar-v2.md | 5 fases |
| Vault v2 | brain/roadmap-vault-v2.md | 5 fases |
| Settings v2 | brain/roadmap-settings-v2.md | 4 fases |
| Brand Hub v2 | brain/roadmap-brand-hub-v2.md | 5 fases |
| Assets v2 | brain/roadmap-assets-v2.md | 5 fases (Phase 1.6 done) |
| Offer Lab v2 | _netecmt/docs/roadmap-offer-lab-v2.md | 4 fases |
