'use client';

/**
 * DebateViewer — Renders council debate with 4 social expert cards
 * Sprint M — M-2.2
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Gavel, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const COUNSELOR_INFO: Record<string, { name: string; role: string; color: string; avatar: string }> = {
  rachel_karten: { name: 'Rachel Karten', role: 'Criativo & Hooks', color: 'rose', avatar: 'RK' },
  lia_haberman: { name: 'Lia Haberman', role: 'Algoritmo & Mudanças', color: 'violet', avatar: 'LH' },
  nikita_beer: { name: 'Nikita Beer', role: 'Viralização & Trends', color: 'amber', avatar: 'NB' },
  justin_welsh: { name: 'Justin Welsh', role: 'Funil Social', color: 'emerald', avatar: 'JW' },
};

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; avatarBg: string }> = {
  rose: { bg: 'bg-rose-500/5', border: 'border-rose-500/20', text: 'text-rose-400', avatarBg: 'bg-rose-500/20' },
  violet: { bg: 'bg-violet-500/5', border: 'border-violet-500/20', text: 'text-violet-400', avatarBg: 'bg-violet-500/20' },
  amber: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-400', avatarBg: 'bg-amber-500/20' },
  emerald: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400', avatarBg: 'bg-emerald-500/20' },
};

interface DebateViewerProps {
  debate: string;
}

/** Parse debate text into sections: counselor opinions + verdict */
function parseDebate(text: string) {
  const sections: { counselorId: string; name: string; content: string }[] = [];
  let verdict = '';

  // Split by counselor headers **[NAME]**:
  const lines = text.split('\n');
  let currentSection: { counselorId: string; name: string; lines: string[] } | null = null;
  let inVerdict = false;

  for (const line of lines) {
    // Check for verdict section
    if (line.includes('Veredito do Conselho') || line.includes('VEREDITO_DO_CONSELHO')) {
      if (currentSection) {
        sections.push({ ...currentSection, content: currentSection.lines.join('\n').trim() });
        currentSection = null;
      }
      inVerdict = true;
      continue;
    }

    if (inVerdict) {
      verdict += line + '\n';
      continue;
    }

    // Check for counselor header
    const headerMatch = line.match(/\*\*\[([^\]]+)\]\*\*/);
    if (headerMatch) {
      if (currentSection) {
        sections.push({ ...currentSection, content: currentSection.lines.join('\n').trim() });
      }
      const name = headerMatch[1].toUpperCase();
      // Match to counselor
      const counselorId = Object.entries(COUNSELOR_INFO).find(
        ([, info]) => name.includes(info.name.toUpperCase()) || name.includes(info.name.split(' ')[1]?.toUpperCase() || '')
      )?.[0] || '';
      currentSection = { counselorId, name: headerMatch[1], lines: [] };
      // Add the rest of the line after the header
      const afterHeader = line.replace(/\*\*\[[^\]]+\]\*\*:?\s*/, '');
      if (afterHeader) currentSection.lines.push(afterHeader);
    } else if (currentSection) {
      currentSection.lines.push(line);
    }
  }

  if (currentSection) {
    sections.push({ ...currentSection, content: currentSection.lines.join('\n').trim() });
  }

  return { sections, verdict: verdict.trim() };
}

export function DebateViewer({ debate }: DebateViewerProps) {
  const { sections, verdict } = parseDebate(debate);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Counselor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section, idx) => {
          const info = COUNSELOR_INFO[section.counselorId];
          const colors = COLOR_MAP[info?.color || 'rose'];

          return (
            <Card
              key={idx}
              className={cn('p-4 border', colors?.bg || 'bg-zinc-900/40', colors?.border || 'border-white/[0.04]')}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className={cn('h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold', colors?.avatarBg || 'bg-zinc-700', colors?.text || 'text-zinc-300')}>
                  {info?.avatar || <User className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={cn('text-sm font-bold', colors?.text || 'text-zinc-300')}>
                    {info?.name || section.name}
                  </h4>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    {info?.role || 'Conselheiro'}
                  </span>
                </div>
                <MessageSquare className={cn('h-4 w-4 shrink-0', colors?.text || 'text-zinc-500')} />
              </div>

              {/* Opinion content */}
              <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                {section.content}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Verdict */}
      {verdict && (
        <Card className="p-5 bg-gradient-to-b from-zinc-900/80 to-zinc-900/40 border-amber-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Gavel className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Veredito do Conselho</h3>
          </div>
          <div className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
            {verdict.replace(/\[VEREDITO_DO_CONSELHO\]/g, '').trim()}
          </div>
        </Card>
      )}

      {sections.length === 0 && (
        <Card className="p-8 text-center bg-zinc-900/40 border-white/[0.04]">
          <MessageSquare className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">O debate será exibido aqui quando gerado.</p>
        </Card>
      )}
    </div>
  );
}
