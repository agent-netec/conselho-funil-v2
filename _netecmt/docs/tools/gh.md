---
title: GitHub CLI (gh) - Guia de Liberacao
status: approved
owner: Monara (Integrator)
permitted_agents:
  - Darllyson (Dev)
  - Luke (Release)
  - Monara (Integrator)
  - Wilder (Analyst)
last_review: 2026-01-31
---

# O que faz
- Cria e gerencia Pull Requests no GitHub via CLI.
- Consulta status, lista PRs e exibe detalhes de revisao/checks.

# Pre-requisitos
- GitHub CLI instalado e acessivel no PATH.
- Autenticacao valida no GitHub.
- Token com escopos minimos: `repo` e `read:org`.
  - Para ler checks: `workflow` (opcional).

# Comandos permitidos (principais)
- `gh auth login`
- `gh auth status`
- `gh auth logout`
- `gh repo view`
- `gh pr create`
- `gh pr view`
- `gh pr list`
- `gh pr checks`
- `gh pr comment`

# Fluxo recomendado
1) Validar autenticacao: `gh auth status`.
2) Garantir branch atual e push feito via Git.
3) Criar PR com titulo e corpo padronizado.
4) Validar checks: `gh pr checks`.

# Exemplos (PowerShell)
## Autenticacao com token
```powershell
$env:GH_TOKEN = "<SEU_TOKEN_AQUI>"
echo $env:GH_TOKEN | gh auth login --with-token
gh auth status
```

## Criar PR com corpo padronizado
```powershell
@"
## Summary
- Descreva o objetivo da mudanca

## Test plan
- [ ] Descreva os testes executados
"@ | gh pr create --title "Titulo do PR" --body-file -
```

## Ver checks do PR atual
```powershell
gh pr checks
```

# Regras de seguranca
- Nunca registrar tokens no repositorio nem em arquivos versionados.
- Evitar colar segredos no corpo do PR.
- Nao usar `gh api` para operacoes de escrita sem liberacao explicita.
