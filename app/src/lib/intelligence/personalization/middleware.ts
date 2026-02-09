import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase/firestore';
import { PersonalizationMaestro } from '@/lib/intelligence/personalization/maestro';

/**
 * Middleware de Personalização (ST-20.1)
 * Intercepta requisições para injetar contexto de personalização ou rastrear eventos.
 *
 * ⚠️ DT-07 (Sprint 28): DEAD CODE — Esta função NÃO está registrada no middleware.ts
 * raiz do Next.js (que nem existe). Portanto, nunca é invocada pelo framework.
 * O risco de auth gap é teórico. Adiado para S29: registrar no middleware raiz
 * com auth guard adequado ou remover se desnecessário.
 */
export async function personalizationMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Apenas processa se houver brandId e leadId (ex: via query params ou cookies)
  const brandId = req.nextUrl.searchParams.get('brandId');
  const leadId = req.nextUrl.searchParams.get('leadId');

  if (brandId && leadId) {
    try {
      // Registrar page_view como interação
      await PersonalizationMaestro.processInteraction(brandId, leadId, {
        type: 'page_view',
        platform: 'web',
        timestamp: Timestamp.now(),
        contentId: pathname
      });
    } catch (error) {
      console.error('[PersonalizationMiddleware] Error:', error);
    }
  }

  return NextResponse.next();
}
