"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Target,
  Layers,
  Gift,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  Info
} from 'lucide-react';

import { 
  OfferComponent, 
  OfferWizardState, 
  OfferDocument 
} from '@/types/offer';
import { OfferLabEngine } from '@/lib/intelligence/offer/calculator';
import { toast } from 'sonner';
import { getAuthHeaders } from '@/lib/utils/auth-headers';

// --- Components ---

const IrresistibilityScore = ({ score, analysis, scoringFactors }: { score: number; analysis: string[]; scoringFactors: { dreamOutcome: number; perceivedLikelihood: number; timeDelay: number; effortSacrifice: number } }) => {
  const getScoreColor = (s: number) => {
    if (s < 40) return 'text-red-500';
    if (s < 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getScoreLabel = (s: number) => {
    if (s < 40) return 'Oferta Fraca';
    if (s < 70) return 'Oferta Promissora';
    if (s < 90) return 'Oferta Irresistível';
    return 'Oferta Lendária';
  };

  return (
    <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm sticky top-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Score de Irresistibilidade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center justify-center py-4">
          <div className={`text-6xl font-black mb-2 ${getScoreColor(score)}`}>
            {score}
          </div>
          <Badge variant="outline" className={`${getScoreColor(score)} border-current bg-current/10`}>
            {getScoreLabel(score)}
          </Badge>
        </div>
        <Progress value={score} className="h-2 bg-zinc-800" />

        {/* K-1.3: Contextual feedback explaining WHY score is low */}
        {score < 60 && (
          <div className="space-y-1.5 mt-3">
            {scoringFactors.dreamOutcome < 5 && (
              <div className="flex gap-2 text-[11px] text-amber-400/80 leading-tight">
                <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                <span>Resultado desejado baixo — defina um sonho mais ambicioso para o cliente</span>
              </div>
            )}
            {scoringFactors.perceivedLikelihood < 5 && (
              <div className="flex gap-2 text-[11px] text-amber-400/80 leading-tight">
                <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                <span>Probabilidade percebida baixa — adicione provas sociais e garantias</span>
              </div>
            )}
            {scoringFactors.timeDelay > 5 && (
              <div className="flex gap-2 text-[11px] text-amber-400/80 leading-tight">
                <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                <span>Tempo percebido alto está reduzindo seu score — adicione bônus de aceleração</span>
              </div>
            )}
            {scoringFactors.effortSacrifice > 5 && (
              <div className="flex gap-2 text-[11px] text-amber-400/80 leading-tight">
                <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                <span>Esforço percebido alto está reduzindo seu score — simplifique o processo</span>
              </div>
            )}
          </div>
        )}

        {analysis.length > 0 && (
          <div className="space-y-2 mt-4">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Insights do Conselho:</p>
            {analysis.map((insight, i) => (
              <div key={i} className="flex gap-2 text-[11px] text-zinc-400 leading-tight">
                <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
                <span>{insight}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ValueEquationGuide = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Card className="bg-zinc-900/30 border-zinc-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <span className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-purple-400" />
          Como funciona a Equação de Valor?
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <CardContent className="pt-0 pb-4 space-y-3">
          <div className="p-3 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
            <p className="text-xs text-zinc-300 font-mono text-center mb-2">
              Score = (Resultado Desejado × Probabilidade) / (Tempo + Esforço)
            </p>
          </div>
          <div className="space-y-2 text-[11px] text-zinc-400 leading-relaxed">
            <div className="flex gap-2">
              <TrendingUp className="w-3 h-3 text-green-400 shrink-0 mt-0.5" />
              <span><strong className="text-zinc-300">Aumente o numerador:</strong> Prometa um resultado ambicioso + demonstre que é alcançável</span>
            </div>
            <div className="flex gap-2">
              <Zap className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
              <span><strong className="text-zinc-300">Diminua o denominador:</strong> Mostre que é rápido e fácil de implementar</span>
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 italic">
            Baseado no framework "$100M Offers" de Alex Hormozi.
          </p>
        </CardContent>
      )}
    </Card>
  );
};

export function OfferLabWizard({ brandId }: { brandId: string }) {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [offer, setOffer] = useState<OfferWizardState>({
    promise: '',
    corePrice: 0,
    perceivedValue: 0,
    stacking: [],
    bonuses: [],
    scarcity: '',
    riskReversal: '',
    scoringFactors: {
      dreamOutcome: 8,
      perceivedLikelihood: 8,
      timeDelay: 2,
      effortSacrifice: 2
    }
  });
  const [result, setResult] = useState<{ total: number; analysis: string[] }>({ total: 0, analysis: [] });

  // Lógica de Score (Offer Lab Engine)
  useEffect(() => {
    const calculation = OfferLabEngine.calculateScore(offer);
    setResult(calculation);
  }, [offer]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/intelligence/offer/save', {
        method: 'POST',
        headers,
        body: JSON.stringify({ brandId, state: offer })
      });
      
      if (!response.ok) throw new Error('Falha ao salvar');
      
      toast.success('Oferta salva com sucesso no Laboratório!');
    } catch (error) {
      toast.error('Erro ao salvar oferta.');
    } finally {
      setIsSaving(false);
    }
  };

  const nextStep = () => {
    if (step === 4) {
      handleSave();
    } else {
      setStep(s => Math.min(s + 1, 4));
    }
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const steps = [
    { id: 1, name: 'Promessa', icon: Target },
    { id: 2, name: 'Stacking', icon: Layers },
    { id: 3, name: 'Bônus', icon: Gift },
    { id: 4, name: 'Escassez', icon: Zap },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        {/* Step Indicator */}
        <div className="flex justify-between items-center mb-8">
          {steps.map((s) => (
            <div 
              key={s.id}
              className={`flex flex-col items-center gap-2 transition-all duration-300 ${
                step >= s.id ? 'text-white' : 'text-zinc-600'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                step === s.id ? 'border-purple-500 bg-purple-500/20' : 
                step > s.id ? 'border-green-500 bg-green-500/20' : 'border-zinc-800'
              }`}>
                {step > s.id ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
              </div>
              <span className="text-xs font-medium">{s.name}</span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">A Grande Promessa</h2>
                  <p className="text-zinc-400">O que seu cliente vai alcançar? Seja específico e audacioso.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Sua Headline / Promessa Principal</label>
                    <Textarea 
                      placeholder="Ex: Como faturar R$ 10k em 30 dias sem precisar de anúncios pagos..."
                      className="bg-zinc-900 border-zinc-800 min-h-[120px] focus:ring-purple-500"
                      value={offer.promise}
                      onChange={(e) => setOffer({...offer, promise: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300">Preço da Oferta (R$)</label>
                      <Input 
                        type="number"
                        placeholder="497"
                        className="bg-zinc-900 border-zinc-800"
                        value={offer.corePrice || ''}
                        onChange={(e) => setOffer({...offer, corePrice: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300">Valor Percebido (R$)</label>
                      <Input 
                        type="number"
                        placeholder="2997"
                        className="bg-zinc-900 border-zinc-800"
                        value={offer.perceivedValue || ''}
                        onChange={(e) => setOffer({...offer, perceivedValue: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Value Stacking</h2>
                  <p className="text-zinc-400">Empilhe os componentes do produto para que o preço pareça insignificante.</p>
                </div>

                {offer.stacking.length > 0 && (
                  <div className="space-y-3">
                    {offer.stacking.map((item, idx) => (
                      <Card key={item.id} className="bg-zinc-900/50 border-zinc-800 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3 text-zinc-600 font-bold text-sm shrink-0 pt-2">
                            #{idx + 1}
                          </div>
                          <div className="flex-1 space-y-3">
                            <Input
                              placeholder="Nome do módulo/entregável"
                              className="bg-zinc-900 border-zinc-800"
                              value={item.name}
                              onChange={(e) => {
                                const updated = offer.stacking.map(s => s.id === item.id ? { ...s, name: e.target.value } : s);
                                setOffer({ ...offer, stacking: updated });
                              }}
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Valor percebido (R$)</label>
                                <Input
                                  type="number"
                                  placeholder="997"
                                  className="bg-zinc-900 border-zinc-800"
                                  value={item.value || ''}
                                  onChange={(e) => {
                                    const updated = offer.stacking.map(s => s.id === item.id ? { ...s, value: Number(e.target.value) } : s);
                                    setOffer({ ...offer, stacking: updated });
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Descricao (opcional)</label>
                                <Input
                                  placeholder="Ex: 12 aulas em video"
                                  className="bg-zinc-900 border-zinc-800"
                                  value={item.description || ''}
                                  onChange={(e) => {
                                    const updated = offer.stacking.map(s => s.id === item.id ? { ...s, description: e.target.value } : s);
                                    setOffer({ ...offer, stacking: updated });
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-zinc-500 hover:text-red-400 shrink-0 mt-2"
                            onClick={() => setOffer({ ...offer, stacking: offer.stacking.filter(s => s.id !== item.id) })}
                          >
                            ✕
                          </Button>
                        </div>
                      </Card>
                    ))}
                    <div className="text-right text-sm text-zinc-500">
                      Valor total empilhado: <span className="text-white font-bold">R$ {offer.stacking.reduce((a, b) => a + b.value, 0).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                )}

                <div className="p-4 border-2 border-dashed border-zinc-800 rounded-xl text-center space-y-4">
                  <p className="text-sm text-zinc-500">
                    {offer.stacking.length === 0
                      ? 'Adicione os modulos ou entregaveis do seu produto principal.'
                      : 'Continue empilhando valor na sua oferta.'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setOffer({
                      ...offer,
                      stacking: [...offer.stacking, { id: crypto.randomUUID(), name: '', value: 0, description: '' }]
                    })}
                  >
                    <Layers className="w-4 h-4" />
                    Adicionar Item ao Stack
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Bonus Irresistiveis</h2>
                  <p className="text-zinc-400">Bonus devem resolver as proximas objecoes ou acelerar o resultado.</p>
                </div>

                <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-start gap-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Dica do Conselheiro (Russell Brunson)</h4>
                    <p className="text-sm text-zinc-400 mt-1">
                      "O bonus nao deve ser apenas mais conteudo. Ele deve resolver um problema que o produto principal cria."
                    </p>
                  </div>
                </div>

                {offer.bonuses.length > 0 && (
                  <div className="space-y-3">
                    {offer.bonuses.map((item, idx) => (
                      <Card key={item.id} className="bg-zinc-900/50 border-zinc-800 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3 shrink-0 pt-2">
                            <Gift className="w-4 h-4 text-purple-400" />
                          </div>
                          <div className="flex-1 space-y-3">
                            <Input
                              placeholder="Nome do bonus"
                              className="bg-zinc-900 border-zinc-800"
                              value={item.name}
                              onChange={(e) => {
                                const updated = offer.bonuses.map(b => b.id === item.id ? { ...b, name: e.target.value } : b);
                                setOffer({ ...offer, bonuses: updated });
                              }}
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Valor percebido (R$)</label>
                                <Input
                                  type="number"
                                  placeholder="497"
                                  className="bg-zinc-900 border-zinc-800"
                                  value={item.value || ''}
                                  onChange={(e) => {
                                    const updated = offer.bonuses.map(b => b.id === item.id ? { ...b, value: Number(e.target.value) } : b);
                                    setOffer({ ...offer, bonuses: updated });
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Qual objecao resolve?</label>
                                <Input
                                  placeholder="Ex: Nao tenho tempo"
                                  className="bg-zinc-900 border-zinc-800"
                                  value={item.description || ''}
                                  onChange={(e) => {
                                    const updated = offer.bonuses.map(b => b.id === item.id ? { ...b, description: e.target.value } : b);
                                    setOffer({ ...offer, bonuses: updated });
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-zinc-500 hover:text-red-400 shrink-0 mt-2"
                            onClick={() => setOffer({ ...offer, bonuses: offer.bonuses.filter(b => b.id !== item.id) })}
                          >
                            ✕
                          </Button>
                        </div>
                      </Card>
                    ))}
                    <div className="text-right text-sm text-zinc-500">
                      Valor total em bonus: <span className="text-white font-bold">R$ {offer.bonuses.reduce((a, b) => a + b.value, 0).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full py-8 border-dashed border-zinc-800 hover:border-zinc-700"
                  onClick={() => setOffer({
                    ...offer,
                    bonuses: [...offer.bonuses, { id: crypto.randomUUID(), name: '', value: 0, description: '' }]
                  })}
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Criar Novo Bonus
                </Button>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Escassez e Garantia</h2>
                  <p className="text-zinc-400">Por que eles devem comprar AGORA e por que o risco é ZERO?</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Gatilho de Escassez / Urgência</label>
                    <Input 
                      placeholder="Ex: Apenas 50 vagas ou disponível até domingo..."
                      className="bg-zinc-900 border-zinc-800"
                      value={offer.scarcity}
                      onChange={(e) => setOffer({...offer, scarcity: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Reversão de Risco (Garantia)</label>
                    <Textarea 
                      placeholder="Ex: 30 dias de garantia incondicional + Desafio de 90 dias..."
                      className="bg-zinc-900 border-zinc-800 min-h-[100px]"
                      value={offer.riskReversal}
                      onChange={(e) => setOffer({...offer, riskReversal: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between pt-8 border-t border-zinc-800">
          <Button 
            variant="ghost" 
            onClick={prevStep} 
            disabled={step === 1}
            className="text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button 
            onClick={nextStep}
            disabled={isSaving}
            className="bg-white text-black hover:bg-zinc-200 px-8"
          >
            {isSaving ? 'Salvando...' : step === 4 ? 'Finalizar Oferta' : 'Próximo Passo'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <IrresistibilityScore score={result.total} analysis={result.analysis} scoringFactors={offer.scoringFactors} />
        
        <Card className="bg-zinc-900/30 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-400" />
              Fatores de Valor (Hormozi)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* K-1.1: Callout explaining slider importance */}
            <div className="flex gap-2 p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-purple-300/80 leading-relaxed">
                Estes sliders controlam ~80% do score de irresistibilidade. Ajuste-os com cuidado.
              </p>
            </div>
            {[
              { id: 'dreamOutcome', label: 'Resultado Desejado', value: offer.scoringFactors.dreamOutcome },
              { id: 'perceivedLikelihood', label: 'Probabilidade Percebida', value: offer.scoringFactors.perceivedLikelihood },
              { id: 'timeDelay', label: 'Velocidade do Resultado', value: offer.scoringFactors.timeDelay, inverse: true },
              { id: 'effortSacrifice', label: 'Facilidade de Execução', value: offer.scoringFactors.effortSacrifice, inverse: true },
            ].map((factor) => {
              const displayValue = factor.inverse ? 11 - factor.value : factor.value;
              return (
                <div key={factor.id} className="space-y-1">
                  <div className="flex justify-between text-[10px] uppercase tracking-wider">
                    <span className="text-zinc-500">{factor.label}</span>
                    <span className="text-zinc-300 font-bold">{displayValue}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={displayValue}
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      const internal = factor.inverse ? 11 - raw : raw;
                      setOffer({
                        ...offer,
                        scoringFactors: { ...offer.scoringFactors, [factor.id]: internal }
                      });
                    }}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  {factor.inverse && (
                    <div className="flex justify-between text-[9px] text-zinc-600">
                      <span>{factor.id === 'timeDelay' ? 'Lento' : 'Difícil'}</span>
                      <span>{factor.id === 'timeDelay' ? 'Rápido' : 'Fácil'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* K-1.5: Mini-guide for Hormozi Value Equation */}
        <ValueEquationGuide />

        <Card className="bg-zinc-900/30 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Checklist de Irresistibilidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Promessa Clara e Específica', met: offer.promise.length > 20 },
              { label: 'Valor Percebido > 10x Preço', met: (offer.perceivedValue + offer.stacking.reduce((a,b)=>a+b.value,0)) >= offer.corePrice * 10 },
              { label: 'Bônus que Resolve Objeção', met: offer.bonuses.length > 0 },
              { label: 'Garantia de Risco Zero', met: offer.riskReversal.length > 20 },
              { label: 'Escassez Real', met: offer.scarcity.length > 5 },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  item.met ? 'bg-green-500/20 text-green-500' : 'bg-zinc-800 text-zinc-600'
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <span className={item.met ? 'text-zinc-300' : 'text-zinc-500'}>{item.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
