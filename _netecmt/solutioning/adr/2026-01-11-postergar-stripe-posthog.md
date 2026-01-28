---
adr: "Postergação de chaves Stripe/PostHog"
date: 2026-01-11
status: accepted
context: "Sprint 0.0 (Ferramentaria & Governança)"
decision: "Prosseguir sem habilitar billing (Stripe) e analytics (PostHog) até o usuário fornecer as chaves."
---

# Contexto
- Sprint 0.0 focou em destravar ferramental (MCPs/CLIs) e permissões.
- Roadblocks de chaves: Exa, Firecrawl e Pinecone já constam no `.env`; Stripe e PostHog não foram entregues.

# Decisão
- Marcar ST-0.0.3 como concluída registrando que Stripe e PostHog ficam pendentes.
- Não bloquear demais entregas da sprint por ausência dessas chaves.

# Consequências
- Funções de billing e telemetria avançada permanecem inativas até provisionamento.
- Quando as chaves forem fornecidas, reabrir um item de liberação leve para validar integrações.
