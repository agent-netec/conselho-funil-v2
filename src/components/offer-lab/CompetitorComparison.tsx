'use client';

import React from 'react';
import { OfferDocument } from '@/types/offer';
import { CompetitorProfile, CompetitorDossier } from '@/types/competitors';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, Trophy, Target, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface CompetitorComparisonProps {
  userOffer: Partial<OfferDocument>;
  competitors: CompetitorProfile[];
  dossiers: Record<string, CompetitorDossier>; // competitorId -> Dossier
}

export const CompetitorComparison: React.FC<CompetitorComparisonProps> = ({
  userOffer,
  competitors,
  dossiers
}) => {
  return (
    <div className="flex flex-col space-y-6 p-6">
      <div className="flex items-center space-x-2">
        <ArrowRightLeft className="text-primary" size={24} />
        <h2 className="text-xl font-bold tracking-tight">Benchmarking Competitivo</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sua Oferta (Resumo) */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">Sua Oferta</CardTitle>
                <CardDescription>{userOffer.name || 'Sem nome'}</CardDescription>
              </div>
              <Badge variant="default" className="text-lg py-1 px-3">
                Score: {userOffer.scoring?.total || 0}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-background rounded-lg border">
                <p className="text-[10px] uppercase text-muted-foreground font-bold">Preço</p>
                <p className="text-lg font-bold">R$ {userOffer.components?.coreProduct.price.toLocaleString('pt-BR')}</p>
              </div>
              <div className="p-3 bg-background rounded-lg border">
                <p className="text-[10px] uppercase text-muted-foreground font-bold">Valor Percebido</p>
                <p className="text-lg font-bold text-green-600">R$ {userOffer.components?.coreProduct.perceivedValue.toLocaleString('pt-BR')}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-muted-foreground">Vantagens Únicas</p>
              <div className="flex flex-wrap gap-2">
                {userOffer.components?.bonuses.length! > 0 && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {userOffer.components?.bonuses.length} Bônus Inclusos
                  </Badge>
                )}
                {userOffer.components?.riskReversal && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Inversão de Risco
                  </Badge>
                )}
                {userOffer.components?.scarcity && (
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    Gatilho de Escassez
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparação com Concorrentes */}
        <ScrollArea className="h-[500px] rounded-md border p-4">
          <div className="space-y-6">
            {competitors.map((competitor) => {
              const dossier = dossiers[competitor.id];
              return (
                <Card key={competitor.id} className="border-muted">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-md flex items-center">
                        <Target className="mr-2 text-muted-foreground" size={16} />
                        {competitor.name}
                      </CardTitle>
                      <Badge variant="secondary" className="capitalize">
                        {competitor.category[0]}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs truncate">{competitor.websiteUrl}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dossier ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase text-green-600 flex items-center">
                              <Trophy size={10} className="mr-1" /> Pontos Fortes
                            </p>
                            <ul className="text-[10px] space-y-1">
                              {dossier.analysis.swot.strengths.slice(0, 3).map((s, i) => (
                                <li key={i} className="flex items-start">
                                  <CheckCircle2 size={10} className="mr-1 mt-0.5 text-green-500 flex-shrink-0" />
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase text-red-600 flex items-center">
                              <AlertCircle size={10} className="mr-1" /> Fraquezas
                            </p>
                            <ul className="text-[10px] space-y-1">
                              {dossier.analysis.swot.weaknesses.slice(0, 3).map((w, i) => (
                                <li key={i} className="flex items-start">
                                  <XCircle size={10} className="mr-1 mt-0.5 text-red-500 flex-shrink-0" />
                                  {w}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">Oportunidade de Diferenciação</p>
                          <p className="text-[11px] italic text-muted-foreground">
                            "{dossier.analysis.marketPositioning}"
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="py-4 text-center text-xs text-muted-foreground italic">
                        Aguardando análise do Spy Agent...
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {competitors.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="mx-auto mb-2 opacity-20" size={48} />
                <p className="text-sm">Nenhum concorrente mapeado para esta marca.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
