'use client';

import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMessageBubble, MessageData } from './chat-message-bubble';

interface ChatMessageListProps {
  messages: MessageData[];
  isSending: boolean;
  accentColor: string;
}

export function ChatMessageList({
  messages,
  isSending,
  accentColor,
}: ChatMessageListProps) {
  return (
    <div className="pb-4">
      {messages.map((message, index) => (
        <ChatMessageBubble
          key={message.id}
          message={message}
          index={index}
        />
      ))}
      
      {isSending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-4 px-6 py-5 bg-white/[0.01]"
        >
          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            accentColor === 'indigo'
              ? 'bg-gradient-to-br from-indigo-500 to-indigo-600'
              : accentColor === 'amber'
              ? 'bg-gradient-to-br from-amber-500 to-amber-600'
              : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
          )}>
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="flex items-center gap-1.5">
            {[0, 0.2, 0.4].map((delay) => (
              <motion.div
                key={delay}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay }}
                className={cn(
                  'h-2 w-2 rounded-full',
                  accentColor === 'indigo' ? 'bg-indigo-500' : accentColor === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'
                )}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

