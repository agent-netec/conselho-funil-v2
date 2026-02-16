/**
 * Ad Generator — Creative Automation Pipeline
 * Sprint 25 · S25-ST-04
 *
 * Gera 3-5 variações de anúncio multi-formato (Meta Feed, Meta Stories,
 * Google Search) a partir de Elite Assets, com CPS estimado por variação
 * e rastreabilidade de frameworks de copywriting.
 *
 * @contract arch-sprint-25-predictive-creative-engine.md § 4
 * @token_budget 8.000 tokens (tag: generate_ads)
 * @rate_limit 10 req/min por brandId
 */

import {
  GeneratedAd,
  AdFormat,
  AdContent,
  MetaFeedAd,
  MetaStoriesAd,
  GoogleSearchAd,
  CopyFramework,
  ConsciousnessLevel,
  AD_CHAR_LIMITS,
  GENERATION_LIMITS,
} from '@/types/creative-ads';
import { UXIntelligence, UXAsset } from '@/types/intelligence';
import { generateWithGemini, DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';
import { getBrand } from '@/lib/firebase/firestore';
import { getPersonalityInstruction } from '@/lib/ai/formatters';
import { AICostGuard } from '@/lib/ai/cost-guard';
import { calculateCPS } from '@/lib/intelligence/predictor/scoring-engine';
import { remixWithEliteAssets } from './asset-remixer';
import { validateBrandVoice } from './brand-compliance';

// ═══════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════

const FEATURE_TAG = 'generate_ads';
const TOKEN_BUDGET = GENERATION_LIMITS.tokenBudgetPerGeneration; // 8000

/** Frameworks disponíveis para seleção round-robin */
const AVAILABLE_FRAMEWORKS: CopyFramework[] = [
  'schwartz',
  'halbert_aida',
  'brunson_story',
  'cialdini',
  'ogilvy',
];

// ═══════════════════════════════════════════════════════
// INTERFACES INTERNAS
// ═══════════════════════════════════════════════════════

export interface GenerateAdsOptions {
  maxVariations?: number;
  audienceLevel?: ConsciousnessLevel;
  minToneMatch?: number;
  preferredFrameworks?: CopyFramework[];
  includeImageSuggestions?: boolean;
  /** Sprint H: Brain context from identity cards */
  brainContext?: string;
  /** Sprint H: RAG context from knowledge base */
  ragContext?: string;
  /** Sprint H: Brand context from brand assets */
  brandContext?: string;
  /** Sprint I: Skip heavy post-processing (CPS scoring + brand voice) to stay within serverless timeout */
  lightMode?: boolean;
}

export interface GenerateAdsResult {
  ads: GeneratedAd[];
  totalGenerated: number;
  totalRejected: number;
  avgCPS: number;
  eliteAssetsUsed: number;
  tokensUsed: number;
  frameworksApplied: CopyFramework[];
}

interface GeminiAdVariation {
  format: AdFormat;
  framework: CopyFramework;
  frameworkExplanation: string;
  content: Record<string, unknown>;
  sourceHeadlines: string[];
  sourceCtas: string[];
  sourceHooks: string[];
}

interface GeminiAdsResponse {
  variations: GeminiAdVariation[];
}

// ═══════════════════════════════════════════════════════
// PROMPT BUILDER
// ═══════════════════════════════════════════════════════

function buildGenerationPrompt(
  assets: UXIntelligence,
  formats: AdFormat[],
  maxVariations: number,
  options: GenerateAdsOptions
): string {
  const headlines = assets.headlines
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 10)
    .map((h) => `- "${h.text}" (relevance: ${h.relevanceScore})`)
    .join('\n');

  const ctas = assets.ctas
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 10)
    .map((c) => `- "${c.text}" (relevance: ${c.relevanceScore})`)
    .join('\n');

  const hooks = assets.hooks
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 10)
    .map((h) => `- "${h.text}" (relevance: ${h.relevanceScore})`)
    .join('\n');

  const audienceContext = options.audienceLevel
    ? `\n## Nível de Consciência do Público (Schwartz)\nNível: ${getAudienceLevelLabel(options.audienceLevel)}\nAdapte o tom e a abordagem de cada anúncio para este nível.`
    : '';

  // Sprint H: Brain/RAG/Brand enrichment
  const brainSection = options.brainContext
    ? `\n## IDENTITY CARDS DOS ESPECIALISTAS (Frameworks Reais)\n\n${options.brainContext}\n`
    : '';
  const ragSection = options.ragContext
    ? `\n## CONHECIMENTO ESTRATÉGICO (ADS PLAYBOOKS)\n${options.ragContext}\n`
    : '';
  const brandSection = options.brandContext
    ? `\n## CONHECIMENTO DA MARCA\n${options.brandContext}\n`
    : '';

  const frameworkInstructions = options.preferredFrameworks?.length
    ? `\nFrameworks preferidos: ${options.preferredFrameworks.join(', ')}`
    : `\nUse frameworks variados entre: schwartz, halbert_aida, brunson_story, cialdini, ogilvy`;

  const formatSpecs = formats
    .map((f) => {
      switch (f) {
        case 'meta_feed': {
          const mf = AD_CHAR_LIMITS.meta_feed;
          return `### meta_feed
- headline: max ${mf.headline} chars
- body: max ${mf.body} chars (primary text)
- description: max ${mf.description} chars
- cta: texto do botão CTA (Ex: "Saiba Mais", "Comprar Agora")
- imageSuggestion: descrição breve da imagem ideal${options.includeImageSuggestions !== false ? '' : ' (omitir)'}`;
        }
        case 'meta_stories': {
          const ms = AD_CHAR_LIMITS.meta_stories;
          return `### meta_stories
- hook: max ${ms.hook} chars (texto rápido de 3s)
- body: max ${ms.body} chars (texto principal de 5s)
- ctaOverlay: max ${ms.ctaOverlay} chars (overlay CTA)
- visualDirection: direção visual sugerida para o criativo`;
        }
        case 'google_search': {
          const gs = AD_CHAR_LIMITS.google_search;
          return `### google_search
- headlines: EXATAMENTE 3 headlines, max ${gs.headline} chars cada
- descriptions: EXATAMENTE 2 descriptions, max ${gs.description} chars cada`;
        }
        default:
          return '';
      }
    })
    .join('\n\n');

  return `Você é um copywriter sênior especializado em anúncios de performance digital, treinado nas metodologias de Eugene Schwartz (níveis de consciência), Gary Halbert (AIDA), Russell Brunson (Story→Offer→Close), Robert Cialdini (persuasão) e David Ogilvy (copy longo, headline-driven).
${brainSection}${ragSection}${brandSection}
## Tarefa
Gere ${maxVariations} variações de anúncio a partir dos ativos de elite abaixo. Cada variação deve usar um formato e framework de copywriting diferente quando possível.
${options.brainContext ? 'Use os frameworks dos especialistas acima para fundamentar cada variação.\n' : ''}${audienceContext}
${frameworkInstructions}

## Elite Assets

### Headlines de Elite
${headlines || 'Nenhuma headline disponível.'}

### CTAs de Elite
${ctas || 'Nenhum CTA disponível.'}

### Hooks de Elite
${hooks || 'Nenhum hook disponível.'}

## Formatos Solicitados
${formatSpecs}

## Regras Críticas
1. RESPEITE os limites de caracteres RIGOROSAMENTE — NUNCA ultrapasse.
2. Cada variação DEVE usar um framework diferente (se possível com ${maxVariations} variações).
3. Cada variação DEVE referenciar quais assets de elite inspiraram a criação.
4. O conteúdo deve ser em português brasileiro, persuasivo e direto.
5. Distribua os formatos equilibradamente entre as variações (se múltiplos formatos solicitados).
6. Inclua frameworkExplanation explicando como o framework foi aplicado (1-2 frases).

## Formato de Resposta (JSON Estrito)

Responda EXCLUSIVAMENTE com um JSON válido, sem markdown, no seguinte formato:

{
  "variations": [
    {
      "format": "meta_feed",
      "framework": "halbert_aida",
      "frameworkExplanation": "AIDA: headline captura Atenção, body gera Interesse e Desejo, CTA converte em Ação.",
      "content": {
        "type": "meta_feed",
        "headline": "Texto do headline (max ${AD_CHAR_LIMITS.meta_feed.headline} chars)",
        "body": "Texto do body (max ${AD_CHAR_LIMITS.meta_feed.body} chars)",
        "description": "Texto da description (max ${AD_CHAR_LIMITS.meta_feed.description} chars)",
        "cta": "Saiba Mais",
        "imageSuggestion": "Descrição da imagem ideal"
      },
      "sourceHeadlines": ["headline de elite usada como base"],
      "sourceCtas": ["cta de elite usado como base"],
      "sourceHooks": ["hook de elite usado como base"]
    }
  ]
}

REGRAS DO JSON:
- O campo "type" dentro de content DEVE ser igual ao campo "format" da variação.
- Para google_search, content.headlines deve ser um array de EXATAMENTE 3 strings, content.descriptions um array de EXATAMENTE 2 strings.
- sourceHeadlines, sourceCtas, sourceHooks devem conter textos reais dos Elite Assets acima.
- Gere EXATAMENTE ${maxVariations} variações.`;
}

