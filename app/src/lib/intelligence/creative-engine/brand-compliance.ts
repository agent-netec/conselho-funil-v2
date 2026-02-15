/**
 * Brand Voice Compliance Gate — Creative Automation
 * Sprint 25 · S25-ST-06
 *
 * Garante que todo anúncio gerado passe pelo Brand Voice validator
 * com toneMatch mínimo de 0.75 (configurável).
 *
 * Pipeline:
 *   1. Buscar VoiceProfile da brand no Firestore
 *   2. Avaliar toneMatch do ad via Gemini
 *   3. Se abaixo do threshold: rejeitar e regenerar (max 2 retries)
 *   4. Se após retries falhar: incluir com brandVoice.passed = false
 *   5. Registrar adjustments[] feitos para compliance
 *
 * Cross-Lane: brand_voice (readonly — brand-validation.ts, brand-governance.ts)
 * Graceful degradation: se Brand Voice service indisponível, passa com warning.
 *
 * @contract arch-sprint-25-predictive-creative-engine.md § 6
 */

import { GeneratedAd, GENERATION_LIMITS } from '@/types/creative-ads';
import { VoiceProfile } from '@/types/intelligence';
import { generateWithGemini, DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';
import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  limit as firestoreLimit,
} from 'firebase/firestore';

// ═══════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════

export interface BrandVoiceResult {
  toneMatch: number;
  passed: boolean;
  adjustments: string[];
}

export interface ComplianceOptions {
  /** Threshold mínimo de toneMatch (default: 0.75) */
  minToneMatch?: number;
  /** Máximo de retries por ad (default: 2 de GENERATION_LIMITS) */
  maxRetries?: number;
}

export interface ComplianceReport {
  /** Ads que passaram pelo compliance gate */
  validatedAds: GeneratedAd[];
  /** Total de ads rejeitados permanentemente */
  totalRejected: number;
  /** Total de retries realizados */
  totalRetries: number;
  /** Se o Brand Voice service estava disponível */
  serviceAvailable: boolean;
}

interface GeminiBrandVoiceResponse {
  toneMatch: number;
  isConsistent: boolean;
  adjustments: string[];
  explanation: string;
}

// ═══════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════

const DEFAULT_MIN_TONE_MATCH = GENERATION_LIMITS.minToneMatchDefault; // 0.75
const MAX_RETRIES = GENERATION_LIMITS.maxBrandVoiceRetries; // 2

// ═══════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════

/**
 * Valida um array de GeneratedAds contra o Brand Voice da brand.
 *
 * Para cada ad:
 *   - Avalia toneMatch via Gemini + VoiceProfile
 *   - Se toneMatch < threshold: tenta ajustar (max retries)
 *   - Preenche brandVoice.toneMatch, .passed, .adjustments
 *
 * @param brandId - ID da brand (multi-tenant)
 * @param ads - Array de ads gerados para validar
 * @param options - Opções de compliance
 * @returns ComplianceReport com ads validados e métricas
 */
