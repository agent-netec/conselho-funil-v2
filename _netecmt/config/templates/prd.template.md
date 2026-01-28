_---
# --- METADADOS (YAML Frontmatter) ---
# Esta seção contém metadados estruturados para fácil processamento por agentes e scripts.

project_name: "[Nome do Projeto]"
version: "1.0"
author: "Iuran (PM Agent)"
date: "YYYY-MM-DD"
status: "Draft" # Opções: Draft, In Review, Approved, Deprecated

# Stakeholders principais envolvidos no projeto
stakeholders:
  - name: "[Nome do Stakeholder 1]"
    role: "[Cargo]"
  - name: "[Nome do Stakeholder 2]"
    role: "[Cargo]"

# Tags para facilitar busca e categorização
tags:
  - "[tag1]"
  - "[tag2]"
  - "[tag3]"

---

# PRD: [Nome do Projeto]

*Este documento descreve os requisitos de produto (PRD) para o projeto [Nome do Projeto]. Ele serve como a fonte da verdade para a equipe de desenvolvimento e stakeholders.*

## 1. Visão Geral

<!-- 
**O que é esta seção?** Um resumo executivo de alto nível.
**Objetivo:** Permitir que qualquer pessoa entenda o projeto em menos de 2 minutos.
-->

### 1.1. Resumo Executivo

*Descreva o projeto em 2-3 parágrafos. Qual é a essência do que estamos construindo?*

### 1.2. O Problema

*Qual problema do cliente ou do negócio estamos resolvendo? Seja específico. Use dados se possível.*

### 1.3. A Solução Proposta

*Como nossa solução resolve o problema? Descreva a abordagem de alto nível.*

### 1.4. Impacto Esperado

*Qual é o impacto positivo que esperamos alcançar com este projeto? (ex: aumento de receita, redução de custos, melhoria da satisfação do cliente).*

---

## 2. Contexto e Background

<!-- 
**O que é esta seção?** O "porquê" por trás do projeto.
**Objetivo:** Dar à equipe o contexto necessário para tomar boas decisões durante a implementação.
-->

### 2.1. Por Que Agora?

*Qual é a urgência? Existe uma janela de oportunidade de mercado? Uma dívida técnica crítica?*

### 2.2. Personas de Usuário

*Quem são os usuários-alvo deste projeto? Descreva 1-3 personas principais.*

| Persona | Descrição | Necessidades e Dores |
| :--- | :--- | :--- |
| **[Nome da Persona 1]** | [Ex: Desenvolvedor Sênior] | [Ex: Precisa de um processo de deploy mais rápido] |
| **[Nome da Persona 2]** | [Ex: Gerente de Produto] | [Ex: Precisa de visibilidade sobre o progresso] |

### 2.3. Contexto de Negócio

*Como este projeto se encaixa na estratégia geral da empresa? Ele suporta quais objetivos de negócio?*

---

## 3. Objetivos e Métricas de Sucesso

<!-- 
**O que é esta seção?** Como saberemos se fomos bem-sucedidos.
**Objetivo:** Definir critérios claros e mensuráveis para o sucesso do projeto.
-->

### 3.1. Objetivos (OKRs)

*Liste os Objetivos e Resultados-Chave (OKRs) que este projeto impactará.*

- **Objetivo 1:** [Ex: Melhorar a experiência de onboarding de novos usuários]
  - **KR 1:** [Ex: Reduzir o tempo para completar o setup inicial em 50%]
  - **KR 2:** [Ex: Aumentar a taxa de ativação na primeira semana de 30% para 50%]

### 3.2. Métricas de Sucesso (KPIs)

*Quais KPIs específicos vamos monitorar para medir o sucesso?*

| Métrica | Descrição | Valor Atual | Valor Alvo |
| :--- | :--- | :--- | :--- |
| [Ex: Taxa de Conversão] | [Ex: % de usuários que se inscrevem] | [Ex: 5%] | [Ex: 8%] |
| [Ex: Tempo de Carregamento] | [Ex: Tempo para a página principal carregar] | [Ex: 2.5s] | [Ex: < 1s] |

### 3.3. Critérios de Aceitação de Alto Nível

*Quais são as condições mínimas que devem ser atendidas para que o projeto seja considerado "concluído"?*

- [ ] [Ex: Usuários conseguem se cadastrar com e-mail e senha]
- [ ] [Ex: Usuários conseguem fazer login e logout]
- [ ] [Ex: O sistema envia um e-mail de boas-vindas após o cadastro]

---

## 4. Requisitos Funcionais

<!-- 
**O que é esta seção?** O "o que" o sistema deve fazer.
**Objetivo:** Detalhar as funcionalidades do produto do ponto de vista do usuário.
-->

### 4.1. User Stories Principais

*Liste as principais user stories. Use o formato: "Como um [tipo de usuário], eu quero [fazer algo], para que [eu possa obter um benefício]".*