// ═══════════════════════════════════════════════════════
// AD GENERATOR PIPELINE
// ═══════════════════════════════════════════════════════

/**
 * Gera variações de anúncio multi-formato a partir de Elite Assets.
 *
 * @param brandId - ID da brand (isolamento multi-tenant)
 * @param assets - UXIntelligence com elite assets
 * @param formats - Formatos de anúncio desejados
 * @param options - Opções de geração
 * @param userId - ID do usuário para cost-guard
 * @returns GenerateAdsResult com ads e metadata
 */
export async function generateAds(
  brandId: string,
  assets: UXIntelligence,
  formats: AdFormat[],
  options: GenerateAdsOptions = {},
  userId: string = 'system'
): Promise<GenerateAdsResult> {
  // 1. Enforce max variations (hardcoded, não bypassável)
  const maxVariations = Math.min(
    options.maxVariations ?? 3,
    GENERATION_LIMITS.maxVariationsPerRequest
  );

  // 2. Validar que há assets suficientes
  const hasHeadlines = assets.headlines?.length > 0;
  const hasCtas = assets.ctas?.length > 0;
  const hasHooks = assets.hooks?.length > 0;

  if (!hasHeadlines && !hasCtas && !hasHooks) {
    throw new Error('EMPTY_ASSETS: eliteAssets deve conter ao menos headlines, CTAs ou hooks.');
  }

  // 3. Remix com Elite Assets (ST-05) — enriquece antes de gerar
  let remixData;
  try {
    remixData = await remixWithEliteAssets(brandId, assets, {
      audienceLevel: options.audienceLevel,
      preferredFrameworks: options.preferredFrameworks,
    });
  } catch (error) {
    console.warn('[AdGenerator] Elite Asset remix falhou, prosseguindo sem remix:', error);
    remixData = null;
  }

  // 4. Cost guard — budget check
  const model = DEFAULT_GEMINI_MODEL;
  const hasBudget = await AICostGuard.checkBudget({
    userId,
    brandId,
    model,
    feature: FEATURE_TAG,
  });

  if (!hasBudget) {
    throw new Error('Budget limit exceeded or no credits available.');
  }

  // 5. Build prompt e chamar Gemini
  const prompt = buildGenerationPrompt(assets, formats, maxVariations, options);

  // Fetch brand AI config for temperature/topP + personality
  const brand = await getBrand(brandId);
  const personalityNote = getPersonalityInstruction(brand?.aiConfiguration?.profile);
  const enrichedPrompt = personalityNote
    ? `${prompt}\n\n## Estilo de Personalidade da Marca\n${personalityNote}`
    : prompt;

  const rawResponse = await generateWithGemini(enrichedPrompt, {
    model,
    temperature: brand?.aiConfiguration?.temperature || 0.7,
    topP: brand?.aiConfiguration?.topP || 0.95,
    maxOutputTokens: TOKEN_BUDGET,
    responseMimeType: 'application/json',
    userId,
    brandId,
    feature: FEATURE_TAG,
  });

  // 6. Parsear resposta
  const parsed = parseGeminiAdsResponse(rawResponse);

  // 7. Validar e construir GeneratedAds com char limit enforcement
  const validAds: GeneratedAd[] = [];
  let totalRejected = 0;
  const frameworksUsed = new Set<CopyFramework>();
  const eliteAssetsTracked = new Set<string>();

  for (const variation of parsed.variations) {
    try {
      // Validar e sanitizar conteúdo por formato
      const validatedContent = validateAndTrimContent(variation);
      if (!validatedContent) {
        totalRejected++;
        continue;
      }

      // Track frameworks
      const framework = validateFramework(variation.framework);
      frameworksUsed.add(framework);

      // Track elite assets used
      for (const h of variation.sourceHeadlines || []) eliteAssetsTracked.add(h);
      for (const c of variation.sourceCtas || []) eliteAssetsTracked.add(c);
      for (const hook of variation.sourceHooks || []) eliteAssetsTracked.add(hook);

      // Build sourceAssets com rastreabilidade de remix (ST-05)
      const sourceHeadlines = variation.sourceHeadlines || [];
      const sourceCtas = variation.sourceCtas || [];
      const sourceHooks = variation.sourceHooks || [];

      // Enriquecer com elite assets do remix se disponíveis
      if (remixData) {
        for (const h of remixData.headlines) {
          if (!sourceHeadlines.includes(h)) sourceHeadlines.push(h);
        }
        for (const c of remixData.ctas) {
          if (!sourceCtas.includes(c)) sourceCtas.push(c);
        }
        for (const hk of remixData.hooks) {
          if (!sourceHooks.includes(hk)) sourceHooks.push(hk);
        }
      }

      // Usar framework explanation do remix se disponível
      const frameworkExplanation =
        variation.frameworkExplanation ||
        (remixData?.frameworkExplanations?.[framework]) ||
        `Gerado com framework ${framework}.`;

      // Build GeneratedAd (CPS e brandVoice serão preenchidos abaixo)
      validAds.push({
        id: generateUUID(),
        format: variation.format,
        content: validatedContent,
        estimatedCPS: 0, // Será preenchido pelo enrichWithCPS
        brandVoice: {
          toneMatch: 0,
          passed: false,
          // Será preenchido pelo validateBrandVoice (ST-06)
        },
        sourceAssets: {
          headlines: sourceHeadlines,
          ctas: sourceCtas,
          hooks: sourceHooks,
        },
        framework,
        frameworkExplanation,
      });
    } catch {
      totalRejected++;
    }
  }

  // 8. Calcular estimatedCPS para cada variação
  if (options.lightMode) {
    // lightMode: heuristic CPS only (skip PRO model scoring — saves ~45-135s)
    for (const ad of validAds) {
      ad.estimatedCPS = estimateHeuristicCPS(ad);
    }
    console.log('[AdGenerator] lightMode: CPS heurístico aplicado, scoring PRO pulado');
  } else {
    await enrichWithCPS(validAds, brandId, assets, userId);
  }

  // 9. Brand Voice Compliance Gate (ST-06)
  let brandVoiceRejected = 0;
  if (!options.lightMode) {
    try {
      const complianceReport = await validateBrandVoice(brandId, validAds, {
        minToneMatch: options.minToneMatch,
      });
      brandVoiceRejected = complianceReport.totalRejected;
    } catch (error) {
      console.warn('[AdGenerator] Brand Voice compliance falhou, prosseguindo sem validação:', error);
      // Graceful degradation: ads passam sem validação de Brand Voice
    }
  } else {
    console.log('[AdGenerator] lightMode: Brand Voice validation pulada');
  }

  totalRejected += brandVoiceRejected;

  // 10. Calcular metadata
  const tokensUsed = AICostGuard.estimateTokens(prompt + rawResponse);
  const avgCPS =
    validAds.length > 0
      ? Math.round(
          (validAds.reduce((sum, ad) => sum + ad.estimatedCPS, 0) / validAds.length) * 100
        ) / 100
      : 0;

  return {
    ads: validAds,
    totalGenerated: validAds.length,
    totalRejected,
    avgCPS,
    eliteAssetsUsed: eliteAssetsTracked.size + (remixData?.totalEliteAssets || 0),
    tokensUsed,
    frameworksApplied: Array.from(frameworksUsed),
  };
}

