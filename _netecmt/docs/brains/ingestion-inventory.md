# 🗄️ Inventário de Ingestão: Sprint 11

Este documento lista todos os ativos brutos identificados pelo Agente Wilder (Analista) que precisam ser extraídos, normalizados e ingeridos no Pinecone para a expansão do "Cérebro" do Conselho.

---

## 📦 1. Pacotes Identificados (Zips Pendentes)

Estes arquivos contêm a base teórica estruturada dos especialistas e precisam ser descompactados para análise individual.

| Arquivo | Localização | Especialidade | Prioridade | Status |
| :--- | :--- | :--- | :--- | :--- |
| `brain.zip` | `brain/second brain/` | Universal / Funil | P0 | ✅ Extraído |
| `ads_brain_complete_final.zip` | `templates/ads_brain/` | Tráfego Pago | P0 | ✅ Extraído |
| `copywriter_brain.zip` | `templates/copy/` | Copywriting | P0 | ✅ Extraído |
| `social_brain.zip` | `templates/social_media/` | Redes Sociais | P1 | ✅ Extraído |
| `design_brain_final_with_example.zip` | `templates/designer/` | Design / UI | P1 | ✅ Extraído |

---

## 📹 2. Transcrições e Multimodal (Vídeos/Audios)

Ativos que requerem processamento de texto antes da vetorização.

- **[P0] Vídeos Russell Brunson (Funnel Hacking Live)**: Necessário extrair MP3 → Texto (Whisper) → Chunks.
- **[P1] Transcrições Mastermind Kern**: Documentos brutos de transcrição sem formatação.
- **[P2] Creative Library**: Pasta de imagens de anúncios para teste do Gemini Vision (Visual Intelligence).

---

## 🛠️ 3. Plano de Ação para Ingestão (Athos/Darllyson)

1.  **Descompactação e Limpeza**: Wilder deve extrair os zips e converter documentos Word/PDF complexos em Markdown simples para manter a fidelidade semântica.
2.  **Validação de Metadados**: Cada arquivo extraído deve ter o header YAML:
    ```markdown
    ---
    source: "Nome do Livro/Vídeo"
    author: "Nome do Mestre"
    version: "2026-v1"
    docType: "heuristics | playbook | case"
    isApprovedForAI: true
    ---
    ```
3.  **Carga em Lote (Bulk)**: Uso do worker v2 para enviar os arquivos processados para o namespace `knowledge` do Pinecone.

---
*Gerado por Wilder (Analista) - Sprint 11 Prep.*
