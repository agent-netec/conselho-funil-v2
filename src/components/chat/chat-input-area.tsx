'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatModeSelector, ChatMode } from './chat-mode-selector';
import { CHAT_MODES } from '@/lib/constants';

interface ChatInputAreaProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

export function ChatInputArea({ 
  onSend, 
  isLoading,
  mode,
  onModeChange,
}: ChatInputAreaProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const modeConfig = CHAT_MODES[mode];
  const accentColor = modeConfig.accentColor;

  const handleSubmit = () => {
    if (!value.trim() || isLoading) return;
    onSend(value.trim());
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  return (
    <div className="border-t border-white/[0.04] bg-[#09090b]/80 backdrop-blur-xl p-4">
      <div className="mx-auto max-w-3xl space-y-3">
        {/* Mode Selector */}
        <div className="flex justify-center">
          <ChatModeSelector mode={mode} onModeChange={onModeChange} />
        </div>

        {/* Input */}
        <div className="relative flex items-end gap-3 rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-3">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={modeConfig.placeholder}
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none disabled:opacity-50"
            style={{ maxHeight: '200px' }}
          />
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={!value.trim() || isLoading}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl transition-all',
              value.trim() && !isLoading
                ? accentColor === 'indigo'
                  ? 'bg-indigo-500 text-white hover:bg-indigo-400'
                  : accentColor === 'amber'
                  ? 'bg-amber-500 text-white hover:bg-amber-400'
                  : 'bg-emerald-500 text-white hover:bg-emerald-400'
                : 'bg-zinc-800 text-zinc-500'
            )}
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </div>
        
        <p className="text-center text-xs text-zinc-600">
          {modeConfig.footer}
        </p>
      </div>
    </div>
  );
}

