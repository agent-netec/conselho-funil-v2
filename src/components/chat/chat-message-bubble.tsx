'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bot, Check, Copy } from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';
import { CounselorBadges, SourcesList } from './counselor-badges';
import { cn } from '@/lib/utils';

export interface MessageData {
  id: string;
  role: string;
  content: string;
  createdAt?: {
    toDate: () => Date;
  };
  metadata?: {
    sources?: Array<{ file: string; section?: string; counselor?: string; similarity?: number }>;
    counselors?: string[];
  };
}

interface ChatMessageBubbleProps {
  message: MessageData;
  index: number;
}

export function ChatMessageBubble({ 
  message, 
  index 
}: ChatMessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className={cn(
        'group flex gap-4 px-6 py-5',
        isUser ? 'bg-transparent' : 'bg-white/[0.01]'
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-sm font-medium text-zinc-300">
            <User className="h-4 w-4" />
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
            <Bot className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-zinc-300">
            {isUser ? 'Você' : 'Conselho'}
          </span>
          {message.createdAt && (
            <span className="text-xs text-zinc-600">
              {message.createdAt.toDate?.().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        
        {/* Message Content - Markdown or Text */}
        {isUser ? (
          <p className="text-zinc-300 whitespace-pre-wrap">{message.content}</p>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}

        {/* Counselor Badges */}
        {!isUser && (message.metadata?.counselors || message.metadata?.sources) && (
          <CounselorBadges 
            counselors={message.metadata.counselors}
            sources={message.metadata.sources}
            compact
          />
        )}

        {/* Sources */}
        {!isUser && message.metadata?.sources && message.metadata.sources.length > 0 && (
          <SourcesList sources={message.metadata.sources} />
        )}

        {/* Copy button */}
        {!isUser && (
          <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copiar
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