| ID | User Story |
| :--- | :--- |
| US-001 | Como um novo usuário, eu quero me cadastrar usando meu e-mail e senha, para que eu possa acessar a plataforma. |
| US-002 | Como um usuário cadastrado, eu quero fazer login, para que eu possa acessar meu painel. |
| US-003 | Como um usuário logado, eu quero fazer logout, para que eu possa proteger minha conta. |

### 4.2. Fluxos de Usuário (Opcional)

*Descreva ou insira diagramas dos principais fluxos de usuário. (ex: fluxo de cadastro, fluxo de compra).*

```mermaid
graph TD
    A[Visita a Página Inicial] --> B{Usuário cadastrado?};
    B -->|Não| C[Clica em "Cadastrar"];
    C --> D[Preenche formulário];
    D --> E[Recebe e-mail de confirmação];
    B -->|Sim| F[Clica em "Login"];
    F --> G[Preenche credenciais];
    G --> H[Acessa o Painel];
```

---

## 5. Requisitos Não-Funcionais (Opcional)

<!-- 
**O que é esta seção?** O "como" o sistema deve se comportar.
**Objetivo:** Definir os critérios de qualidade e restrições técnicas.
-->

| Categoria | Requisito |
| :--- | :--- |
| **Performance** | - O tempo de resposta da API de login deve ser < 200ms. <br> - A página principal deve carregar em menos de 1.5 segundos. |
| **Segurança** | - Senhas devem ser armazenadas com hash (bcrypt). <br> - O sistema deve ser protegido contra ataques de força bruta. |
| **Escalabilidade** | - O sistema deve suportar 10.000 usuários simultâneos. |
| **Acessibilidade** | - O sistema deve seguir as diretrizes WCAG 2.1 Nível AA. |

---

## 6. Escopo

<!-- 
**O que é esta seção?** Definir os limites do projeto.
**Objetivo:** Evitar "scope creep" (aumento descontrolado do escopo) e alinhar expectativas.
-->

### 6.1. In Scope (O que ESTÁ no escopo)

*Liste explicitamente as funcionalidades que fazem parte deste projeto.*

- Cadastro com e-mail e senha
- Login e Logout
- Recuperação de senha

### 6.2. Out of Scope (O que NÃO ESTÁ no escopo)

*Liste explicitamente o que NÃO será feito. Isso é tão importante quanto o que será feito.*

- Login com redes sociais (Google, Facebook)
- Autenticação de dois fatores (2FA)
- Perfis de usuário avançados

### 6.3. Future Scope (Escopo Futuro)

*Liste funcionalidades que são interessantes, mas que serão consideradas para futuras versões.*

- Login com redes sociais
- Magic links

---

## 7. Dependências e Integrações

<!-- 
**O que é esta seção?** O que este projeto precisa de outros sistemas ou equipes.
**Objetivo:** Identificar e comunicar dependências cedo.
-->

| Tipo | Dependência | Contato Responsável |
| :--- | :--- | :--- |
| **Sistema Externo** | [Ex: API de Pagamentos (Stripe)] | [Ex: equipe.financeira@empresa.com] |
| **Equipe Interna** | [Ex: Design de UI/UX] | [Ex: Equipe de Design] |
| **Dependência Técnica** | [Ex: Versão do Node.js >= 20.0] | [Ex: Equipe de Infra] |

---

## 8. Riscos e Mitigações (Opcional)

<!-- 
**O que é esta seção?** O que pode dar errado.
**Objetivo:** Pensar proativamente sobre os riscos e como lidar com eles.
-->

| Risco | Probabilidade | Impacto | Plano de Mitigação |
| :--- | :--- | :--- | :--- |
| [Ex: A API de terceiros é instável] | Média | Alto | [Ex: Implementar um circuito breaker e fallback] |
| [Ex: Adoção do usuário é baixa] | Baixa | Alto | [Ex: Realizar testes de usabilidade antes do lançamento] |

---

## 9. Timeline e Milestones (Opcional)

<!-- 
**O que é esta seção?** Uma estimativa de alto nível do cronograma.
**Objetivo:** Alinhar expectativas sobre as datas de entrega.
-->

| Milestone | Data Estimada |
| :--- | :--- |
| **Fase 1: Arquitetura e Planejamento** | YYYY-MM-DD |
| **Fase 2: Desenvolvimento (MVP)** | YYYY-MM-DD |
| **Fase 3: QA e Testes** | YYYY-MM-DD |
| **Fase 4: Lançamento Beta** | YYYY-MM-DD |

---

## 10. Anexos

<!-- 
**O que é esta seção?** Links para recursos adicionais.
**Objetivo:** Centralizar todas as informações relevantes.
-->

- [Link para os Mockups no Figma](http://figma.com/...)
- [Link para a Pesquisa de Mercado](http://docs.google.com/...)
- [Link para o Diagrama de Arquitetura](http://miro.com/...)
