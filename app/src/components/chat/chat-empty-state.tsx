'use client';

import { motion } from 'framer-motion';
import { Bot, Sparkles, Target, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMode } from './chat-mode-selector';
import { CHAT_MODES, COUNSELORS_REGISTRY } from '@/lib/constants';
import { CounselorId } from '@/types';

interface ChatEmptyStateProps {
  onSuggestionClick: (text: string) => void;
  mode: ChatMode;
}

const SUGGESTIONS: Record<ChatMode, string[]> = {
  general: [
    'Como criar urgência sem ser apelativo?',
    'Como qualificar leads no topo do funil?',
    'Preciso melhorar meu VSL script',
    'Como aumentar o LTV dos clientes?',
  ],
  campaign: [
    'Analise minha campanha e sugira melhorias',
    'Como está o fluxo da minha Linha de Ouro?',
    'Que tipo de copy funciona para este público?',
    'Quais hooks sociais funcionam para esta oferta?',
  ],
  party: [
    'Debatam a melhor estratégia de lançamento',
    'Comparem abordagens para tráfego frio',
    'Qual a melhor estrutura de oferta para high ticket?',
    'Analisem meu funil e encontrem os gargalos',
  ],
};

const MODE_DESCRIPTIONS: Record<ChatMode, string> = {
  general: 'Pergunte sobre funis, ofertas, copy e estratégias de growth.',
  campaign: 'Todos os 23 especialistas com contexto completo da sua campanha ativa.',
  party: 'Selecione especialistas para um debate profundo sobre o seu tema.',
};

const HIGHLIGHT_COUNSELORS = [
  'russell_brunson', 'dan_kennedy', 'frank_kern', 'eugene_schwartz',
  'gary_halbert', 'rachel_karten', 'savannah_sanchez',
];

export function ChatEmptyState({
  onSuggestionClick,
  mode,
}: ChatEmptyStateProps) {
  const suggestions = SUGGESTIONS[mode];
  const accentColor = mode === 'campaign' ? 'amber' : 'gold';

  return (
    <div className="flex h-full flex-col items-center justify-center p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-2xl"
      >
        {/* Logo */}
        <div className="relative mx-auto mb-4 sm:mb-8 scale-90 sm:scale-100">
          <div className={cn(
            'absolute inset-0 rounded-3xl blur-2xl opacity-40',
            accentColor === 'amber' ? 'bg-amber-500/20' : 'bg-[#E6B447]/20'
          )} />
          <div className={cn(
            'relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl sm:rounded-3xl shadow-xl mx-auto',
            accentColor === 'amber'
              ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/20'
              : 'bg-gradient-to-br from-[#E6B447] to-[#AB8648] shadow-[#E6B447]/20'
          )}>
            {mode === 'campaign' ? (
              <Target className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            ) : mode === 'party' ? (
              <Users className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            ) : (
              <Bot className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            )}
          </div>
        </div>

        <h2 className="text-lg sm:text-2xl font-bold text-white mb-2 sm:mb-3">
          {CHAT_MODES[mode].title}
        </h2>
        <p className="text-xs sm:text-base text-zinc-500 mb-6 sm:mb-8 leading-relaxed px-6 sm:px-4">
          {MODE_DESCRIPTIONS[mode]}
        </p>

        {/* Suggestions */}
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 mb-8 px-4 sm:px-0 max-w-lg mx-auto">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
              onClick={() => onSuggestionClick(suggestion)}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3 text-[13px] sm:text-sm text-zinc-300 transition-all text-left',
                accentColor === 'amber'
                  ? 'border-white/[0.04] bg-white/[0.01] hover:border-amber-500/30 hover:bg-amber-500/5'
                  : 'border-white/[0.04] bg-white/[0.01] hover:border-[#E6B447]/30 hover:bg-[#E6B447]/5'
              )}
            >
              <Sparkles className={cn(
                'h-3.5 w-3.5 shrink-0 opacity-70',
                accentColor === 'amber' ? 'text-amber-400' : 'text-[#E6B447]'
              )} />
              <span className="line-clamp-1">{suggestion}</span>
            </motion.button>
          ))}
        </div>

        {/* Counselors — show for general & campaign */}
        {(mode === 'general' || mode === 'campaign') && (
          <div className="hidden sm:block space-y-4">
            <p className="text-xs text-zinc-600 uppercase tracking-wider mb-2">
              {mode === 'campaign' ? 'Especialistas com Contexto da Campanha' : '23 Especialistas MKTHONEY'}
            </p>
            <div className="flex flex-wrap justify-center gap-2 px-12">
              {HIGHLIGHT_COUNSELORS.map((id, index) => {
                const counselor = COUNSELORS_REGISTRY[id as CounselorId];
                if (!counselor) return null;
                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.5 + index * 0.05 }}
                    className="flex items-center gap-1.5 rounded-full bg-zinc-800/50 px-3 py-1.5"
                    title={counselor.expertise}
                  >
                    <span className="text-sm">{counselor.icon}</span>
                    <span className="text-xs text-zinc-400">
                      {counselor.name.split(' ').slice(-1)[0]}
                    </span>
                  </motion.div>
                );
              })}
              <div className="flex items-center gap-1.5 rounded-full bg-[#E6B447]/10 px-3 py-1.5 border border-[#E6B447]/20">
                <span className="text-xs text-[#E6B447]">+16 experts</span>
              </div>
            </div>
          </div>
        )}

        {/* Party Mode hint */}
        {mode === 'party' && (
          <div className="hidden sm:block">
            <p className="text-xs text-zinc-600 uppercase tracking-wider mb-2">Selecione especialistas no painel lateral</p>
            <p className="text-[11px] text-zinc-700">Cada debate custa 2 créditos</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
