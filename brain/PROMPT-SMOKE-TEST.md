# PROMPT: Smoke Test End-to-End

> **Branch:** `master`
> **Contexto:** Todos os commits de UI, security, auth, monitoring e bug fixes estão no master. Este é o teste final antes do deploy.
> **Como rodar:** `cd app && npm run dev` → abrir `http://localhost:3001`
> **Importante:** Usar aba anônima/incognito para simular novo usuário.

---

## FLUXO 1 — Visitante Não-Autenticado

### 1.1 Landing Page
- [ ] Acessar `http://localhost:3001` → landing page aparece (NÃO redirect para login)
- [ ] Hero section carrega com copy, botões CTA visíveis
- [ ] Scroll funciona — todas as seções renderizam (arsenal, pricing, FAQ, footer)
- [ ] Pricing mostra 3 tiers (Starter R$97, Pro R$297, Agency R$597)
- [ ] Visual: dark theme, cores Honey Gold, sem purple, sem emerald
- [ ] Botão CTA principal navega para `/signup`

### 1.2 Páginas Públicas
- [ ] `/pricing` → página de pricing acessível
- [ ] `/terms` → termos de uso carregam
- [ ] `/privacy` → política de privacidade carrega
- [ ] `/cookies` → política de cookies carrega
- [ ] `/refund` → política de reembolso carrega
- [ ] `/login` → tela de login aparece

### 1.3 SEO Básico
- [ ] View source da landing → `<title>` presente com "MKTHONEY"
- [ ] `<meta name="description">` presente
- [ ] `/sitemap.xml` → XML válido com URLs
- [ ] `/robots.txt` → regras presentes

---

## FLUXO 2 — Signup + Onboarding

### 2.1 Criar Conta
- [ ] `/signup` → formulário aparece (nome, email, senha)
- [ ] Tentar senha fraca ("123456") → erro de validação
- [ ] Criar conta com email real → sucesso
- [ ] Redirect para `/welcome` (ou dashboard)
- [ ] Email de verificação chega na caixa de entrada

### 2.2 Banner de Verificação
- [ ] Banner "Verifique seu email" aparece no topo do app
- [ ] Botão "Reenviar" funciona (com cooldown 60s)
- [ ] App é utilizável mesmo sem verificar email (non-blocking)

### 2.3 Onboarding
- [ ] Modal de onboarding aparece (3 steps: identity, audience, offer)
- [ ] Preencher os 3 steps → marca criada com sucesso
- [ ] Dashboard muda de estado (pre-briefing → post-aha ou active)

---

## FLUXO 3 — Features Core

### 3.1 Dashboard
- [ ] Dashboard carrega sem erro
- [ ] Cards/widgets renderizam com dados (ou empty states guiados)
- [ ] Quick actions funcionam (links navegam para destino correto)
- [ ] Visual: dark theme Honey Gold consistente

### 3.2 Chat (Conselheiros)
- [ ] Acessar chat via sidebar
- [ ] Enviar mensagem → resposta do Gemini chega (streaming)
- [ ] Mensagem aparece formatada no bubble
- [ ] Sem erro 500 no console

### 3.3 Funnels
- [ ] Acessar `/funnels` → lista de funis (ou empty state guiado)
- [ ] Criar novo funil → formulário funciona
- [ ] Funil criado aparece na lista
- [ ] Clicar em funil → detail page carrega

### 3.4 Offer Lab
- [ ] Acessar `/intelligence/offer-lab`
- [ ] Wizard 4 steps carrega (Promessa → Stacking → Bônus → Escassez)
- [ ] Step indicators em Honey Gold (NÃO purple)
- [ ] Score AI funciona ao finalizar

### 3.5 Settings
- [ ] Acessar `/settings`
- [ ] Alterar algo (ex: nome) → salvar → reload → mudança persistiu
- [ ] Billing tab carrega sem erro

---

## FLUXO 4 — Auth Actions

### 4.1 Verificação de Email
- [ ] Clicar no link do email de verificação → `/auth/action` processa
- [ ] Mensagem "Email verificado com sucesso" aparece
- [ ] Voltar ao app → banner de verificação desaparece

### 4.2 Password Recovery
- [ ] Na tela de login → clicar "Esqueci minha senha"
- [ ] Inserir email → mensagem de confirmação aparece
- [ ] Email de reset chega
- [ ] Clicar no link → form de nova senha aparece
- [ ] Redefinir senha → logar com nova senha funciona

### 4.3 Logout + Re-login
- [ ] Clicar logout no sidebar → redireciona para landing (ou login)
- [ ] Logar novamente → dashboard carrega com dados anteriores

---

## FLUXO 5 — Error Handling

### 5.1 Error Boundaries
- [ ] Acessar rota inexistente (`/asdfasdf`) → 404 page (não tela branca)
- [ ] Console do browser: sem erros JS em vermelho durante navegação normal

### 5.2 Health Check
- [ ] Acessar `/api/health` → JSON retorna `{ status: "healthy" }`
- [ ] 3 serviços: firebase, gemini, pinecone → todos "ok"

---

## FLUXO 6 — Visual Consistency

### 6.1 Checklist de Cores
- [ ] ZERO purple visível em qualquer tela
- [ ] ZERO emerald visível em qualquer tela
- [ ] Botões CTA → Honey Gold (#E6B447)
- [ ] Backgrounds → Dark (#0D0B09, #1A1612)
- [ ] Textos → Cream (#F5E8CE) / Sand (#A89B84)
- [ ] Borders → Sutis (white/6%, white/10%)

### 6.2 Sidebar
- [ ] Logo MKTHONEY visível
- [ ] Items com lock icon para features "Coming Soon"
- [ ] Active state em gold (não emerald/purple)
- [ ] Hover states funcionam

### 6.3 Responsividade (Opcional)
- [ ] Abrir DevTools → modo mobile (375px)
- [ ] Landing page legível
- [ ] Sidebar colapsável/drawer
- [ ] Dashboard não quebra

---

## RESULTADO

### Se tudo passou:
O app está pronto para deploy. Próximo passo:
```bash
git push origin master
```
Vercel fará o deploy automaticamente.

### Se algo falhou:
Anotar o item que falhou com:
1. **Tela** onde ocorreu
2. **Ação** que causou o erro
3. **Erro** (screenshot do console ou mensagem)
4. **Severidade:** BLOCKER (impede launch) / ALTA / MÉDIA / BAIXA

Corrigir todos os BLOCKERs antes de deploy. ALTA pode ser v1.1.

---

## NOTAS

- **Email de verificação:** Firebase envia via servidor deles. Se não chegar, verificar aba Spam. Em localhost, pode demorar ~30s.
- **Gemini timeout:** Se chat demorar >30s, pode ser rate limit da API. Tentar novamente em 1 min.
- **PostHog:** Só ativa com consentimento de cookies. Em dev, pode não carregar se cookie banner não foi aceito.
- **Console errors:** Warnings do React (deprecated APIs, hydration mismatches) NÃO são blockers. Apenas erros em vermelho contam.
