# Testes Manuais — Bugs e Problemas Encontrados

> **Data de início:** 2026-02-19
> **Testador:** Usuário (phsed)
> **Ambiente:** localhost:3001
> **Objetivo:** QA manual completo da plataforma antes de sprints de correção

---

## 📋 Formato de Report

Para cada bug encontrado, documentar:

```markdown
### BUG-XXX: Título curto do problema

**Severidade:** P0 (crítico) | P1 (alto) | P2 (médio) | P3 (baixo)
**Rota:** /caminho/da/pagina
**Reprodução:**
1. Passo 1
2. Passo 2
3. Resultado esperado vs resultado real

**Screenshot:** (se aplicável)
**Console errors:** (se houver)
**Sugestão de fix:** (opcional)
**Sprint sugerido:** Sprint Y / Sprint Z
```

---

## 💡 Sugestões de Melhoria (UX)

### SUG-001: Paleta de Cores — Assistência para Usuário

**Origem:** Teste manual em produção (2026-02-19)
**Rota:** `/brands/new` — Step "Visual" (Paleta de Cores)
**Problema:** Nem todo usuário sabe criar paletas de cores harmoniosas
**Sugestões:**
1. **Paletas pré-prontas** — Biblioteca curada (20-30 paletas por vertical: tech, saúde, luxo, etc.)
2. **Dicas inline** — Tooltips explicando teoria de cores básica
3. **IA extrai de referências:**
   - Upload de screenshot → Gemini Vision identifica paleta
   - Inserir URL de site → Scrape + extração de cores CSS
4. **Gerador automático** — Dada cor primária, sugerir secundária/destaque/fundo

**Sprint sugerido:** Brand Hub v2 Fase 3 (UX Melhorado)
**Prioridade:** P2 (melhoria de UX, não blocker)
**Status:** Documentado em `roadmap-brand-hub-v2.md`

---

### SUG-002: Tipografia — Falta de Opções de Fontes

**Origem:** Teste manual em produção (2026-02-19)
**Rota:** `/brands/new` — Step "Visual" (Tipografia)
**Problema:** Wizard oferece apenas "Inter" hardcoded. Sem opções de fontes.
**Impacto:** Campo parece "pro forma" — usuário não consegue personalizar tipografia
**Análise técnica:**
- ✅ Tipografia **ESTÁ CONECTADA** aos engines (ver análise abaixo)
- ❌ UI não oferece seleção de fontes
- Sistema injeta `typography.primaryFont` e `secondaryFont` nos prompts

**Sugestão:**
1. **Dropdown com 15-20 fontes Google Fonts** curadas
   - Headlines: Montserrat, Poppins, Roboto Condensed, Bebas Neue, Oswald
   - Corpo: Inter, Open Sans, Lato, Roboto, Nunito, Source Sans
2. **Preview ao vivo** da combinação escolhida
3. **IA sugere par de fontes** baseado no visual style (Minimalista → Sans-serif clean)

**Sprint sugerido:** Brand Hub v2 Fase 3
**Prioridade:** P2
**Status:** Aguardando implementação

---

### SUG-003: Seletor de Conselheiros — Falta de Contexto e Usabilidade

**Origem:** Teste manual em produção (2026-02-19)
**Rota:** `/chat` — Seletor "Alto Conselho"
**Problemas identificados:**

#### 1. Alto Conselho sem detalhes
- ❌ Mostra card "ALTO CONSELHO - SELECIONE ATÉ 3 ESPECIALISTAS"
- ❌ Não mostra **QUEM SÃO** os 3 especialistas do Alto Conselho
- ✅ **Deveria:** Mostrar avatares + nomes dos 3 experts (ex: Russell Brunson, Eugene Schwartz, Dan Kennedy)

#### 2. Sem mini resumo de expertise
- ❌ Cards mostram apenas nome do conselheiro (ex: "RUSSELL..." "JOSEPH S...")
- ❌ Não explica **ESPECIALIDADE** de cada um
- ✅ **Deveria:** Tooltip ou subtitle com expertise
  - Ex: "Russell Brunson - ARQUITETURA DE FUNIS"
  - Ex: "Eugene Schwartz - COPYWRITING CIENTÍFICO"
  - Ex: "Joseph Sugarman - NARRATIVA PERSUASIVA"

#### 3. Sem botão para fechar o seletor
- ❌ Após selecionar conselheiros, o modal/toggle **não fecha automaticamente**
- ❌ Bloqueia a tela, usuário não consegue escrever a pergunta
- ❌ Sem botão "X" ou "Confirmar" visível
- ✅ **Deveria:**
  - Auto-fechar após seleção (click no card já confirma)
  - OU botão "Confirmar seleção" no rodapé
  - OU botão "X" no canto superior direito

