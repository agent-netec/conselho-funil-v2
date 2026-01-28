---
id: 058f016d-b3ff-4e03-916c-f366a6cf7a9d
counselor: wilder
docType: case
version: 2026-01-11.v2
---
# Brain do Conselho (canônico)

- Raiz: `_netecmt/brain/` (fonte única do Brain).
- Frontmatter mínimo (contrato `brain-sync`): `id`, `counselor`, `docType` (identity|heuristic|scorecard|case), `version` (YYYY-MM-DD.vN). Campos extras são permitidos.
- Estrutura sugerida: `council/`, `social/`, `business/_template/`, `templates/`, `meta/`, `library/`, `assets/`, `case-library/`, `anti-patterns/`, `playbooks/`, `mental-models/`, `contradictions/`, `failure-patterns/`, `decisions/`.
- Comandos: `npm run brain:audit`, `npm run brain:sync`, `npm run brain:clean`.
- Origem: migrado de `brain/second brain/brain/` em 2026-01-11.
- Legado: arquivos diferentes encontrados em `brain/social` foram guardados em `_netecmt/brain/social-legacy/` para revisão.