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
    <Card className="w-full h-full flex flex-col bg-zinc-900/40 border-zinc-800 border-t-4 border-t-rose-600">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 text-white font-black uppercase tracking-tighter">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Sentry: Alert Center
            </CardTitle>
            <CardDescription className="text-zinc-500">
              Anomalias detectadas pelo motor de IA.
            </CardDescription>
          </div>
          <Badge variant={activeAlerts.length > 0 ? "destructive" : "secondary"} className="font-black uppercase text-[10px]">
            {activeAlerts.length} Ativos
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[400px]">
          <div className="divide-y divide-zinc-800/50">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500/20" />
                <p className="text-sm font-bold uppercase tracking-widest">All Nominal</p>
                <p className="text-xs">Tudo operando dentro dos parâmetros.</p>
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
      color: "text-rose-500", 
      bg: "bg-rose-500/10" 
    },
    medium: { 
      icon: <AlertTriangle className="w-4 h-4" />, 
      color: "text-amber-500", 
      bg: "bg-amber-500/10" 
    },
    low: { 
      icon: <Info className="w-4 h-4" />, 
      color: "text-blue-500", 
      bg: "bg-blue-500/10" 
    }
  };

  const config = severityConfig[alert.severity];

  return (
    <div className={`p-4 transition-colors hover:bg-zinc-800/30 ${alert.status !== 'active' ? 'opacity-40' : ''}`}>
      <div className="flex gap-3">
        <div className={`mt-0.5 p-2 rounded-lg h-fit border border-current/20 ${config.bg} ${config.color}`}>
          {config.icon}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              {alert.context.platform} • {alert.metricType}
            </span>
            <span className="text-[10px] text-zinc-600 font-bold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(alert.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-sm font-bold leading-tight text-white">{alert.message}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-black uppercase tracking-tighter">
              Deviation: {alert.context.deviation.toFixed(2)}%
            </div>
            <div className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-black uppercase tracking-tighter">
              {alert.context.entityName}
            </div>
          </div>
          {alert.status === 'active' && (
            <div className="flex justify-end pt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
                onClick={onAcknowledge}
              >
                ACKNOWLEDGE
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
