# Firestore (Banco de Dados NoSQL)

## O que é
Banco de dados NoSQL do Firebase utilizado para persistência de dados do sistema (Funis, Conversas, Marcas, Assets).

## Variáveis de Ambiente
As chaves abaixo devem estar configuradas para que o Firestore funcione corretamente:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

**Onde configurar:**
- `app/.env.local` (Desenvolvimento)
- Vercel Dashboard (Preview/Production)

## Implementação e Libs
- **Configuração Central**: `app/src/lib/firebase/config.ts`
- **Operações (Data Access Layer)**: `app/src/lib/firebase/firestore.ts`
- **Gerenciamento de Assets**: `app/src/lib/firebase/assets.ts`

## Estrutura de Coleções (Principais)
- `users`: Dados de perfil e créditos.
- `brands`: Identidade visual e verbal das marcas.
- `brand_assets`: Metadados de arquivos e referências (RAG).
- `funnels`: Estruturas de funis e contextos.
- `conversations`: Histórico de chat e sessões de Party Mode.

## Boas Práticas e Segurança
1. **Atômico**: Use `writeBatch` para operações que envolvem múltiplas coleções (ex: aprovação de asset e atualização de chunks).
2. **Sanitização**: Sempre use `Object.fromEntries` para remover campos `undefined` antes de enviar ao Firestore (ver `createConversation`).
3. **QA**: Se notar atrasos em ambiente local, verifique o `Long Polling` no `config.ts`.
4. **Resiliência**: Use `Timestamp.now()` do Firestore em vez de `new Date()` para garantir consistência entre cliente e servidor.