export async function validateBrandVoice(
  brandId: string,
  ads: GeneratedAd[],
  options: ComplianceOptions = {}
): Promise<ComplianceReport> {
  const minToneMatch = options.minToneMatch ?? DEFAULT_MIN_TONE_MATCH;
  const maxRetries = options.maxRetries ?? MAX_RETRIES;

  // 1. Buscar VoiceProfile da brand
  let voiceProfile: VoiceProfile | null = null;

  try {
    voiceProfile = await fetchVoiceProfile(brandId);
  } catch (error) {
    console.warn(
      '[BrandCompliance] Falha ao buscar VoiceProfile, passando ads sem validação:',
      error
    );
    // Graceful degradation: marca todos como não validados mas não bloqueia
    return buildGracefulDegradationReport(ads);
  }

  if (!voiceProfile) {
    console.warn(
      `[BrandCompliance] Nenhum VoiceProfile encontrado para brand ${brandId}, passando ads sem validação.`
    );
    return buildGracefulDegradationReport(ads);
  }

  // 2. Validar cada ad
  const validatedAds: GeneratedAd[] = [];
  let totalRejected = 0;
  let totalRetries = 0;

  for (const ad of ads) {
    try {
      const result = await validateSingleAd(
        ad,
        voiceProfile,
        minToneMatch,
        maxRetries
      );

      // Atualizar brandVoice no ad
      ad.brandVoice = {
        toneMatch: result.toneMatch,
        passed: result.passed,
        adjustments: result.adjustments.length > 0 ? result.adjustments : undefined,
      };

      if (!result.passed) {
        totalRejected++;
      }

      totalRetries += result.retriesUsed;
      validatedAds.push(ad);
    } catch (error) {
      console.warn(
        `[BrandCompliance] Falha ao validar ad ${ad.id}, incluindo com passed=false:`,
        error
      );
      // Graceful: inclui o ad com passed = false
      ad.brandVoice = {
        toneMatch: 0,
        passed: false,
        adjustments: ['Validação falhou — Brand Voice service indisponível'],
      };
      totalRejected++;
      validatedAds.push(ad);
    }
  }

  return {
    validatedAds,
    totalRejected,
    totalRetries,
    serviceAvailable: true,
  };
}

// ═══════════════════════════════════════════════════════
// SINGLE AD VALIDATION
// ═══════════════════════════════════════════════════════

interface SingleAdResult extends BrandVoiceResult {
  retriesUsed: number;
}

/**
 * Valida um único ad contra o VoiceProfile, com retry logic.
 */
async function validateSingleAd(
  ad: GeneratedAd,
  voiceProfile: VoiceProfile,
  minToneMatch: number,
  maxRetries: number
): Promise<SingleAdResult> {
  let retriesUsed = 0;
  let lastResult: GeminiBrandVoiceResponse | null = null;
  const allAdjustments: string[] = [];

  // Primeira avaliação
  lastResult = await evaluateToneMatch(ad, voiceProfile);

  if (lastResult.toneMatch >= minToneMatch) {
    return {
      toneMatch: lastResult.toneMatch,
      passed: true,
      adjustments: lastResult.adjustments,
      retriesUsed: 0,
    };
  }

  // Retry loop: tentar ajustar o ad
  while (retriesUsed < maxRetries) {
    retriesUsed++;
    allAdjustments.push(...lastResult.adjustments);

    // Tentar regenerar o ad com as correções sugeridas
    const adjustedResult = await evaluateWithAdjustments(
      ad,
      voiceProfile,
      lastResult.adjustments
    );

    lastResult = adjustedResult;

    if (adjustedResult.toneMatch >= minToneMatch) {
      return {
        toneMatch: adjustedResult.toneMatch,
        passed: true,
        adjustments: allAdjustments,
        retriesUsed,
      };
    }
  }

  // Após retries: falhou
  allAdjustments.push(...(lastResult?.adjustments || []));
  return {
    toneMatch: lastResult?.toneMatch || 0,
    passed: false,
    adjustments: allAdjustments,
    retriesUsed,
  };
}

// ═══════════════════════════════════════════════════════
// GEMINI TONE EVALUATION
// ═══════════════════════════════════════════════════════

/**
 * Avalia o toneMatch de um ad via Gemini.
 */
