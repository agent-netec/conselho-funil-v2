# 🐙 Guia de Uso: Git (NETECMT)

Este guia define o workflow oficial de versionamento para o projeto Conselho de Funil.

## 📍 Remotes Oficiais
- **origin**: `https://github.com/agent-netec/conselho-funil-v2.git` (Repositório Principal)
- **Branch**: `master`

## 🔄 Workflow de Trabalho
1. **Sincronizacao**: Antes de iniciar, sempre puxe as ultimas mudancas.
   ```bash
   git pull origin master
   ```
2. **Commits**: Use mensagens claras seguindo o padrao Conventional Commits.
   - `feat:` para novas funcionalidades.
   - `fix:` para correcoes de bugs.
   - `docs:` para mudancas em documentacao.
3. **Push**: Envie suas mudancas para o master.
   ```bash
   git push origin master
   ```

## ⚠️ Resolucao de Problemas de Rede
Se o `git push` falhar com erro de proxy:
1. Execute o script de limpeza: `powershell ./_netecmt/scripts/clear-proxy.ps1`
2. Tente o push novamente.

## 🔒 Seguranca
- NUNCA suba arquivos `.env` ou chaves de API.
- Verifique se o `.gitignore` esta protegendo arquivos sensiveis.
- Se expuser um token acidentalmente, rotacione-o IMEDIATAMENTE.
