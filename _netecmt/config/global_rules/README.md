# Proposta de Melhorias: Cursor Rules para NETECMT

**Data:** 08 de janeiro de 2026
**Autor:** Manus AI
**Versão:** 1.0

## Introdução

Este pacote contém uma proposta completa de melhorias para as Cursor Rules da metodologia NETECMT, incluindo:

- **4 User Rules Globais** para resolver problemas recorrentes em todos os projetos
- **2 Templates de `.cursorrules`** para projetos greenfield e brownfield
- **1 Rule Modificada** do agente de desenvolvimento com gerenciamento de portas integrado
- **Documentação Completa** de implementação e análise

## Estrutura dos Arquivos

```
netecmt_rules_proposal/
├── README.md (este arquivo)
├── GUIA_DE_IMPLEMENTACAO.md
├── user_rules/
│   ├── 01-port-management.md
│   ├── 02-communication-standards.md
│   ├── 03-security-baseline.md
│   └── 04-netecmt-global-principles.md
├── project_templates/
│   ├── .cursorrules.greenfield
│   └── .cursorrules.brownfield
└── project_rules/
    └── netecmt/
        └── bmm/
            └── agents/
                └── dev_with_port_management.mdc
```

## O Que Cada Componente Faz

### User Rules (Regras Globais)

Estas regras são configuradas uma única vez no Cursor Settings e se aplicam automaticamente a **todos os seus projetos**.

| Arquivo | Propósito |
| :--- | :--- |
| `01-port-management.md` | Elimina conflitos de portas ao iniciar servidores locais |
| `02-communication-standards.md` | Define idioma (PT-BR), formatação numérica e tom de voz |
| `03-security-baseline.md` | Estabelece práticas de segurança (secrets, Snyk, menor privilégio) |
| `04-netecmt-global-principles.md` | Reforça as 5 Leis da NETECMT em todos os contextos |

### Templates de Projeto

Estes arquivos devem ser copiados para a raiz de cada novo projeto e renomeados para `.cursorrules`.

| Arquivo | Quando Usar |
| :--- | :--- |
| `.cursorrules.greenfield` | Projetos novos, criados do zero |
| `.cursorrules.brownfield` | Projetos existentes com código legado |

### Rule Modificada do Agente Dev

Este arquivo substitui ou complementa a rule original do agente Darllyson (Developer), adicionando o procedimento obrigatório de limpeza de portas antes de iniciar servidores.

## Problemas Resolvidos

Esta proposta resolve os seguintes problemas identificados na metodologia NETECMT:

1.  **✅ Conflitos de Portas Recorrentes:** Integração do plano de ação de portas diretamente nas rules.
2.  **✅ Falta de Padronização Global:** User Rules garantem consistência em todos os projetos.
3.  **✅ Ausência de Templates Específicos:** Templates separados para greenfield e brownfield facilitam a adoção.
4.  **✅ Segurança Não Automatizada:** Regra de segurança baseline torna o Snyk e boas práticas parte do fluxo padrão.

## Como Implementar

Leia o arquivo **`GUIA_DE_IMPLEMENTACAO.md`** para instruções detalhadas passo a passo.

**Resumo Rápido:**

1.  **User Rules:** Configure no Cursor Settings → Cloud Agents → User Rules.
2.  **Templates:** Copie o template apropriado (greenfield ou brownfield) para a raiz do seu projeto e renomeie para `.cursorrules`.
3.  **Agente Dev:** Substitua ou crie uma variante da rule do agente de desenvolvimento.
4.  **Valide:** Teste cada componente conforme descrito no guia.

## Benefícios Esperados

Após a implementação completa, você terá:

- **Redução de Fricção:** Menos tempo perdido com problemas recorrentes (portas, formatação, segurança).
- **Maior Consistência:** Todos os agentes seguem os mesmos padrões globais.
- **Adoção Facilitada:** Templates prontos para diferentes cenários de projeto.
- **Governança Reforçada:** As 5 Leis da NETECMT são aplicadas automaticamente.

## Suporte e Feedback

Se você tiver dúvidas ou sugestões sobre esta proposta, documente-as e compartilhe com a equipe ou comunidade NETECMT.

---

**Próximos Passos:** Leia o `GUIA_DE_IMPLEMENTACAO.md` e comece a implementação.
