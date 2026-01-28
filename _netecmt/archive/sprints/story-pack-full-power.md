# Story Pack: E22-1 (Ingestão de Heurísticas Avançadas de Design)

## 🎯 Objetivo
Habilitar o "Full Power" de design através da ingestão dos frameworks avançados presentes nos templates, garantindo que o Diretor de Design aplique psicologia visual e regras sêniores de composição.

## 📝 User Stories
- **US-22.1**: Ingestão de Heurísticas de Design (Regra dos Terços, Hierarquia Visual, Teoria das Cores).

## 🛠️ Contrato Técnico
- **Base de Conhecimento:** Coleção `knowledge` no Firestore.
- **Metadados de Ingestão:** 
    - `metadata.counselor: 'design_director'`
    - `metadata.docType: 'heuristics'`
    - `metadata.scope: 'visual_intelligence'`
- **Fonte de Dados:** `templates/designer/design_brain_final_with_example (1)/design_brain/council/frameworks/`

## 📋 Tasks para Amelia
1. [ ] Analisar os arquivos `.md` na pasta de frameworks de design.
2. [ ] Criar o script `app/scripts/ingest-advanced-design.ts`.
3. [ ] Implementar a quebra inteligente (chunking) preservando as regras de IF/THEN do design.
4. [ ] Gerar embeddings e fazer o upload para o Firestore via API.
5. [ ] Validar a busca semântica perguntando: "Quais são as regras de contraste para thumbnails?".

## 🧪 Critérios de Aceite
- Script executado com sucesso sem erros de runtime.
- Mínimo de 100 novos chunks de inteligência visual ingeridos.
- Verificação de que o campo `design_director` está mapeado no RAG.



