---
# --- METADADOS (YAML Frontmatter) ---

story_id: "STORY-001"
title: "Implementar Fluxo de Login do Usuário"
status: "Todo"
author: "Letícia (Planning Agent)"
assignee: "Darllyson (Development Agent)"

points: 5

related_prd: "prd_auth_system_v1.md"
related_contract: "contract_auth-api_v1.md"

---

# Story Pack: Implementar Fluxo de Login do Usuário

*Este documento detalha a unidade de trabalho para implementar a funcionalidade de login do usuário na aplicação web.*

## 1. User Story

> *Como um usuário cadastrado, eu quero fazer login com meu e-mail e senha, para que eu possa acessar meu painel e dados salvos.*

## 2. Critérios de Aceitação (ACs)

- [ ] **AC-1:** Quando o usuário insere um e-mail ou senha inválidos e clica em "Entrar", uma mensagem de erro clara ("Credenciais inválidas") é exibida abaixo do formulário.
- [ ] **AC-2:** Quando o usuário insere credenciais válidas e clica em "Entrar", ele é redirecionado para a rota `/dashboard` em menos de 2 segundos.
- [ ] **AC-3:** Após o login bem-sucedido, o `accessToken` é armazenado na memória (ex: estado do React) e o `refreshToken` é armazenado em um cookie `HttpOnly` e seguro.
- [ ] **AC-4:** O botão "Entrar" fica desabilitado e mostra um indicador de carregamento (spinner) enquanto a chamada à API está em andamento.

## 3. Detalhes Técnicos e Orientações

- **Lane(s) Afetada(s):** `frontend-webapp`
- **Contrato(s) a Utilizar:** `auth-api v1.0`
- **Endpoint(s) a Consumir:** `POST /auth/login`
- **Componentes a Criar/Modificar:**
  - `src/features/auth/components/LoginForm.tsx` (Criar)
  - `src/features/auth/pages/LoginPage.tsx` (Criar)
  - `src/app/router.tsx` (Modificar para adicionar a nova rota)
- **Observações Importantes:**
  - Use a biblioteca `axios` para fazer a chamada à API. Crie uma instância do `axios` configurada para a `baseURL` da `auth-api`.
  - Para gerenciamento de estado global (estado de autenticação), use o `Zustand` store que já está configurado no projeto.
  - Os componentes de UI (Input, Button, Spinner) devem ser importados da nossa biblioteca de componentes compartilhados em `src/components/ui/`.

## 4. Plano de Implementação (Checklist de Tarefas)

- [ ] **Setup:** Criar os arquivos `LoginForm.tsx` e `LoginPage.tsx` dentro da estrutura de diretórios `src/features/auth/`.
- [ ] **UI:** Construir o formulário de login na `LoginPage.tsx` usando os componentes de UI da biblioteca, incluindo campos para e-mail, senha e o botão de submit.
- [ ] **Validação:** Usar a biblioteca `zod` para criar um schema de validação para o formulário, garantindo que o e-mail é válido e a senha não está em branco.
- [ ] **Lógica de API:** Criar uma função assíncrona `handleLogin` que recebe os dados do formulário, chama o endpoint `POST /auth/login` e lida com a resposta.
- [ ] **Gerenciamento de Estado:** Em caso de sucesso, chamar a ação `loginSuccess` do store do Zustand, passando os tokens recebidos.
- [ ] **Tratamento de Erro:** No `catch` da chamada à API, exibir a mensagem de erro retornada pela API no estado do formulário.
- [ ] **Redirecionamento:** Usar o hook `useNavigate` do `react-router-dom` para redirecionar o usuário para `/dashboard` após o login bem-sucedido.
- [ ] **Testes:** Escrever os testes especificados na seção 5.
- [ ] **Roteamento:** Adicionar a nova rota `/login` ao `router.tsx`, apontando para o componente `LoginPage`.

## 5. Testes a Serem Criados

- **Testes Unitários (`LoginForm.test.tsx`):**
  - [ ] Testar se o componente renderiza corretamente com os dois inputs e o botão.
  - [ ] Testar se o botão de submit fica desabilitado se os campos estiverem vazios.
- **Testes de Integração (`LoginPage.test.tsx`):**
  - [ ] Mockar a chamada à API para retornar sucesso e verificar se o redirecionamento é chamado.
  - [ ] Mockar a chamada à API para retornar um erro 401 e verificar se a mensagem de erro é exibida na tela.
- **Testes End-to-End (E2E) (`login.spec.ts`):**
  - [ ] Criar um teste com Cypress ou Playwright que navega para a página `/login`, preenche o formulário com dados de um usuário de teste, clica em "Entrar" e afirma que a URL mudou para `/dashboard`.
