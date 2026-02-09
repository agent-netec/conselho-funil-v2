# Contract: Deep Research

## Lane
- `deep_research`

## Escopo
- Pipeline Exa + Firecrawl + síntese Gemini
- Geração de dossiê de mercado (chunked 2 fases)
- Persistência Firestore com cache 24h
- API de geração/listagem de dossiês
- UI de Deep Research (form + lista + viewer)

## Tipos
- `ResearchQuery`, `ResearchSource`
- `MarketDossier`, `MarketDossierSections`
- `ResearchDepth`, `ResearchStatus`, `ResearchProvider`

## APIs
- `POST /api/intelligence/research`
- `GET /api/intelligence/research`

## Regras
- Cache obrigatório antes de gerar novo dossiê
- Fallback/graceful degradation obrigatório
- Attribution obrigatório em fontes (`url` + `provider`)
- Isolamento por `brandId`
