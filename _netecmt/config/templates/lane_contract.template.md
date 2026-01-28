---
# --- METADADOS (YAML Frontmatter) ---

lane_name: "[nome-da-lane]" # Ex: backend-api, frontend-webapp, auth-service
version: "1.0"
author: "Athos (Architecture Agent)"
date: "YYYY-MM-DD"
status: "Draft" # Opções: Draft, In Review, Active, Deprecated

# Descrição curta da principal responsabilidade desta lane.
description: "[Descreva a responsabilidade da lane em uma frase.]"

# Lanes com as quais esta lane interage diretamente.
dependencies:
  - "[nome-da-outra-lane-1]"
  - "[nome-da-outra-lane-2]"

---

# Contrato de Lane: [nome-da-lane]

*Este documento define a interface pública e as responsabilidades da lane `[nome-da-lane]`. Ele serve como um contrato técnico para todas as outras lanes que interagem com ela.*

## 1. Visão Geral e Responsabilidades

<!-- 
**O que é esta seção?** Uma declaração clara do propósito da lane.
**Objetivo:** Evitar sobreposição de responsabilidades e garantir que cada lane faça uma única coisa bem.
-->

### 1.1. Propósito Principal

*Descreva em detalhes o que esta lane faz. Quais são suas principais funcionalidades?*

### 1.2. Limites e Responsabilidades (O que a Lane NÃO Faz)

*Seja explícito sobre o que está fora do escopo desta lane. Isso é crucial para definir fronteiras claras.*

- Esta lane **não** é responsável por [ex: renderizar a interface do usuário].
- Esta lane **não** lida com [ex: autenticação de usuários].

## 2. Interface Pública

<!-- 
**O que é esta seção?** A "API" da lane. A forma como o mundo exterior interage com ela.
**Objetivo:** Definir de forma rigorosa todos os pontos de entrada da lane.
-->

### 2.1. Endpoints da API (para Lanes de Backend)

*Liste todos os endpoints que esta lane expõe. Use um formato claro e consistente.*

#### Endpoint: `POST /users`

- **Descrição:** Cria um novo usuário.
- **Método:** `POST`
- **Path:** `/users`
- **Autenticação:** Nenhuma (endpoint público).
- **Request Body (`application/json`):**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response Sucesso (201 Created):**
  ```json
  {
    "id": "string (uuid)",
    "email": "string",
    "createdAt": "string (ISO 8601)"
  }
  ```
- **Response Erro (400 Bad Request):**
  ```json
  {
    "error": "string (ex: Email já em uso)"
  }
  ```

#### Endpoint: `GET /users/{id}`

- **Descrição:** Obtém os detalhes de um usuário.
- **Método:** `GET`
- **Path:** `/users/{id}`
- **Autenticação:** Obrigatória (Bearer Token).
- **Request Body:** N/A
- **Response Sucesso (200 OK):**
  ```json
  {
    "id": "string (uuid)",
    "email": "string",
    "createdAt": "string (ISO 8601)"
  }
  ```
- **Response Erro (404 Not Found):**
  ```json
  {
    "error": "Usuário não encontrado"
  }
  ```

### 2.2. Funções Exportadas (para Lanes de Biblioteca)

*Liste todas as funções que esta lane exporta.*

- **`calculatePrice(basePrice: number, taxRate: number): number`**
  - **Descrição:** Calcula o preço final com base no preço base e na taxa de imposto.
  - **Parâmetros:**
    - `basePrice` (number): O preço antes dos impostos.
    - `taxRate` (number): A taxa de imposto (ex: 0.05 para 5%).
  - **Retorno:** O preço final (number).

## 3. Modelos de Dados (Data Models)

<!-- 
**O que é esta seção?** As principais estruturas de dados que a lane usa em sua interface pública.
**Objetivo:** Criar um dicionário de dados compartilhado.
-->

### 3.1. Modelo `User`

*Descreva os campos do modelo de dados `User`.*

| Campo | Tipo | Descrição | Obrigatório? |
| :--- | :--- | :--- | :--- |
| `id` | string (uuid) | Identificador único do usuário. | Sim |
| `email` | string | Endereço de e-mail do usuário. | Sim |
| `passwordHash` | string | Hash da senha do usuário (nunca exposto na API). | Sim |
| `createdAt` | string (ISO 8601) | Data e hora de criação do usuário. | Sim |

## 4. Eventos Emitidos ou Consumidos (Opcional)

<!-- 
**O que é esta seção?** Para sistemas orientados a eventos.
**Objetivo:** Documentar a comunicação assíncrona.
-->

### 4.1. Eventos Emitidos

- **Evento:** `user.created`
  - **Descrição:** Emitido quando um novo usuário é criado com sucesso.
  - **Payload:** O objeto `User` completo.

### 4.2. Eventos Consumidos

- **Evento:** `payment.succeeded`
  - **Descrição:** Consumido para atualizar o status da assinatura do usuário.
  - **Payload Esperado:** `{ "userId": "string", "plan": "string" }`

## 5. Regras de Interação

<!-- 
**O que é esta seção?** Um guia prático de como usar a lane.
**Objetivo:** Prevenir o uso incorreto da interface da lane.
-->

### 5.1. Do's (O que fazer)

- ✅ **Sempre** valide os dados do usuário no frontend antes de chamar a API de criação.
- ✅ **Sempre** armazene o JWT de forma segura no cliente.

### 5.2. Don'ts (O que NÃO fazer)

- ❌ **Nunca** tente chamar um endpoint que requer autenticação sem um Bearer Token válido.
- ❌ **Nunca** armazene a senha do usuário em texto plano no cliente.

## 6. Changelog (Histórico de Mudanças)

<!-- 
**O que é esta seção?** Um registro de todas as mudanças no contrato.
**Objetivo:** Manter a rastreabilidade e comunicar quebras de contrato (breaking changes).
-->

- **v1.0 (YYYY-MM-DD):** Versão inicial do contrato.
