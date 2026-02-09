# 🎯 PRD: Predictive & Creative Engine — Sprint 25

**Versão:** 1.0  
**Responsável:** Iuran (PM)  
**Status:** Draft → Ready for Architecture Review  
**Data:** 06/02/2026  
**Predecessora:** Sprint 24 (ROI & UX Intelligence) — ✅ CONCLUÍDA

---

## 1. Contexto Estratégico

### O que já temos (Sprint 24 Foundation)
A Sprint 24 nos deu a **infraestrutura de dados de elite**: o sistema agora extrai, classifica e armazena Headlines, CTAs, Hooks e elementos visuais de qualquer funil via Firecrawl/Deep RAG, com isolamento multi-tenant garantido. Temos o `UXIntelligence` schema ativo, o `AssetsPanel` na UI, e um pipeline completo de extração → classificação → armazenamento no Pinecone/Firestore.

### O gap de monetização
Os dados de elite estão sendo **coletados**, mas ainda não estão sendo **utilizados proativamente** para gerar valor direto ao usuário. Hoje o operador precisa:
1. Extrair manualmente os ativos via Discovery Hub
2. Interpretar quais são bons (sem scoring preditivo)
3. Criar manualmente os anúncios baseados nos ativos
4. Testar no escuro (sem estimativa de performance)

**Isso é desperdício de inteligência.**

### A oportunidade: De Dados para Lucro em 3 cliques
Sprint 25 transforma o Conselho de Funil de uma **ferramenta de coleta** em um **motor de predição e execução autônomo**. O usuário extrai, o sistema pontua e cria.

---

## 2. Objetivo da Sprint

> **"Transformar Ativos de Elite em anúncios prontos para publicação, com scoring preditivo de conversão, reduzindo o ciclo de criação de 4 horas para 4 minutos."**

### North Star Metric
- **Time to First Ad (TTFA)**: Tempo desde a extração de um funil até ter um anúncio pronto para publicação.
- **Meta**: < 5 minutos (atual: manual, ~4h estimado)

### Métricas Secundárias
| Métrica | Baseline (Sprint 24) | Meta (Sprint 25) |
|:--------|:---------------------|:------------------|
| Elite Assets utilizados em ads | 0% | 80%+ |
| Score preditivo disponível antes do tráfego | ❌ | ✅ (0-100) |
| Anúncios gerados automaticamente por funil | 0 | 3-5 variações |
| Canais de input suportados | URL only | URL + Texto/Transcrição |

---

## 3. Temas Estratégicos (Prioridade IMV)

### 🏆 Tema 1: Conversion Predictor (MUST HAVE)
**Impacto**: Alto | **Esforço**: Médio | **ROI para o usuário**: Imediato

Utilizar os dados extraídos (`UXIntelligence`) + benchmarks internos para calcular um **Conversion Probability Score (CPS)** de 0 a 100 para cada funil analisado, ANTES de gastar dinheiro com tráfego.

#### Requisitos Funcionais

**RF-01: Scoring Engine**
- Calcular CPS baseado em 6 dimensões:
  1. **Headline Strength** (clareza, especificidade, gatilhos emocionais)
  2. **CTA Effectiveness** (urgência, clareza de ação, contraste visual)
  3. **Hook Quality** (padrão de curiosidade, loop aberto, pattern interrupt)
  4. **Offer Structure** (presença de garantia, ancoragem de preço, escassez)
  5. **Funnel Coherence** (alinhamento entre headline → body → CTA → oferta)
  6. **Trust Signals** (prova social, autoridade, selos, depoimentos)

- Cada dimensão: score de 0 a 100 + explicação textual
- Score final: média ponderada (pesos configuráveis por nicho)
- Output: JSON com breakdown por dimensão + recomendações de melhoria

**RF-02: Benchmark Comparativo**
- Comparar o CPS do funil analisado com a média dos funis já processados na base
- Apresentar ranking relativo: "Este funil está no Top 15% dos funis analisados"
- Cruzar com dados de `competitor` do Intelligence Wing (se disponível)