// ═══════════════════════════════════════════════════════
// PARSING & VALIDATION
// ═══════════════════════════════════════════════════════

/**
 * Parseia a resposta JSON do Gemini com fallback para limpeza de markdown.
 */
function parseGeminiAdsResponse(raw: string): GeminiAdsResponse {
  let jsonStr = raw.trim();

  // Remover possíveis wrappers markdown
  if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
  if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
  if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);

  try {
    const parsed = JSON.parse(jsonStr.trim()) as GeminiAdsResponse;

    if (!parsed.variations || !Array.isArray(parsed.variations)) {
      throw new Error('Resposta do Gemini sem array "variations".');
    }

    if (parsed.variations.length === 0) {
      throw new Error('Gemini retornou 0 variações.');
    }

    return parsed;
  } catch (error) {
    console.error('[AdGenerator] Falha ao parsear resposta do Gemini:', raw.slice(0, 500));
    throw new Error(
      `GENERATION_ERROR: Falha ao processar resposta da IA. ${error instanceof Error ? error.message : ''}`
    );
  }
}

/**
 * Valida e trunca o conteúdo do anúncio conforme os limites de caracteres.
 * Retorna null se o formato for inválido.
 */
function validateAndTrimContent(variation: GeminiAdVariation): AdContent | null {
  const format = variation.format;
  const content = variation.content;

  if (!content || !format) return null;

  switch (format) {
    case 'meta_feed':
      return validateMetaFeed(content);
    case 'meta_stories':
      return validateMetaStories(content);
    case 'google_search':
      return validateGoogleSearch(content);
    default:
      console.warn(`[AdGenerator] Formato desconhecido: ${format}`);
      return null;
  }
}

