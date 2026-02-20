import { OfferWizardState } from '@/types/offer';

// ═══════════════════════════════════════════════════════
// OFFER LAB ENGINE — Motor de scoring de ofertas (client-safe)
// Baseado na Equação de Valor de Alex Hormozi
// ═══════════════════════════════════════════════════════

export interface OfferScoreResult {
  total: number;
  analysis: string[];
}

export class OfferLabEngine {
  /**
   * Calcula o Irresistibility Score v2 (0-100)
   * Distribuição: sliders 40pts + conteúdo 60pts
   */
  static calculateScore(state: OfferWizardState): OfferScoreResult {
    const { dreamOutcome, perceivedLikelihood, timeDelay, effortSacrifice } = state.scoringFactors;

    // ── 1. Equação de Valor Hormozi (0-40 pts) ──
    const numerator = dreamOutcome * perceivedLikelihood;
    const denominator = (timeDelay + effortSacrifice) || 1;
    const rawValueScore = numerator / denominator;
    // Max teórico: (10*10)/(1+1) = 50 → 40 pts
    const hormoziScore = Math.min(40, Math.round((rawValueScore / 50) * 40));

    // ── 2. Pontos por Conteúdo (0-60 pts) ──
    let contentScore = 0;

    // Promessa (0-15 pts)
    if (state.promise.length > 20) contentScore += 5;
    if (/\d/.test(state.promise)) contentScore += 5;
    if (/dia|semana|mês|hora|mes/i.test(state.promise)) contentScore += 5;

    // Ancoragem de Preço (0-10 pts)
    const totalValue = state.perceivedValue +
      state.stacking.reduce((acc, i) => acc + i.value, 0) +
      state.bonuses.reduce((acc, i) => acc + i.value, 0);
    const price = state.corePrice || 1;
    const valueRatio = totalValue / price;
    if (valueRatio >= 10) contentScore += 10;
    else if (valueRatio >= 5) contentScore += 5;

    // Value Stacking (0-10 pts)
    if (state.stacking.length >= 3) contentScore += 5;
    const allStackingNamed = state.stacking.length > 0 && state.stacking.every(s => s.name.length > 0 && s.value > 0);
    if (allStackingNamed) contentScore += 5;

    // Bônus (0-10 pts)
    if (state.bonuses.length >= 2) contentScore += 5;
    const allBonusesDescribed = state.bonuses.length > 0 && state.bonuses.every(b => b.description && b.description.length > 0);
    if (allBonusesDescribed) contentScore += 5;

    // Garantia (0-10 pts)
    if (state.riskReversal.length > 50) contentScore += 5;
    if (/dia|garantia|devolv|reembols/i.test(state.riskReversal)) contentScore += 5;

    // Escassez (0-5 pts)
    if (state.scarcity.length > 10) contentScore += 5;

    const finalScore = Math.round(Math.min(100, hormoziScore + contentScore));

    return {
      total: finalScore,
      analysis: this.generateAnalysis(finalScore, valueRatio, state, hormoziScore),
    };
  }

  private static generateAnalysis(
    score: number,
    valueRatio: number,
    state: OfferWizardState,
    hormoziScore: number,
  ): string[] {
    const insights: string[] = [];

    if (state.promise.length <= 20 && state.promise.length > 0) {
      insights.push('Sua promessa esta curta. Seja mais especifico sobre o resultado que o cliente tera.');
    }
    if (!/\d/.test(state.promise) && state.promise.length > 0) {
      insights.push('Adicione um numero a promessa (ex: "R$10k", "30 dias", "3x mais"). Promessas mensuraveis convertem mais.');
    }

    if (valueRatio < 5 && state.corePrice > 0) {
      insights.push('Ancoragem insuficiente: aumente o valor percebido ou adicione mais itens ao stack para atingir 10x o preco.');
    } else if (valueRatio >= 5 && valueRatio < 10) {
      insights.push('Boa ancoragem (5x), mas o ideal e 10x. Adicione bonus de alto valor percebido.');
    }

    if (state.stacking.length < 3 && state.stacking.length > 0) {
      insights.push(`Voce tem ${state.stacking.length} item(ns) no stack. Adicione pelo menos 3 para maximizar ancoragem.`);
    }

    if (state.bonuses.length > 0 && state.bonuses.some(b => !b.description || b.description.length === 0)) {
      insights.push('Bonus sem descricao de objecao valem menos. Descreva qual barreira cada bonus resolve.');
    }

    if (state.riskReversal.length > 0 && state.riskReversal.length <= 50) {
      insights.push('Sua garantia esta curta. Detalhe: tipo de garantia, prazo, e o que acontece se pedir reembolso.');
    }

    if (state.scarcity.length === 0) {
      insights.push('Sem escassez, nao ha urgencia. Adicione limite de vagas, prazo ou edicao limitada.');
    }

    if (hormoziScore < 20) {
      insights.push('O atrito (tempo + esforco) esta matando o desejo. Diminua a friccao percebida pelo cliente.');
    }

    if (score >= 80) {
      insights.push('Oferta Lendaria: excelente equilibrio entre promessa, valor e urgencia.');
    }

    return insights;
  }
}