**RF-03: Recommendations Engine**
- Para cada dimensão com score < 60, gerar sugestões concretas:
  - "Sua headline falta especificidade. Sugestão: [headline reescrita]"
  - "Seu CTA não tem urgência. Sugestão: [CTA reescrito]"
- As sugestões devem ser baseadas nos **Elite Assets** da base (RAG-powered)
- Contextualizar com os frameworks dos Conselheiros (Schwartz, Brunson, etc.)

#### Endpoint Proposto
```
POST /api/intelligence/predict/score
Body: { brandId: string, funnelUrl?: string, funnelData?: UXIntelligence }
Response: { score: number, breakdown: DimensionScore[], recommendations: Recommendation[], benchmark: BenchmarkComparison }
```

---

### 🎨 Tema 2: Creative Automation Engine (MUST HAVE)
**Impacto**: Muito Alto | **Esforço**: Médio-Alto | **ROI para o usuário**: Direto em receita

Gerar anúncios multi-formato (Meta Ads, Google Ads, Stories) automaticamente a partir dos Ativos de Elite capturados, com adaptação de tom por Brand Voice.

#### Requisitos Funcionais

**RF-04: Ad Generation Pipeline**
- Input: `UXIntelligence` (Headlines, CTAs, Hooks extraídos) + Brand Voice
- Output: 3-5 variações de anúncio por formato:
  - **Meta Feed Ad**: Headline + Body + CTA + sugestão de imagem
  - **Meta Stories Ad**: Hook (3s) + Body (5s) + CTA overlay
  - **Google Search Ad**: Headlines (30 chars x3) + Descriptions (90 chars x2)
- Cada variação deve incluir o CPS estimado (Tema 1)

**RF-05: Elite Asset Remixing**
- Reutilizar headlines/CTAs de elite do banco (top 20% por `relevanceScore`)
- Aplicar técnicas de copywriting dos Conselheiros:
  - **Schwartz**: Adaptar por nível de consciência do público
  - **Halbert**: Aplicar fórmula AIDA nos bodies
  - **Brunson**: Estrutura de Story → Offer → Close
- Tag cada anúncio com a técnica utilizada (rastreabilidade)

**RF-06: Brand Voice Compliance**
- Todo anúncio gerado DEVE passar pelo `BrandVoiceTranslator` (Sprint 17)
- Score de `toneMatch` mínimo: 0.75 (rejeitar e regenerar se menor)
- Validar com `brand-validation.ts` antes de apresentar ao usuário

#### Endpoint Proposto
```
POST /api/intelligence/creative/generate-ads
Body: { brandId: string, sourceUrl?: string, eliteAssets: UXIntelligence, formats: AdFormat[], audienceLevel?: ConsciousnessLevel }
Response: { ads: GeneratedAd[], metadata: { totalGenerated: number, avgCPS: number, eliteAssetsUsed: number } }
```

---

### 📝 Tema 3: Multi-Input Intelligence (SHOULD HAVE)
**Impacto**: Médio-Alto | **Esforço**: Médio | **ROI para o usuário**: Expansão de cobertura

Expandir a inteligência de extração para além de URLs, permitindo análise de transcrições de VSL, scripts de vídeo e textos de anúncios colados manualmente.

#### Requisitos Funcionais

**RF-07: Text Input Analyzer**
- Novo input type no Discovery Hub: "Colar Texto / Transcrição"
- O motor de análise (`UXIntelligence`) deve funcionar identicamente para:
  - URLs (existente via Firecrawl)
  - Texto colado (novo)
  - Upload de arquivo .txt/.srt/.vtt (novo)
- Extrair Headlines, CTAs e Hooks do texto usando as mesmas heurísticas

**RF-08: VSL Transcript Parser**
- Parser especializado para transcrições de VSL:
  - Detectar hooks de abertura (primeiros 30 segundos)
  - Identificar pontos de oferta e urgência
  - Mapear estrutura narrativa (Story → Problem → Solution → Offer → Close)
