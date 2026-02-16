/**
 * Sprint O — O-3.1/O-3.2: Research Chat Refinement API
 * Chat alongside dossier for refinements, questions, extra context.
 * History saved with the dossier.
 *
 * POST /api/intelligence/research/chat
 * Body: { brandId, dossierId, message, chatHistory }
 * Returns: { reply, chatHistory }
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { generateWithGemini, PRO_GEMINI_MODEL } from '@/lib/ai/gemini';
import { getResearch } from '@/lib/firebase/research';
import { updateUserUsage } from '@/lib/firebase/firestore';
import type { ResearchChatMessage } from '@/types/research';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, dossierId, message, chatHistory } = body as {
      brandId?: string;
      dossierId?: string;
      message?: string;
      chatHistory?: ResearchChatMessage[];
    };

    if (!brandId || !dossierId || !message) {
      return createApiError(400, 'brandId, dossierId e message são obrigatórios');
    }

    let userId = '';
    try {
      userId = (await requireBrandAccess(req, brandId)).userId;
    } catch (error) {
      return handleSecurityError(error);
    }

    // Load dossier for context
    const dossier = await getResearch(brandId, dossierId);
    if (!dossier) {
      return createApiError(404, 'Dossiê não encontrado');
    }

    // Build context from dossier sections
    const dossierContext = [
      `# Dossiê: ${dossier.topic}`,
      `## Visão Geral: ${dossier.sections.marketOverview}`,
      `## Tamanho: ${dossier.sections.marketSize}`,
      `## Tendências: ${dossier.sections.trends.join('; ')}`,
      `## Oportunidades: ${dossier.sections.opportunities.join('; ')}`,
      `## Ameaças: ${dossier.sections.threats.join('; ')}`,
      `## Recomendações: ${dossier.sections.recommendations.join('; ')}`,
      `## Competidores: ${dossier.sections.competitors.map(c => `${c.name}: forças=${c.strengths.join(',')} fraquezas=${c.weaknesses.join(',')}`).join('; ')}`,
    ].join('\n');

    // Build chat prompt with history
    const history = (chatHistory || []).slice(-10);
    const historyBlock = history.length > 0
      ? history.map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`).join('\n')
      : '';

    const prompt = [
      '# CONTEXTO DO DOSSIÊ',
      dossierContext,
      '',
      historyBlock ? `# HISTÓRICO DE CONVERSA\n${historyBlock}\n` : '',
      '# NOVA PERGUNTA DO USUÁRIO',
      message,
      '',
      '# INSTRUÇÕES',
      'Você é um analista de mercado especialista. Refine e aprofunde a análise do dossiê acima.',
      'Responda de forma direta, específica e acionável em PT-BR.',
      'Se o usuário pedir para corrigir algo, sugira a correção concreta.',
      'Se pedir mais detalhes, aprofunde com base no contexto disponível.',
    ].filter(Boolean).join('\n');

    const reply = await generateWithGemini(prompt, {
      model: PRO_GEMINI_MODEL,
      temperature: 0.5,
      maxOutputTokens: 4096,
      feature: 'research_chat',
    });

    // Build updated chat history
    const newHistory: ResearchChatMessage[] = [
      ...history,
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: reply, timestamp: new Date().toISOString() },
    ];

    // O-3.2: Save chat history to dossier
    try {
      const dossierRef = doc(db, 'brands', brandId, 'research', dossierId);
      await updateDoc(dossierRef, { chatHistory: newHistory });
    } catch (err) {
      console.warn('[Research/Chat] Failed to save history:', err);
    }

    // Debit 1 credit
    if (userId) {
      try { await updateUserUsage(userId, -1); } catch { /* non-critical */ }
    }

    return createApiSuccess({ reply, chatHistory: newHistory });
  } catch (error: unknown) {
    if (error instanceof ApiError) return handleSecurityError(error);
    console.error('[Research/Chat] Error:', error);
    return createApiError(500, 'Erro interno no chat de refinamento.');
  }
}
