export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { anomalyDetector } from '@/lib/reporting/anomaly-detector';
import { getLatestPrediction } from '@/lib/firebase/predictive';
import { saveAnomalyAlert } from '@/lib/firebase/reporting';
import { verifyAdminRole, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

/**
 * POST /api/reporting/anomaly-check
 * Verifica anomalias entre ROI real e predito e gera alertas se necessário.
 * ST-24.2
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Segurança
    await verifyAdminRole(request);

    const body = await request.json();
    const { clientId, realRoi, durationHours } = body;

    if (!clientId || realRoi === undefined) {
      return createApiError(400, 'Parâmetros clientId e realRoi são obrigatórios');
    }

    // 2. Busca a predição mais recente (Sprint 22)
    const latestPrediction = await getLatestPrediction(clientId, 'roi_forecast');

    if (!latestPrediction) {
      return createApiError(404, 'Nenhuma predição de ROI encontrada para este cliente. Execute o Prediction Engine primeiro.');
    }

    // 3. Execução do Anomaly Detector
    const result = anomalyDetector.detectRoiAnomaly(realRoi, latestPrediction, durationHours || 49);

    // 4. Persistência se houver anomalia
    let alertId = null;
    if (result.hasAnomaly && result.alert) {
      alertId = await saveAnomalyAlert(result.alert);
    }

    // 5. Retorno
    return createApiSuccess({
      hasAnomaly: result.hasAnomaly,
      alertId,
      details: result.alert || null
    });

  } catch (error) {
    console.error('[API Anomaly Check] Error:', error);
    return handleSecurityError(error);
  }
}