- Integrar com o Conversion Predictor (Tema 1) para scoring de VSLs

**RF-09: Ad Copy Analyzer**
- Input: texto de anúncio existente (colado da Ads Library)
- Output: análise de efetividade + sugestões de melhoria
- Cruzar com Elite Assets para identificar elementos que faltam

#### Endpoint Proposto
```
POST /api/intelligence/analyze/text
Body: { brandId: string, text: string, textType: 'vsl_transcript' | 'ad_copy' | 'landing_page' | 'general', format?: 'txt' | 'srt' | 'vtt' }
Response: { uxIntelligence: UXIntelligence, scoring: ConversionScore, suggestions: Suggestion[] }
```

---

## 4. O que NÃO está no escopo (Sprint 25)

| Item | Motivo | Sprint Planejada |
|:-----|:-------|:-----------------|
| Publicação automática de ads (one-click publish) | Precisa de OAuth completo com Meta/Google | Sprint 26 |
| Análise de vídeo/áudio direto (sem transcrição) | Complexidade de infra (Whisper/Vision) | Sprint 27 |
| A/B Testing automatizado de variações | Requer integração profunda com plataformas de ads | Sprint 27 |
| Machine Learning customizado (modelo treinado) | Fase atual é heurística + LLM; ML vem depois | Sprint 28+ |
| Dashboard de ROI pós-publicação | Precisa de tracking de conversão end-to-end | Sprint 26 |

---

## 5. Requisitos Técnicos & Segurança

### RT-01: Scoring Engine Isolation
- O Conversion Predictor deve ser um módulo independente em `app/src/lib/intelligence/predictor/`
- Sem dependência direta do Firecrawl (recebe `UXIntelligence` como input)
- Cache de benchmarks no Firestore (atualização a cada 24h)

### RT-02: Creative Generation Guardrails
- Token budget máximo por geração: 8.000 tokens (via `cost-guard.ts`)
- Máximo de 5 variações por request
- Rate limiting: 10 gerações por minuto por `brandId`
- Todas as variações devem incluir `brandId` no metadata (multi-tenant)

### RT-03: Text Input Sanitization
- Strip de HTML/scripts em inputs de texto
- Limite de 50.000 caracteres por input
- Detecção de idioma automática (pt/en/es)
- Rejeitar inputs que pareçam código ou dados sensíveis

### RT-04: Multi-Tenant Compliance
- Todos os novos endpoints devem exigir `brandId` obrigatório
- Elite Assets de uma brand NUNCA devem ser usados para gerar ads de outra brand
- Benchmarks comparativos usam apenas dados agregados (anonimizados)

---

## 6. Arquitetura de Alto Nível (para Athos)

```
[Discovery Hub] → [UX Intelligence] → [Conversion Predictor]
       |                    |                    |
       |                    ▼                    ▼
       |           [Elite Assets DB]      [CPS Score + Recs]
       |                    |                    |
       ▼                    ▼                    ▼
[Text Input] ──→ [Creative Automation Engine] ──→ [Generated Ads]
                         |                           |
                         ▼                           ▼
                 [Brand Voice Validator]    [Ad Preview Panel]
                         |
                         ▼
                 [Ready for Publish Queue]
```

### Lanes Impactadas
| Lane | Impacto | Ação |
|:-----|:--------|:-----|
| `intelligence_wing` | Novos módulos: predictor, creative-engine, text-analyzer | Extensão de contrato |
| `ai_retrieval` | RAG para buscar Elite Assets como referência | Mínimo (já existe) |
| `brand_voice` | Validação de ads gerados | Mínimo (já existe) |
| `scraping_engine` | Sem mudança (Firecrawl já funciona) | Nenhuma |

---

## 7. Story Map (Sugestão para Leticia)

### Epic 1: Conversion Predictor
| Story | Descrição | Prioridade | Estimativa |
|:------|:----------|:-----------|:-----------|
| S25-ST-01 | Scoring Engine: 6 dimensões + CPS calculado | P0 | M |
| S25-ST-02 | Benchmark Comparativo (ranking relativo) | P1 | S |
| S25-ST-03 | Recommendations Engine (sugestões RAG-powered) | P1 | M |

