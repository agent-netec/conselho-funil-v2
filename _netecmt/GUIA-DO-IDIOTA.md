# 🤡 GUIA DO IDIOTA: NETECMT para Quem Tem Pressa

Se você não quer ler manuais técnicos e só quer fazer a coisa funcionar, siga este plano. **NÃO PULE PASSOS.**

---

## 🏁 PASSO 0: Começar o Projeto

### Cenário A: Quero criar um projeto NOVO do ZERO
1. Abra o terminal em uma pasta vazia.
2. Digite:
   ```bash
   netecmt init meu-projeto-lindo
   ```
3. Entre na pasta: `cd meu-projeto-lindo`

### Cenário B: Já tenho código e quero usar NETECMT nele
1. Abra o terminal DENTRO da pasta do seu código.
2. Digite:
   ```bash
   netecmt init . --brownfield
   ```

---

## 🤖 PASSO 1: Preparar o "Cérebro" (Cursor)

1. Abra a pasta do projeto no **Cursor**.
2. O Cursor vai ler a pasta `_netecmt`.
3. **REGRA DE OURO:** Sempre que for pedir algo para a IA, tenha os arquivos da metodologia abertos (especialmente os da pasta `_netecmt/docs`).

### Passo 1.1: Instalar as Regras do Cursor
No terminal, digite:
```bash
netecmt rules setup
```
Isso dá o "cérebro" da metodologia para o Cursor. Sem isso, ele pode tentar improvisar.

### Passo 1.2: Invocando os Agentes (Slash Commands)
No chat do Cursor, você pode forçar a IA a virar um agente específico usando comandos simples:
- **`/iuran`**: Chama o PM (Produto/Negócio)
- **`/athos`**: Chama o Arquiteto (Técnico/Contratos)
- **`/ps`**: Ativa o **Party Mode** (Discussão em grupo)
- **`/darllyson`**: Chama o Dev (Código/Testes)
- **`/wilder`**: Chama o Wilder (Documentação)

> [!TIP]
> Use esses comandos sempre que iniciar um novo chat para garantir que a IA assuma a identidade NETECMT v2.0 desde a primeira mensagem.

---

## 🔍 PASSO 2: Documentar (Só se você escolheu o Cenário B)

Se você já tinha código, a IA precisa "ler" ele antes de tentar mudar qualquer coisa.
1. No terminal, digite:
   ```bash
   netecmt project document
   ```
2. Deixe o agente Wilder (Analista) terminar. Ele vai criar a "Bíblia" do seu projeto (`project-context.md`).

---

## 📝 PASSO 3: O Que Vamos Fazer? (Iuran)

Agora vamos decidir a próxima funcionalidade ou correção.
1. No terminal, digite:
   ```bash
   netecmt prd create
   ```
2. O Iuran (PM) vai te fazer perguntas. Responda com calma. Quando ele terminar, você terá um arquivo de requisitos (`prd.md`).

---

## 📐 PASSO 4: Como Vamos Resolver? (Athos)

Não escreva código ainda! Vamos desenhar a solução.
1. No terminal, digite:
   ```bash
   netecmt arch create
   ```
2. O Athos (Arquiteto) vai criar o plano técnico (`architecture.md`). Ele garante que a solução é limpa.

---

## 📅 PASSO 5: Quebrar em Tarefas (Leticia)

Vamos organizar o trabalho.
1. Primeiro, prepare o plano da Sprint:
   ```bash
   netecmt sprint plan
   ```
2. Agora, crie a primeira tarefa (Story) para o desenvolvedor:
   ```bash
   netecmt story create
   ```

---

## 💻 PASSO 6: Mão na Massa (Darllyson)

Finalmente, o código!
1. Olhe o ID da tarefa que a Leticia criou (ex: `STORY-001`).
2. No terminal, digite:
   ```bash
   netecmt dev start STORY-001
   ```
3. O Darllyson vai escrever os testes e o código para você.

---

## 🚨 REGRAS QUE SE VOCÊ QUEBRAR, TUDO ESTRAGA:

1. **NUNCA** peça código direto sem ter uma Story criada pela Leticia.
2. **NUNCA** mude a estrutura da pasta `_netecmt` manualmente.
3. Se a IA parecer "perdida", diga: *"Leia o master-workflow.md e me diga em qual etapa estamos"*.

---
*NETECMT v2.0 | Porque até um idiota pode entregar software de alta fidelidade.*
