'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  title: string;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  isLoading: boolean;
  conversationId: string | null;
  isCreating: boolean;
  accentColor: string;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
}

export function ChatSidebar({
  conversations,
  isLoading,
  conversationId,
  isCreating,
  accentColor,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
}: ChatSidebarProps) {
  return (
    <div className="w-72 flex-shrink-0 border-r border-white/[0.04] bg-[#0a0a0c]">
      <div className="flex h-full flex-col">
        {/* New Chat */}
        <div className="p-4">
          <Button
            onClick={onNewConversation}
            disabled={isCreating}
            className={cn(
              'w-full justify-center',
              accentColor === 'indigo' 
                ? 'bg-indigo-500 hover:bg-indigo-400' 
                : accentColor === 'amber'
                ? 'bg-amber-500 hover:bg-amber-400'
                : 'btn-accent'
            )}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Conversa
          </Button>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4">
          <AnimatePresence>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-11 rounded-xl bg-zinc-800/30 animate-pulse" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-zinc-700 mb-3" />
                <p className="text-sm text-zinc-500">
                  Nenhuma conversa ainda
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    onClick={() => onSelectConversation(conv.id)}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-all',
                      conv.id === conversationId
                        ? accentColor === 'indigo'
                          ? 'bg-indigo-500/10 text-white'
                          : accentColor === 'amber'
                          ? 'bg-amber-500/10 text-white'
                          : 'bg-emerald-500/10 text-white'
                        : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200'
                    )}
                  >
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 truncate text-sm">{conv.title}</span>
                    <button
                      onClick={(e) => onDeleteConversation(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/10 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-zinc-500 hover:text-red-400" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
