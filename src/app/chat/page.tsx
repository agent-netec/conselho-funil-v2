'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { useConversations, useConversation } from '@/lib/hooks/use-conversations';
import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatInputArea } from '@/components/chat/chat-input-area';
import { ChatMessageList } from '@/components/chat/chat-message-list';
import { ChatEmptyState } from '@/components/chat/chat-empty-state';
import { ChatMode } from '@/components/chat/chat-mode-selector';
import { MessageData } from '@/components/chat/chat-message-bubble';
import { CHAT_MODES } from '@/lib/constants';

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('id');
  const funnelId = searchParams.get('funnelId');
  const activeBrand = useActiveBrand(); // Marca ativa para vincular conversas
  
  const [chatMode, setChatMode] = useState<ChatMode>('general');
  const [isCreating, setIsCreating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const modeConfig = CHAT_MODES[chatMode];
  const accentColor = modeConfig.accentColor;

  const {
    conversations,
    isLoading: conversationsLoading,
    create: createConversation,
    remove: removeConversation,
  } = useConversations();
  
  const {
    messages,
    isSending,
    sendMessage,
  } = useConversation(conversationId);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const handleNewConversation = async () => {
    setIsCreating(true);
    try {
      const newId = await createConversation('Nova conversa', activeBrand?.id);
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
    const apiMode = 
      chatMode === 'funnel' ? 'funnel_creation' : 
      chatMode === 'copy' ? 'copy' : 
      chatMode === 'social' ? 'social' : 
      'general';
    
    if (!conversationId) {
      const newId = await createConversation('Nova conversa', activeBrand?.id);
      const url = funnelId ? `/chat?id=${newId}&funnelId=${funnelId}` : `/chat?id=${newId}`;
      router.push(url);
      setTimeout(() => {
        sendMessage(message, apiMode, funnelId || undefined);
      }, 500);
      return;
    }
    await sendMessage(message, apiMode, funnelId || undefined);
  };

  return (
    <div className="flex h-screen flex-col">
      <Header 
        title={modeConfig.title} 
        subtitle={modeConfig.subtitle} 
      />

      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar 
          conversations={conversations}
          isLoading={conversationsLoading}
          conversationId={conversationId}
          isCreating={isCreating}
          accentColor={accentColor}
          onNewConversation={handleNewConversation}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
        />

        <div className="flex flex-1 flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            {!conversationId || messages.length === 0 ? (
              <ChatEmptyState onSuggestionClick={handleSend} mode={chatMode} />
            ) : (
              <ChatMessageList 
                messages={messages as MessageData[]} 
                isSending={isSending} 
                accentColor={accentColor} 
              />
            )}
          </div>

          <ChatInputArea 
            onSend={handleSend} 
            isLoading={isSending} 
            mode={chatMode}
            onModeChange={setChatMode}
          />
        </div>
      </div>
    </div>
  );
}
