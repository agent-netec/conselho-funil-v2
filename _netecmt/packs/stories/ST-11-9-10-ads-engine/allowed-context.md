# Allowed Context: Ads Design Engine
ID: ST-11.9 & ST-11.10

## 📂 Arquivos Permitidos para Leitura/Escrita
Para esta story, o desenvolvedor (Darllyson) e o arquiteto (Athos) têm permissão para interagir com:

### 1. Prompts & Lógica (Escrita/Refatoração)
- `app/src/lib/ai/prompts/design.ts`: Onde reside o System Prompt do Diretor de Design.
- `app/src/lib/ai/nano-banana-engine.ts`: (Se existir) Onde a lógica modular de prompts será implementada.

### 2. Conhecimento (Leitura)
- `_netecmt/contracts/retrieval-contracts.md`: Para entender como os chunks de especialistas chegam.
- `_netecmt/packs/stories/ST-11-9-10-ads-engine/contract.md`: O contrato que deve ser seguido.
- `brain/design/C.H.A.P.E.U.md`: (Se existir) Referência técnica do framework.

### 3. Contexto de Marca (Leitura)
- `app/src/lib/ai/brand-governance.ts`: Para garantir que as cores e o estilo sejam aplicados corretamente.

## 🛑 Restrições (Não Tocar)
- **Firebase/Firestore**: Não alterar coleções de banco de dados diretamente.
- **UI Components**: Não alterar componentes de dashboard ou chat, a menos que explicitamente solicitado em uma story de UI (ST-11.11).
- **Global Types**: Não alterar tipos globais fora do escopo de Design/Ads sem aprovação do Athos.
