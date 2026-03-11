# PROMPT: Email Verification + Password Recovery — Páginas e Guards

> **Branch:** `fix/auth-email-verification` (criar a partir do master)
> **Contexto:** Firebase Auth e Resend já estão 100% configurados. `signupWithEmail()` já envia email de verificação. Login já tem "Esqueci minha senha" funcional. Faltam as PÁGINAS que processam os links dos emails e os GUARDS que bloqueiam acesso sem verificação.
> **Regra:** NÃO alterar visual/paleta (já está em Honey Gold). NÃO alterar lógica de RAG, credits, ou persistência.

---

## O QUE JÁ EXISTE (NÃO RECRIAR)

| Item | Arquivo | Linha | Status |
|------|---------|-------|--------|
| `signupWithEmail()` — envia verificação | `app/src/lib/firebase/auth.ts` | 70-85 | ✅ Funciona |
| `sendEmailVerification()` — reenvio | `app/src/lib/firebase/auth.ts` | 99-104 | ✅ Funciona |
| `sendPasswordReset(email)` | `app/src/lib/firebase/auth.ts` | 107-110 | ✅ Funciona |
| "Esqueci minha senha" no login | `app/src/app/(auth)/login/page.tsx` | 116-132, 159 | ✅ Funciona |
| Templates de email (Resend) | `app/src/lib/email/resend.ts` | 169+ | ✅ 11 templates |
| Auth store (Zustand) | `app/src/lib/stores/auth-store.ts` | 40-92 | ✅ Funciona |
| Middleware de routing | `app/src/middleware.ts` | 42-77 | ✅ Funciona |

---

## O QUE FALTA IMPLEMENTAR

### 1. Página de Ação Firebase (`/auth/action`)

Quando o Firebase envia email de verificação ou reset de senha, o link aponta para uma URL com parâmetros `mode` e `oobCode`. Precisamos de uma página que processa esses códigos.

**Criar:** `app/src/app/(auth)/action/page.tsx`

**Funcionalidade:**
```
URL: /auth/action?mode=verifyEmail&oobCode=ABC123
URL: /auth/action?mode=resetPassword&oobCode=ABC123
```

**Lógica:**
```typescript
// Imports necessários do Firebase
import { applyActionCode, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

// Ler query params
const mode = searchParams.get('mode');
const oobCode = searchParams.get('oobCode');

// Switch por mode:
// 'verifyEmail' → applyActionCode(auth, oobCode) → mostrar sucesso → redirect para /
// 'resetPassword' → verifyPasswordResetCode(auth, oobCode) → mostrar form de nova senha → confirmPasswordReset(auth, oobCode, newPassword)
```

**UI — mode=verifyEmail (sucesso):**
- Ícone de check dourado
- "Email verificado com sucesso!"
- "Sua conta está ativa. Você já pode usar todos os recursos."
- Botão "Ir para o Dashboard" → link para `/`

**UI — mode=verifyEmail (erro):**
- Ícone de alerta
- "Link expirado ou inválido"
- "Solicite um novo email de verificação."
- Botão "Reenviar verificação" → chama `sendEmailVerification()`

**UI — mode=resetPassword:**
- Form com campos: "Nova senha" + "Confirmar senha"
- Validação: mín 8 chars, 1 maiúscula, 1 número (mesma regra do signup)
- Botão "Redefinir senha" → `confirmPasswordReset(auth, oobCode, newPassword)`
- Sucesso: "Senha redefinida! Faça login com sua nova senha." + link para `/login`
- Erro: "Link expirado. Solicite novo reset." + link para `/login`

**Visual:** Dark theme, mesma estética do login/signup. Card centralizado, bg `#0D0B09`, border `border-white/[0.06]`, botões gold `bg-[#E6B447] hover:bg-[#F0C35C] text-black`.

---

### 2. Configurar Firebase Action URL

**No Firebase Console** (ou via Firebase Admin SDK):
- Authentication → Templates → ação de e-mail
- Alterar "Action URL" para: `https://mkthoney.com/auth/action`
- Para dev: `http://localhost:3001/auth/action`

**Alternativa via código** — se Firebase usar URL default (`firebaseapp.com/__/auth/action`):

**Arquivo:** `app/src/lib/firebase/auth.ts`

Modificar `signupWithEmail()` para usar `actionCodeSettings`:

```typescript
import { sendEmailVerification as firebaseSendEmailVerification } from 'firebase/auth';

const actionCodeSettings = {
  url: process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/action`
    : 'http://localhost:3001/auth/action',
  handleCodeInApp: false, // false = link direto, true = deep link
};

