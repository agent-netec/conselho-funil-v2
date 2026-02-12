# INCIDENT REPORT: CRON_SECRET Whitespace - Build Failure Total (0ms)
**Status:** Resolvido | **Severidade:** Critica (P0 - Build Blocker)
**Data:** 12 de Fevereiro de 2026
**Duracao do impacto:** ~25 horas (11/Fev 17:24 ate 12/Fev 19:05)
**Deploys afetados:** 7 consecutivos

---

## 1. RESUMO EXECUTIVO

Todos os deploys do projeto `app` na Vercel passaram a falhar instantaneamente (0ms de build, status "Error") a partir do commit `eb69350da` em 11/Fev as 17:24. O build nunca iniciava - nenhum `npm install`, nenhum `next build`. A causa raiz foi a variavel de ambiente `CRON_SECRET` cadastrada com um caractere `\n` (newline) no final do valor, o que viola a validacao de headers HTTP da Vercel.

---

## 2. TIMELINE DO INCIDENTE

| Horario (BRT) | Evento |
| :--- | :--- |
| 11/Fev 17:08 | Ultimo deploy bem-sucedido (`app-r0i2a0sex`, commit `5904e124`) |
| 11/Fev ~17:20 | `CRON_SECRET` adicionada via CLI com `\n` no valor |
| 11/Fev 17:24 | Primeiro deploy falhando (`app-osnmgtsfz`, commit `eb69350d`) |
| 11/Fev 17:24 - 12/Fev 16:57 | 6 deploys consecutivos falhando (commits `eb69350` a `b035601`) |
| 12/Fev 18:42 | Diagnostico iniciado - logs revelam erro de `CRON_SECRET` |
| 12/Fev 18:58 | Variavel corrigida via `printf` (sem newline) |
| 12/Fev 19:02 | Redeploy disparado (`app-6nukgezuf`) |
| 12/Fev 19:05 | Deploy com sucesso - status `Ready`, aliases restaurados |

---

## 3. CAUSA RAIZ

### 3.1. O que aconteceu
A variavel de ambiente `CRON_SECRET` foi cadastrada na Vercel usando o comando:
```bash
# ERRADO - echo adiciona \n ao final
echo "valor" | vercel env add CRON_SECRET production
```

O `echo` sempre adiciona um caractere newline (`\n`) ao final da string. Quando a Vercel recebeu o valor `691195ad...f2b8\n`, armazenou com o `\n` literal.

### 3.2. Por que o build quebrou
A Vercel, a partir da CLI v50.15.1, valida **todas** as env vars antes de iniciar o build. A `CRON_SECRET` e usada como valor do header `Authorization: Bearer <CRON_SECRET>` nos cron jobs. Headers HTTP nao podem conter whitespace no inicio/final (RFC 7230). A validacao falha **antes** de qualquer etapa de build:

```
Error: The `CRON_SECRET` environment variable contains leading or trailing whitespace,
which is not allowed in HTTP header values.
Learn More: https://vercel.link/securing-cron-jobs
```

### 3.3. Por que nao foi detectado imediatamente
- O erro de `0ms` no build nao exibe mensagem no dashboard da Vercel (apenas "Error")
- O GitHub Actions CI **nao testa** variaveis de ambiente da Vercel - passou normalmente
- O commit `eb69350da` (indexes do Firestore) nao tinha relacao com o erro, criando falsa pista
- O projeto `conselho-funil-v2-final-flat-2` deployava com sucesso do **mesmo commit** porque nao tinha a env var `CRON_SECRET`

### 3.4. Valor original vs. corrigido
```
# ANTES (com \n)
CRON_SECRET="691195ad4d1ceb7da573577d4bf3b539e66c2fe00d702bc2a15aced2aa37f2b8\n"

# DEPOIS (limpo)
CRON_SECRET="691195ad4d1ceb7da573577d4bf3b539e66c2fe00d702bc2a15aced2aa37f2b8"
```

---

## 4. CORRECAO APLICADA