### Epic 2: Creative Automation
| Story | Descrição | Prioridade | Estimativa |
|:------|:----------|:-----------|:-----------|
| S25-ST-04 | Ad Generation Pipeline (3 formatos) | P0 | L |
| S25-ST-05 | Elite Asset Remixing (top 20% como referência) | P0 | M |
| S25-ST-06 | Brand Voice Compliance Gate | P1 | S |

### Epic 3: Multi-Input Intelligence
| Story | Descrição | Prioridade | Estimativa |
|:------|:----------|:-----------|:-----------|
| S25-ST-07 | Text Input Analyzer (colar texto/transcrição) | P1 | M |
| S25-ST-08 | VSL Transcript Parser (estrutura narrativa) | P2 | M |
| S25-ST-09 | Ad Copy Analyzer (input de anúncio existente) | P2 | S |

### Story Transversal
| Story | Descrição | Prioridade | Estimativa |
|:------|:----------|:-----------|:-----------|
| S25-ST-10 | UI: Painel de Predição + Preview de Ads | P0 | L |

**Legenda**: S = Small (< 2h), M = Medium (2-4h), L = Large (4-8h)

---

## 8. Critérios de Aceitação

### Definition of Ready (DoR)
- [ ] PRD revisado pelo Alto Conselho (Iuran ✅, Athos pendente)
- [ ] Contratos de API definidos para os 3 novos endpoints
- [ ] Story Pack preparado por Leticia com allowed-context
- [ ] Mockups do Painel de Predição (Beto/Victor)

### Definition of Done (DoD)
- [ ] Conversion Predictor retornando CPS para qualquer `UXIntelligence` input
- [ ] Pelo menos 3 variações de anúncio geradas por funil analisado
- [ ] Brand Voice Compliance validado (toneMatch ≥ 0.75)
- [ ] Text Input funcional no Discovery Hub (URL + Texto colado)
- [ ] Multi-tenant testado (zero vazamento entre brands)
- [ ] Build limpo na Vercel (sem erros de importação)
- [ ] Smoke test dos novos endpoints passando (200 OK)

---

## 9. Riscos & Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|:------|:-------------|:--------|:----------|
| CPS impreciso (sem dados históricos reais) | Alta | Médio | Usar heurísticas baseadas em frameworks consagrados (Schwartz, Brunson) + disclaimers claros na UI |
| Token budget estourado na geração de ads | Média | Alto | Limitar a 5 variações, usar `cost-guard.ts`, chunking de contexto |
| Brand Voice Validator rejeita muitas variações | Média | Médio | Threshold dinâmico (iniciar em 0.70, subir para 0.75 gradualmente) |
| Transcrições de VSL com formato irregular | Alta | Baixo | Parser robusto com fallback para análise genérica de texto |
| Sobrecarga no Gemini API (muitas gerações) | Baixa | Alto | Queue com rate limiting + cache de variações populares |

---

## 10. Métricas de Sucesso (KPIs Sprint 25)

| KPI | Meta | Medição |
|:----|:-----|:--------|
| Time to First Ad (TTFA) | < 5 minutos | Timestamp: extração → ad gerado |
| CPS Coverage | 100% dos funis analisados têm score | Count de funis com CPS / total |
| Ad Variations por funil | ≥ 3 variações | Média de ads gerados por request |
| Brand Voice Pass Rate | ≥ 80% | Ads com toneMatch ≥ 0.75 / total |
| Multi-Input Adoption | ≥ 20% dos inputs via texto | Inputs texto / total inputs |
| Zero vazamento multi-tenant | 0 incidentes | Testes de isolamento |

---

*PRD gerado por Iuran (PM) — Conselho de Funil Agency Engine*  
*Sprint 25: Predictive & Creative Engine | 06/02/2026*  
*"De dados para lucro em 3 cliques."*