// Na função signupWithEmail, trocar:
await firebaseSendEmailVerification(user);
// Por:
await firebaseSendEmailVerification(user, actionCodeSettings);
```

Fazer o mesmo na função `sendEmailVerification()` (linha 99-104).

---

### 3. Banner de Verificação Pendente

**Arquivo:** `app/src/components/layout/app-shell.tsx`

**Adicionar** um banner condicional ACIMA do conteúdo principal quando `user.emailVerified === false`:

```tsx
{user && !user.emailVerified && (
  <EmailVerificationBanner
    onResend={() => sendEmailVerification()}
  />
)}
```

**Criar:** `app/src/components/auth/email-verification-banner.tsx`

**UI:**
- Banner fixo no topo (não sticky — aparece 1x)
- Background: `bg-[#E6B447]/10 border-b border-[#E6B447]/20`
- Ícone de email + "Verifique seu email para ativar todos os recursos."
- Botão: "Reenviar email" (com cooldown de 60s para evitar spam)
- Botão X para fechar temporariamente (volta no próximo login)

**Comportamento:**
- **NÃO bloquear** o app inteiro — apenas mostrar banner
- Usuário pode usar o produto normalmente
- Após verificar, banner desaparece automaticamente (Firebase Auth atualiza o `emailVerified` flag)

**Razão:** Bloquear totalmente prejudica a experiência. Melhor nudge suave + lembretes.

---

### 4. Refresh de `emailVerified` no Auth Store

**Problema:** Firebase Auth NÃO atualiza `emailVerified` em tempo real no client. O token precisa ser refreshed.

**Arquivo:** `app/src/lib/stores/auth-store.ts`

**Adicionar** no `initialize()`, após o callback de `onAuthChange`:

```typescript
// Periodicamente checar se email foi verificado
if (user && !user.emailVerified) {
  const checkInterval = setInterval(async () => {
    await user.reload();
    if (user.emailVerified) {
      set({ user: { ...user } }); // Trigger re-render
      clearInterval(checkInterval);
    }
  }, 10000); // Check a cada 10s
}
```

**Alternativa mais simples:** Chamar `user.reload()` quando o user volta para a aba (via `visibilitychange` event).

---

### 5. Atualizar Middleware (Opcional)

**Arquivo:** `app/src/middleware.ts`

**NÃO bloquear** rotas por `emailVerified` no middleware — o middleware só lê cookies, não tem acesso ao Firebase Auth state. O guard fica no AppShell (client-side).

---

## ARQUIVOS A CRIAR

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `app/src/app/(auth)/action/page.tsx` | Página | Processa oobCode (verify email + reset senha) |
| `app/src/components/auth/email-verification-banner.tsx` | Componente | Banner de nudge para verificar email |

## ARQUIVOS A MODIFICAR

| Arquivo | Mudança |
|---------|---------|
| `app/src/lib/firebase/auth.ts` | Adicionar `actionCodeSettings` no `sendEmailVerification` |
| `app/src/components/layout/app-shell.tsx` | Renderizar `EmailVerificationBanner` quando `!emailVerified` |
| `app/src/lib/stores/auth-store.ts` | Adicionar refresh de `emailVerified` via `user.reload()` |

---

## DESIGN TOKENS (Referência)

```
Primary Gold:     #E6B447
Gold Hover:       #F0C35C
BG Base:          #0D0B09
Surface 1:        #1A1612
Text Primary:     #F5E8CE
Text Secondary:   #A89B84
Border Subtle:    rgba(255,255,255,0.06)
Border Default:   rgba(255,255,255,0.10)
Border Gold:      rgba(230,180,71,0.2)
```

---

## CHECKLIST

- [ ] Página `/auth/action` processa `verifyEmail` e `resetPassword`
- [ ] Verificação de email mostra feedback de sucesso/erro
- [ ] Reset de senha mostra form + valida + confirma
- [ ] Banner de verificação aparece no AppShell quando `!emailVerified`
- [ ] Botão "Reenviar email" funciona com cooldown de 60s
- [ ] `actionCodeSettings` configurado com URL correta
- [ ] `user.reload()` atualiza `emailVerified` no auth store
- [ ] Visual consistente com dark theme Honey Gold
- [ ] Textos em PT-BR
- [ ] Build passa: `cd app && npm run build`

---

## VERIFICAÇÃO

```bash
# 1. Build
cd app && npm run build

# 2. Verificar que a rota existe
grep -rn "action" app/src/app/\(auth\)/ --include="*.tsx"

# 3. Verificar banner
grep -rn "emailVerified\|email-verification-banner" app/src/components/layout/app-shell.tsx

# 4. Verificar actionCodeSettings
grep -rn "actionCodeSettings\|handleCodeInApp" app/src/lib/firebase/auth.ts
```

---

## TESTE MANUAL

```
1. Criar conta nova → verificar que email de verificação chegou
2. NÃO clicar no link → logar → verificar que banner aparece
3. Clicar "Reenviar email" → verificar cooldown de 60s
4. Clicar no link do email → verificar que /auth/action processa
5. Após verificação → banner desaparece
6. Na tela de login → clicar "Esqueci minha senha" → receber email
7. Clicar no link de reset → form aparece → resetar → logar com nova senha
```

---

## COMMIT

```
feat(auth): add email verification page, password reset flow, and verification banner

- Create /auth/action page to process Firebase oobCode (verify + reset)
- Add EmailVerificationBanner component with 60s resend cooldown
- Configure actionCodeSettings for custom redirect URL
- Add emailVerified refresh via user.reload() in auth store
- Non-blocking: users can use app while unverified (soft nudge)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```
