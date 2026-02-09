'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';
import type { Message } from '@/types';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-4 px-4 py-6',
        isUser ? 'bg-zinc-900/50' : 'bg-zinc-950'
      )}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={cn(
            'text-white',
            isUser
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
              : 'bg-gradient-to-br from-violet-600 to-indigo-600'
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 space-y-2">
        {/* Role label */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-300">
            {isUser ? 'Você' : 'Conselho de Funil'}
          </span>
          <span className="text-xs text-zinc-500">
            {(message.timestamp?.toDate?.() ?? new Date()).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Message content */}
        <div className="prose prose-invert prose-sm max-w-none">
          <p className="whitespace-pre-wrap text-zinc-300">{message.content}</p>
        </div>

        {/* Sources (if any) */}
        {message.metadata?.sources && message.metadata.sources.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs text-zinc-500">Fontes:</span>
            {message.metadata.sources.map((source, i) => (
              <span
                key={i}
                className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400"
              >
                {typeof source === 'string' ? source : source.file}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


