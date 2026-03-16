/**
 * Briefing PDF HTML Template
 *
 * Gera HTML estilizado A4 para visualização no browser.
 * Usuário pode salvar como PDF via Ctrl+P / botão de print.
 * Estilo: fundo branco, accent dourado #AB8648, tipografia limpa.
 */

import { BriefingSections } from '@/types/briefing';

interface PdfTemplateData {
  brandName: string;
  campaignName: string;
  logoBase64: string | null;
  sections: BriefingSections;
  generatedAt: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildBriefingPdfHtml(data: PdfTemplateData): string {
  const { brandName, campaignName, logoBase64, sections, generatedAt } = data;

  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" alt="${escapeHtml(brandName)}" style="max-width:120px;max-height:80px;object-fit:contain;margin-bottom:16px;" />`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<style>
  @page { size: A4; margin: 24mm 20mm 28mm 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11pt; color: #1a1a1a; line-height: 1.6; }
  .page-break { page-break-before: always; }
  .gold { color: #AB8648; }
  .section-title { font-size: 16pt; font-weight: 700; color: #AB8648; border-bottom: 2px solid #AB8648; padding-bottom: 6px; margin-bottom: 16px; margin-top: 8px; }
  .sub-title { font-size: 12pt; font-weight: 600; color: #333; margin-bottom: 6px; margin-top: 14px; }
  .content { margin-bottom: 10px; text-align: justify; }
  .cover { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 680px; text-align: center; }
  .cover h1 { font-size: 28pt; font-weight: 800; color: #1a1a1a; margin-bottom: 8px; }
  .cover h2 { font-size: 16pt; font-weight: 400; color: #666; margin-bottom: 24px; }
  .cover .date { font-size: 10pt; color: #999; margin-top: 32px; }
  .cover .brand-badge { display: inline-block; padding: 6px 20px; border: 2px solid #AB8648; border-radius: 6px; color: #AB8648; font-weight: 600; font-size: 12pt; margin-bottom: 16px; }
  .roadmap-item { padding: 8px 12px; background: #f9f7f2; border-left: 3px solid #AB8648; margin-bottom: 8px; border-radius: 0 4px 4px 0; }
  .risk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .risk-card { padding: 10px; border-radius: 6px; font-size: 10pt; }
  .risk-card.risk { background: #fef2f2; border: 1px solid #fecaca; }
  .risk-card.mitigation { background: #f0fdf4; border: 1px solid #bbf7d0; }
  .risk-label { font-weight: 700; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 8pt; color: #aaa; padding: 8px 20mm; border-top: 1px solid #eee; }
  .print-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 9999; background: #1a1a1a; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
  .print-bar button { background: #AB8648; color: #fff; border: none; padding: 8px 24px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }
  .print-bar button:hover { background: #E6B447; }
  .print-bar span { color: #999; font-size: 12px; }
  .print-spacer { height: 56px; }
  @media print { .print-bar, .print-spacer { display: none !important; } }
</style>
</head>
<body>

<div class="print-bar">
  <span>Briefing Estratégico &mdash; ${escapeHtml(brandName)}</span>
  <button onclick="window.print()">Salvar como PDF</button>
</div>
<div class="print-spacer"></div>

<!-- CAPA -->
<div class="cover">
  ${logoHtml}
  <div class="brand-badge">${escapeHtml(brandName)}</div>
  <h1>${escapeHtml(campaignName)}</h1>
  <h2>Briefing Estratégico de Campanha</h2>
  <div class="date">${generatedAt}</div>
  <div style="margin-top:48px;font-size:9pt;color:#bbb;">Gerado por MKTHONEY</div>
</div>

<!-- SUMÁRIO EXECUTIVO -->
<div class="page-break"></div>
<h2 class="section-title">Sumário Executivo</h2>
<p class="content">${escapeHtml(sections.executiveSummary)}</p>

<!-- CONTEXTO ESTRATÉGICO -->
<h2 class="section-title" style="margin-top:32px;">Contexto Estratégico</h2>
<h3 class="sub-title">Público-Alvo</h3>
<p class="content">${escapeHtml(sections.strategicContext.audience)}</p>
<h3 class="sub-title">Mercado</h3>
<p class="content">${escapeHtml(sections.strategicContext.market)}</p>
<h3 class="sub-title">Posicionamento</h3>
<p class="content">${escapeHtml(sections.strategicContext.positioning)}</p>
<h3 class="sub-title">Objetivo</h3>
<p class="content">${escapeHtml(sections.strategicContext.objective)}</p>

<!-- ESTRATÉGIA DE FUNIL -->
<div class="page-break"></div>
<h2 class="section-title">Estratégia de Funil</h2>
<h3 class="sub-title">Tipo de Funil</h3>
<p class="content">${escapeHtml(sections.funnelStrategy.type)}</p>
<h3 class="sub-title">Arquitetura</h3>
<p class="content">${escapeHtml(sections.funnelStrategy.architecture)}</p>
<h3 class="sub-title">Estágios</h3>
<p class="content">${escapeHtml(sections.funnelStrategy.stages)}</p>
<h3 class="sub-title">Caminho de Conversão</h3>
<p class="content">${escapeHtml(sections.funnelStrategy.conversionPath)}</p>

<!-- ANÁLISE DA OFERTA -->
<h2 class="section-title" style="margin-top:32px;">Análise da Oferta</h2>
<h3 class="sub-title">Promessa</h3>
<p class="content">${escapeHtml(sections.offerAnalysis.promise)}</p>
<h3 class="sub-title">Diferenciais</h3>
<p class="content">${escapeHtml(sections.offerAnalysis.differentiator)}</p>
<h3 class="sub-title">Racional do Score</h3>
<p class="content">${escapeHtml(sections.offerAnalysis.scoringRationale)}</p>

<!-- ESTRATÉGIA DE COPY -->
<div class="page-break"></div>
<h2 class="section-title">Estratégia de Copy</h2>
<h3 class="sub-title">Big Idea</h3>
<p class="content">${escapeHtml(sections.copyStrategy.bigIdea)}</p>
<h3 class="sub-title">Análise de Tom</h3>
<p class="content">${escapeHtml(sections.copyStrategy.toneAnalysis)}</p>
<h3 class="sub-title">Headlines</h3>
<p class="content">${escapeHtml(sections.copyStrategy.headlines)}</p>
<h3 class="sub-title">Framework de Persuasão</h3>
<p class="content">${escapeHtml(sections.copyStrategy.persuasionFramework)}</p>

<!-- ESTRATÉGIA SOCIAL -->
<h2 class="section-title" style="margin-top:32px;">Estratégia Social</h2>
<h3 class="sub-title">Plataformas</h3>
<p class="content">${escapeHtml(sections.socialStrategy.platformBreakdown)}</p>
<h3 class="sub-title">Análise de Hooks</h3>
<p class="content">${escapeHtml(sections.socialStrategy.hookAnalysis)}</p>
<h3 class="sub-title">Destaques de Conteúdo</h3>
<p class="content">${escapeHtml(sections.socialStrategy.contentHighlights)}</p>
<h3 class="sub-title">Potencial Viral</h3>
<p class="content">${escapeHtml(sections.socialStrategy.viralPotential)}</p>

<!-- DIREÇÃO DE DESIGN -->
<div class="page-break"></div>
<h2 class="section-title">Direção de Design</h2>
<h3 class="sub-title">Identidade Visual</h3>
<p class="content">${escapeHtml(sections.designDirection.visualIdentity)}</p>
<h3 class="sub-title">Psicologia das Cores</h3>
<p class="content">${escapeHtml(sections.designDirection.colorPsychology)}</p>
<h3 class="sub-title">Recomendações de Assets</h3>
<p class="content">${escapeHtml(sections.designDirection.assetRecommendations)}</p>

<!-- ESTRATÉGIA DE ADS -->
<h2 class="section-title" style="margin-top:32px;">Estratégia de Ads</h2>
<h3 class="sub-title">Alocação de Canais</h3>
<p class="content">${escapeHtml(sections.adsStrategy.channelAllocation)}</p>
<h3 class="sub-title">Racional do Budget</h3>
<p class="content">${escapeHtml(sections.adsStrategy.budgetRationale)}</p>
<h3 class="sub-title">Segmentação de Audiências</h3>
<p class="content">${escapeHtml(sections.adsStrategy.audienceTargeting)}</p>
<h3 class="sub-title">Benchmarks</h3>
<p class="content">${escapeHtml(sections.adsStrategy.benchmarks)}</p>

<!-- ROADMAP -->
<div class="page-break"></div>
<h2 class="section-title">Roadmap de Execução</h2>
${sections.executionRoadmap.map((step, i) => `
<div class="roadmap-item">
  <strong class="gold">Passo ${i + 1}:</strong> ${escapeHtml(step)}
</div>`).join('')}

<!-- RISCOS -->
<h2 class="section-title" style="margin-top:32px;">Análise de Riscos</h2>
<div class="risk-grid">
  <div>
    <div class="risk-label" style="color:#b91c1c;">Riscos Identificados</div>
    ${sections.riskAnalysis.risks.map(r => `<div class="risk-card risk">${escapeHtml(r)}</div>`).join('')}
  </div>
  <div>
    <div class="risk-label" style="color:#15803d;">Mitigações</div>
    ${sections.riskAnalysis.mitigations.map(m => `<div class="risk-card mitigation">${escapeHtml(m)}</div>`).join('')}
  </div>
</div>

<div class="footer">${escapeHtml(brandName)} &bull; Gerado por MKTHONEY &bull; ${generatedAt}</div>

</body>
</html>`;
}
