'use client';

/**
 * Sprint O — O-4.4 + Sprint 01.7: ProfileAnalyzer component
 * Input competitor URL → Firecrawl scrape → Gemini analysis report
 * Persists results in Firestore (TTL 30 days), loads saved profiles on mount.
 */

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  UserSearch, ExternalLink, Loader2, Search,
  ThumbsUp, ThumbsDown, Lightbulb,
} from 'lucide-react';
import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import { notify } from '@/lib/stores/notification-store';
import {
  collection, query, orderBy, getDocs, addDoc, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

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

interface SavedProfile {
  url: string;
  report: ProfileReport;
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function ProfileAnalyzer() {
  const activeBrand = useActiveBrand();
  const [loading, setLoading] = useState(false);
  const [profileUrl, setProfileUrl] = useState('');
  const [report, setReport] = useState<ProfileReport | null>(null);
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [selectedSavedIdx, setSelectedSavedIdx] = useState<number | null>(null);

  // Load saved profiles on mount
  const loadSavedProfiles = useCallback(async () => {
    if (!activeBrand?.id) return;
    try {
      const colRef = collection(db, 'brands', activeBrand.id, 'competitor_profiles');
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const now = Date.now();
      const valid = snap.docs
        .map(d => d.data() as SavedProfile)
        .filter(p => (p.expiresAt?.toMillis?.() ?? 0) > now);
      setSavedProfiles(valid);
    } catch (err) {
      console.warn('[ProfileAnalyzer] Failed to load saved profiles:', err);
    }
  }, [activeBrand?.id]);

  useEffect(() => {
    loadSavedProfiles();
  }, [loadSavedProfiles]);

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
    setSelectedSavedIdx(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/social/profile-analysis', {
        method: 'POST',
        headers,
        body: JSON.stringify({ brandId: activeBrand.id, profileUrl }),
      });
      if (!res.ok) throw new Error('Falha na análise');
      const data = await res.json();
      const newReport = data.data?.report || null;
      setReport(newReport);
      notify.success('Análise de perfil concluída!');

      // Persist to Firestore
      if (newReport) {
        try {
          const colRef = collection(db, 'brands', activeBrand.id, 'competitor_profiles');
          await addDoc(colRef, {
            url: profileUrl,
            report: newReport,
            createdAt: serverTimestamp(),
            expiresAt: Timestamp.fromMillis(Date.now() + THIRTY_DAYS_MS),
          });
          // Refresh saved list
          loadSavedProfiles();
        } catch (saveErr) {
          console.warn('[ProfileAnalyzer] Failed to persist profile:', saveErr);
        }
      }
    } catch {
      notify.error('Erro na análise de perfil.');
    } finally {
      setLoading(false);
    }
  };

  const showSavedProfile = (idx: number) => {
    setSelectedSavedIdx(idx);
    setReport(savedProfiles[idx].report);
  };

  const activeReport = report;

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

      {/* Saved profiles list */}
      {savedProfiles.length > 0 && !activeReport && (
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Perfis analisados</p>
          <div className="space-y-1.5">
            {savedProfiles.map((sp, i) => (
              <button
                key={i}
                onClick={() => showSavedProfile(i)}
                className="w-full flex items-center gap-2 p-2 rounded-lg bg-zinc-800/30 border border-zinc-800 hover:bg-zinc-800/60 transition-colors text-left"
              >
                <UserSearch className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                <span className="text-xs text-zinc-300 truncate">{sp.report.profileName}</span>
                <Badge variant="outline" className="text-[9px] border-zinc-700 text-zinc-500 ml-auto shrink-0">
                  {sp.report.platform}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeReport && (
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-100">{activeReport.profileName}</span>
              <Badge variant="outline" className="text-[10px] border-violet-500/20 text-violet-400">
                {activeReport.platform}
              </Badge>
              <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500">
                {activeReport.frequency}
              </Badge>
            </div>
            {selectedSavedIdx !== null && (
              <button onClick={() => { setReport(null); setSelectedSavedIdx(null); }} className="text-[10px] text-zinc-500 hover:text-zinc-300">
                Voltar
              </button>
            )}
          </div>

          {/* Summary */}
          <p className="text-xs text-zinc-400 italic">{activeReport.summary}</p>

          {/* Strengths */}
          {activeReport.strengths.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <ThumbsUp className="h-3.5 w-3.5 text-[#E6B447]" />
                <span className="text-[11px] font-medium text-[#E6B447]">Pontos Fortes</span>
              </div>
              <ul className="space-y-1">
                {activeReport.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex items-start gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-[#E6B447]/50 mt-1.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {activeReport.weaknesses.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <ThumbsDown className="h-3.5 w-3.5 text-red-400" />
                <span className="text-[11px] font-medium text-red-400">Pontos Fracos</span>
              </div>
              <ul className="space-y-1">
                {activeReport.weaknesses.map((w, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex items-start gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-red-500/50 mt-1.5 shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Opportunities */}
          {activeReport.opportunities.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[11px] font-medium text-amber-400">Oportunidades</span>
              </div>
              <ul className="space-y-1">
                {activeReport.opportunities.map((o, i) => (
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
            {activeReport.hookTypes.map((h, i) => (
              <Badge key={i} variant="outline" className="text-[9px] border-zinc-700 text-zinc-500">
                {h}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {!activeReport && savedProfiles.length === 0 && !loading && (
        <div className="text-center py-6 text-zinc-500 text-xs">
          Insira a URL de um perfil social para analisar estratégia e padrões.
        </div>
      )}
    </Card>
  );
}