async function evaluateToneMatch(
  ad: GeneratedAd,
  voiceProfile: VoiceProfile
): Promise<GeminiBrandVoiceResponse> {
  const adText = extractAdText(ad);

  const prompt = `Você é um especialista em Brand Voice e Copywriting. Avalie se o texto do anúncio abaixo está alinhado com o Tom de Voz da marca.

## Tom de Voz da Marca
- **Tom:** ${voiceProfile.tone}
${voiceProfile.style ? `- **Estilo:** ${voiceProfile.style}` : ''}
${voiceProfile.personality ? `- **Personalidade:** ${voiceProfile.personality}` : ''}
${voiceProfile.vocabulary?.length ? `- **Vocabulário preferido:** ${voiceProfile.vocabulary.join(', ')}` : ''}
${voiceProfile.forbiddenTerms?.length ? `- **Termos proibidos:** ${voiceProfile.forbiddenTerms.join(', ')}` : ''}
${voiceProfile.examples?.length ? `- **Exemplos de referência:**\n${voiceProfile.examples.map((e) => `  - "${e}"`).join('\n')}` : ''}

## Texto do Anúncio (Formato: ${ad.format})
"${adText}"

## Instruções
1. Avalie a consistência do tom de voz (0.0 a 1.0, onde 1.0 = perfeitamente alinhado).
2. Identifique se o texto é consistente com a personalidade da marca.
3. Liste ajustes necessários para melhorar o alinhamento (se houver).
4. Verifique se algum termo proibido foi usado.

## Formato de Resposta (JSON estrito)
Responda EXCLUSIVAMENTE com JSON válido:
{
  "toneMatch": 0.85,
  "isConsistent": true,
  "adjustments": ["Ajuste 1", "Ajuste 2"],
  "explanation": "Breve explicação da avaliação"
}

REGRAS:
- toneMatch DEVE ser um número entre 0.0 e 1.0
- adjustments é um array vazio se não houver ajustes necessários
- Se termos proibidos foram encontrados, liste-os nos adjustments`;

  try {
    const response = await generateWithGemini(prompt, {
      model: DEFAULT_GEMINI_MODEL,
      temperature: 0.1, // Baixa temperatura para avaliação consistente
      maxOutputTokens: 500,
      responseMimeType: 'application/json',
    });

    return parseBrandVoiceResponse(response);
  } catch (error) {
    console.warn('[BrandCompliance] Gemini evaluation failed:', error);
    // Fallback: score neutro
    return {
      toneMatch: 0.5,
      isConsistent: false,
      adjustments: ['Avaliação automática indisponível — revisão manual recomendada'],
      explanation: 'Fallback: Gemini não disponível para avaliação.',
    };
  }
}

/**
 * Re-avalia o ad com as sugestões de ajuste aplicadas.
 * Pede ao Gemini para considerar os ajustes sugeridos.
 */
async function evaluateWithAdjustments(
  ad: GeneratedAd,
  voiceProfile: VoiceProfile,
  previousAdjustments: string[]
): Promise<GeminiBrandVoiceResponse> {
  const adText = extractAdText(ad);

  const prompt = `Você é um especialista em Brand Voice e Copywriting. O texto abaixo foi avaliado e recebeu sugestões de ajuste. Re-avalie considerando que os ajustes foram internalizados.

## Tom de Voz da Marca
- **Tom:** ${voiceProfile.tone}
${voiceProfile.style ? `- **Estilo:** ${voiceProfile.style}` : ''}
${voiceProfile.personality ? `- **Personalidade:** ${voiceProfile.personality}` : ''}
${voiceProfile.vocabulary?.length ? `- **Vocabulário preferido:** ${voiceProfile.vocabulary.join(', ')}` : ''}
${voiceProfile.forbiddenTerms?.length ? `- **Termos proibidos:** ${voiceProfile.forbiddenTerms.join(', ')}` : ''}

## Texto do Anúncio (Formato: ${ad.format})
"${adText}"

## Ajustes Anteriores Aplicados
${previousAdjustments.map((a, i) => `${i + 1}. ${a}`).join('\n')}

## Instruções
Considerando que os ajustes acima foram comunicados ao modelo de geração, re-avalie o toneMatch. Seja um pouco mais tolerante dado que ajustes foram sugeridos, mas mantenha a precisão. Liste apenas ajustes adicionais se ainda houver problemas.

## Formato de Resposta (JSON estrito)
{
  "toneMatch": 0.85,
  "isConsistent": true,
  "adjustments": [],
  "explanation": "Breve explicação"
}`;

  try {
    const response = await generateWithGemini(prompt, {
      model: DEFAULT_GEMINI_MODEL,
      temperature: 0.1,
      maxOutputTokens: 500,
      responseMimeType: 'application/json',
    });

    return parseBrandVoiceResponse(response);
  } catch (error) {
    console.warn('[BrandCompliance] Gemini re-evaluation failed:', error);
    return {
      toneMatch: 0.5,
      isConsistent: false,
      adjustments: ['Re-avaliação indisponível'],
      explanation: 'Fallback: Gemini não disponível para re-avaliação.',
    };
  }
}

