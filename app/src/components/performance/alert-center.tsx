'use client';

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PerformanceAlertDoc, AlertSeverity } from "@/types/performance";
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle2,
  Clock,
  ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AlertCenterProps {
  alerts: PerformanceAlertDoc[];
  onAcknowledge?: (alertId: string) => void;
  loading?: boolean;
}

export function AlertCenter({ alerts, onAcknowledge, loading }: AlertCenterProps) {
  const activeAlerts = alerts.filter(a => a.status === 'active');
  
  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Alert Center
            </CardTitle>
            <CardDescription>
              Anomalias detectadas pelo motor de IA.
            </CardDescription>
          </div>
          <Badge variant={activeAlerts.length > 0 ? "destructive" : "secondary"}>
            {activeAlerts.length} Ativos
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[400px]">
          <div className="divide-y">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500/20" />
                <p className="text-sm font-medium">Nenhuma anomalia detectada.</p>
                <p className="text-xs">Tudo operando dentro dos parâmetros normais.</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <AlertItem 
                  key={alert.id} 
                  alert={alert} 
                  onAcknowledge={() => onAcknowledge?.(alert.id)} 
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function AlertItem({ alert, onAcknowledge }: { alert: PerformanceAlertDoc; onAcknowledge: () => void }) {
  const severityConfig: Record<AlertSeverity, { icon: React.ReactNode; color: string; bg: string }> = {
    high: { 
      icon: <AlertCircle className="w-4 h-4" />, 
      color: "text-rose-600", 
      bg: "bg-rose-50" 
    },
    medium: { 
      icon: <AlertTriangle className="w-4 h-4" />, 
      color: "text-amber-600", 
      bg: "bg-amber-50" 
    },
    low: { 
      icon: <Info className="w-4 h-4" />, 
      color: "text-blue-600", 
      bg: "bg-blue-50" 
    }
  };

  const config = severityConfig[alert.severity];

  return (
    <div className={`p-4 transition-colors hover:bg-muted/50 ${alert.status !== 'active' ? 'opacity-60' : ''}`}>
      <div className="flex gap-3">
        <div className={`mt-0.5 p-2 rounded-full h-fit ${config.bg} ${config.color}`}>
          {config.icon}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {alert.context.platform} • {alert.metricType}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(alert.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-sm font-bold leading-tight">{alert.message}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-medium">
              Z-Score: {alert.context.deviation.toFixed(2)}
            </div>
            <div className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-medium">
              {alert.context.entityName}
            </div>
          </div>
          {alert.status === 'active' && (
            <div className="flex justify-end pt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-[10px] font-bold uppercase"
                onClick={onAcknowledge}
              >
                Marcar como Lido
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
