# 🎯 PRD: Brain Expansion & Visual Intelligence (Sprint 11)

**Versão:** 1.0  
**Responsável:** Iuran (PM)  
**Status:** Ready for Execution

## 1. Problema & Oportunidade
O Conselho já possui o motor Pinecone ativo, mas a "sabedoria" atual está limitada a mocks e poucos documentos manuais. Além disso, a IA hoje é "cega": ela não consegue criticar um anúncio visual ou uma página de vendas por imagem, limitando-se apenas ao texto.

**Objetivo:** Popular massivamente o cérebro com o legado dos mestres e habilitar o "Olho Estratégico" via Gemini Vision.

## 2. Requisitos Funcionais

### RF-01: Ingestão de Legado (Massive Brain Load)
- O sistema deve ingerir todos os documentos contidos nos 5 pacotes .zip identificados no inventário.
- Garantir que cada chunk tenha metadados de Autor e Obra para citação obrigatória.

### RF-02: Visual Strategy Analysis (Gemini Vision)
- O usuário deve poder subir uma imagem de anúncio/LP.
- A IA deve analisar a imagem seguindo heurísticas de:
    - **Contraste e Foco**: Onde o olho do usuário bate primeiro?
    - **Hierarquia de Texto**: A headline é legível? O CTA está visível?
    - **Direção de Olhar**: Elementos visuais apontam para a oferta?

### RF-03: Dashboard de Performance de Assets
- Exibir quantos chunks cada marca possui indexados.
- Mostrar histórico de arquivos processados com sucesso/erro.

## 3. Requisitos Técnicos
- **Modelos**: Gemini 2.0 Flash-exp (Multimodal) para análise visual.
- **Vetorização**: Batch Processing para os .zips (limitar a 50 chunks por requisição para evitar timeout).
- **Storage**: Organização de assets visuais em `brand-assets/{id}/visual-analysis/`.

## 4. Métricas de Sucesso
- 100% dos arquivos .zip ingeridos no namespace `knowledge`.
- Tempo de análise visual inferior a 10s.
- Zero alucinações em citações de fontes (Grounding Check).
