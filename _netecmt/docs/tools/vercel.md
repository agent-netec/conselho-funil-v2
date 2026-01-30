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

## 🌐 Resolucao de Problemas de Conexao (Proxy) - TRAVA OBRIGATORIA
**ATENCAO:** Devido ao incidente da Sprint 16, o uso da trava de proxy e **OBRIGATORIO** para qualquer comando `vercel`. O CLI falha silenciosamente ou com `ECONNREFUSED` se o proxy local (Porta 9) estiver ativo.

Execute sempre:
```powershell
# PowerShell (Obrigatorio)
$env:HTTP_PROXY=""; $env:HTTPS_PROXY=""; $env:ALL_PROXY=""; vercel --prod
```

## 🔑 Variaveis de Ambiente
As variaveis listadas em `app/.env.example` devem ser cadastradas no painel da Vercel (Settings -> Environment Variables).

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
- [ ] O Root Directory esta definido como `app`?

## 🚨 Troubleshooting
- **Build Error (Fonts/Network)**: Verifique se `optimizeFonts: false` esta no `next.config.ts`.
- **Hydration Error**: Verifique se as paginas de dashboard tem `"use client"` no topo.
- **Module Not Found (fs/path)**: Verifique se o código de servidor (Pinecone) esta isolado com guards de `typeof window`.
