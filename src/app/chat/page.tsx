'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { useConversations, useConversation } from '@/lib/hooks/use-conversations';
import { 
  Bot, 
  Sparkles, 
  Plus, 
  MessageSquare, 
  Trash2, 
  Send,
  User,
  Copy,
  Check,
  ChevronRight,
} from 'lucide-react';
import { COUNSELORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

function ChatMessageBubble({ 
  message, 
  index 
}: { 
  message: { role: string; content: string; createdAt?: any }; 
  index: number;
}) {
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
      transition={{ duration: 0.3, delay: index * 0.05 }}
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
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-medium text-zinc-300">
            {isUser ? 'Você' : 'Conselho'}
          </span>
          {message.createdAt && (
            <span className="text-xs text-zinc-600">
              {message.createdAt.toDate?.().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        
        <div className={cn(
          'prose prose-invert prose-sm max-w-none',
          'prose-p:text-zinc-300 prose-p:leading-relaxed',
          'prose-strong:text-white prose-strong:font-semibold',
          'prose-code:text-emerald-400 prose-code:bg-emerald-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded',
          'prose-blockquote:border-emerald-500/30 prose-blockquote:text-zinc-400',
          'prose-ul:text-zinc-300 prose-li:marker:text-emerald-500'
        )}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

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

function ChatInput({ 
  onSend, 
  isLoading 
}: { 
  onSend: (message: string) => void; 
  isLoading: boolean;
}) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      <div className="mx-auto max-w-3xl">
        <div className="relative flex items-end gap-3 rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-3">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte ao Conselho..."
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
                ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                : 'bg-zinc-800 text-zinc-500'
            )}
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </div>
        
        <p className="mt-2 text-center text-xs text-zinc-600">
          Pressione Enter para enviar, Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
}

function EmptyState({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) {
  const suggestions = [
    'Como estruturar um funil de quiz?',
    'Minha taxa de conversão está baixa',
    'Como criar urgência sem ser apelativo?',
    'Qual tipo de funil para high ticket?',
  ];

  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-lg"
      >
        {/* Logo */}
        <div className="relative mx-auto mb-8">
          <div className="absolute inset-0 rounded-3xl bg-emerald-500/20 blur-2xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-xl shadow-emerald-500/20 mx-auto">
            <Bot className="h-10 w-10 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">
          Conselho de Funil
        </h2>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          Faça perguntas sobre funis, ofertas, copy e estratégias de growth.
          O conselho analisa com base nas heurísticas dos 6 especialistas.
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
              className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-sm text-zinc-300 transition-all hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-white"
            >
              <Sparkles className="h-3 w-3 text-emerald-400" />
              {suggestion}
            </motion.button>
          ))}
        </div>

        {/* Counselors */}
        <div className="flex flex-wrap justify-center gap-2">
          {Object.values(COUNSELORS).map((counselor, index) => (
            <motion.div
              key={counselor.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.5 + index * 0.05 }}
              className="flex items-center gap-1.5 rounded-full bg-zinc-800/50 px-3 py-1.5"
            >
              <span className="text-sm">{counselor.icon}</span>
              <span className="text-xs text-zinc-400">
                {counselor.name.split(' ')[1]}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('id');
  const funnelId = searchParams.get('funnelId');
  
  const {
    conversations,
    isLoading: conversationsLoading,
    create: createConversation,
    remove: removeConversation,
  } = useConversations();
  
  const {
    messages,
    isLoading: messagesLoading,
    isSending,
    sendMessage,
  } = useConversation(conversationId);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleNewConversation = async () => {
    setIsCreating(true);
    try {
      const newId = await createConversation('Nova conversa');
      router.push(`/chat?id=${newId}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectConversation = (id: string) => {
    router.push(`/chat?id=${id}`);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await removeConversation(id);
    if (id === conversationId) {
      router.push('/chat');
    }
  };

  const handleSend = async (message: string) => {
    if (!conversationId) {
      const newId = await createConversation('Nova conversa');
      const url = funnelId ? `/chat?id=${newId}&funnelId=${funnelId}` : `/chat?id=${newId}`;
      router.push(url);
      return;
    }
    await sendMessage(message, 'general', funnelId || undefined);
  };

  return (
    <div className="flex h-screen flex-col">
      <Header title="Conselho" subtitle="Consulte os especialistas" />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 border-r border-white/[0.04] bg-[#0a0a0c]">
          <div className="flex h-full flex-col">
            {/* New Chat */}
            <div className="p-4">
              <Button
                onClick={handleNewConversation}
                disabled={isCreating}
                className="w-full btn-accent justify-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Conversa
              </Button>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4">
              <AnimatePresence>
                {conversationsLoading ? (
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
                        onClick={() => handleSelectConversation(conv.id)}
                        className={cn(
                          'group flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-all',
                          conv.id === conversationId
                            ? 'bg-emerald-500/10 text-white'
                            : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200'
                        )}
                      >
                        <MessageSquare className="h-4 w-4 flex-shrink-0" />
                        <span className="flex-1 truncate text-sm">{conv.title}</span>
                        <button
                          onClick={(e) => handleDeleteConversation(conv.id, e)}
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

        {/* Main Chat */}
        <div className="flex flex-1 flex-col">
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            {!conversationId || messages.length === 0 ? (
              <EmptyState onSuggestionClick={handleSend} />
            ) : (
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
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        className="h-2 w-2 rounded-full bg-emerald-500"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        className="h-2 w-2 rounded-full bg-emerald-500"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        className="h-2 w-2 rounded-full bg-emerald-500"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          <ChatInput onSend={handleSend} isLoading={isSending} />
        </div>
      </div>
    </div>
  );
}
