# 🛠️ Guia de Troubleshooting: Proxy e Rede

Este guia detalha como resolver problemas de conexao causados por proxies locais que bloqueiam operacoes de Git e Vercel.

## 🚨 Sintomas
- Erros de `Failed to connect to github.com port 443 via 127.0.0.1:9`.
- Timeout em operacoes de `npm install` ou `vercel deploy`.
- Erros de `Connection reset` ao tentar dar `git push`.

## 🧹 Solucao Rapida (Script)
Sempre que encontrar problemas de rede, execute o script de limpeza:

```powershell
./_netecmt/scripts/clear-proxy.ps1
```

O que este script faz:
1. Limpa as variaveis de ambiente `$env:HTTP_PROXY` e `$env:HTTPS_PROXY`.
2. Remove configuracoes de proxy do Git (`git config --unset`).
3. Testa a conexao direta com o GitHub.

## ⚙️ Solucao Permanente (Windows)
Se o problema persistir, verifique as configuracoes do sistema:
1. Pressione `Win + R`, digite `inetcpl.cpl` e Enter.
2. Va na aba **Conexoes** -> **Configuracoes da LAN**.
3. Desmarque a opcao **"Usar um servidor proxy para a rede local"**.
4. Clique em OK.

## 🛡️ Verificacao
Apos limpar o proxy, voce deve conseguir rodar:
```bash
curl -I https://github.com
```
Se retornar `HTTP/2 200`, a conexao esta limpa.
