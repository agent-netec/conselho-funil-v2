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
export const maxDuration = 120;

import { NextRequest } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { generateWithGemini, PRO_GEMINI_MODEL } from '@/lib/ai/gemini';
import { getResearch } from '@/lib/firebase/research';
import { updateUserUsage } from '@/lib/firebase/firestore';
import type { ResearchChatMessage } from '@/types/research';

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch (parseErr) {
      console.error('[Research/Chat] Body parse failed:', parseErr);
      return createApiError(400, 'Request body inválido (JSON mal formado)');
    }

    const { brandId, dossierId, message, chatHistory } = body as {
      brandId?: string;
      dossierId?: string;
      message?: string;
      chatHistory?: ResearchChatMessage[];
    };

    console.log('[Research/Chat] Received:', {
      brandId: brandId ? `${brandId.substring(0, 8)}...` : '(empty)',
      dossierId: dossierId ? `${dossierId.substring(0, 8)}...` : '(empty)',
      messageLen: message?.length ?? 0,
      bodyKeys: Object.keys(body || {}),
    });

    if (!brandId || !dossierId || !message) {
      console.error('[Research/Chat] 400 — missing fields:', {
        brandId: typeof brandId === 'string' ? `"${brandId.substring(0, 20)}"` : String(brandId),
        dossierId: typeof dossierId === 'string' ? `"${dossierId.substring(0, 20)}"` : String(dossierId),
        message: typeof message === 'string' ? `"${message.substring(0, 30)}"` : String(message),
      });
      return createApiError(400, 'brandId, dossierId e message são obrigatórios', {
        details: `brandId=${!!brandId}, dossierId=${!!dossierId}, message=${!!message}`
      });
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

    // Build context from dossier sections (null-safe)
    const s = dossier.sections || {} as any;
    const dossierContext = [
      `# Dossiê: ${dossier.topic}`,
      s.marketOverview ? `## Visão Geral: ${s.marketOverview}` : '',
      s.marketSize ? `## Tamanho: ${s.marketSize}` : '',
      Array.isArray(s.trends) && s.trends.length > 0 ? `## Tendências: ${s.trends.join('; ')}` : '',
      Array.isArray(s.opportunities) && s.opportunities.length > 0 ? `## Oportunidades: ${s.opportunities.join('; ')}` : '',
      Array.isArray(s.threats) && s.threats.length > 0 ? `## Ameaças: ${s.threats.join('; ')}` : '',
      Array.isArray(s.recommendations) && s.recommendations.length > 0 ? `## Recomendações: ${s.recommendations.join('; ')}` : '',
      Array.isArray(s.competitors) && s.competitors.length > 0
        ? `## Competidores: ${s.competitors.map((c: any) => `${c.name || '?'}: forças=${(c.strengths || []).join(',')} fraquezas=${(c.weaknesses || []).join(',')}`).join('; ')}`
        : '',
    ].filter(Boolean).join('\n');

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
      timeoutMs: 50_000,
    });

    // Build updated chat history
    const newHistory: ResearchChatMessage[] = [
      ...history,
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: reply, timestamp: new Date().toISOString() },
    ];

    // O-3.2: Save chat history to dossier
    try {
      const adminDb = getAdminFirestore();
      const dossierRef = adminDb.collection('brands').doc(brandId).collection('research').doc(dossierId);
      await dossierRef.update({ chatHistory: newHistory });
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
    if (error instanceof Error) {
      const msg = error.message || '';
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('QUOTA_EXCEEDED') || msg.includes('429')) {
        return createApiError(429, 'Cota de IA excedida. Tente novamente em alguns minutos.');
      }
    }
    return createApiError(500, 'Erro interno no chat de refinamento.', {
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
