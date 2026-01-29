import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/performance/integrations/validate
 * Valida uma chave de API antes de salvar. Suporta modo mock para validação inicial.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, platform, apiKey, accountId, mock } = body;

    // Security check: brandId é obrigatório
    if (!brandId) {
      return NextResponse.json({
        success: false, message: 'brandId é obrigatório para isolamento de dados.'
      }, { status: 400 });
    }

    // Validação de campos obrigatórios
    if (!platform || !apiKey || !accountId) {
      return NextResponse.json({
        success: false, message: 'Campos platform, apiKey e accountId são obrigatórios.'
      }, { status: 400 });
    }

    // Lógica de Mock para validação inicial (ST-18.2)
    if (mock === true || mock === 'true') {
      console.log(`[Mock] Validando integração ${platform} para brand ${brandId}`);
      
      // Simula um delay de rede
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock de sucesso para qualquer chave que comece com 'sk_' ou 'meta_'
      const isValid = apiKey.startsWith('sk_') || apiKey.startsWith('meta_') || apiKey === 'mock_key';

      if (isValid) {
        return NextResponse.json({
          success: true,
          message: `[Mock] Integração com ${platform} validada com sucesso.`
        });
      } else {
        return NextResponse.json({
          success: false,
          message: `[Mock] Chave de API inválida para ${platform}.`
        }, { status: 401 });
      }
    }

    // TODO: Implementar validação real com as SDKs de Meta/Google Ads em sprints futuras
    return NextResponse.json({
      success: false,
      message: 'Validação real ainda não implementada. Use mock=true para testes.'
    }, { status: 501 });

  } catch (error) {
    console.error('[API Performance] Erro na validação:', error);
    return NextResponse.json({
      success: false, message: 'Erro interno ao validar integração.'
    }, { status: 500 });
  }
}