**Impacto UX:**
- Usuário não sabe quem está no "Alto Conselho"
- Não entende a especialidade de cada expert
- Fica preso no seletor sem conseguir prosseguir

**Solução:**
1. **Expandir cards com detalhes:**
   ```
   [Avatar] RUSSELL BRUNSON
   Arquitetura de Funis • Expert em VSL
   ```
2. **Tooltip hover:** Mostra bio completa do conselheiro
3. **Auto-fechar:** Click no card já adiciona à seleção e fecha modal
4. **Ou botão confirmar:** "Consultar esses 3 especialistas" (CTA claro)

**Arquivos afetados:**
- `app/src/app/chat/page.tsx` — Seletor de conselheiros
- `app/src/components/chat/counselor-selector.tsx` (se existir)

**Sprint sugerido:** Sprint J (UX Polish) ou Chat UX v2
**Prioridade:** P2
**Status:** Aguardando implementação

---

## 🐛 Bugs Reportados

<!-- Os bugs serão adicionados abaixo conforme forem encontrados durante os testes -->

### OBS-001: Email de Verificação Cai no Spam

**Tipo:** Observação (não é bug)
**Origem:** Teste manual em produção (2026-02-19)
**Rota:** `/signup` → Email verification
**Comportamento:**
- ✅ Email **É ENVIADO** corretamente
- ⚠️ Email **CAI NA PASTA SPAM** (Gmail/Yahoo)
- ✅ Funcionalidade está OK, mas reputação do domínio remetente precisa melhorar

**Impacto:** Usuários podem não ver o email e pensar que não funcionou
**Causa provável:** Firebase Auth emails sem SPF/DKIM/DMARC configurados
**Solução (futuro):**
1. Configurar domínio customizado para emails (ex: noreply@conselhodefunil.com)
2. Adicionar SPF, DKIM e DMARC records no DNS
3. Ou integrar SendGrid/Resend para emails transacionais
4. Adicionar mensagem na UI: "Verifique também a pasta de spam"

**Sprint sugerido:** Sprint R (Integrations Launch) ou Sprint de Infraestrutura
**Prioridade:** P3 (baixa - workaround: usuário checa spam)
**Status:** Documentado para melhoria futura

---

### BUG-001: Banner de verificação persiste após email confirmado

**Severidade:** P1 (alto — afeta UX de onboarding)
**Origem:** Teste manual em produção (2026-02-19)
**Rota:** Dashboard (após signup e verificação de email)
**Reprodução:**
1. Fazer signup
2. Receber email de verificação
3. Clicar no link do email
4. Email é verificado com sucesso
5. Voltar para o dashboard
6. ❌ Banner "Verifique seu email..." **ainda aparece**

**Causa raiz:**
- Arquivo: `app/src/components/layout/app-shell.tsx:166`
- O objeto `user` do Firebase Auth **não recarrega automaticamente** após verificação externa
- Banner checa `user.emailVerified` que está em cache desatualizado
- Usuário precisa fazer **reload manual** da página (F5) para atualizar

**Solução:**
1. **Curto prazo**: Adicionar botão "Já verifiquei" que chama `user.reload()` + recheck
2. **Melhor**: Polling a cada 5s checando `user.reload()` enquanto banner estiver visível
3. **Ideal**: Após clicar "Reenviar email", iniciar polling automático

**Código sugerido:**
```typescript
// Após verificação, fazer reload do user
const checkVerification = async () => {
  if (user) {
    await user.reload();
    // Estado será atualizado pelo onAuthStateChanged
  }
};
```

**Sprint sugerido:** Sprint Y (Integrity & Security) — Sessão 2
**Prioridade:** P1
**Status:** Aguardando correção

---

### BUG-002: Wizard de Brand perde progresso ao navegar

**Severidade:** P2 (médio — confunde fluxo de onboarding)
**Origem:** Teste manual em produção (2026-02-19)
**Rota:** `/brands/new` (wizard multi-step)
**Reprodução:**
1. Iniciar wizard de criação de marca
2. Avançar alguns steps
3. Navegar para outra página (ex: Brand Hub para ajustar config)
4. ❌ Perde o contexto de "quais steps ainda faltam"

**Comportamento esperado:**
- Wizard deveria mostrar "completeness" da marca (30%, 60%, 100%)
- Indicar quais steps foram pulados
- Permitir retomar configuração

**Observação:**
- Marca **É CRIADA** no Firestore após step "Confirm"
- Mas steps opcionais (Visual, Logo, AI Config) podem ser pulados
- Não há indicador visual de completude

**Solução:**
- Implementar "Brand Completeness Score" (documentado em roadmap Brand Hub v2 Fase 1)
- Badge visual: "Marca 60% configurada - Complete o Brand Hub"
- Link direto para continuar configuração

