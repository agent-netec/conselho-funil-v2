# ADR: Restart from Zero vs. Solução Focada (Party Mode)

**Data:** 2026-02-03  
**Contexto:** Sessão Party Mode (/ps). Usuário relatou 2 dias reconfigurando rotas e smoke tests que sempre devolvem erro, looping de diagnósticos e muitas tarefas manuais. Pergunta: é melhor começar o projeto do zero ou existe solução?

---

## [IURAN — PM]

O produto não está “quebrado em tudo”. O relatório QA (ST-22-00) mostra:

- **Já OK:** `/api/intelligence/keywords` (200), `/api/chat` (200), `/api/assets/metrics` (200 com brandId), `/api/intelligence/spy` (404 tratado quando competitor não existe), autopsy e ingest retornam **422 tratado** (mensagem clara de scraping).
- **Problemas reais:** (1) `/api/intelligence/spy` retorna **500** com payload válido (competitor existente) — regressão; (2) smoke tests exigem 200 em rotas que legitimamente podem retornar 422 (scraping); (3) não há um único comando/script que rode todos os P0 com critério de “sucesso” bem definido; (4) muita etapa manual (Postman, brandId no LocalStorage, tokens, etc.).

Recomendo **não** reiniciar o projeto. O custo de recomeçar é alto e não resolve as causas reais (um bug no spy, critérios de smoke inadequados, falta de automação única).

---

## [ATHOS — Arquiteto]

A base é brownfield estável: Firebase, Gemini, Pinecone, rotas Next.js e contratos já existem. O `contract-map` e a matriz env↔endpoint estão documentados. O 500 em `/api/intelligence/spy` vem do `catch` genérico da rota (linhas 137–143): alguma exceção não tratada em `getCompetitorProfile`, `SpyAgent.scan` ou `updateCompetitorProfile`. Isso é bug pontual, não falha arquitetural. Reiniciar do zero não corrige esse bug e ainda perde toda a integração já feita.

---

## [DANDARA — QA]

Os smoke atuais (`api-smoke.spec.ts`) cobrem só 2 endpoints e esperam **sempre 200**. No mundo real, ingest e autopsy podem retornar **422** (scraping sem conteúdo ou parser falhou). Ou seja, o teste está **mal especificado**: falha mesmo quando o sistema se comporta como documentado no `smoke-tests.md`. O bloqueio de “ferramenta não permite POST” pode ser contornado com script Node/curl local (um único `npm run smoke` com variáveis de ambiente). Conclusão: o problema é especificação e automação dos smoke, não “tudo falhando”.

---

## [LETICIA — SM]

Sprint 22 já tem várias tarefas concluídas (ST-22.3 a ST-22.5, ST-22.7). ST-22.6 (QA pós-deploy) está pendente por insumos e por critérios de smoke pouco realistas. Fazer um “restart do projeto” invalida esse trabalho e gera retrabalho enorme. Melhor: uma **mini-iniciativa de destravamento** (1–2 dias) com escopo claro: (1) corrigir 500 do spy, (2) alinhar smoke à matriz de aceitação (200 ou 422 onde aplicável), (3) um script único de smoke com pass/fail claro.

---

## [DARLLYSON — Dev]

O 500 em `/api/intelligence/spy` ocorre quando o fluxo padrão (scan) executa e algo lança exceção antes de retornar 502. Possíveis causas: `SpyAgent.scan(competitor)` (rede, Puppeteer, timeout) ou `updateCompetitorProfile` (Firestore). Basta isolar o trecho e tratar/mapear para 502 com mensagem, em vez de deixar cair no catch genérico. Quanto aos smoke: um script em Node (fetch) ou Playwright com expectativas corretas (por exemplo, 200 ou 422 para ingest/autopsy) reduz trabalho manual e evita o loop “rode de novo / veja env / veja brandId”.

---

## Decisão (Veredito do Alto Conselho)

- **Não reiniciar o projeto do zero.**  
- **Adotar solução focada em 3 eixos:**

1. **Corrigir o 500 do spy**  
   - Garantir que erros em `SpyAgent.scan` ou persistência retornem 502 (e mensagem), e que 500 só apareça em falha realmente inesperada (ex.: se for o caso, logar e retornar 500 com mensagem genérica controlada).

2. **Alinhar smoke tests à realidade**  
   - Para rotas que dependem de scraping (ingest/url, autopsy/run): considerar **sucesso** quando retornarem 200 **ou** 422 com corpo tratado (mensagem de scraping).  
   - Manter “zero 500” como critério global de smoke.

3. **Um comando único de smoke**  
   - Um único script (ex.: `npm run smoke` ou `node scripts/smoke-p0.js`) que:  
     - Use base URL (ex.: prod) e, se necessário, `TEST_BRAND_ID` / `TEST_USER_ID` / `TEST_TARGET_URL` (ou mocks onde fizer sentido).  
     - Chame todos os P0 do `smoke-tests.md`.  
     - Aplique a matriz de aceitação (200/400/404/422 conforme documento).  
   - Objetivo: você rodar **uma vez** e ver pass/fail por endpoint, sem Postman manual para cada rota.

---

## Próximos passos sugeridos

| Quem     | Ação |
|----------|------|
| **Darllyson** | Corrigir 500 em `/api/intelligence/spy` (tratamento explícito → 502; evitar 500 genérico). |
| **Dandara**   | Atualizar critérios de smoke (doc + script ou Playwright) para aceitar 200 ou 422 em ingest/autopsy; manter zero 500. |
| **Darllyson** | Implementar script único `smoke-p0` (Node ou Playwright) com pass/fail por endpoint e documentar em `smoke-tests.md`. |
| **Você**      | Após o script: rodar `npm run smoke` (ou equivalente) com as env necessárias; usar o resultado como evidência de estabilidade. |

---

## Consequências

- Você deixa de depender de muitas etapas manuais e de rodar smoke “no escuro”.  
- O loop “sempre erro” quebra quando o critério de sucesso for “sem 500 + respostas tratadas”.  
- O projeto continua evoluindo em cima da base atual, sem custo de restart.

---

*Assinado: Alto Conselho NETECMT (Party Mode).*
