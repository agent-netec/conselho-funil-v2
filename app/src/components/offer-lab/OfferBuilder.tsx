'use client';

import React, { useState } from 'react';
import { OfferDocument, BonusItem } from '@/types/offer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ShieldCheck, Zap, Clock, Star, BrainCircuit, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface OfferBuilderProps {
  initialData?: Partial<OfferDocument>;
  onSave: (data: Partial<OfferDocument>) => void;
}

export const OfferBuilder: React.FC<OfferBuilderProps> = ({ initialData, onSave }) => {
  const [offer, setOffer] = useState<Partial<OfferDocument>>({
    name: initialData?.name || '',
    components: initialData?.components || {
      coreProduct: { name: '', promise: '', description: '', price: 0, perceivedValue: 0 },
      stacking: [],
      bonuses: [],
      riskReversal: '',
      scarcity: '',
      urgency: '',
    },
    scoring: initialData?.scoring || {
      total: 0,
      factors: {
        dreamOutcome: 5,
        perceivedLikelihood: 5,
        timeDelay: 5,
        effortSacrifice: 5,
      },
      analysis: [],
    },
  });

  const updateScoringFactor = (factor: keyof OfferDocument['scoring']['factors'], value: number) => {
    setOffer({
      ...offer,
      scoring: {
        ...offer.scoring!,
        factors: {
          ...offer.scoring!.factors,
          [factor]: value,
        },
      },
    });
  };

  const addBonus = () => {
    const newBonus: BonusItem = {
      id: `bonus_${Date.now()}`,
      name: '',
      value: 0,
      complementarityScore: 50,
    };
    setOffer({
      ...offer,
      components: {
        ...offer.components!,
        bonuses: [...offer.components!.bonuses, newBonus],
      },
    });
  };

  const removeBonus = (id: string) => {
    setOffer({
      ...offer,
      components: {
        ...offer.components!,
        bonuses: offer.components!.bonuses.filter((b) => b.id !== id),
      },
    });
  };

  const updateBonus = (id: string, updates: Partial<BonusItem>) => {
    setOffer({
      ...offer,
      components: {
        ...offer.components!,
        bonuses: offer.components!.bonuses.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      },
    });
  };

  return (
    <div className="flex flex-col space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Offer Builder Framework</h1>
          <p className="text-muted-foreground text-sm">Estruture sua oferta usando componentes de alto valor.</p>
        </div>
        <Button onClick={() => onSave(offer)}>Salvar Oferta</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Equação de Valor (Cérebro) */}
        <Card className="md:col-span-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <BrainCircuit className="mr-2 text-primary" size={20} />
              Equação de Valor (Value Equation)
            </CardTitle>
            <CardDescription>Ajuste os fatores psicológicos que determinam a força da sua oferta.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="flex items-center">
                      Sonho (Dream Outcome)
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger><Info size={12} className="ml-1 text-muted-foreground" /></TooltipTrigger>
                          <TooltipContent>Quão grande é o resultado final desejado pelo cliente?</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <span className="text-sm font-bold">{offer.scoring?.factors.dreamOutcome}/10</span>
                  </div>
                  <Slider 
                    value={[offer.scoring?.factors.dreamOutcome || 5]} 
                    min={1} max={10} step={1}
                    onValueChange={([v]) => updateScoringFactor('dreamOutcome', v)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="flex items-center">
                      Probabilidade Percebida
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger><Info size={12} className="ml-1 text-muted-foreground" /></TooltipTrigger>
                          <TooltipContent>O cliente acredita que VAI conseguir o resultado com você?</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <span className="text-sm font-bold">{offer.scoring?.factors.perceivedLikelihood}/10</span>
                  </div>
                  <Slider 
                    value={[offer.scoring?.factors.perceivedLikelihood || 5]} 
                    min={1} max={10} step={1}
                    onValueChange={([v]) => updateScoringFactor('perceivedLikelihood', v)}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-destructive">
                    <Label className="flex items-center text-destructive">
                      Tempo de Espera (Time Delay)
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger><Info size={12} className="ml-1" /></TooltipTrigger>
                          <TooltipContent>Quanto tempo demora para o cliente ver o primeiro resultado?</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <span className="text-sm font-bold">{offer.scoring?.factors.timeDelay}/10</span>
                  </div>
                  <Slider 
                    value={[offer.scoring?.factors.timeDelay || 5]} 
                    min={1} max={10} step={1}
                    onValueChange={([v]) => updateScoringFactor('timeDelay', v)}
                    className="accent-destructive"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-destructive">
                    <Label className="flex items-center text-destructive">
                      Esforço e Sacrifício
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger><Info size={12} className="ml-1" /></TooltipTrigger>
                          <TooltipContent>Quão difícil ou chato é o processo para o cliente?</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <span className="text-sm font-bold">{offer.scoring?.factors.effortSacrifice}/10</span>
                  </div>
                  <Slider 
                    value={[offer.scoring?.factors.effortSacrifice || 5]} 
                    min={1} max={10} step={1}
                    onValueChange={([v]) => updateScoringFactor('effortSacrifice', v)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Core Product */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Star className="mr-2 text-yellow-500" size={20} />
              Produto Principal (Core)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Oferta</Label>
                <Input 
                  placeholder="Ex: Mentoria Scale 10x" 
                  value={offer.name}
                  onChange={(e) => setOffer({ ...offer, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço (R$)</Label>
                  <Input 
                    type="number" 
                    value={offer.components?.coreProduct.price}
                    onChange={(e) => setOffer({
                      ...offer,
                      components: {
                        ...offer.components!,
                        coreProduct: { ...offer.components!.coreProduct, price: Number(e.target.value) }
                      }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Percebido (R$)</Label>
                  <Input 
                    type="number" 
                    value={offer.components?.coreProduct.perceivedValue}
                    onChange={(e) => setOffer({
                      ...offer,
                      components: {
                        ...offer.components!,
                        coreProduct: { ...offer.components!.coreProduct, perceivedValue: Number(e.target.value) }
                      }
                    })}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>O que o produto entrega? (Promessa Principal)</Label>
              <Textarea 
                placeholder="Descreva o resultado final que o cliente terá..." 
                value={offer.components?.coreProduct.description}
                onChange={(e) => setOffer({
                  ...offer,
                  components: {
                    ...offer.components!,
                    coreProduct: { ...offer.components!.coreProduct, description: e.target.value }
                  }
                })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bonuses */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center">
                <Plus className="mr-2 text-green-500" size={20} />
                Bônus Irresistíveis
              </CardTitle>
              <CardDescription>Bônus devem resolver objeções ou acelerar o resultado.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addBonus}>
              <Plus size={16} className="mr-1" /> Add Bônus
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {offer.components?.bonuses.map((bonus) => (
              <div key={bonus.id} className="p-4 border rounded-lg space-y-3 relative group">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeBonus(bonus.id)}
                >
                  <Trash2 size={16} />
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-xs">Nome do Bônus</Label>
                    <Input 
                      placeholder="Ex: Template de Copy High-Ticket" 
                      value={bonus.name}
                      onChange={(e) => updateBonus(bonus.id, { name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Valor (R$)</Label>
                    <Input 
                      type="number" 
                      value={bonus.value}
                      onChange={(e) => updateBonus(bonus.id, { value: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-[10px] uppercase font-bold">
                      <span>Complementaridade</span>
                      <span>{bonus.complementarityScore}%</span>
                    </div>
                    <Input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={bonus.complementarityScore}
                      onChange={(e) => updateBonus(bonus.id, { complementarityScore: Number(e.target.value) })}
                      className="h-4"
                    />
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {(bonus.complementarityScore ?? 0) > 70 ? 'Alta' : (bonus.complementarityScore ?? 0) > 40 ? 'Média' : 'Baixa'}
                  </Badge>
                </div>
              </div>
            ))}
            {offer.components?.bonuses.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                Nenhum bônus adicionado. Clique em "Add Bônus" para começar.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Reversal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <ShieldCheck className="mr-2 text-blue-500" size={20} />
              Inversão de Risco
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              placeholder="Ex: Garantia incondicional de 30 dias ou condicional baseada em resultado..." 
              className="min-h-[100px]"
              value={offer.components?.riskReversal}
              onChange={(e) => setOffer({
                ...offer,
                components: { ...offer.components!, riskReversal: e.target.value }
              })}
            />
          </CardContent>
        </Card>

        {/* Scarcity & Urgency */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Zap className="mr-2 text-orange-500" size={20} />
              Escassez e Urgência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs flex items-center">
                <Clock className="mr-1" size={14} /> Urgência (Tempo)
              </Label>
              <Input 
                placeholder="Ex: Válido até domingo às 23:59" 
                value={offer.components?.urgency}
                onChange={(e) => setOffer({
                  ...offer,
                  components: { ...offer.components!, urgency: e.target.value }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs flex items-center">
                <Plus className="mr-1" size={14} /> Escassez (Vagas/Quantidade)
              </Label>
              <Input 
                placeholder="Ex: Apenas 15 vagas disponíveis" 
                value={offer.components?.scarcity}
                onChange={(e) => setOffer({
                  ...offer,
                  components: { ...offer.components!, scarcity: e.target.value }
                })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
