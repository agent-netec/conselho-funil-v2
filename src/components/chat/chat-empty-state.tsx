'use client';

import { motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMode } from './chat-mode-selector';
import { COUNSELORS, COPY_COUNSELORS } from '@/lib/constants';

interface ChatEmptyStateProps {
  onSuggestionClick: (text: string) => void;
  mode: ChatMode;
}

export function ChatEmptyState({ 
  onSuggestionClick,
  mode,
}: ChatEmptyStateProps) {
  const funnelSuggestions = [
    'Como estruturar um funil de quiz?',
    'Minha taxa de conversão está baixa',
    'Qual tipo de funil para high ticket?',
    'Como aplicar a Value Ladder?',
  ];

  const copySuggestions = [
    'Como criar headlines que convertem?',
    'Qual copy para audiência fria?',
    'Como estruturar uma oferta irresistível?',
    'Me ajude com uma sequência de emails',
  ];

  const generalSuggestions = [
    'Como criar urgência sem ser apelativo?',
    'Como qualificar leads no topo do funil?',
    'Preciso melhorar meu VSL script',
    'Como aumentar o LTV dos clientes?',
  ];

  const suggestions = mode === 'funnel' ? funnelSuggestions : mode === 'copy' ? copySuggestions : generalSuggestions;
  const accentColor = mode === 'funnel' ? 'indigo' : mode === 'copy' ? 'amber' : 'emerald';

  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-2xl"
      >
        {/* Logo */}
        <div className="relative mx-auto mb-8">
          <div className={cn(
            'absolute inset-0 rounded-3xl blur-2xl',
            accentColor === 'indigo' ? 'bg-indigo-500/20' : accentColor === 'amber' ? 'bg-amber-500/20' : 'bg-emerald-500/20'
          )} />
          <div className={cn(
            'relative flex h-20 w-20 items-center justify-center rounded-3xl shadow-xl mx-auto',
            accentColor === 'indigo' 
              ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-500/20' 
              : accentColor === 'amber'
              ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/20'
              : 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/20'
          )}>
            <Bot className="h-10 w-10 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">
          {mode === 'funnel' ? 'Conselho de Funil' : mode === 'copy' ? 'Conselho de Copy' : 'Conselho Estratégico'}
        </h2>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          {mode === 'funnel' && 'Consulte 6 especialistas em arquitetura de funil, qualificação, LTV e monetização.'}
          {mode === 'copy' && 'Consulte 9 copywriters lendários sobre headlines, persuasão, ofertas e estrutura.'}
          {mode === 'general' && 'Pergunte sobre funis, ofertas, copy e estratégias de growth. Todos os 15 especialistas disponíveis.'}
        </p>

        {/* Suggestions */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
              onClick={() => onSuggestionClick(suggestion)}
              className={cn(
                'flex items-center gap-2 rounded-full border px-4 py-2 text-sm text-zinc-300 transition-all',
                accentColor === 'indigo'
                  ? 'border-white/[0.06] bg-white/[0.02] hover:border-indigo-500/30 hover:bg-indigo-500/5'
                  : accentColor === 'amber'
                  ? 'border-white/[0.06] bg-white/[0.02] hover:border-amber-500/30 hover:bg-amber-500/5'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-emerald-500/30 hover:bg-emerald-500/5'
              )}
            >
              <Sparkles className={cn(
                'h-3 w-3',
                accentColor === 'indigo' ? 'text-indigo-400' : accentColor === 'amber' ? 'text-amber-400' : 'text-emerald-400'
              )} />
              {suggestion}
            </motion.button>
          ))}
        </div>

        {/* Counselors */}
        <div className="space-y-4">
          {(mode === 'general' || mode === 'funnel') && (
            <div>
              <p className="text-xs text-zinc-600 uppercase tracking-wider mb-2">Conselho de Funil</p>
              <div className="flex flex-wrap justify-center gap-2">
                {Object.values(COUNSELORS).map((counselor, index) => (
                  <motion.div
                    key={counselor.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.5 + index * 0.05 }}
                    className="flex items-center gap-1.5 rounded-full bg-zinc-800/50 px-3 py-1.5"
                    title={counselor.expertise}
                  >
                    <span className="text-sm">{counselor.icon}</span>
                    <span className="text-xs text-zinc-400">
                      {counselor.name.split(' ')[1]}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {(mode === 'general' || mode === 'copy') && (
            <div>
              <p className="text-xs text-zinc-600 uppercase tracking-wider mb-2">Conselho de Copy</p>
              <div className="flex flex-wrap justify-center gap-2">
                {Object.values(COPY_COUNSELORS).map((counselor, index) => (
                  <motion.div
                    key={counselor.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.7 + index * 0.05 }}
                    className="flex items-center gap-1.5 rounded-full bg-zinc-800/50 px-3 py-1.5"
                    title={counselor.expertise}
                  >
                    <span className="text-sm">{counselor.icon}</span>
                    <span className="text-xs text-zinc-400">
                      {counselor.name.split(' ')[1]}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

