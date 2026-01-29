'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, Trash2, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useMobile } from '@/lib/hooks/use-mobile';

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
  const isMobile = useMobile();

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-[#0a0a0c] overflow-hidden">
      {/* New Chat */}
      <div className="p-4 flex-shrink-0">
        <Button
          onClick={onNewConversation}
          disabled={isCreating}
          className={cn(
            'w-full justify-center h-11 shadow-lg shadow-black/20', 
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

      {/* Conversations Container with elegant scroll and mask */}
      <div className="flex-1 relative overflow-hidden group/sidebar">
        {/* Top Fade Mask */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#0a0a0c] to-transparent z-10 pointer-events-none opacity-0 group-hover/sidebar:opacity-100 transition-opacity" />
        
        <div className="absolute inset-0 overflow-y-auto custom-scrollbar px-3 pb-8 scroll-smooth">
          <AnimatePresence>
            {isLoading ? (
              <div className="space-y-2 py-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 rounded-xl bg-zinc-800/20 animate-pulse border border-white/[0.02]" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="px-3 py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-900/50 border border-white/[0.05] flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-5 w-5 text-zinc-700" />
                </div>
                <p className="text-sm text-zinc-500 font-medium">
                  Inicie sua primeira<br />consultoria
                </p>
              </div>
            ) : (
              <div className="space-y-1 py-2">
                {conversations.map((conv) => (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    onClick={() => onSelectConversation(conv.id)}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-3 cursor-pointer transition-all min-h-[48px] border border-transparent',
                      conv.id === conversationId
                        ? accentColor === 'indigo'
                          ? 'bg-indigo-500/10 text-white border-indigo-500/20 shadow-sm shadow-indigo-500/5'
                          : accentColor === 'amber'
                          ? 'bg-amber-500/10 text-white border-amber-500/20 shadow-sm shadow-amber-500/5'
                          : 'bg-emerald-500/10 text-white border-emerald-500/20 shadow-sm shadow-emerald-500/5'
                        : 'text-zinc-500 hover:bg-white/[0.02] hover:text-zinc-300 hover:border-white/[0.05]'
                    )}
                  >
                    <div className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      conv.id === conversationId 
                        ? (accentColor === 'indigo' ? "bg-indigo-500/20 text-indigo-400" : accentColor === 'amber' ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400")
                        : "bg-zinc-900 text-zinc-600 group-hover:text-zinc-400"
                    )}>
                      <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
                    </div>
                    <span className="flex-1 truncate text-[13px] font-medium tracking-tight">{conv.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id, e);
                      }}
                      className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-lg transition-all"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-zinc-600 hover:text-red-400" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Fade Mask */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0a0a0c] to-transparent z-10 pointer-events-none" />
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="fixed left-3 top-3.5 z-40 md:hidden h-9 w-9 text-zinc-400 bg-zinc-900/50 backdrop-blur-md border border-white/[0.04] rounded-xl hover:bg-zinc-800"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[280px] bg-[#0a0a0c] border-r border-white/[0.04]">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-white/[0.04] bg-[#0d0d0f]">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-500" />
                Histórico
              </h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <SidebarContent />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="w-72 flex-shrink-0 border-r border-white/[0.04] bg-[#0a0a0c] hidden md:flex flex-col h-full">
      <SidebarContent />
    </div>
  );
}
