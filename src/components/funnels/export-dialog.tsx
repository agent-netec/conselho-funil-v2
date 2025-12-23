'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  FileText, 
  Copy, 
  Check,
  X,
  FileJson,
  FileCode,
  Clipboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { notify } from '@/lib/stores/notification-store';
import type { Funnel, Proposal } from '@/types/database';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  funnel: Funnel;
  proposals: Proposal[];
}

type ExportFormat = 'markdown' | 'html' | 'json' | 'notion';

const EXPORT_OPTIONS: { format: ExportFormat; label: string; icon: any; description: string }[] = [
  { format: 'markdown', label: 'Markdown', icon: FileText, description: 'Para documentação e README' },
  { format: 'html', label: 'HTML', icon: FileCode, description: 'Para Google Docs ou email' },
  { format: 'json', label: 'JSON', icon: FileJson, description: 'Para integração com APIs' },
  { format: 'notion', label: 'Notion', icon: Clipboard, description: 'Copiar como blocos Notion' },
];

function generateMarkdown(funnel: Funnel, proposals: Proposal[]): string {
  let md = `# ${funnel.name}\n\n`;
  md += `> ${funnel.description || 'Funil criado com Conselho de Funil'}\n\n`;
  
  md += `## 📋 Contexto\n\n`;
  md += `| Campo | Valor |\n`;
  md += `|-------|-------|\n`;
  md += `| **Empresa** | ${funnel.context.company} |\n`;
  md += `| **Mercado** | ${funnel.context.market} |\n`;
  md += `| **Objetivo** | ${funnel.context.objective} |\n`;
  md += `| **Audiência** | ${funnel.context.audience.who} |\n`;
  md += `| **Dor** | ${funnel.context.audience.pain} |\n`;
  md += `| **Awareness** | ${funnel.context.audience.awareness} |\n`;
  md += `| **Oferta** | ${funnel.context.offer.what} |\n`;
  md += `| **Ticket** | ${funnel.context.offer.ticket} |\n`;
  md += `| **Canal Principal** | ${funnel.context.channel?.main || 'N/A'} |\n\n`;

  if (proposals.length > 0) {
    md += `## 🎯 Propostas do Conselho\n\n`;
    
    proposals.forEach((proposal, i) => {
      md += `### Proposta ${i + 1}: ${proposal.name}\n\n`;
      md += `**Score:** ${(proposal.scorecard as any)?.overall?.toFixed(1) || 'N/A'}/10\n\n`;
      md += `${proposal.summary}\n\n`;
      
      if (proposal.stages && proposal.stages.length > 0) {
        md += `#### Etapas do Funil\n\n`;
        proposal.stages.forEach((stage, j) => {
          md += `${j + 1}. **${stage.name}**\n`;
          if (stage.objective) md += `   - Objetivo: ${stage.objective}\n`;
          if (stage.metrics) md += `   - Métricas: ${stage.metrics.join(', ')}\n`;
          md += '\n';
        });
      }

      if (proposal.reasoning) {
        md += `#### Raciocínio\n\n`;
        md += `${proposal.reasoning}\n\n`;
      }

      md += '---\n\n';
    });
  }

  md += `\n*Gerado por [Conselho de Funil](https://conselho-de-funil.vercel.app) em ${new Date().toLocaleDateString('pt-BR')}*\n`;
  
  return md;
}

