/**
 * Motor de Diagnóstico Forense (Funnel Autopsy Engine)
 * Versão 3.0 — Sprint B: Integrado com Brain Identity Cards
 *
 * Cada etapa de análise usa frameworks REAIS de 2 experts do Conselho:
 *   Hook    → Carlton (hook_and_fascinations) + Halbert (headline_score)
 *   Story   → Sugarman (slippery_slide) + Schwartz (awareness_alignment)
 *   Offer   → Kennedy (offer_architecture) + Brunson (value_ladder_score)
 *   Friction → Bird (simplicity_efficiency) + Hopkins (scientific_rigor)
 *   Trust   → Hopkins (trial_and_proof) + Ogilvy (big_idea_test)
 */

import { generateWithGemini, PRO_GEMINI_MODEL } from '@/lib/ai/gemini';
import { AutopsyReport, AutopsyRunRequest } from '@/types/autopsy';
import { loadBrain } from '@/lib/intelligence/brains/loader';
import { buildScoringPromptFromBrain, buildMultiCounselorContext } from '@/lib/intelligence/brains/prompt-builder';
import type { CounselorId } from '@/types';

// ═══════════════════════════════════════════════════════
// STAGE → EXPERTS MAPPING
// ═══════════════════════════════════════════════════════

interface StageExpertMapping {
  counselorIds: CounselorId[];
  frameworks: { counselorId: CounselorId; frameworkId: string }[];
  label: string;
  question: string;
}

const STAGE_EXPERT_MAP: Record<string, StageExpertMapping> = {
  hook: {
    counselorIds: ['john_carlton', 'gary_halbert'],
    frameworks: [
      { counselorId: 'john_carlton', frameworkId: 'hook_and_fascinations' },
      { counselorId: 'gary_halbert', frameworkId: 'headline_score' },
    ],
    label: 'Hook (Gancho)',
    question: 'A headline captura a atenção em < 5s? É específica e resolve uma dor?',
  },
  story: {
    counselorIds: ['joseph_sugarman', 'eugene_schwartz'],
    frameworks: [
      { counselorId: 'joseph_sugarman', frameworkId: 'slippery_slide' },
      { counselorId: 'eugene_schwartz', frameworkId: 'awareness_alignment' },
    ],
    label: 'Story (Conexão)',
    question: 'O copy quebra as objeções principais? Existe uma narrativa clara e um "slippery slide"?',
  },
  offer: {
    counselorIds: ['dan_kennedy_copy', 'russell_brunson'],
    frameworks: [
      { counselorId: 'dan_kennedy_copy', frameworkId: 'offer_architecture' },
      { counselorId: 'russell_brunson', frameworkId: 'value_ladder_score' },
    ],
    label: 'Offer (Oferta)',
    question: 'Existe empilhamento de valor claro? A oferta é irresistível com risk reversal?',
  },
  friction: {
    counselorIds: ['drayton_bird', 'claude_hopkins'],
    frameworks: [
      { counselorId: 'drayton_bird', frameworkId: 'simplicity_efficiency' },
      { counselorId: 'claude_hopkins', frameworkId: 'scientific_rigor' },
    ],
    label: 'Friction (Fricção)',
    question: 'Existem elementos que dificultam a conversão? O copy é direto e eficiente?',
  },
  trust: {
    counselorIds: ['claude_hopkins', 'david_ogilvy'],
    frameworks: [
      { counselorId: 'claude_hopkins', frameworkId: 'trial_and_proof' },
      { counselorId: 'david_ogilvy', frameworkId: 'big_idea_test' },
    ],
    label: 'Trust (Confiança)',
    question: 'Existem depoimentos, selos, provas sociais e provas factuais?',
  },
};

// ═══════════════════════════════════════════════════════
// ENGINE
// ═══════════════════════════════════════════════════════