function validateMetaFeed(content: Record<string, unknown>): MetaFeedAd | null {
  const limits = AD_CHAR_LIMITS.meta_feed;

  const headline = truncate(String(content.headline || ''), limits.headline);
  const body = truncate(String(content.body || ''), limits.body);
  const cta = String(content.cta || 'Saiba Mais');

  if (!headline || !body) return null;

  const ad: MetaFeedAd = {
    type: 'meta_feed',
    headline,
    body,
    cta,
  };

  if (content.description) {
    ad.description = truncate(String(content.description), limits.description);
  }
  if (content.imageSuggestion) {
    ad.imageSuggestion = String(content.imageSuggestion);
  }

  return ad;
}

function validateMetaStories(content: Record<string, unknown>): MetaStoriesAd | null {
  const limits = AD_CHAR_LIMITS.meta_stories;

  const hook = truncate(String(content.hook || ''), limits.hook);
  const body = truncate(String(content.body || ''), limits.body);
  const ctaOverlay = truncate(String(content.ctaOverlay || ''), limits.ctaOverlay);

  if (!hook || !body) return null;

  const ad: MetaStoriesAd = {
    type: 'meta_stories',
    hook,
    body,
    ctaOverlay: ctaOverlay || 'Saiba Mais',
  };

  if (content.visualDirection) {
    ad.visualDirection = String(content.visualDirection);
  }

  return ad;
}

