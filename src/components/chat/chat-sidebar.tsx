'use client';

import { Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore } from '@/lib/stores/chat-store';
import { cn } from '@/lib/utils';

export function ChatSidebar() {
  const {
    conversations,
    currentConversation,
    createConversation,
    selectConversation,
  } = useChatStore();

  return (
    <div className="flex h-full w-64 flex-col border-r border-zinc-800 bg-zinc-900/50">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-4">
        <h2 className="font-medium text-zinc-300">Conversas</h2>
        <Button
          onClick={createConversation}
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-zinc-400 hover:text-white"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Conversations list */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="mb-2 h-8 w-8 text-zinc-600" />
              <p className="text-sm text-zinc-500">Nenhuma conversa</p>
              <Button
                onClick={createConversation}
                variant="link"
                className="mt-2 text-violet-400 hover:text-violet-300"
              >
                Iniciar nova conversa
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => selectConversation(conversation.id)}
                  className={cn(
                    'w-full rounded-lg px-3 py-2 text-left transition-colors',
                    currentConversation?.id === conversation.id
                      ? 'bg-violet-600/20 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  )}
                >
                  <p className="truncate text-sm font-medium">
                    {conversation.title}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {conversation.messages.length} mensagens
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}