export class AutopsyEngine {
  /**
   * Executa a análise heurística do conteúdo capturado.
   */
  static async analyzeContent(
    url: string,
    scrapedContent: string,
    request: AutopsyRunRequest,
    metadata: { loadTimeMs: number; techStack: string[]; screenshotUrl?: string }
  ): Promise<AutopsyReport> {
    // US-22.01: Limitar conteúdo para evitar estouro de contexto e timeout
    const maxChars = 30000;
    const limitedContent = scrapedContent.length > maxChars
      ? scrapedContent.substring(0, maxChars) + '... [Conteúdo truncado para análise]'
      : scrapedContent;

    const prompt = this.buildAnalysisPrompt(limitedContent, request.context);

    const responseText = await generateWithGemini(prompt, {
      model: PRO_GEMINI_MODEL,
      temperature: 0.2,
      responseMimeType: 'application/json',
    });

    try {
      const analysis = JSON.parse(responseText);

      return {
        score: analysis.score,
        summary: analysis.summary,
        heuristics: analysis.heuristics,
        recommendations: analysis.recommendations,
        metadata: {
          loadTimeMs: metadata.loadTimeMs,
          techStack: metadata.techStack,
          ...(metadata.screenshotUrl ? { screenshotUrl: metadata.screenshotUrl } : {}),
        },
      };
    } catch (error) {
      console.error('[AUTOPSY_ENGINE_PARSE_ERROR]:', error, responseText);
      throw new Error('Falha ao processar a análise heurística do Gemini.');
    }
  }

  /**
   * Builds the framework context for each autopsy stage using real identity cards.
   */
  private static buildStageFrameworks(): string {
    const sections: string[] = [];

    for (const [stage, mapping] of Object.entries(STAGE_EXPERT_MAP)) {
      const expertParts: string[] = [];

      for (const { counselorId, frameworkId } of mapping.frameworks) {
        const frameworkJson = buildScoringPromptFromBrain(counselorId, frameworkId);
        if (!frameworkJson) continue;

        const brain = loadBrain(counselorId);
        if (!brain) continue;

        const redFlags = brain.redFlags.slice(0, 3).map(rf =>
          `  - ${rf.id}: ${rf.label} (penalty: ${rf.penalty})`
        ).join('\n');

        expertParts.push(
          `**${brain.name}** (${frameworkId}):\n${frameworkJson}\n` +
          `Red Flags relevantes:\n${redFlags}`
        );
      }

      sections.push(
        `### ${mapping.label}\nPergunta-chave: ${mapping.question}\n\n${expertParts.join('\n\n')}`
      );
    }

    return sections.join('\n\n---\n\n');
  }

  /**
   * Constrói o prompt para o Gemini baseado nos frameworks reais do Conselho.
   */
  private static buildAnalysisPrompt(content: string, context?: AutopsyRunRequest['context']): string {
    const stageFrameworks = this.buildStageFrameworks();

    return `Você é o Analista Forense do Conselho de Funil. Sua missão é realizar uma autópsia detalhada em uma página de vendas/funil.

Baseie sua análise EXCLUSIVAMENTE nos dados fornecidos e nos frameworks dos experts abaixo.

CONTEÚDO DA PÁGINA:
---
${content}
---

CONTEXTO ADICIONAL:
Público-alvo: ${context?.targetAudience || 'Não informado'}
Oferta Principal: ${context?.mainOffer || 'Não informada'}

## FRAMEWORKS DE ANÁLISE POR ETAPA (Conselho de Funil)

${stageFrameworks}

## FORMATO DE RESPOSTA

VOCÊ DEVE RESPONDER APENAS COM UM JSON NO SEGUINTE FORMATO:
{
  "score": number (0-10),
  "summary": "string (resumo executivo referenciando os frameworks usados)",
  "heuristics": {
    "hook": { "score": number, "status": "pass"|"fail"|"warning", "findings": ["string — referenciando critérios de Carlton/Halbert"] },
    "story": { "score": number, "status": "pass"|"fail"|"warning", "findings": ["string — referenciando critérios de Sugarman/Schwartz"] },
    "offer": { "score": number, "status": "pass"|"fail"|"warning", "findings": ["string — referenciando critérios de Kennedy/Brunson"] },
    "friction": { "score": number, "status": "pass"|"fail"|"warning", "findings": ["string — referenciando critérios de Bird/Hopkins"] },
    "trust": { "score": number, "status": "pass"|"fail"|"warning", "findings": ["string — referenciando critérios de Hopkins/Ogilvy"] }
  },
  "recommendations": [
    { "priority": "high"|"medium"|"low", "type": "copy"|"design"|"offer"|"technical", "action": "string (ação baseada nos frameworks)", "impact": "string" }
  ]
}

REGRAS:
- Use os critérios e pesos dos frameworks fornecidos para fundamentar cada finding.
- Cada finding deve citar o expert e framework relevante (ex: "Segundo o framework slippery_slide de Sugarman...").
- Se não há dados suficientes para avaliar uma etapa, atribua status "warning" e explique.
- Recommendations devem ser acionáveis e baseadas nos red flags dos experts.
`;
  }
}
