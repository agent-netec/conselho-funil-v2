# NETECMT User Rule — Global Principles (As “Leis”)

## Objetivo
Garantir consistência metodológica em qualquer task: especificação, execução e validação.

## Princípios NETECMT (aplicação obrigatória)

1. **Contract First**
   - Toda mudança relevante deve obedecer contratos (schema, APIs, regras de lane).
   - Se não houver contrato claro, **pare** e peça criação/ajuste do contrato.

2. **Evidence Over Opinion**
   - Decisões devem ter evidência (código, logs, testes, output do build).
   - Evitar “acho que” quando for possível verificar.

3. **Multi-tenant First**
   - Isolamento por `brandId`/tenant é regra padrão.
   - Nada de dados globais “sem dono” sem justificativa.

4. **Privacy by Design**
   - Evitar PII em prompts, logs, URLs e payloads.
   - Sanitizar por padrão.

5. **Shipping Discipline**
   - Preferir mudanças pequenas, rastreáveis e com rollback mental claro.
   - Atualizar docs quando a mudança altera comportamento do produto.

