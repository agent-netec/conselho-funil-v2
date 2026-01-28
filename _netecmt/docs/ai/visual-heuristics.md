# 📐 Arquitetura: Inteligência Multimodal & Vision (Sprint 11)

**Lane:** AI / Infrastructure  
**Responsável:** Athos (Arquiteto)

## 1. Pipeline Vision Intelligence
Para evitar custos desnecessários e latência, a análise visual seguirá o fluxo:

1.  **Input:** Upload de Imagem (UI) -> Firebase Storage.
2.  **Trigger:** Chamada para `/api/ai/analyze-visual`.
3.  **Prompt de Ouro (Visual Heuristics):** O sistema injetará um prompt técnico oculto que instrui o Gemini 2.0 a agir como um Diretor de Arte Estratégico.
4.  **Output:** Relatório estruturado (JSON) + Contexto formatado para o Chat.

## 2. Estratégia de Namespace Pinecone (v2)
Para suportar o "Brain Expansion", adotaremos a seguinte convenção de namespaces:

- `knowledge-universal`: Livros e cursos base (Russell, Kennedy, etc.).
- `knowledge-specialized`: Transcrições de mentorias e playbooks técnicos.
- `brand-{id}`: Ativos privados de cada cliente.

## 3. Heurísticas de Análise Visual (Prompt Base)
O arquivo `app/src/lib/ai/prompts/vision-heuristics.ts` deve ser criado com as seguintes dimensões:
- **Legibilidade**: Verificação de contraste texto/fundo.
- **Psicologia das Cores**: Alinhamento com o tom de voz da marca.
- **Gatilhos Visuais**: Uso de rostos, setas ou elementos de prova social.

## 4. Segurança e Auditoria
- Cada análise visual gera um log em `brand_assets/{id}/analysis_history` para auditoria de cota.
- Limite de 5 análises visuais por dia para contas 'Free'.
