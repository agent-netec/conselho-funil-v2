---
title: Firecrawl MCP - Guia de Liberação
status: approved
owner: Kai (Integrator)
permitted_agents:
  - Athos (Arch)
  - Darllyson (Dev)
  - Kai (Integrator)
last_review: 2026-01-11
---

# O que faz
- URL → Markdown limpo para ingestão/RAG.

# Status
- Aprovado (chave `FIRECRAWL_API_KEY` necessaria). Usar apenas quando configurado.

# Comandos (quando ativo)
- `firecrawl_crawl`: converter página em markdown estruturado.

# Regras
- Não enviar dados sensíveis na URL.
- Evitar uso em sites que bloqueiem scraping; respeitar ToS.

# Troubleshooting: Connection Refused (Vercel)
Quando o Firecrawl funciona localmente, mas falha em produção com **Connection Refused**:
1. **Validar variáveis na Vercel**:
   - `FIRECRAWL_API_KEY` deve existir em **Production**.
   - `FIRECRAWL_WORKER_URL` deve apontar para `https://api.firecrawl.dev/v0/scrape` (ou proxy autorizado).
   - Comando permitido:
   ```powershell
   $env:HTTP_PROXY=""; $env:HTTPS_PROXY=""; $env:ALL_PROXY=""; vercel env ls
   ```
2. **Teste local de conectividade (chave/endpoint)**:
   - Este teste valida se a chave responde **200/success** fora da Vercel.
   ```powershell
   $env:HTTP_PROXY=""; $env:HTTPS_PROXY=""; $env:ALL_PROXY=""; `
   Get-Content app/.env.local | Where-Object { $_ -and ($_ -notmatch '^\s*#') } | `
   ForEach-Object {
     $parts = $_ -split '=',2
     if ($parts.Length -eq 2) {
       $name = $parts[0].Trim()
       $value = $parts[1]
       if ($value.StartsWith('"') -and $value.EndsWith('"')) {
         $value = $value.Substring(1, $value.Length - 2)
       }
       [System.Environment]::SetEnvironmentVariable($name, $value, 'Process')
     }
   }
   node -e '(async()=>{const endpoint=process.env.FIRECRAWL_WORKER_URL||"https://api.firecrawl.dev/v0/scrape";const key=process.env.FIRECRAWL_API_KEY; if(!key){console.error("FIRECRAWL_API_KEY ausente");process.exit(1)}; const res=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},body:JSON.stringify({url:"https://www.cloudflare.com/",pageOptions:{includeHtml:false,includeRawHtml:false,onlyMainContent:true,removeTags:["script","style","noscript"],screenshot:false,fullPageScreenshot:false},timeout:30000})}); const status=res.status; const payload=await res.json().catch(()=>({})); console.log("Firecrawl status",status,"success",payload?.success===true); if(!res.ok||!payload?.success){console.log("response",payload)} })().catch(e=>{console.error("erro",e);process.exit(1)})'
   ```
3. **Se falha apenas na Vercel**:
   - Verifique se há **restrição de IP/allowlist** no painel do Firecrawl (se aplicável).
   - Caso o Firecrawl exija allowlist, use **Static IPs** da Vercel para obter IPs fixos de saída e cadastrar no provedor.

# Exemplo (quando habilitado)
- `firecrawl_crawl`: url="https://vero.academy"
