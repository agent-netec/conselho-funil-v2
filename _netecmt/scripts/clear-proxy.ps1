# Script para limpar configuracoes de proxy do sistema
# Executar ANTES de qualquer operacao Git/Vercel

# Limpar variaveis de ambiente da sessao
$env:HTTP_PROXY = $null
$env:HTTPS_PROXY = $null
$env:NO_PROXY = $null

# Limpar configuracoes Git (local e global)
git config --global --unset http.proxy
git config --global --unset https.proxy
git config --unset http.proxy
git config --unset https.proxy

# Verificar status
Write-Host "Proxy limpo. Verificando conexao..."
Test-NetConnection github.com -Port 443