**Sprint sugerido:** Brand Hub v2 Fase 1 (Onboarding Unificado)
**Prioridade:** P2
**Status:** Já planejado no roadmap

---

### BUG-003: Primeira mensagem no chat "buga" e não envia

**Severidade:** P1 (alto — afeta experiência principal do produto)
**Origem:** Teste manual em produção (2026-02-19)
**Rota:** `/chat` — Primeira mensagem em nova conversa
**Reprodução:**
1. Abrir chat
2. Escrever primeira pergunta
3. Apertar Enter ou click em "Enviar"
4. ❌ Mensagem **não aparece** na tela
5. ❌ Conselheiros **não respondem**
6. Escrever segunda mensagem
7. ✅ Agora funciona normalmente

**Comportamento esperado:**
- Primeira mensagem deveria enviar e exibir normalmente
- Conselheiros deveriam processar e responder

**Causa provável:**
- Problema de inicialização de estado
- Possíveis causas:
  - Conversation ID não criado antes do primeiro envio
  - Chat context não carregado
  - WebSocket/listener não conectado
  - State do React não inicializado

**Impacto:**
- **Confunde usuário** — parece que o sistema não funciona
- Usuário pode desistir antes de tentar segunda vez
- Experiência de "primeira impressão" prejudicada

**Arquivos para investigar:**
- `app/src/app/chat/page.tsx` — Lógica de envio de mensagem
- `app/src/components/chat/chat-input-area.tsx` — Handler de submit
- `app/src/lib/hooks/use-chat.ts` ou similar — State management do chat

**Workaround para usuário:**
- Enviar qualquer mensagem duas vezes (segunda funciona)

**Sprint sugerido:** Sprint Y (Integrity & Security) — Sessão 1 (P0/P1 fixes)
**Prioridade:** P1
**Status:** Aguardando investigação + correção

---

### BUG-004: Geração de Design retorna 504 Gateway Timeout

**Severidade:** **P0 (CRÍTICO)** — Funcionalidade principal quebrada
**Origem:** Teste manual em produção (2026-02-19)
**Rota:** `/chat` — Conselho de Design → Geração de criativo
**Reprodução:**
1. Abrir chat com "Conselho de Design"
2. Preencher parâmetros (Plataforma: Universal, Zonas: Search, Aspecto: 16:9, Estratégia: C.H.A.P.E.U)
3. Click em "Gerar Criativo Baseado na Intenção"
4. ❌ **ERRO NA GERAÇÃO**
5. ❌ **Error: Falha na resposta da API**

**Console errors:**
```
POST https://app-rho-flax-25.vercel.app/api/design/generate
504 (Gateway Timeout)

Generation Error: Error: Falha na resposta da API
at ea (fc6515b420bbf270.js?...kBPBqKUDw86:5:30511)
```

**Causa raiz:**
- **504 Gateway Timeout** — Request para `/api/design/generate` excede limite de timeout
- Vercel tem limite de **10 segundos** para funções serverless (plano free/hobby)
- Gemini Vision API provavelmente demora mais que 10s para gerar design

**Possíveis causas:**
1. **Timeout da Vercel** (mais provável) — Função serverless excede 10s
2. **Gemini API lenta** — Geração de imagem demora muito
3. **Sem tratamento de timeout** — Código não tem fallback ou retry
4. **Região GRU1** — Latência para Google AI (us-central1)?

**Impacto:**
- ⚠️ **Funcionalidade CORE quebrada** — Geração de design não funciona
- Usuário não consegue usar principal feature do "Conselho de Design"
- **100% taxa de falha** (confirmado em teste)

**Soluções possíveis:**

**Curto prazo (hotfix):**
1. **Aumentar timeout da função** (se Vercel Pro — até 60s)
2. **Dividir em steps** — Gerar prompt rápido, depois imagem async
3. **Fallback para Flash** — Se timeout, usar modelo mais rápido

**Médio prazo:**
1. **Job queue async** — Usar fila (BullMQ, Inngest, Trigger.dev)
2. **Webhook de callback** — Gemini processa, depois notifica
3. **SSE (Server-Sent Events)** — Streaming de progresso

**Longo prazo:**
1. **Upgrade Vercel** para Pro (timeout 60s, region gru1)
2. **Migrar para Cloud Run** — Timeout configurável (até 60min)

**Arquivos afetados:**
- `app/src/app/api/design/generate/route.ts` — Endpoint que está timing out
- `vercel.json` — Config de timeout (se existir)

**Verificação necessária:**
```bash
# Checar timeout atual
vercel inspect <deployment-url>

# Logs do erro
vercel logs <deployment-url>
```

**Sprint sugerido:** **HOTFIX IMEDIATO** — Bloqueia uso do produto
**Prioridade:** **P0** (crítico)
**Status:** ⚠️ **BLOCKER** — Requer fix urgente