function generateHTML(funnel: Funnel, proposals: Proposal[]): string {
  let html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${funnel.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a; }
    h1 { color: #059669; border-bottom: 3px solid #059669; padding-bottom: 10px; }
    h2 { color: #374151; margin-top: 30px; }
    h3 { color: #059669; }
    table { border-collapse: collapse; width: 100%; margin: 15px 0; }
    th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
    th { background: #f3f4f6; }
    .score { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: bold; }
    .score-high { background: #d1fae5; color: #065f46; }
    .score-mid { background: #fef3c7; color: #92400e; }
    .score-low { background: #fee2e2; color: #991b1b; }
    .stage { background: #f9fafb; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #059669; }
    blockquote { border-left: 4px solid #d1d5db; margin: 20px 0; padding: 10px 20px; background: #f9fafb; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <h1>🎯 ${funnel.name}</h1>
  <blockquote>${funnel.description || 'Funil criado com Conselho de Funil'}</blockquote>
  
  <h2>📋 Contexto</h2>
  <table>
    <tr><th>Campo</th><th>Valor</th></tr>
    <tr><td>Empresa</td><td>${funnel.context.company}</td></tr>
    <tr><td>Mercado</td><td>${funnel.context.market}</td></tr>
    <tr><td>Objetivo</td><td>${funnel.context.objective}</td></tr>
    <tr><td>Audiência</td><td>${funnel.context.audience.who}</td></tr>
    <tr><td>Dor</td><td>${funnel.context.audience.pain}</td></tr>
    <tr><td>Awareness</td><td>${funnel.context.audience.awareness}</td></tr>
    <tr><td>Oferta</td><td>${funnel.context.offer.what}</td></tr>
    <tr><td>Ticket</td><td>${funnel.context.offer.ticket}</td></tr>
    <tr><td>Canal Principal</td><td>${funnel.context.channel?.main || 'N/A'}</td></tr>
  </table>`;

  if (proposals.length > 0) {
    html += `<h2>🎯 Propostas do Conselho</h2>`;
    
    proposals.forEach((proposal, i) => {
      const score = (proposal.scorecard as any)?.overall || 0;
      const scoreClass = score >= 7.5 ? 'score-high' : score >= 6 ? 'score-mid' : 'score-low';
      
      html += `
      <h3>Proposta ${i + 1}: ${proposal.name}</h3>
      <p><span class="score ${scoreClass}">${score.toFixed(1)}/10</span></p>
      <p>${proposal.summary}</p>`;
      
      if (proposal.stages && proposal.stages.length > 0) {
        html += `<h4>Etapas do Funil</h4>`;
        proposal.stages.forEach((stage, j) => {
          html += `
          <div class="stage">
            <strong>${j + 1}. ${stage.name}</strong>
            ${stage.objective ? `<br><small>Objetivo: ${stage.objective}</small>` : ''}
            ${stage.metrics ? `<br><small>Métricas: ${stage.metrics.join(', ')}</small>` : ''}
          </div>`;
        });
      }

      if (proposal.reasoning) {
        html += `<h4>Raciocínio</h4><p>${proposal.reasoning}</p>`;
      }

      html += '<hr>';
    });
  }

  html += `
  <div class="footer">
    <p>Gerado por <strong>Conselho de Funil</strong> em ${new Date().toLocaleDateString('pt-BR')}</p>
  </div>
</body>
</html>`;
  
  return html;
}

function generateJSON(funnel: Funnel, proposals: Proposal[]): string {
  const data = {
    funnel: {
      id: funnel.id,
      name: funnel.name,
      description: funnel.description,
      status: funnel.status,
      context: funnel.context,
      createdAt: funnel.createdAt,
      updatedAt: funnel.updatedAt,
    },
    proposals: proposals.map(p => ({
      id: p.id,
      name: p.name,
      version: p.version,
      summary: p.summary,
      status: p.status,
      scorecard: p.scorecard,
      stages: p.stages,
      reasoning: p.reasoning,
    })),
    exportedAt: new Date().toISOString(),
    source: 'Conselho de Funil',
  };
  
  return JSON.stringify(data, null, 2);
}

function generateNotionBlocks(funnel: Funnel, proposals: Proposal[]): string {
  // Format optimized for pasting into Notion
  let text = `# ${funnel.name}\n\n`;
  text += `> ${funnel.description || ''}\n\n`;
  
  text += `## 📋 Contexto\n`;
  text += `- **Empresa:** ${funnel.context.company}\n`;
  text += `- **Objetivo:** ${funnel.context.objective}\n`;
  text += `- **Audiência:** ${funnel.context.audience.who}\n`;
  text += `- **Dor:** ${funnel.context.audience.pain}\n`;
  text += `- **Oferta:** ${funnel.context.offer.what}\n`;
  text += `- **Ticket:** ${funnel.context.offer.ticket}\n\n`;

  proposals.forEach((proposal, i) => {
    const score = (proposal.scorecard as any)?.overall || 0;
    text += `## 🎯 Proposta ${i + 1}: ${proposal.name}\n`;
    text += `**Score:** ${score.toFixed(1)}/10\n\n`;
    text += `${proposal.summary}\n\n`;
    
    if (proposal.stages && proposal.stages.length > 0) {
      text += `### Etapas\n`;
      proposal.stages.forEach((stage, j) => {
        text += `${j + 1}. **${stage.name}** - ${stage.objective || ''}\n`;
      });
      text += '\n';
    }
  });

  return text;
}

export function ExportDialog({ isOpen, onClose, funnel, proposals }: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('markdown');
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      let content: string;
      let mimeType: string;
      let extension: string;

      switch (selectedFormat) {
        case 'markdown':
          content = generateMarkdown(funnel, proposals);
          mimeType = 'text/markdown';
          extension = 'md';
          break;
        case 'html':
          content = generateHTML(funnel, proposals);
          mimeType = 'text/html';
          extension = 'html';
          break;
        case 'json':
          content = generateJSON(funnel, proposals);
          mimeType = 'application/json';
          extension = 'json';
          break;
        case 'notion':
          content = generateNotionBlocks(funnel, proposals);
          await navigator.clipboard.writeText(content);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          notify.success('Copiado!', 'Cole no Notion com Ctrl+V');
          setIsExporting(false);
          return;
        default:
          return;
      }

      // Download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${funnel.name.toLowerCase().replace(/\s+/g, '-')}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      notify.success('Exportado!', `Arquivo ${extension.toUpperCase()} baixado`);
      
    } catch (error) {
      notify.error('Erro', 'Falha ao exportar');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Download className="h-5 w-5 text-emerald-400" />
            Exportar Funil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-sm text-zinc-400">
            Escolha o formato para exportar <strong className="text-white">&quot;{funnel.name}&quot;</strong>
          </p>

          {/* Format selection */}
          <div className="grid grid-cols-2 gap-2">
            {EXPORT_OPTIONS.map((option) => (
              <button
                key={option.format}
                onClick={() => setSelectedFormat(option.format)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-lg border transition-all text-left',
                  selectedFormat === option.format
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                )}
              >
                <option.icon className={cn(
                  'h-6 w-6',
                  selectedFormat === option.format ? 'text-emerald-400' : 'text-zinc-500'
                )} />
                <div className="text-center">
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs text-zinc-500">{option.description}</p>
                </div>
              </button>
            ))}
          </div>

          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full btn-accent"
          >
            {isExporting ? (
              'Exportando...'
            ) : selectedFormat === 'notion' ? (
              copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar para Notion
                </>
              )
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Baixar {selectedFormat.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

