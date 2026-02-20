'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Paperclip, X, FileText, Loader2, ChevronUp, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatModeSelector, ChatMode } from './chat-mode-selector';
import { CHAT_MODES, COUNSELORS_REGISTRY } from '@/lib/constants';
import { CounselorId } from '@/types';
import { CounselorSelector } from './party-mode/counselor-selector';
import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import { useUser } from '@/lib/hooks/use-user';
import { useFileUpload } from '@/lib/hooks/chat/use-file-upload';
import { usePartyMode } from '@/lib/hooks/chat/use-party-mode';
import { useChatMessage } from '@/lib/hooks/chat/use-chat-message';

interface ChatInputAreaProps {
  onSend: (message: string, options?: { selectedAgents?: string[]; intensity?: 'debate' | 'consensus' }) => void;
  isLoading: boolean;
  disabled?: boolean;
  disabledMessage?: string;
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

export function ChatInputArea({ onSend, isLoading, disabled = false, disabledMessage, mode, onModeChange }: ChatInputAreaProps) {
  const [value, setValue] = useState('');
  const [mounted, setMounted] = useState(false);
  const [selectorExpanded, setSelectorExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeBrand = useActiveBrand();
  const { user } = useUser();
  const { attachments, isUploading, handleFileSelect, removeAttachment, clearAttachments } = useFileUpload(activeBrand?.id ?? null, user?.id ?? null);
  const { isPartyMode, selectedAgents, intensity, togglePartyMode, setSelectedAgents, setIntensity, hasMinimumAgents } = usePartyMode(mode, onModeChange);
  const { buildMessage } = useChatMessage();

  useEffect(() => { setMounted(true); }, []);

  // Auto-expand selector when party mode activates, collapse when deactivated
  useEffect(() => {
    if (isPartyMode) setSelectorExpanded(true);
    else setSelectorExpanded(false);
  }, [isPartyMode]);

  const handleToggleParty = () => {
    if (!isPartyMode) {
      // Activate party mode (hook will set mode='party', effect above expands)
      togglePartyMode();
    } else {
      // Toggle selector visibility (keep party mode active)
      setSelectorExpanded(prev => !prev);
    }
  };

  const handleDeactivateParty = () => {
    togglePartyMode(); // back to 'general'
  };

  const handleConfirmMesa = () => {
    setSelectorExpanded(false);
    // Focus the textarea after collapse
    setTimeout(() => textareaRef.current?.focus(), 150);
  };

  const modeConfig = CHAT_MODES[mode];
  const accentColor = modeConfig.accentColor;

  // Gerar footer dinâmico com base nos conselheiros
  const counselorNames = isPartyMode
    ? selectedAgents.map(id => COUNSELORS_REGISTRY[id as CounselorId]?.name || id).join(', ')
    : modeConfig.counselors.map(id => COUNSELORS_REGISTRY[id as CounselorId]?.name || id).join(', ');
  const dynamicFooter = mode === 'general'
    ? modeConfig.footer
    : isPartyMode
      ? `🎉 Party: ${counselorNames || 'Nenhum selecionado'}`
      : `${modeConfig.footer.split(':')[0]}: ${counselorNames}`;

  const isInputDisabled = isLoading || (mounted && disabled) || isUploading;
  const isSendDisabled = (!value.trim() && attachments.length === 0) || isInputDisabled || !hasMinimumAgents;

  const handleSubmit = () => {
    if (isSendDisabled) return;
    const { finalMessage, sendOptions } = buildMessage(value, {
      attachments, partyMode: isPartyMode, selectedAgents, intensity,
    });
    onSend(finalMessage, sendOptions);
    setValue('');
    clearAttachments();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.files?.length) handleFileSelect(e.dataTransfer.files); };

  useEffect(() => {
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`; }
  }, [value]);

  return (
    <div className="border-t border-white/[0.04] bg-[#09090b]/90 backdrop-blur-2xl p-3 sm:p-4 pb-6 sm:pb-4" onDragOver={handleDragOver} onDrop={handleDrop}>
      <div className="mx-auto max-w-3xl space-y-3">
        {/* Attachment Previews */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex flex-wrap gap-2 pb-1">
              {attachments.map((att) => (
                <motion.div key={att.id} className="relative group flex items-center gap-2 rounded-xl border border-white/[0.06] bg-zinc-900/80 p-1.5 pr-2">
                  <div className="h-8 w-8 rounded-lg overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0">
                    {att.previewUrl ? <img src={att.previewUrl} alt="Preview" className="h-full w-full object-cover" /> : <FileText className="h-4 w-4 text-zinc-500" />}
                  </div>
                  <div className="flex flex-col min-w-0 pr-1">
                    <span className="text-[10px] text-zinc-300 truncate max-w-[100px] font-medium">{att.file.name}</span>
                    <div className="flex items-center gap-1.5">
                      {att.status === 'uploading' && (
                        <div className="flex items-center gap-1.5">
                          <div className="h-1 w-12 rounded-full bg-zinc-800 overflow-hidden"><motion.div className="h-full bg-emerald-500" initial={{ width: 0 }} animate={{ width: `${att.progress}%` }} /></div>
                          <span className="text-[8px] text-zinc-500">{att.progress}%</span>
                        </div>
                      )}
                      {att.status === 'analyzing' && <span className="text-[9px] text-indigo-400 flex items-center gap-1 animate-pulse"><Loader2 className="h-2.5 w-2.5 animate-spin" /> Analisando...</span>}
                      {att.status === 'ready' && <span className="text-[9px] text-emerald-500 font-medium">Pronto</span>}
                      {att.status === 'error' && <span className="text-[9px] text-red-500 truncate max-w-[80px]">{att.error}</span>}
                    </div>
                  </div>
                  <button onClick={() => removeAttachment(att.id)} className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all opacity-0 group-hover:opacity-100"><X className="h-2.5 w-2.5" /></button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Party Mode Selector (expandable) */}
        <AnimatePresence>
          {isPartyMode && selectorExpanded && (
            <CounselorSelector
              selectedIds={selectedAgents}
              onChange={setSelectedAgents}
              intensity={intensity}
              onIntensityChange={setIntensity}
              onConfirm={handleConfirmMesa}
              onClose={handleDeactivateParty}
            />
          )}
        </AnimatePresence>

        {/* Compact bar when party mode active but selector collapsed */}
        <AnimatePresence>
          {isPartyMode && !selectorExpanded && selectedAgents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/[0.04]"
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {selectedAgents.map((id) => {
                    const c = COUNSELORS_REGISTRY[id as CounselorId];
                    if (!c) return null;
                    return (
                      <div
                        key={id}
                        className="h-7 w-7 rounded-full border-2 border-zinc-950 flex items-center justify-center text-xs shadow-md"
                        style={{ backgroundColor: c.color, boxShadow: `0 0 10px ${c.color}30` }}
                      >
                        {c.icon}
                      </div>
                    );
                  })}
                </div>
                <span className="text-[10px] font-bold text-fuchsia-300 uppercase tracking-wider">
                  {intensity === 'debate' ? 'Debate' : 'Consenso'} — {selectedAgents.length} estrategistas
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectorExpanded(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[9px] font-bold text-zinc-400 uppercase tracking-wider hover:text-white hover:border-white/10 transition-all"
                >
                  <Settings2 className="h-3 w-3" />
                  Alterar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDeactivateParty}
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mode Selector */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <ChatModeSelector mode={mode} onModeChange={onModeChange} />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleToggleParty}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all border',
                isPartyMode
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200 shadow-[0_0_24px_rgba(16,185,129,0.35)]'
                  : 'bg-zinc-900/60 border-white/5 text-zinc-200 hover:border-white/10'
              )}
            >
              {isPartyMode && !selectorExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isPartyMode ? 'Alto Conselho Ativo' : 'Invocar Alto Conselho'}
            </motion.button>
          </div>
          {isPartyMode && !hasMinimumAgents && <p className="text-[11px] text-amber-400 font-medium">Selecione pelo menos 3 especialistas para iniciar o debate.</p>}
        </div>

        {/* Input */}
        <div className={cn('relative flex items-end gap-2 sm:gap-3 rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-2 sm:p-3 transition-all duration-300', 'focus-within:border-white/[0.1] focus-within:bg-zinc-900/80 focus-within:shadow-[0_0_20px_rgba(255,255,255,0.02)]', disabled && 'border-red-500/50 bg-red-500/5')}>
          <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e.target.files)} className="hidden" multiple accept="image/*,application/pdf" />
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isInputDisabled} className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300', 'text-zinc-500 hover:text-white hover:bg-white/[0.05] disabled:opacity-30')}>
            <Paperclip className="h-5 w-5" />
          </button>
          <textarea ref={textareaRef} value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={handleKeyDown} placeholder={mounted && disabled ? (disabledMessage || 'Saldo insuficiente') : modeConfig.placeholder} disabled={isInputDisabled} rows={1} className="flex-1 resize-none bg-transparent py-2.5 px-0 text-[16px] sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none disabled:opacity-50 min-h-[44px] sm:min-h-0" style={{ maxHeight: '160px' }} />
          <motion.button whileHover={!isInputDisabled ? { scale: 1.05 } : {}} whileTap={!isInputDisabled ? { scale: 0.95 } : {}} onClick={handleSubmit} disabled={isSendDisabled} className={cn('flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300', (value.trim() || attachments.length > 0) && !isInputDisabled && hasMinimumAgents ? accentColor === 'indigo' ? 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : accentColor === 'amber' ? 'bg-amber-500 text-white hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : accentColor === 'blue' ? 'bg-blue-500 text-white hover:bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-zinc-800 text-zinc-500')}>
            <Send className="h-5 w-5" />
          </motion.button>
        </div>

        <p className="text-center text-[10px] sm:text-xs text-zinc-600 px-4">
          {disabled ? '⚠️ Faça upgrade para obter mais créditos.' : dynamicFooter}
        </p>
      </div>
    </div>
  );
}