function validateGoogleSearch(content: Record<string, unknown>): GoogleSearchAd | null {
  const limits = AD_CHAR_LIMITS.google_search;

  // Validar headlines (exatamente 3)
  const rawHeadlines = Array.isArray(content.headlines) ? content.headlines : [];
  if (rawHeadlines.length < 3) return null;

  const headlines: [string, string, string] = [
    truncate(String(rawHeadlines[0] || ''), limits.headline),
    truncate(String(rawHeadlines[1] || ''), limits.headline),
    truncate(String(rawHeadlines[2] || ''), limits.headline),
  ];

  if (headlines.some((h) => !h)) return null;

  // Validar descriptions (exatamente 2)
  const rawDescriptions = Array.isArray(content.descriptions) ? content.descriptions : [];
  if (rawDescriptions.length < 2) return null;

  const descriptions: [string, string] = [
    truncate(String(rawDescriptions[0] || ''), limits.description),
    truncate(String(rawDescriptions[1] || ''), limits.description),
  ];

  if (descriptions.some((d) => !d)) return null;

  const ad: GoogleSearchAd = {
    type: 'google_search',
    headlines,
    descriptions,
  };

  if (content.path && Array.isArray(content.path)) {
    ad.path = [String(content.path[0] || ''), content.path[1] ? String(content.path[1]) : undefined];
  }

  return ad;
}

