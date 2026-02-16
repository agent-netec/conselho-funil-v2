/**
 * Strategic Analysis Engine — Sprint N-3
 * Provides qualitative Gemini analysis for Spy Agent scans.
 */
import { generateWithGemini, PRO_GEMINI_MODEL } from '@/lib/ai/gemini';

export interface StrategicAnalysisResult {
  qualitative: {
    strengths: string[];
    weaknesses: string[];
    emulate: string[];
    avoid: string[];
  };
  designSystem: {
    colors: string[];
    typography: string;
    spacing: string;
    components: string[];
  };
  strategicRationale: string[];
  actionableInsights: string[];
}

/**
 * Analyze a competitor page content with Gemini for strategic insights.
 * N-3.1 through N-3.4
 */
export async function analyzeCompetitorStrategy(
  url: string,
  htmlContent: string,
  techStack: Record<string, unknown>
): Promise<StrategicAnalysisResult> {
  // Truncate HTML to fit in prompt
  const truncatedHtml = htmlContent.substring(0, 15000);

  const prompt = `Você é um estrategista de marketing digital e design de conversão de nível mundial.

Analise esta página de concorrente e forneça uma análise estratégica completa.

**URL:** ${url}
**Tech Stack detectada:** ${JSON.stringify(techStack)}

**Conteúdo da página (HTML parcial):**
\`\`\`
${truncatedHtml}
\`\`\`

Retorne APENAS um JSON válido com esta estrutura:
{
  "qualitative": {
    "strengths": ["3-5 pontos fortes da página — O que fazem BEM"],
    "weaknesses": ["3-5 pontos fracos — O que precisa melhorar"],
    "emulate": ["3-5 elementos para EMULAR na sua estratégia"],
    "avoid": ["2-3 elementos para EVITAR"]
  },
  "designSystem": {
    "colors": ["#hex das cores principais detectadas, máx 5"],
    "typography": "Descrição da tipografia (ex: 'Sans-serif moderna, provavelmente Inter ou similar')",
    "spacing": "Descrição do espaçamento (ex: 'Espaçamento generoso, ~32-48px entre seções')",
    "components": ["Componentes UI identificados (ex: 'Hero com vídeo', 'Testimonial carousel', 'Pricing table')"]
  },
  "strategicRationale": [
    "5-7 racionalizações estratégicas do PORQUÊ de cada decisão importante (ex: 'CTA vermelho = urgência, padrão Cialdini de escassez', 'Vídeo acima da dobra = storytelling primeiro, copywriting de Gary Halbert')"
  ],
  "actionableInsights": [
    "3-5 ações CONCRETAS e ESPECÍFICAS que você pode implementar hoje (ex: 'Adotar hero com vídeo curto (< 90s) focando no problema #1 do ICP', 'Usar depoimentos em formato vídeo ao lado do CTA final')"
  ]
}`;

  const result = await generateWithGemini(prompt, {
    model: PRO_GEMINI_MODEL,
    responseMimeType: 'application/json',
    temperature: 0.5,
    feature: 'spy_strategic_analysis',
  });

  const parsed = JSON.parse(result);

  return {
    qualitative: {
      strengths: parsed.qualitative?.strengths || [],
      weaknesses: parsed.qualitative?.weaknesses || [],
      emulate: parsed.qualitative?.emulate || [],
      avoid: parsed.qualitative?.avoid || [],
    },
    designSystem: {
      colors: parsed.designSystem?.colors || [],
      typography: parsed.designSystem?.typography || 'Não identificada',
      spacing: parsed.designSystem?.spacing || 'Não identificado',
      components: parsed.designSystem?.components || [],
    },
    strategicRationale: parsed.strategicRationale || [],
    actionableInsights: parsed.actionableInsights || [],
  };
}
