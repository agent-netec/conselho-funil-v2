# Story Distilled: ST-19-1-autopsy-engine

## Contexto
Implementação do motor de análise forense de funis. Este motor é o coração da Sprint 19, permitindo que a plataforma analise URLs externas e forneça diagnósticos baseados nos playbooks do Conselho.

## Requisitos Técnicos
- Utilizar `gemini-1.5-pro` para análise de copy.
- Integrar com `Browser MCP` via Agente Monara.
- Seguir estritamente o `funnel-autopsy-spec.md`.

## Definição de Pronto (DoD)
- [ ] Endpoint de API testado e retornando JSON válido.
- [ ] Scraping capturando texto e estrutura da página.
- [ ] Heurísticas gerando scores de 0 a 10.
- [ ] Logs de execução armazenados corretamente.
