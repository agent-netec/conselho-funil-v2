'use client';

import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  MousePointer2, 
  PlayCircle, 
  ShoppingCart, 
  UserPlus, 
  Activity,
  ArrowRight,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { JourneyEvent } from '@/types/journey';

interface LeadTimelineProps {
  events: JourneyEvent[];
}

/**
 * @fileoverview Componente de Timeline Visual para o rastro do lead.
 * @author Victor (UI) & Beto (UX)
 */
export const LeadTimeline: React.FC<LeadTimelineProps> = ({ events }) => {
  
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'page_view': return <MousePointer2 className="w-4 h-4 text-blue-500" />;
      case 'vsl_watch': return <PlayCircle className="w-4 h-4 text-red-500" />;
      case 'checkout_init': return <ShoppingCart className="w-4 h-4 text-amber-500" />;
      case 'lead_capture': return <UserPlus className="w-4 h-4 text-green-500" />;
      default: return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'page_view': return 'Visualizou Página';
      case 'vsl_watch': return 'Assistiu VSL';
      case 'checkout_init': return 'Iniciou Checkout';
      case 'lead_capture': return 'Captura de Lead';
      default: return 'Evento Customizado';
    }
  };

  if (!events || events.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="py-10 text-center text-muted-foreground">
          Nenhum evento registrado para este lead.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-none shadow-none bg-transparent">
      <CardHeader className="px-0">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Rastro do Lead (Timeline)
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <ScrollArea className="h-[600px] pr-4">
          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/20 before:via-primary/10 before:to-transparent">
            {events.map((event, index) => (
              <div key={event.id || index} className="relative flex items-start gap-6 group">
                {/* Icon Circle */}
                <div className="absolute left-0 flex items-center justify-center w-10 h-10 rounded-full bg-background border-2 border-primary/20 group-hover:border-primary transition-colors z-10 shadow-sm">
                  {getEventIcon(event.type)}
                </div>

                {/* Content */}
                <div className="flex-1 ml-12 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {getEventLabel(event.type)}
                      </span>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider py-0 px-1.5 h-4">
                        {event.source}
                      </Badge>
                    </div>
                    <time className="text-xs text-muted-foreground font-medium">
                      {format(event.timestamp.toDate(), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                    </time>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
                    {/* UTM Context */}
                    {(event.session?.utmSource || event.session?.utmMedium) && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2 text-[11px]">
                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <span className="font-semibold uppercase">Source:</span>
                          <span>{event.session.utmSource || 'direct'}</span>
                        </div>
                        <Separator orientation="vertical" className="h-3 hidden sm:block" />
                        <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                          <span className="font-semibold uppercase">Medium:</span>
                          <span>{event.session.utmMedium || 'none'}</span>
                        </div>
                        {event.session.utmCampaign && (
                          <>
                            <Separator orientation="vertical" className="h-3 hidden sm:block" />
                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <span className="font-semibold uppercase">Campaign:</span>
                              <span>{event.session.utmCampaign}</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Payload Details */}
                    <div className="space-y-1">
                      {event.payload?.url && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground group/link">
                          <ExternalLink className="w-3 h-3" />
                          <span className="truncate max-w-[300px]">{event.payload.url}</span>
                        </div>
                      )}
                      {event.type === 'vsl_watch' && event.payload?.duration && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-red-500 rounded-full" 
                              style={{ width: `${Math.min((event.payload.duration / 1800) * 100, 100)}%` }} 
                            />
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {Math.floor(event.payload.duration / 60)}min assistidos
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
