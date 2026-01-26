import { NextRequest, NextResponse } from 'next/server';
import { KillSwitchRequest } from '@/types/automation';

/**
 * Endpoint para disparar o Kill-Switch de tráfego.
 * POST /api/automation/kill-switch
 */
export async function POST(req: NextRequest) {
  try {
    const body: KillSwitchRequest = await req.json();

    // 1. Validação básica
    if (!body.brandId || !body.funnelId || !body.affectedAdEntities?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 2. No MVP, todas as ações requerem aprovação humana (Guardrail P0)
    // Portanto, este endpoint apenas registra a intenção e notifica o usuário.
    
    console.log(`[Kill-Switch] Triggered for brand ${body.brandId}, funnel ${body.funnelId}`);
    console.log(`[Kill-Switch] Reason: ${body.reason}`);
    
    // TODO: Salvar no Firestore (automation_logs) com status 'pending_approval'
    // TODO: Disparar notificação (Push/Slack/WhatsApp) para aprovação

    return NextResponse.json({
      message: 'Kill-Switch request registered. Pending human approval.',
      status: 'pending_approval',
      affectedEntitiesCount: body.affectedAdEntities.length
    });

  } catch (error) {
    console.error('[Kill-Switch API Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
