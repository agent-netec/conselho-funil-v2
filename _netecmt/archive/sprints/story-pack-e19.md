# Story Pack: E19-1 (Gestão de Projetos por Marca)

## 🎯 Objetivo
Criar a estrutura de "Projetos" para organizar as entregas da agência (Funis, Copy, Design) dentro de cada marca.

## 📝 User Stories
- **US-19.1**: Criação de Projetos vinculados a uma Marca.

## 🛠️ Contrato Técnico (Lane Contract)
### Firestore: `projects` collection
```typescript
export interface Project {
  id: string;
  brandId: string;
  userId: string;
  name: string;
  description?: string;
  status: 'active' | 'archived' | 'completed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 📋 Tasks para Amelia
1. [x] Atualizar `app/src/types/database.ts` com a interface `Project`.
2. [x] Criar `app/src/lib/firebase/projects.ts` com funções CRUD.
3. [x] Criar interface de lista de projetos na página da marca (`/brands/[id]`).
4. [x] Implementar modal de "Novo Projeto".

## 🧪 Critérios de Aceite
- Usuário pode criar múltiplos projetos por marca.
- A lista de projetos deve ser filtrada pela `brandId` ativa.
- Deletar uma marca (opcionalmente) deve alertar sobre projetos vinculados.

