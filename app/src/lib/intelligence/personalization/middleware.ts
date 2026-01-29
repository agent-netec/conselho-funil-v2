import { NextRequest, NextResponse } from 'next/server';
import { PersonalizationMaestro } from '@/lib/intelligence/personalization/maestro';

/**
 * Middleware de Personalização (ST-20.1)
 * Intercepta requisições para injetar contexto de personalização ou rastrear eventos.
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
        timestamp: any, // Firebase Timestamp será gerado no maestro
        contentId: pathname
      });
    } catch (error) {
      console.error('[PersonalizationMiddleware] Error:', error);
    }
  }

  return NextResponse.next();
}