---

### Exemplo de estrutura:

#### BUG-XXX: Calendar retorna 500 error

**Severidade:** P0
**Rota:** `/content/calendar`
**Reprodução:**
1. Login na plataforma
2. Navegar para Content → Calendar
3. Página carrega mas retorna erro 500

**Console errors:**
```
Failed to load calendar: 500 Internal Server Error
```

**Sugestão de fix:** Verificar rota API `/api/content/calendar` + handler de erro
**Sprint sugerido:** Sprint Y (Integrity & Security) — Sessão 3

---

## 📝 Checklist de Testes

### Autenticação
- [ ] Signup com email válido
- [ ] Login com credenciais corretas
- [ ] Login com credenciais incorretas
- [ ] Logout
- [ ] Password recovery (se existir)
- [ ] Google Login (esperado: não funciona)

### Onboarding
- [ ] Welcome page exibe 3 cards
- [ ] Click "Criar marca" → Wizard
- [ ] Preencher wizard 4 steps
- [ ] Confirmar criação
- [ ] Redirect para dashboard

### Brand Hub
- [ ] Acessar Brand Hub
- [ ] Configurar cores (primary, secondary, accent)
- [ ] Upload de logo
- [ ] Ativar Logo Lock
- [ ] Configurar AI preset (Agressivo/Sobrio/Criativo/Equilibrado)
- [ ] Salvar configurações
- [ ] Verificar persistência (reload da página)

### Assets
- [ ] Upload de PDF
- [ ] Upload de URL
- [ ] Status de processamento
- [ ] Preview de asset
- [ ] Delete de asset

### Chat
- [ ] Abrir chat
- [ ] Enviar pergunta simples
- [ ] Verificar seleção de conselheiros
- [ ] Receber resposta
- [ ] Histórico de conversas

### Funnels
- [ ] Criar novo funil
- [ ] Preencher dados
- [ ] IA gera proposta
- [ ] Visualizar etapas
- [ ] Editar etapa
- [ ] Delete funil

### Social
- [ ] Criar post social
- [ ] Selecionar plataforma (Instagram/Facebook/etc)
- [ ] Selecionar formato (Feed/Reels/Stories)
- [ ] IA gera copy
- [ ] Preview
- [ ] Agendar (se disponível)

### Keywords Miner
- [ ] Abrir Keywords Miner
- [ ] Inserir keyword seed
- [ ] Click "Mine Keywords"
- [ ] Receber resultados
- [ ] Validar se dados são reais ou mock

### Spy Agent
- [ ] Inserir URL de concorrente
- [ ] IA analisa
- [ ] Receber relatório
- [ ] Validar informações extraídas

### Campaign Command Center
- [ ] Ver lista de campanhas
- [ ] Ver detalhes de campanha
- [ ] Verificar métricas (CTR, CPC, ROAS)
- [ ] Validar se dados são reais ou mock
- [ ] Sync data (botão existe?)

### Calendar
- [ ] Abrir calendar (⚠️ esperado: erro 500)
- [ ] Documentar erro

### Settings
- [ ] Abrir Settings
- [ ] Tab Profile
- [ ] Tab API Keys
- [ ] Tab Integrations
- [ ] Salvar configurações
- [ ] Validar se save é real ou fake

### Integrations
- [ ] Ver status de integrações
- [ ] Tentar conectar Meta Ads
- [ ] Tentar conectar Google Ads
- [ ] Validar tokens

---

## 🎯 Áreas de Foco

### Prioridade Máxima
1. **Fluxo crítico**: Signup → Criar marca → Chat → Funil
2. **Dados fake**: Identificar onde mock data aparece para usuário
3. **Botões mortos**: Testar todos os CTAs principais

### Prioridade Média
1. **Performance**: Pages que carregam lento
2. **UX**: Confusões de navegação
3. **Empty states**: Como plataforma se comporta sem dados

### Prioridade Baixa
1. **Estética**: Problemas visuais menores
2. **Textos**: Typos, termos inconsistentes

---

## 📊 Resumo de Sessão de Testes

<!-- Preencher ao final de cada sessão -->

**Data:** 2026-02-19
**Duração:** ___ horas
**Bugs encontrados:** ___
**Bugs críticos (P0):** ___
**Features testadas:** ___
**Features OK:** ___
**Features com problema:** ___

---

## 🔄 Status de Sprints de Correção

Com base nos bugs encontrados, planejar sprints:

- **Sprint Y (Integrity & Security)**: P0 fixes
- **Sprint Z (UX Polish)**: P1-P2 fixes
- **Sprint AA (Debt Cleanup)**: P3 fixes

---

> **Última atualização:** 2026-02-19
> **Próxima sessão de testes:** A definir após primeira rodada
