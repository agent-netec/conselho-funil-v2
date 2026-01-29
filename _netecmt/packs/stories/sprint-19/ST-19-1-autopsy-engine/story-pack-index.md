# Story Pack: ST-19-1-autopsy-engine
ID: ST-19-1
Lane: funnel-autopsy

## Contents
- [Story Distilled](story-distilled.md)
- [Lane Contract](../../../contracts/funnel-autopsy-spec.md)

## Success Criteria
- Endpoint `POST /api/intelligence/autopsy/run` funcional.
- Integração com Browser MCP para captura de snapshot e screenshot.
- Implementação das 5 heurísticas base (Hook, Story, Offer, Friction, Trust).
- Salvamento do resultado no Firestore seguindo o schema definido no contrato.
