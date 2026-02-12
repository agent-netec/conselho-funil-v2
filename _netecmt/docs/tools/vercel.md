# 🚀 Guia de Deploy: Vercel (NETECMT)

Este guia detalha a configuracao e o processo de deploy para a plataforma Vercel.

## ⚙️ Configuracoes Obrigatorias
Para que o projeto funcione corretamente na Vercel, as seguintes configuracoes devem estar no Dashboard:

1. **Root Directory**: `app`
   - Isso garante que a Vercel ignore a raiz do monorepo e foque apenas na aplicacao Next.js.
   - **IMPORTANTE**: O projeto oficial vinculado e o `app` (`app-rho-flax-25.vercel.app`).
2. **Framework Preset**: `Next.js`
3. **Build Command**: `npm run build` (que executa `next build`)
4. **Output Directory**: `.next`

## ✅ Projeto oficial e dominio (obrigatorio)
- **Projeto oficial:** `app`
- **Dominio de producao:** `app-rho-flax-25.vercel.app`
- **Nunca** publicar no projeto `conselho-funil-v2-final-flat-2`.

## ✅ Comandos permitidos (Vercel CLI)
Todos os comandos abaixo devem usar a **trava de proxy** obrigatoria.
- `vercel link`
- `vercel env ls`
- `vercel env pull`
- `vercel redeploy <deploy-url> --no-wait` (metodo preferido de deploy)

### Deploy via CLI - NUNCA na raiz do repo (Incidente #2)
**PROIBIDO:** `vercel --prod` na raiz do repositorio. O CLI tenta subir 1.6GB (inclui `.git/` e `node_modules/`).
**Usar apenas:**
1. `git push origin master` (deploy automatico via GitHub integration)
2. `vercel redeploy <deploy-url> --no-wait` (redeploy de um deploy existente)
3. Dashboard > Deployments > Redeploy sem cache (manual)

### Re-link seguro do CLI para o projeto `app`
Use este procedimento quando o CLI estiver apontando para o projeto errado.
1. Rode o comando abaixo e selecione o projeto `app` quando solicitado.
```powershell
# PowerShell (Obrigatorio)
$env:HTTP_PROXY=""; $env:HTTPS_PROXY=""; $env:ALL_PROXY=""; vercel link
```
2. Confirme que o CLI esta vinculado ao projeto `app`:
```powershell
# PowerShell (Obrigatorio)
$env:HTTP_PROXY=""; $env:HTTPS_PROXY=""; $env:ALL_PROXY=""; vercel env ls
```
3. Se o dominio exibido nao for `app-rho-flax-25.vercel.app`, repita o passo 1.

### Verificacao rapida do vinculo do CLI
- Confira se o CLI esta ligado ao projeto `app` (dominio `app-rho-flax-25.vercel.app`).
- Se estiver ligado a outro projeto, re-vincule antes do deploy.

## 🌐 Resolucao de Problemas de Conexao (Proxy) - TRAVA OBRIGATORIA
**ATENCAO:** Devido ao incidente da Sprint 16, o uso da trava de proxy e **OBRIGATORIO** para qualquer comando `vercel`. O CLI falha silenciosamente ou com `ECONNREFUSED` se o proxy local (Porta 9) estiver ativo.

Execute sempre:
```powershell
# PowerShell (Obrigatorio)
$env:HTTP_PROXY=""; $env:HTTPS_PROXY=""; $env:ALL_PROXY=""; vercel --prod
```

## 🔑 Variaveis de Ambiente
As variaveis listadas em `app/.env.example` devem ser cadastradas no painel da Vercel (Settings -> Environment Variables).

### Cadastro via CLI - TRAVA DE SANITIZACAO (Incidente #2)
**ATENCAO:** Nunca usar `echo` para passar valores ao `vercel env add`. O `echo` injeta `\n` (newline) no final, o que causa falha silenciosa de build (0ms, status "Error").

```powershell
# CORRETO - printf nao adiciona \n
printf "valor_limpo" | vercel env add NOME_VAR production

# ERRADO - echo adiciona \n ao final
echo "valor" | vercel env add NOME_VAR production
```

### Validacao obrigatoria apos cadastro
Apos adicionar ou alterar qualquer env var, SEMPRE validar:
```powershell
vercel env pull .env.check --environment production
grep "NOME_VAR" .env.check
# Verificar: sem \n, sem espacos extras, sem caracteres invisiveis
rm .env.check
```

### CRON_SECRET (variavel critica)
- Deve existir APENAS no environment `Production`
- Valor: hash hex de 64 caracteres (SHA-256), sem whitespace
- Usada para autenticacao dos cron jobs em `/api/cron/*`
- Se contiver whitespace, o build falha ANTES de iniciar (0ms)
- Referencia: `incidents/INCIDENT-2026-02-12-CRON-SECRET-WHITESPACE.md`

## 🔄 Processo de Redeploy
Se o site apresentar erros estranhos ou nao atualizar, realize um redeploy limpo:
1. Va na aba **Deployments**.
2. Clique nos `...` do deploy desejado.
3. Selecione **Redeploy**.
4. Desmarque a opcao **"Use existing Build Cache"**.

## 🛡️ Checklist Pre-Deploy
- [ ] O build local (`npm run build`) passa sem erros?
- [ ] O console do navegador esta limpo (Zero Runtime Errors)?
- [ ] Todas as variaveis de ambiente estao configuradas na Vercel?
- [ ] Env vars validadas com `vercel env pull`? (sem whitespace/newlines)
- [ ] `CRON_SECRET` presente em Production? (sem `\n`)
- [ ] O Root Directory esta definido como `app`?
- [ ] Deploy sera via `git push` ou `vercel redeploy`? (nunca `vercel --prod` na raiz)

## 🚨 Troubleshooting
- **Build Error 0ms (Error instantaneo)**: Rodar `vercel inspect <url> --logs` para ver a mensagem real. Se mencionar "whitespace" em env var, corrigir com `printf` + `vercel env rm/add`. Ref: Incidente #2.
- **Build Error (Fonts/Network)**: Verifique se `optimizeFonts: false` esta no `next.config.ts`.
- **Hydration Error**: Verifique se as paginas de dashboard tem `"use client"` no topo.
- **Module Not Found (fs/path)**: Verifique se o codigo de servidor (Pinecone) esta isolado com guards de `typeof window`.
- **CLI upload 1.6GB travado**: Nao usar `vercel --prod` na raiz. Usar `vercel redeploy` ou `git push`.