// ═══════════════════════════════════════════════════════
// CPS ENRICHMENT
// ═══════════════════════════════════════════════════════

/**
 * Enriquece cada ad com estimatedCPS via scoring-engine (ST-01).
 * Constrói um UXIntelligence sintético a partir do conteúdo do ad
 * e calcula o CPS para estimar a conversão.
 */
async function enrichWithCPS(
  ads: GeneratedAd[],
  brandId: string,
  originalAssets: UXIntelligence,
  userId: string
): Promise<void> {
  for (const ad of ads) {
    try {
      // Construir UXIntelligence sintético a partir do ad gerado
      const syntheticAssets = buildSyntheticAssets(ad, originalAssets);

      const result = await calculateCPS(brandId, syntheticAssets, undefined, userId);
      ad.estimatedCPS = Math.round(result.score * 100) / 100;
    } catch (error) {
      // Graceful degradation: se CPS falhar, usar score estimado heurístico
      console.warn(`[AdGenerator] Falha ao calcular CPS para ad ${ad.id}:`, error);
      ad.estimatedCPS = estimateHeuristicCPS(ad);
    }
  }
}

/**
 * Constrói UXIntelligence sintético a partir do conteúdo de um ad gerado,
 * para estimar seu CPS via scoring-engine.
 */
function buildSyntheticAssets(
  ad: GeneratedAd,
  originalAssets: UXIntelligence
): UXIntelligence {
  const headlines: UXAsset[] = [];
  const ctas: UXAsset[] = [];
  const hooks: UXAsset[] = [];

  switch (ad.content.type) {
    case 'meta_feed': {
      const content = ad.content as MetaFeedAd;
      headlines.push({
        text: content.headline,
        type: 'headline',
        relevanceScore: 0.8,
      });
      ctas.push({
        text: content.cta,
        type: 'cta',
        relevanceScore: 0.8,
      });
      if (content.body) {
        hooks.push({
          text: content.body,
          type: 'hook',
          relevanceScore: 0.7,
        });
      }
      break;
    }
    case 'meta_stories': {
      const content = ad.content as MetaStoriesAd;
      hooks.push({
        text: content.hook,
        type: 'hook',
        relevanceScore: 0.8,
      });
      ctas.push({
        text: content.ctaOverlay,
        type: 'cta',
        relevanceScore: 0.8,
      });
      if (content.body) {
        headlines.push({
          text: content.body,
          type: 'headline',
          relevanceScore: 0.6,
        });
      }
      break;
    }
    case 'google_search': {
      const content = ad.content as GoogleSearchAd;
      for (const h of content.headlines) {
        headlines.push({
          text: h,
          type: 'headline',
          relevanceScore: 0.8,
        });
      }
      for (const d of content.descriptions) {
        hooks.push({
          text: d,
          type: 'hook',
          relevanceScore: 0.7,
        });
      }
      break;
    }
  }

  return {
    headlines: headlines.length > 0 ? headlines : originalAssets.headlines.slice(0, 3),
    ctas: ctas.length > 0 ? ctas : originalAssets.ctas.slice(0, 3),
    hooks: hooks.length > 0 ? hooks : originalAssets.hooks.slice(0, 3),
    visualElements: originalAssets.visualElements,
    funnelStructure: originalAssets.funnelStructure,
  };
}

