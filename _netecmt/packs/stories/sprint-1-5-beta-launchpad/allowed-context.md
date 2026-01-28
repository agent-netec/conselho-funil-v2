# Allowed Context: Sprint 1.5 - Beta Launchpad

Este documento define quais partes do repositório o desenvolvedor (Darllyson) tem permissão de ler para esta Story, minimizando ruído.

## 📁 Diretórios Permitidos
- `_netecmt/packs/stories/sprint-1-5-beta-launchpad/`: Contexto da Story e Contrato.
- `_netecmt/brain/social/playbooks/`: Referência para os scripts que serão exibidos.
- `src/components/council/`: Local onde a nova UI de preview será criada.
- `src/lib/ai/`: Lógica de RAG e integração com Gemini para refatoração do output.

## 🛑 Bloqueios
- Proibido alterar lógica de faturamento (Stripe) ou autenticação básica nesta story.
- Proibido ler a pasta `_netecmt/archive/` para evitar confusão com sprints passadas.

## 🔍 Símbolos Chave
- `CouncilOutput` (Novo Contrato)
- `ragEngine` (Função principal de busca e geração)
- `AssetPreview` (Novo componente React)
