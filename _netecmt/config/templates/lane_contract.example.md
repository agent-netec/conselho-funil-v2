---
# --- METADADOS (YAML Frontmatter) ---

lane_name: "auth-api"
version: "1.0"
author: "Athos (Architecture Agent)"
date: "2026-01-24"
status: "Active"

description: "Serviço responsável por toda a lógica de autenticação e gerenciamento de usuários."

dependencies:
  - "database-postgres"
  - "email-service"

---

# Contrato de Lane: auth-api

*Este documento define a interface pública e as responsabilidades da lane `auth-api`. Ele serve como um contrato técnico para todas as outras lanes que interagem com ela, como a `frontend-webapp`.*

## 1. Visão Geral e Responsabilidades

### 1.1. Propósito Principal

A lane `auth-api` é a única autoridade dentro do sistema para lidar com a identidade do usuário. Suas responsabilidades incluem:
- Criar novas contas de usuário.
- Validar credenciais e emitir tokens de sessão (JWTs).
- Gerenciar o ciclo de vida dos tokens (refresh tokens).
- Lidar com o fluxo de recuperação de senha.

### 1.2. Limites e Responsabilidades (O que a Lane NÃO Faz)

- Esta lane **não** é responsável por armazenar dados de perfil do usuário (como nome, foto, biografia). Isso é responsabilidade da lane `user-profile-api`.
- Esta lane **não** lida com autorização (controle de acesso a recursos). Ela apenas autentica. A autorização é tratada pela lane que possui o recurso.
- Esta lane **não** envia e-mails diretamente. Ela emite um evento `auth.send_recovery_email` que é consumido pela lane `email-service`.

## 2. Interface Pública

### 2.1. Endpoints da API

#### Endpoint: `POST /auth/register`

- **Descrição:** Registra um novo usuário no sistema.
- **Método:** `POST`
- **Path:** `/auth/register`
- **Autenticação:** Nenhuma.
- **Request Body (`application/json`):**
  ```json
  {
    "email": "user@example.com",
    "password": "aVeryStrongP@ssw0rd!"
  }
  ```
- **Response Sucesso (201 Created):**
  ```json
  {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "email": "user@example.com"
  }
  ```
- **Response Erro (400 Bad Request):** `{"error": "Email já em uso"}`
- **Response Erro (422 Unprocessable Entity):** `{"error": "Senha muito fraca"}`

#### Endpoint: `POST /auth/login`

- **Descrição:** Autentica um usuário e retorna tokens de sessão.
- **Método:** `POST`
- **Path:** `/auth/login`
- **Autenticação:** Nenhuma.
- **Request Body (`application/json`):**
  ```json
  {
    "email": "user@example.com",
    "password": "aVeryStrongP@ssw0rd!"
  }
  ```
- **Response Sucesso (200 OK):**
  ```json
  {
    "accessToken": "ey...",
    "refreshToken": "ey..."
  }
  ```
- **Response Erro (401 Unauthorized):** `{"error": "Credenciais inválidas"}`

#### Endpoint: `POST /auth/refresh`

- **Descrição:** Gera um novo `accessToken` usando um `refreshToken` válido.
- **Método:** `POST`
- **Path:** `/auth/refresh`
- **Autenticação:** Nenhuma.
- **Request Body (`application/json`):**
  ```json
  {
    "refreshToken": "ey..."
  }
  ```
- **Response Sucesso (200 OK):**
  ```json
  {
    "accessToken": "ey..."
  }
  ```
- **Response Erro (401 Unauthorized):** `{"error": "Refresh token inválido ou expirado"}`

## 3. Modelos de Dados (Data Models)

### 3.1. Modelo `AuthUser` (Interno)

*Este modelo é interno à lane e nunca é totalmente exposto.*

| Campo | Tipo | Descrição | Obrigatório? |
| :--- | :--- | :--- | :--- |
| `id` | string (uuid) | Identificador único do usuário. | Sim |
| `email` | string | Endereço de e-mail único do usuário. | Sim |
| `passwordHash` | string | Hash Argon2 da senha do usuário. | Sim |
| `createdAt` | string (ISO 8601) | Data e hora de criação da conta. | Sim |

### 3.2. Modelo `TokenPair` (Público)

*Este modelo é retornado no login.*

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `accessToken` | string (JWT) | Token de curta duração (15 min) para acessar recursos protegidos. |
| `refreshToken` | string (JWT) | Token de longa duração (7 dias) usado para obter um novo `accessToken`. |

## 4. Eventos Emitidos ou Consumidos (Opcional)

### 4.1. Eventos Emitidos

- **Evento:** `auth.user.registered`
  - **Descrição:** Emitido quando um novo usuário completa o registro.
  - **Payload:** `{ "userId": "string", "email": "string" }`
  - **Consumidores:** `analytics-service`, `user-profile-api`.

## 5. Regras de Interação

### 5.1. Do's (O que fazer)

- ✅ **Sempre** use o `accessToken` no header `Authorization` como `Bearer <token>` para chamar endpoints protegidos.
- ✅ **Sempre** armazene o `refreshToken` de forma segura (ex: `HttpOnly` cookie) e use-o para chamar o endpoint `/auth/refresh` quando o `accessToken` expirar.
- ✅ **Sempre** descarte ambos os tokens no cliente ao fazer logout.

### 5.2. Don'ts (O que NÃO fazer)

- ❌ **Nunca** armazene o `accessToken` no `localStorage` do navegador devido a riscos de XSS.
- ❌ **Nunca** tente decodificar os tokens no cliente para extrair informações, pois a estrutura do payload pode mudar.

## 6. Changelog (Histórico de Mudanças)

- **v1.0 (2026-01-24):** Versão inicial do contrato. Inclui registro, login e refresh de token.