### 4.1. Remocao e recriacao da variavel
```bash
# 1. Remover a variavel contaminada
echo y | vercel env rm CRON_SECRET production

# 2. Recriar usando printf (SEM newline)
printf "691195ad4d1ceb7da573577d4bf3b539e66c2fe00d702bc2a15aced2aa37f2b8" | vercel env add CRON_SECRET production

# 3. Validar o valor limpo
vercel env pull .env.check --environment production
grep "CRON_SECRET" .env.check
# Esperado: CRON_SECRET="...f2b8" (sem \n)
```

### 4.2. Redeploy
```bash
vercel redeploy <url-do-ultimo-deploy> --no-wait
```

---

## 5. IMPACTO

| Metrica | Valor |
| :--- | :--- |
| **Tempo de inatividade** | ~25 horas de deploys bloqueados |
| **Deploys perdidos** | 7 (todos com status "Error") |
| **Producao afetada** | Nao - o ultimo deploy `Ready` continuou servindo |
| **Commits acumulados** | 5 commits sem deploy em producao |
| **CI afetado** | Nao - GitHub Actions continuou passando |

---

## 6. DIRETRIZES NOVAS (SALVAGUARDAS)

### Regra 15 - Sanitizacao de Environment Variables
**Ao adicionar env vars via CLI, NUNCA usar `echo`. Sempre usar `printf`:**
```bash
# CORRETO
printf "valor_sem_whitespace" | vercel env add NOME_VAR production

# ERRADO - echo adiciona \n
echo "valor" | vercel env add NOME_VAR production
```

### Regra 16 - Validacao Pos-Cadastro de Env Vars
**Apos cadastrar qualquer env var, OBRIGATORIO validar:**
```bash
vercel env pull .env.check --environment production
grep "NOME_VAR" .env.check
# Verificar: sem \n, sem espacos, sem caracteres invisíveis
rm .env.check
```

### Regra 17 - Diagnostico de Build 0ms
**Se um deploy falhar com 0ms de build (Error instantaneo), verificar nesta ordem:**
1. `vercel inspect <deploy-url> --logs` - ler a mensagem de erro real
2. Se mencionar "whitespace" em env var -> corrigir com `printf` + `vercel env rm/add`
3. Se nao houver logs -> verificar Ignored Build Step no dashboard
4. Nunca assumir que o codigo e a causa se o build nao chega a rodar

### Regra 18 - Deploy via CLI Proibido na Raiz
**Nunca rodar `vercel --prod` na raiz do repo.** O CLI tenta subir 1.6GB (inclui `.git/` e `node_modules/`). Usar apenas:
```bash
# Opcao A: Redeploy via CLI (preferido)
vercel redeploy <deploy-url> --no-wait

# Opcao B: Push para o GitHub (deploy automatico)
git push origin master

# Opcao C: Deploy manual do dashboard
# Vercel Dashboard > Deployments > Redeploy (sem cache)
```

### Regra 19 - Cron Jobs e CRON_SECRET
**A variavel `CRON_SECRET` e critica para o funcionamento dos cron jobs:**
- Deve existir APENAS no environment `Production`
- O valor deve ser um hash hex de 64 caracteres (SHA-256)
- A rota `/api/cron/*` no `vercel.json` depende dessa variavel para autenticacao
- Sem ela, os cron jobs ainda executam mas sem protecao contra chamadas externas

---

## 7. CHECKLIST PRE-DEPLOY ATUALIZADO

Adicionar ao checklist existente em `_netecmt/docs/tools/vercel.md`:

- [ ] Variaveis de ambiente validadas com `vercel env pull`? (sem whitespace)
- [ ] `CRON_SECRET` presente no environment Production? (sem `\n`)
- [ ] Deploy disparado via `git push` ou `vercel redeploy`? (nunca `vercel --prod` na raiz)

---

## 8. COMO REPRODUZIR (PARA REFERENCIA)

```bash
# Isto QUEBRA o build:
echo "qualquer-valor" | vercel env add CRON_SECRET production
# O echo injeta \n, a Vercel rejeita no pre-build

# Isto FUNCIONA:
printf "qualquer-valor" | vercel env add CRON_SECRET production
# printf nao adiciona \n
```

---

*Gerado pelo Agente de Estabilizacao NETECMT - Incidente #2*
*Referencia cruzada: INCIDENT-2026-01-27-BUILD-RECOVERY.md (Incidente #1)*
