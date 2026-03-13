/**
 * API Route para Exportar Funil
 *
 * GET /api/funnels/export?funnelId=xxx&format=markdown|pdf
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import type { Funnel, Proposal } from '@/types/database';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const funnelId = searchParams.get('funnelId');
    const brandId = searchParams.get('brandId');
    const proposalId = searchParams.get('proposalId');
    const format = searchParams.get('format') || 'markdown';

    if (!funnelId) {
      return createApiError(400, 'funnelId is required');
    }

    if (!brandId) {
      return createApiError(400, 'brandId is required');
    }

    try {
      await requireBrandAccess(request, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    const adminDb = getAdminFirestore();

    // Load funnel
    const funnelDoc = await adminDb.collection('funnels').doc(funnelId).get();
    if (!funnelDoc.exists) {
      return createApiError(404, 'Funnel not found');
    }
    const funnel = { id: funnelDoc.id, ...funnelDoc.data() } as Funnel;

    // Load proposals
    let proposals: Proposal[] = [];
    if (proposalId) {
      const propDoc = await adminDb.collection('funnels').doc(funnelId).collection('proposals').doc(proposalId).get();
      if (propDoc.exists) {
        proposals = [{ id: propDoc.id, ...propDoc.data() } as Proposal];
      }
    } else {
      const propsSnap = await adminDb.collection('funnels').doc(funnelId).collection('proposals').orderBy('version', 'desc').get();
      proposals = propsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Proposal));
    }

    // Generate content
    const markdown = generateMarkdown(funnel, proposals);

    if (format === 'markdown') {
      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${sanitizeFilename(funnel.name)}.md"`,
        },
      });
    }

    // For PDF, return JSON with markdown (frontend will convert)
    return createApiSuccess({
      funnel: {
        id: funnel.id,
        name: funnel.name,
        status: funnel.status,
      },
      markdown,
      proposals: proposals.map(p => ({
        id: p.id,
        name: p.name,
        version: p.version,
      })),
    });

  } catch (error) {
    console.error('Export error:', error);
    return createApiError(500, 'Failed to export', { details: String(error) });
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50);
}

function generateMarkdown(funnel: Funnel, proposals: Proposal[]): string {
  const ctx = funnel.context;
  const channel = ctx.channel?.main || ctx.channels?.primary || 'N/A';
  const date = new Date().toLocaleDateString('pt-BR');

  let md = `# ${funnel.name}

> Exportado em ${date} | Status: **${funnel.status}**

---

## 📋 Contexto do Negócio

| Campo | Valor |
|-------|-------|
| **Empresa** | ${ctx.company} |
| **Mercado** | ${ctx.market} |
| **Maturidade** | ${ctx.maturity} |
| **Objetivo** | ${ctx.objective} |

---

## 👥 Público-Alvo

**Quem é:**
${ctx.audience?.who || 'Não definido'}

**Dor Principal:**
${ctx.audience?.pain || 'Não definido'}

**Nível de Consciência:** ${ctx.audience?.awareness || 'N/A'}

${ctx.audience?.objection ? `**Objeção Dominante:** ${ctx.audience.objection}` : ''}

---

## 💰 Oferta

| Campo | Valor |
|-------|-------|
| **Produto/Serviço** | ${ctx.offer?.what || 'N/A'} |
| **Ticket** | ${ctx.offer?.ticket || 'N/A'} |
| **Tipo** | ${ctx.offer?.type || 'N/A'} |

---

## 📡 Canais

- **Principal:** ${channel}
${ctx.channel?.secondary || ctx.channels?.secondary ? `- **Secundário:** ${ctx.channel?.secondary || ctx.channels?.secondary}` : ''}

---

`;

  // Add proposals
  if (proposals.length > 0) {
    md += `## 🎯 Propostas de Funil\n\n`;

    proposals.forEach((proposal, index) => {
      md += generateProposalMarkdown(proposal, index + 1);
    });
  }

  // Footer
  md += `
---

*Documento gerado pelo MKTHONEY*
*${process.env.NEXT_PUBLIC_APP_URL || 'https://mkthoney.com'}*
`;

  return md;
}

function generateProposalMarkdown(proposal: Proposal, num: number): string {
  const scorecard = proposal.scorecard as any;
  const score = scorecard?.overall || 'N/A';

  let md = `### Proposta ${num}: ${proposal.name}

**Score Geral:** ${typeof score === 'number' ? score.toFixed(1) : score}/10

${proposal.summary}

`;

  // Strategy rationale
  if (proposal.strategy?.rationale) {
    md += `#### 💡 Racional Estratégico

${proposal.strategy.rationale}

`;
  }

  // Architecture
  if (proposal.architecture?.stages?.length) {
    md += `#### 🏗️ Arquitetura do Funil

| # | Etapa | Tipo | Objetivo |
|---|-------|------|----------|
`;
    proposal.architecture.stages.forEach(stage => {
      md += `| ${stage.order} | ${stage.name} | ${stage.type} | ${stage.objective || '-'} |\n`;
    });
    md += '\n';
  }

  // Scorecard
  if (scorecard && typeof scorecard === 'object') {
    md += `#### 📊 Scorecard

| Dimensão | Nota |
|----------|------|
| Clareza | ${scorecard.clarity || '-'} |
| Força da Oferta | ${scorecard.offerStrength || '-'} |
| Qualificação | ${scorecard.qualification || '-'} |
| Fricção | ${scorecard.friction || '-'} |
| Potencial LTV | ${scorecard.ltvPotential || '-'} |
| ROI Esperado | ${scorecard.expectedRoi || '-'} |

`;
  }

  // Counselor insights
  if (proposal.strategy?.counselorInsights?.length) {
    md += `#### 🧠 Insights dos Especialistas

`;
    proposal.strategy.counselorInsights.forEach(insight => {
      const name = insight.counselor.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      md += `**${name}:** ${insight.insight}\n\n`;
    });
  }

  // Risks
  if (proposal.strategy?.risks?.length) {
    md += `#### ⚠️ Riscos

${proposal.strategy.risks.map(r => `- ${r}`).join('\n')}

`;
  }

  // Recommendations
  if (proposal.strategy?.recommendations?.length) {
    md += `#### ✅ Recomendações

${proposal.strategy.recommendations.map(r => `- ${r}`).join('\n')}

`;
  }

  // Assets
  if (proposal.assets) {
    md += `#### 📝 Assets Gerados

`;
    if (proposal.assets.headlines?.length) {
      md += `**Headlines:**
${proposal.assets.headlines.map(h => `- ${h}`).join('\n')}

`;
    }
    if (proposal.assets.hooks?.length) {
      md += `**Hooks:**
${proposal.assets.hooks.map(h => `- ${h}`).join('\n')}

`;
    }
    if (proposal.assets.ctas?.length) {
      md += `**CTAs:**
${proposal.assets.ctas.map(c => `- ${c}`).join('\n')}

`;
    }
  }

  md += `---\n\n`;
  return md;
}


