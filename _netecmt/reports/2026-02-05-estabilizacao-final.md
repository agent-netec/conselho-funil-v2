# 🛡️ Relatório de Estabilização e Handoff - Sprint 22
**Data**: 05/02/2026
**Status**: CONCLUÍDO (Sistema Estabilizado em Produção)

## 1. O que foi feito (Resumo Técnico)
- **Padronização de IA**: Migração total do modelo `gemini-2.0-flash-exp` (experimental) para `gemini-2.0-flash` (estável na v1beta).
- **Correção de Rotas P0**:
    - Resolvido Erro 405/500 em `/api/intelligence/autopsy/run` através da correção da assinatura da rota (`NextRequest`) e sincronização de dependências.
    - Estabilização do **Spy Agent** com tratamento de erro 502 para falhas de scraping/tech-stack.
- **Governança de Git**: 
    - Limpeza do repositório: Remoção de `node_modules` e `.next` que estavam sendo trackeados indevidamente.
    - Configuração de `.gitignore` robusto para evitar arquivos > 100MB que bloqueavam o deploy.
- **Validação**: Execução de Smoke Test P0 em produção com 100% de sucesso (6/6 endpoints críticos).

## 2. Pontos de Atenção (Guardrails para Próximas Etapas)

### 🚨 Travas de Segurança (Anti-Erro)
1. **Modelos de IA**: NUNCA utilize sufixos `-exp` em produção. O padrão do projeto é `gemini-2.0-flash`. Qualquer alteração deve ser refletida no `AICostGuard`.
2. **Deploy Vercel**: Se um deploy falhar sem erro aparente de código, verifique o tamanho dos arquivos no Git. O limite do GitHub é 100MB. Use `git rm -r --cached` se necessário.
3. **Assinaturas de Rota**: No Next.js 15+, sempre use `NextRequest` e `NextResponse` explicitamente para evitar erros de Method Not Allowed (405).

### 🛠️ Infraestrutura e MCPs
- **Scraping**: O sistema utiliza fallback entre Jina Reader e scraping local. Se o Jina falhar, o erro 422 é esperado e deve ser tratado na UI.
- **Firestore**: O `brandId: test_brand_seed` deve ser preservado para testes de fumaça.

## 3. Próximos Passos Sugeridos
1. **Monitoramento de Custos**: Observar a coleção `usage_logs` no Firestore para validar o cálculo de tokens do novo modelo.
2. **Escalabilidade de Scraping**: Implementar o **Firecrawl** como MCP primário para reduzir erros 422 em sites protegidos por Cloudflare.
3. **Refatoração de UI**: Sincronizar os estados de loading do Discovery Hub com os novos tempos de resposta (mais rápidos) do Gemini Flash.

---
*Documento gerado para orientação de todos os agentes (Iuran, Athos, Leticia, Darllyson).*
