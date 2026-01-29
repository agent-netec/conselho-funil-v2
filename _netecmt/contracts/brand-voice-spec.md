# Especificação do Brand Voice Translator

**Lane:** Brand Hub / AI  
**Status:** 🟢 Ready for Implementation  
**Versão:** 1.0.0

## 1. Arquitetura de Acoplamento (RAG-to-Voice)
O `BrandVoiceTranslator` atua como uma camada de pós-processamento (Middleware) no pipeline de RAG.

### Fluxo de Execução:
1. **Retrieval**: O `RetrievalEngine` busca chunks relevantes (Knowledge + Brand Kit).
2. **Augmentation**: O Prompt é montado com o conhecimento técnico.
3. **Generation**: O LLM gera uma `BaseResponse` técnica e precisa.
4. **Translation (O Ponto de Acoplamento)**:
   - A `BaseResponse` é enviada ao `BrandVoiceTranslator`.
   - O tradutor injeta as `VoiceGuidelines` (extraídas do Brand Kit).
   - O LLM realiza o "Style Transfer" sem alterar os fatos técnicos.

## 2. Contrato do Tradutor
```typescript
export interface VoiceGuidelines {
  tone: string;             // ex: "Sarcástico mas prestativo"
  forbiddenWords: string[]; // ex: ["barato", "promoção"]
  preferredTerms: Record<string, string>; // ex: {"cliente": "membro"}
  formatting: {
    useEmojis: boolean;
    paragraphStyle: 'short' | 'dense';
  };
}

export interface TranslationInput {
  content: string;
  guidelines: VoiceGuidelines;
  platformContext?: string; // ex: "Instagram DM" (ajusta brevidade)
}
```

## 3. Prompt de Style Transfer (System Prompt)
```markdown
Você é o Brand Voice Translator do Conselho de Funil.
Sua missão é reescrever o CONTEÚDO TÉCNICO abaixo seguindo rigorosamente as DIRETRIZES DE VOZ.

REGRAS:
1. NÃO altere os fatos, dados ou instruções técnicas.
2. Ajuste o vocabulário para os TERMOS PREFERIDOS.
3. Remova qualquer PALAVRA PROIBIDA.
4. Aplique o TOM especificado.
```
