"use client";

import { useMemo, useState } from 'react';
import { AlertTriangle, Bell, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AudienceForecast, ChurnBatchResult, LTVBatchResult, PredictiveAlert } from '@/types/predictive';
import { PredictiveAlertGenerator } from '@/lib/intelligence/predictive/alert-generator';

interface Props {
  brandId: string;
  churn: ChurnBatchResult | null;
  ltv: LTVBatchResult | null;
  forecast: AudienceForecast | null;
}

export function PredictiveAlerts({ brandId, churn, ltv, forecast }: Props) {
  const [dismissed, setDismissed] = useState<Record<string, true>>({});
  const alerts = useMemo(() => {
    if (!churn || !ltv || !forecast) return [];
    return PredictiveAlertGenerator.generateAlerts(brandId, churn, ltv, forecast).filter((a) => !dismissed[a.id]);
  }, [brandId, churn, ltv, forecast, dismissed]);

  const visible = alerts.slice(0, 5);
  const iconFor = (alert: PredictiveAlert) =>
    alert.severity === 'critical' ? <AlertTriangle size={16} /> : alert.severity === 'warning' ? <Bell size={16} /> : <Info size={16} />;

  return (
    <div className="space-y-3">
      {visible.map((alert) => (
        <Card key={alert.id} className="p-4 border-zinc-800 bg-zinc-900/30">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <span className="text-zinc-200 mt-0.5">{iconFor(alert)}</span>
              <div>
                <div className="text-sm font-semibold text-zinc-100">{alert.title}</div>
                <div className="text-xs text-zinc-400">{alert.description}</div>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setDismissed((prev) => ({ ...prev, [alert.id]: true }))}>
              Dispensar
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
