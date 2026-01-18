'use client';

import { motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMode } from './chat-mode-selector';
import { CHAT_MODES, COUNSELORS_REGISTRY } from '@/lib/constants';
import { CounselorId } from '@/types';

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

  const socialSuggestions = [
    'Como viralizar no TikTok em 2025?',
    'Ideias de hooks para Reels de 15s',
    'Como converter seguidores em leads?',
    'Estratégia de conteúdo para LinkedIn',
  ];

  const adsSuggestions = [
    'Qual o melhor criativo para Meta Ads?',
    'Como baixar o CPA no TikTok?',
    'Estratégia de escala para $10k/dia',
    'Como evitar bloqueios no Facebook?',
  ];

  const designSuggestions = [
    'Como estruturar uma thumbnail de YouTube?',
    'Briefing para carrossel do Instagram',
    'Crie um prompt de criativo estático',
    'Checklist de design para conversão',
  ];

  const generalSuggestions = [
    'Como criar urgência sem ser apelativo?',
    'Como qualificar leads no topo do funil?',
    'Preciso melhorar meu VSL script',
    'Como aumentar o LTV dos clientes?',
  ];

  const suggestions = 
    mode === 'funnel' ? funnelSuggestions : 
    mode === 'copy' ? copySuggestions : 
    mode === 'social' ? socialSuggestions :
    mode === 'ads' ? adsSuggestions :
    mode === 'design' ? designSuggestions :
    generalSuggestions;

  const accentColor = 
    mode === 'funnel' ? 'indigo' : 
    mode === 'copy' ? 'amber' : 
    mode === 'social' ? 'rose' :
    mode === 'ads' ? 'blue' :
    mode === 'design' ? 'purple' :
    'emerald';

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
            accentColor === 'indigo' ? 'bg-indigo-500/20' : 
            accentColor === 'amber' ? 'bg-amber-500/20' : 
            accentColor === 'rose' ? 'bg-rose-500/20' :
            accentColor === 'blue' ? 'bg-blue-500/20' :
            accentColor === 'purple' ? 'bg-purple-500/20' :
            'bg-emerald-500/20'
          )} />
          <div className={cn(
            'relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl sm:rounded-3xl shadow-xl mx-auto',
            accentColor === 'indigo' 
              ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-500/20' 
              : accentColor === 'amber'
              ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/20'
              : accentColor === 'rose'
              ? 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-500/20'
              : accentColor === 'blue'
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/20'
              : accentColor === 'purple'
              ? 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/20'
              : 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/20'
          )}>
            <Bot className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
        </div>

        <h2 className="text-lg sm:text-2xl font-bold text-white mb-2 sm:mb-3">
          {CHAT_MODES[mode].title}
        </h2>
        <p className="text-xs sm:text-base text-zinc-500 mb-6 sm:mb-8 leading-relaxed px-6 sm:px-4">
          {mode === 'funnel' && `Consulte especialistas em arquitetura de funil, qualificação, LTV e monetização.`}
          {mode === 'copy' && `Consulte copywriters lendários sobre headlines, persuasão, ofertas e estrutura.`}
          {mode === 'social' && `Consulte especialistas em redes sociais e viralização.`}
          {mode === 'ads' && `Consulte especialistas em tráfego pago, escala e otimização de campanhas.`}
          {mode === 'design' && `Consulte o Diretor de Design para criar briefings visuais e prompts de alta conversão.`}
          {mode === 'general' && `Pergunte sobre funis, ofertas, copy e estratégias de growth.`}
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
                accentColor === 'indigo'
                  ? 'border-white/[0.04] bg-white/[0.01] hover:border-indigo-500/30 hover:bg-indigo-500/5'
                  : accentColor === 'amber'
                  ? 'border-white/[0.04] bg-white/[0.01] hover:border-amber-500/30 hover:bg-amber-500/5'
                  : accentColor === 'rose'
                  ? 'border-white/[0.04] bg-white/[0.01] hover:border-rose-500/30 hover:bg-rose-500/5'
                  : 'border-white/[0.04] bg-white/[0.01] hover:border-emerald-500/30 hover:bg-emerald-500/5'
              )}
            >
              <Sparkles className={cn(
                'h-3.5 w-3.5 shrink-0 opacity-70',
                accentColor === 'indigo' ? 'text-indigo-400' : accentColor === 'amber' ? 'text-amber-400' : accentColor === 'rose' ? 'text-rose-400' : 'text-emerald-400'
              )} />
              <span className="line-clamp-1">{suggestion}</span>
            </motion.button>
          ))}
        </div>

        {/* Counselors - Hidden on very small screens or more compact */}
        <div className="hidden sm:block space-y-4">
          {mode === 'funnel' && (
            <div>
              <p className="text-xs text-zinc-600 uppercase tracking-wider mb-2">Conselho de Funil</p>
              <div className="flex flex-wrap justify-center gap-2">
                {CHAT_MODES.funnel.counselors.map((id, index) => {
                  const counselor = COUNSELORS_REGISTRY[id];
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
              </div>
            </div>
          )}

          {mode === 'copy' && (
            <div>
              <p className="text-xs text-zinc-600 uppercase tracking-wider mb-2">Conselho de Copy</p>
              <div className="flex flex-wrap justify-center gap-2">
                {CHAT_MODES.copy.counselors.map((id, index) => {
                  const counselor = COUNSELORS_REGISTRY[id];
                  if (!counselor) return null;
                  return (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: 0.7 + index * 0.05 }}
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
              </div>
            </div>
          )}

          {mode === 'social' && (
            <div>
              <p className="text-xs text-zinc-600 uppercase tracking-wider mb-2">Conselho Social</p>
              <div className="flex flex-wrap justify-center gap-2">
                {CHAT_MODES.social.counselors.map((id, index) => {
                  const counselor = COUNSELORS_REGISTRY[id];
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
              </div>
            </div>
          )}

          {mode === 'ads' && (
            <div>
              <p className="text-xs text-zinc-600 uppercase tracking-wider mb-2">Conselho de Ads</p>
              <div className="flex flex-wrap justify-center gap-2">
                {CHAT_MODES.ads.counselors.map((id, index) => {
                  const counselor = COUNSELORS_REGISTRY[id];
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
              </div>
            </div>
          )}

          {mode === 'design' && (
            <div>
              <p className="text-xs text-zinc-600 uppercase tracking-wider mb-2">Diretor de Design</p>
              <div className="flex flex-wrap justify-center gap-2">
                {CHAT_MODES.design.counselors.map((id, index) => {
                  const counselor = COUNSELORS_REGISTRY[id];
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
                        {counselor.name}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {mode === 'general' && (
            <div>
              <p className="text-xs text-zinc-600 uppercase tracking-wider mb-2">23 Especialistas do Conselho</p>
              <div className="flex flex-wrap justify-center gap-2 px-12">
                {['russell_brunson', 'dan_kennedy', 'frank_kern', 'eugene_schwartz', 'gary_halbert', 'savannah_sanchez', 'design_director'].map((id, index) => {
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
                        {id === 'design_director' ? 'Design' : counselor.name.split(' ').slice(-1)[0]}
                      </span>
                    </motion.div>
                  );
                })}
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 border border-emerald-500/20">
                  <span className="text-xs text-emerald-400">+16 experts</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

