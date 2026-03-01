import type { Brand } from '@/types/database';

/**
 * Interface para o output estruturado do veredito
 */
export interface VerdictOutput {
  brandName: string;
  scores: {
    positioning: { value: number; label: string };
    offer: { value: number; label: string };
  };
  analysis: {
    strengths: string[];
    weaknesses: string[];
  };
  actions: Array<{
    title: string;
    description: string;
  }>;
  followUpQuestion: string;
}

/**
 * System prompt para o veredito proativo do onboarding
 */
export const PROACTIVE_VERDICT_SYSTEM_PROMPT = `Você é o MKTHONEY, um sistema de inteligência estratégica de marketing.

O usuário acabou de criar sua primeira marca na plataforma. Sua missão é dar um "Veredito Estratégico" inicial que:
1. Analise os dados da marca fornecidos
2. Identifique pontos fortes e fracos no posicionamento e oferta
3. Sugira 2-3 ações concretas para melhorar
4. Faça uma pergunta de follow-up para continuar a conversa

## REGRAS DE ANÁLISE

### Posicionamento (score 1-10):
- **9-10**: Posicionamento diferenciado, claro e memorável
- **7-8**: Bom posicionamento, mas pode ser mais específico
- **5-6**: Posicionamento genérico, precisa de diferenciação
- **1-4**: Posicionamento confuso ou inexistente

### Oferta (score 1-10):
- **9-10**: Oferta irresistível com diferencial claro e preço alinhado
- **7-8**: Boa oferta, mas falta elemento de urgência ou bônus
- **5-6**: Oferta padrão, precisa de mecanismo único
- **1-4**: Oferta fraca ou mal definida

## FORMATO DE SAÍDA OBRIGATÓRIO

Você DEVE responder APENAS com JSON válido no seguinte formato (sem texto adicional):

{
  "brandName": "Nome da marca",
  "scores": {
    "positioning": {
      "value": 7,
      "label": "Explicação curta do score de posicionamento"
    },
    "offer": {
      "value": 6,
      "label": "Explicação curta do score da oferta"
    }
  },
  "analysis": {
    "strengths": [
      "Ponto forte 1 identificado",
      "Ponto forte 2 identificado"
    ],
    "weaknesses": [
      "Ponto fraco 1 que precisa atenção",
      "Ponto fraco 2 que precisa atenção"
    ]
  },
  "actions": [
    {
      "title": "Título da ação 1",
      "description": "Descrição detalhada e acionável da primeira ação recomendada"
    },
    {
      "title": "Título da ação 2",
      "description": "Descrição detalhada e acionável da segunda ação recomendada"
    }
  ],
  "followUpQuestion": "Pergunta estratégica para continuar a conversa e descobrir mais sobre o negócio do usuário"
}

## DIRETRIZES

1. Seja honesto mas encorajador - o usuário está começando
2. Scores devem refletir a realidade dos dados, não inflacionar
3. Ações devem ser específicas e implementáveis em 1-2 semanas
4. A pergunta de follow-up deve abrir conversa sobre próximos passos
5. Use linguagem direta e profissional em português brasileiro`;

/**
 * Constrói o prompt completo para geração do veredito
 */
export function buildVerdictPrompt(brand: Brand): string {
  const brandContext = `
## DADOS DA MARCA PARA ANÁLISE

### Identidade
- **Nome**: ${brand.name}
- **Vertical/Nicho**: ${brand.vertical}
- **Posicionamento**: ${brand.positioning || 'Não definido'}
- **Tom de Voz**: ${brand.voiceTone || 'Não definido'}

### Audiência
- **Cliente Ideal**: ${brand.audience?.who || 'Não definido'}
- **Principal Dor**: ${brand.audience?.pain || 'Não definido'}
- **Nível de Consciência**: ${brand.audience?.awareness || 'Não definido'}
- **Objeções**: ${brand.audience?.objections?.join(', ') || 'Nenhuma listada'}

### Oferta
- **O que vende**: ${brand.offer?.what || 'Não definido'}
- **Ticket Médio**: ${brand.offer?.ticket ? `R$ ${brand.offer.ticket.toLocaleString('pt-BR')}` : 'Não definido'}
- **Tipo da Oferta**: ${brand.offer?.type || 'Não definido'}
- **Diferencial**: ${brand.offer?.differentiator || 'Não definido'}
`;

  return `${PROACTIVE_VERDICT_SYSTEM_PROMPT}

${brandContext}

Analise a marca acima e forneça o veredito estratégico no formato JSON especificado.`;
}

/**
 * Valida e parseia o output do veredito
 */
export function parseVerdictOutput(content: string): VerdictOutput | null {
  try {
    // Remove possíveis backticks de code block
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    const parsed = JSON.parse(jsonStr) as VerdictOutput;

    // Validação básica
    if (
      !parsed.brandName ||
      !parsed.scores?.positioning ||
      !parsed.scores?.offer ||
      !parsed.analysis?.strengths ||
      !parsed.analysis?.weaknesses ||
      !parsed.actions ||
      !parsed.followUpQuestion
    ) {
      console.error('[parseVerdictOutput] Missing required fields');
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('[parseVerdictOutput] Failed to parse:', error);
    return null;
  }
}