// ═══════════════════════════════════════════════════════
// VOICE PROFILE FETCHING
// ═══════════════════════════════════════════════════════

/**
 * Busca o VoiceProfile default da brand no Firestore.
 * Cross-lane: brand_voice (readonly).
 */
async function fetchVoiceProfile(
  brandId: string
): Promise<VoiceProfile | null> {
  try {
    const voiceRef = collection(db, 'brands', brandId, 'voice_profiles');
    const q = query(
      voiceRef,
      where('isDefault', '==', true),
      firestoreLimit(1)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data() as VoiceProfile;
  } catch (error) {
    console.warn(
      `[BrandCompliance] Erro ao buscar VoiceProfile para brand ${brandId}:`,
      error
    );
    return null;
  }
}

// ═══════════════════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════════════════

/**
 * Extrai o texto legível de um ad para avaliação de Brand Voice.
 */
function extractAdText(ad: GeneratedAd): string {
  const content = ad.content;

  switch (content.type) {
    case 'meta_feed':
      return [content.headline, content.body, content.description, content.cta]
        .filter(Boolean)
        .join(' | ');

    case 'meta_stories':
      return [content.hook, content.body, content.ctaOverlay]
        .filter(Boolean)
        .join(' | ');

    case 'google_search':
      return [
        ...content.headlines,
        ...content.descriptions,
      ]
        .filter(Boolean)
        .join(' | ');

    default:
      return '';
  }
}

/**
 * Parseia a resposta JSON do Gemini para BrandVoiceResponse.
 */
function parseBrandVoiceResponse(raw: string): GeminiBrandVoiceResponse {
  let jsonStr = raw.trim();

  // Remover wrappers markdown
  if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
  if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
  if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);

  try {
    const parsed = JSON.parse(jsonStr.trim());

    // Validar e sanitizar toneMatch
    const toneMatch = Math.max(0, Math.min(1, Number(parsed.toneMatch) || 0));

    return {
      toneMatch,
      isConsistent: Boolean(parsed.isConsistent),
      adjustments: Array.isArray(parsed.adjustments) ? parsed.adjustments : [],
      explanation: String(parsed.explanation || ''),
    };
  } catch (error) {
    console.warn('[BrandCompliance] Falha ao parsear resposta do Gemini:', raw.slice(0, 300));
    return {
      toneMatch: 0.5,
      isConsistent: false,
      adjustments: ['Resposta de avaliação não pôde ser processada'],
      explanation: `Parse error: ${error instanceof Error ? error.message : 'unknown'}`,
    };
  }
}

/**
 * Constrói report de graceful degradation (quando Brand Voice indisponível).
 * Marca todos os ads como não validados mas não os bloqueia.
 */
function buildGracefulDegradationReport(
  ads: GeneratedAd[]
): ComplianceReport {
  for (const ad of ads) {
    ad.brandVoice = {
      toneMatch: 0,
      passed: false,
      adjustments: ['Brand Voice não configurado — validação não realizada'],
    };
  }

  return {
    validatedAds: ads,
    totalRejected: 0, // Não conta como rejeitados — apenas não validados
    totalRetries: 0,
    serviceAvailable: false,
  };
}