/**
 * Estimativa heurística de CPS quando o scoring-engine não está disponível.
 * Baseada em checklist simples dos elementos presentes.
 */
function estimateHeuristicCPS(ad: GeneratedAd): number {
  let score = 40; // Base

  // Presença de headline
  if (ad.content.type === 'meta_feed' && (ad.content as MetaFeedAd).headline) score += 10;
  if (ad.content.type === 'google_search' && (ad.content as GoogleSearchAd).headlines?.length === 3) score += 10;

  // Presença de CTA
  if (ad.content.type === 'meta_feed' && (ad.content as MetaFeedAd).cta) score += 10;
  if (ad.content.type === 'meta_stories' && (ad.content as MetaStoriesAd).ctaOverlay) score += 10;

  // Presença de hook
  if (ad.content.type === 'meta_stories' && (ad.content as MetaStoriesAd).hook) score += 10;

  // Framework aplicado
  if (ad.framework) score += 5;
  if (ad.frameworkExplanation) score += 5;

  // Source assets rastreados
  const totalSources =
    (ad.sourceAssets.headlines?.length || 0) +
    (ad.sourceAssets.ctas?.length || 0) +
    (ad.sourceAssets.hooks?.length || 0);
  if (totalSources > 0) score += 5;

  return Math.min(score, 85); // Cap heurístico em 85
}

// ═══════════════════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════════════════

/** Trunca string ao limite mantendo integridade de palavras quando possível */
function truncate(text: string, maxLength: number): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;

  // Tentar cortar na última palavra antes do limite
  const sliced = trimmed.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(' ');

  // Se a última palavra tem > 5 chars do limite, cortar na palavra
  if (lastSpace > maxLength - 10 && lastSpace > 0) {
    return sliced.slice(0, lastSpace).trim();
  }

  return sliced.trim();
}

/** Valida e normaliza o framework (fallback para schwartz se inválido) */
function validateFramework(framework: string | undefined): CopyFramework {
  if (!framework) return 'schwartz';
  if (AVAILABLE_FRAMEWORKS.includes(framework as CopyFramework)) {
    return framework as CopyFramework;
  }
  return 'schwartz';
}

/** Gera UUID v4 simples (crypto-safe quando disponível) */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback para ambientes sem crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Retorna label legível para o nível de consciência */
function getAudienceLevelLabel(level: ConsciousnessLevel): string {
  const labels: Record<ConsciousnessLevel, string> = {
    unaware: 'Nível 1 — Não sabe que tem o problema (Unaware)',
    problem_aware: 'Nível 2 — Sabe do problema, não da solução (Problem Aware)',
    solution_aware: 'Nível 3 — Sabe da solução, não do produto (Solution Aware)',
    product_aware: 'Nível 4 — Sabe do produto, não está convencido (Product Aware)',
    most_aware: 'Nível 5 — Pronto para comprar (Most Aware)',
  };
  return labels[level] || level;
}
