'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { COUNSELOR_METADATA, CounselorMeta } from '@/data/counselor-metadata';

// Sprint 05.8: Counselor introduction card — shown on first interaction
// Tracking via localStorage to avoid Firestore writes

const STORAGE_KEY = 'mkthoney_seen_counselors';

function getSeenCounselors(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function markCounselorSeen(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const seen = getSeenCounselors();
    seen.add(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
  } catch { /* ignore */ }
}

interface CounselorIntroCardProps {
  counselorId: string;
}

// Brief "why listen" bios per counselor
const COUNSELOR_BIOS: Record<string, string> = {
  russell_brunson: 'Criou funnels que geraram mais de $100M. Inventor do Value Ladder e autor de DotCom Secrets.',
  dan_kennedy: 'O "millionaire maker" do direct response. Seus alunos faturam coletivamente bilhões.',
  frank_kern: 'Pioneiro em behavioral dynamics. Seus lançamentos definiram o marketing digital moderno.',
  sam_ovens: 'De zero a $30M em consulting funnels. Especialista em qualificação e high ticket.',
  ryan_deiss: 'Criador do Customer Value Journey. Fez a DigitalMarketer crescer para 8 figuras.',
  perry_belcher: 'Mestre em ofertas de entrada. Vendeu mais de $1B em produtos via direct response.',
  eugene_schwartz: 'Autor de Breakthrough Advertising. Seus 5 níveis de consciência são a base de toda copy moderna.',
  claude_hopkins: 'Pai da publicidade científica. Cada headline é um experimento, cada campanha é um dado.',
  gary_halbert: 'O maior copywriter da história. Suas cartas de vendas moveram milhões.',
  joseph_sugarman: 'Inventor do "slippery slide". Seus triggers psicológicos são usados até hoje.',
  dan_kennedy_copy: 'Master em copy direta e ofertas irresistíveis. Combina urgência real com persuasão ética.',
  david_ogilvy: 'O pai da publicidade moderna. Criou campanhas icônicas para Rolls-Royce, Dove e Schweppes.',
  john_carlton: 'Copy "punchy" e ganchos de curiosidade. Seus leads são estudados como obras de arte.',
  drayton_bird: 'Simplicidade como arma. 50 anos escrevendo copy que converte pela clareza.',
  frank_kern_copy: 'Mass Control e campanhas comportamentais. Automatiza persuasão em escala.',
  lia_haberman: 'Especialista em Creator Economy e algoritmos. Sabe exatamente o que as plataformas priorizam.',
  rachel_karten: 'A rainha dos hooks. Seus ganchos param o scroll e prendem a atenção.',
  nikita_beer: 'Decodificou padrões virais. Sabe por que conteúdo viraliza e como replicar.',
  justin_welsh: 'De burnout a $5M solo no LinkedIn. Mestre em funil social orgânico.',
  justin_brooke: 'Investiu $100M+ em mídia paga. Sabe escalar campanhas sem queimar budget.',
  nicholas_kusmich: 'O cara do Facebook Ads. Suas estratégias de targeting são referência no mercado.',
  jon_loomer: 'O cientista do Meta Ads. Testa tudo, documenta tudo, otimiza tudo.',
  savannah_sanchez: 'Rainha do TikTok Ads e UGC. Sabe criar criativos que performam na nova geração.',
  design_director: 'Direção de arte estratégica. Cada peça visual tem um papel no funil de conversão.',
};

export function CounselorIntroCard({ counselorId }: CounselorIntroCardProps) {
  const [visible, setVisible] = useState(false);
  const meta = COUNSELOR_METADATA[counselorId];

  useEffect(() => {
    if (!meta) return;
    const seen = getSeenCounselors();
    if (!seen.has(counselorId)) {
      setVisible(true);
      markCounselorSeen(counselorId);
    }
  }, [counselorId, meta]);

  if (!visible || !meta) return null;

  const bio = COUNSELOR_BIOS[counselorId] || `Especialista em ${meta.specialty}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-3 overflow-hidden"
    >
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
            style={{ backgroundColor: `${meta.accentColor}20`, color: meta.accentColor }}
          >
            {meta.initials}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">{meta.name}</h4>
            <span className="text-[10px] font-mono text-zinc-500 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
              {meta.specialty}
            </span>
          </div>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">{bio}</p>
      </div>
    </motion.div>
  );
}
