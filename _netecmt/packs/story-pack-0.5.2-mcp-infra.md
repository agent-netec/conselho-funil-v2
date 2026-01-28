# 📦 Story Pack: ST-0.5.2 - MCP Docker & Cloud Run Orchestration

## 🎯 Objetivo
Configurar e documentar os MCPs disponíveis no Docker para que os agentes possam realizar pesquisas, scraping e deploys sem erros de permissão ou falta de contexto.

## 📝 User Stories
- **Como** agente NETECMT, **quero** utilizar o Stripe MCP para validar planos de pagamento.
- **Como** sistema, **quero** usar o Browser MCP para scraping imune a CORS.
- **Como** arquiteto, **quero** configurar o Cloud Run MCP como nosso Heavy Worker.

## 🛠️ Critérios de Aceite
1.  **Stripe/Exa Keys:** Identificar se chaves estão no `.env.local`.
2.  **Cloud Run Roadblock:** Gerar instrução para o User sobre o `credentials_path`.
3.  **Browser MCP:** Validar que o agente consegue snapshotar uma URL protegida.

## 📋 Lista para o User (Liberar Caminho)
User, para esta Story, preciso que você:
- [ ] Forneça o path absoluto para o seu `google_credentials.json` (para o Cloud Run).
- [ ] Confirme se as chaves `STRIPE_SECRET_KEY` e `EXA_API_KEY` estão no seu ambiente.

