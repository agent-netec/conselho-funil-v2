'use client';

/**
 * Sprint O — O-4.4: ProfileAnalyzer component
 * Input competitor URL → Firecrawl scrape → Gemini analysis report
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  UserSearch, ExternalLink, Loader2, Search,
  ThumbsUp, ThumbsDown, Eye, Lightbulb, BarChart3,
} from 'lucide-react';
import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import { notify } from '@/lib/stores/notification-store';

interface ProfileReport {
  profileName: string;
  platform: string;
  frequency: string;
  hookTypes: string[];
  engagementPatterns: string[];
  strengths: string[];
  weaknesses: string[];
  contentPatterns: string[];
  opportunities: string[];
  summary: string;
}

export function ProfileAnalyzer() {
  const activeBrand = useActiveBrand();
  const [loading, setLoading] = useState(false);
  const [profileUrl, setProfileUrl] = useState('');
  const [report, setReport] = useState<ProfileReport | null>(null);

  const handleAnalyze = async () => {
    if (!activeBrand?.id) {
      notify.error('Selecione uma marca primeiro.');
      return;
    }
    if (!profileUrl.trim() || !profileUrl.startsWith('http')) {
      notify.error('Insira uma URL válida de perfil social.');
      return;
    }
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/social/profile-analysis', {
        method: 'POST',
        headers,
        body: JSON.stringify({ brandId: activeBrand.id, profileUrl }),
      });
      if (!res.ok) throw new Error('Falha na análise');
      const data = await res.json();
      setReport(data.data?.report || null);
      notify.success('Análise de perfil concluída!');
    } catch {
      notify.error('Erro na análise de perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 bg-zinc-900/50 border-white/[0.04] space-y-4">
      <div className="flex items-center gap-2">
        <UserSearch className="h-5 w-5 text-violet-400" />
        <h3 className="text-sm font-bold text-zinc-100">Análise de Perfil</h3>
      </div>

      <div className="flex gap-2">
        <Input
          value={profileUrl}
          onChange={(e) => setProfileUrl(e.target.value)}
          placeholder="https://instagram.com/... ou https://tiktok.com/@..."
          onKeyDown={(e) => { if (e.key === 'Enter') handleAnalyze(); }}
          className="bg-zinc-800/50 border-zinc-700 text-xs"
        />
        <Button onClick={handleAnalyze} disabled={loading} size="sm" className="bg-violet-500 hover:bg-violet-600 text-white">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {report && (
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/50">
            <span className="text-sm font-medium text-zinc-100">{report.profileName}</span>
            <Badge variant="outline" className="text-[10px] border-violet-500/20 text-violet-400">
              {report.platform}
            </Badge>
            <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500">
              {report.frequency}
            </Badge>
          </div>

          {/* Summary */}
          <p className="text-xs text-zinc-400 italic">{report.summary}</p>

          {/* Strengths */}
          {report.strengths.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <ThumbsUp className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[11px] font-medium text-emerald-400">Pontos Fortes</span>
              </div>
              <ul className="space-y-1">
                {report.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex items-start gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-emerald-500/50 mt-1.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {report.weaknesses.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <ThumbsDown className="h-3.5 w-3.5 text-red-400" />
                <span className="text-[11px] font-medium text-red-400">Pontos Fracos</span>
              </div>
              <ul className="space-y-1">
                {report.weaknesses.map((w, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex items-start gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-red-500/50 mt-1.5 shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Opportunities */}
          {report.opportunities.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[11px] font-medium text-amber-400">Oportunidades</span>
              </div>
              <ul className="space-y-1">
                {report.opportunities.map((o, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex items-start gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-amber-500/50 mt-1.5 shrink-0" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Hook Types & Patterns */}
          <div className="flex flex-wrap gap-1 pt-1">
            {report.hookTypes.map((h, i) => (
              <Badge key={i} variant="outline" className="text-[9px] border-zinc-700 text-zinc-500">
                {h}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {!report && !loading && (
        <div className="text-center py-6 text-zinc-500 text-xs">
          Insira a URL de um perfil social para analisar estratégia e padrões.
        </div>
      )}
    </Card>
  );
}
