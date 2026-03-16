/**
 * Briefing Slides HTML Template
 *
 * Gera HTML estilizado 16:9 landscape para visualização no browser.
 * Usuário pode salvar como PDF via Ctrl+P / botão de print.
 * Estilo: dark theme, accent dourado, textos grandes, mínimo por slide.
 */

import { BriefingSections } from '@/types/briefing';

interface SlidesTemplateData {
  brandName: string;
  campaignName: string;
  logoBase64: string | null;
  sections: BriefingSections;
  generatedAt: string;
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slide(content: string): string {
  return `<div class="slide">${content}</div>`;
}

export function buildBriefingSlidesHtml(data: SlidesTemplateData): string {
  const { brandName, campaignName, logoBase64, sections, generatedAt } = data;

  const logoImg = logoBase64
    ? `<img src="${logoBase64}" alt="${esc(brandName)}" style="max-width:100px;max-height:60px;object-fit:contain;margin-bottom:20px;" />`
    : '';

  const slides: string[] = [];

  // 1. CAPA
  slides.push(slide(`
    <div class="slide-center">
      ${logoImg}
      <div class="badge">${esc(brandName)}</div>
      <h1 class="slide-hero">${esc(campaignName)}</h1>
      <p class="slide-sub">Briefing Estratégico de Campanha</p>
      <p class="slide-date">${generatedAt}</p>
    </div>
  `));

  // 2. SUMÁRIO EXECUTIVO
  slides.push(slide(`
    <h2 class="slide-title">Sumário Executivo</h2>
    <p class="slide-body">${esc(sections.executiveSummary)}</p>
  `));

  // 3. CONTEXTO ESTRATÉGICO
  slides.push(slide(`
    <h2 class="slide-title">Contexto Estratégico</h2>
    <div class="grid-2">
      <div class="card"><h3>Público-Alvo</h3><p>${esc(sections.strategicContext.audience)}</p></div>
      <div class="card"><h3>Mercado</h3><p>${esc(sections.strategicContext.market)}</p></div>
      <div class="card"><h3>Posicionamento</h3><p>${esc(sections.strategicContext.positioning)}</p></div>
      <div class="card"><h3>Objetivo</h3><p>${esc(sections.strategicContext.objective)}</p></div>
    </div>
  `));

  // 4. ESTRATÉGIA DE FUNIL
  slides.push(slide(`
    <h2 class="slide-title">Estratégia de Funil</h2>
    <div class="grid-2">
      <div class="card"><h3>Tipo</h3><p>${esc(sections.funnelStrategy.type)}</p></div>
      <div class="card"><h3>Arquitetura</h3><p>${esc(sections.funnelStrategy.architecture)}</p></div>
      <div class="card"><h3>Estágios</h3><p>${esc(sections.funnelStrategy.stages)}</p></div>
      <div class="card"><h3>Conversão</h3><p>${esc(sections.funnelStrategy.conversionPath)}</p></div>
    </div>
  `));

  // 5. OFERTA
  slides.push(slide(`
    <h2 class="slide-title">Análise da Oferta</h2>
    <div class="card-full"><h3>Promessa</h3><p>${esc(sections.offerAnalysis.promise)}</p></div>
    <div class="grid-2" style="margin-top:16px;">
      <div class="card"><h3>Diferenciais</h3><p>${esc(sections.offerAnalysis.differentiator)}</p></div>
      <div class="card"><h3>Score</h3><p>${esc(sections.offerAnalysis.scoringRationale)}</p></div>
    </div>
  `));

  // 6. COPY
  slides.push(slide(`
    <h2 class="slide-title">Estratégia de Copy</h2>
    <div class="grid-2">
      <div class="card"><h3>Big Idea</h3><p>${esc(sections.copyStrategy.bigIdea)}</p></div>
      <div class="card"><h3>Tom</h3><p>${esc(sections.copyStrategy.toneAnalysis)}</p></div>
      <div class="card"><h3>Headlines</h3><p>${esc(sections.copyStrategy.headlines)}</p></div>
      <div class="card"><h3>Persuasão</h3><p>${esc(sections.copyStrategy.persuasionFramework)}</p></div>
    </div>
  `));

  // 7. SOCIAL
  slides.push(slide(`
    <h2 class="slide-title">Estratégia Social</h2>
    <div class="grid-2">
      <div class="card"><h3>Plataformas</h3><p>${esc(sections.socialStrategy.platformBreakdown)}</p></div>
      <div class="card"><h3>Hooks</h3><p>${esc(sections.socialStrategy.hookAnalysis)}</p></div>
      <div class="card"><h3>Conteúdo</h3><p>${esc(sections.socialStrategy.contentHighlights)}</p></div>
      <div class="card"><h3>Viral</h3><p>${esc(sections.socialStrategy.viralPotential)}</p></div>
    </div>
  `));

  // 8. DESIGN
  slides.push(slide(`
    <h2 class="slide-title">Direção de Design</h2>
    <div class="card-full"><h3>Identidade Visual</h3><p>${esc(sections.designDirection.visualIdentity)}</p></div>
    <div class="grid-2" style="margin-top:16px;">
      <div class="card"><h3>Cores</h3><p>${esc(sections.designDirection.colorPsychology)}</p></div>
      <div class="card"><h3>Assets</h3><p>${esc(sections.designDirection.assetRecommendations)}</p></div>
    </div>
  `));

  // 9. ADS
  slides.push(slide(`
    <h2 class="slide-title">Estratégia de Ads</h2>
    <div class="grid-2">
      <div class="card"><h3>Canais</h3><p>${esc(sections.adsStrategy.channelAllocation)}</p></div>
      <div class="card"><h3>Budget</h3><p>${esc(sections.adsStrategy.budgetRationale)}</p></div>
      <div class="card"><h3>Audiências</h3><p>${esc(sections.adsStrategy.audienceTargeting)}</p></div>
      <div class="card"><h3>Benchmarks</h3><p>${esc(sections.adsStrategy.benchmarks)}</p></div>
    </div>
  `));

  // 10. ROADMAP
  slides.push(slide(`
    <h2 class="slide-title">Roadmap de Execução</h2>
    <div class="roadmap">
      ${sections.executionRoadmap.map((step, i) => `
        <div class="roadmap-step">
          <span class="step-num">${i + 1}</span>
          <span>${esc(step)}</span>
        </div>
      `).join('')}
    </div>
  `));

  // 11. RISCOS
  slides.push(slide(`
    <h2 class="slide-title">Análise de Riscos</h2>
    <div class="grid-2">
      <div>
        <h3 style="color:#f87171;margin-bottom:12px;">Riscos</h3>
        ${sections.riskAnalysis.risks.map(r => `<div class="risk-item risk">${esc(r)}</div>`).join('')}
      </div>
      <div>
        <h3 style="color:#4ade80;margin-bottom:12px;">Mitigações</h3>
        ${sections.riskAnalysis.mitigations.map(m => `<div class="risk-item mit">${esc(m)}</div>`).join('')}
      </div>
    </div>
  `));

  // 12. ENCERRAMENTO
  slides.push(slide(`
    <div class="slide-center">
      ${logoImg}
      <h1 class="slide-hero" style="font-size:32pt;">Pronto para escalar.</h1>
      <p class="slide-sub">${esc(brandName)} &bull; ${generatedAt}</p>
      <p class="slide-date" style="margin-top:32px;">Gerado por MKTHONEY</p>
    </div>
  `));

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<style>
  @page { size: 1280px 720px; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #f5f5f5; }
  .slide { width: 1280px; height: 720px; padding: 48px 64px; page-break-after: always; position: relative; overflow: hidden; background: linear-gradient(135deg, #111 0%, #0a0a0a 100%); }
  .slide:last-child { page-break-after: avoid; }
  .slide-center { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; }
  .slide-hero { font-size: 36pt; font-weight: 800; color: #fff; line-height: 1.2; }
  .slide-sub { font-size: 16pt; color: #AB8648; margin-top: 8px; }
  .slide-date { font-size: 11pt; color: #666; margin-top: 12px; }
  .slide-title { font-size: 22pt; font-weight: 700; color: #AB8648; margin-bottom: 24px; border-bottom: 2px solid #AB8648; padding-bottom: 8px; }
  .slide-body { font-size: 14pt; line-height: 1.7; color: #d4d4d4; max-width: 1000px; }
  .badge { display: inline-block; padding: 6px 20px; border: 2px solid #AB8648; border-radius: 6px; color: #AB8648; font-weight: 600; font-size: 12pt; margin-bottom: 20px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(171,134,72,0.2); border-radius: 10px; padding: 16px 20px; }
  .card h3 { font-size: 10pt; text-transform: uppercase; letter-spacing: 0.1em; color: #AB8648; margin-bottom: 8px; }
  .card p { font-size: 11pt; line-height: 1.5; color: #ccc; }
  .card-full { background: rgba(255,255,255,0.04); border: 1px solid rgba(171,134,72,0.2); border-radius: 10px; padding: 16px 20px; }
  .card-full h3 { font-size: 10pt; text-transform: uppercase; letter-spacing: 0.1em; color: #AB8648; margin-bottom: 8px; }
  .card-full p { font-size: 12pt; line-height: 1.5; color: #ccc; }
  .roadmap { display: flex; flex-direction: column; gap: 12px; }
  .roadmap-step { display: flex; align-items: center; gap: 16px; padding: 12px 20px; background: rgba(171,134,72,0.08); border-left: 3px solid #AB8648; border-radius: 0 8px 8px 0; font-size: 12pt; color: #ddd; }
  .step-num { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: #AB8648; color: #000; font-weight: 700; font-size: 14pt; flex-shrink: 0; }
  .risk-item { padding: 10px 14px; border-radius: 6px; margin-bottom: 8px; font-size: 11pt; line-height: 1.4; }
  .risk-item.risk { background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3); color: #fca5a5; }
  .risk-item.mit { background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.3); color: #86efac; }
  .print-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 9999; background: #1a1a1a; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 8px rgba(0,0,0,0.5); }
  .print-bar button { background: #AB8648; color: #fff; border: none; padding: 8px 24px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }
  .print-bar button:hover { background: #E6B447; }
  .print-bar span { color: #999; font-size: 12px; }
  .print-spacer { height: 56px; }
  @media print { .print-bar, .print-spacer { display: none !important; } }
</style>
</head>
<body>

<div class="print-bar">
  <span>Apresentação &mdash; ${esc(brandName)}</span>
  <button onclick="window.print()">Salvar como PDF</button>
</div>
<div class="print-spacer"></div>

${slides.join('\n')}
</body>
</html>`;
}
