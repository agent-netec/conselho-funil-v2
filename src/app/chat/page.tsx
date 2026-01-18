'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { useConversations, useConversation } from '@/lib/hooks/use-conversations';
import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import { useUser } from '@/lib/hooks/use-user';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatInputArea } from '@/components/chat/chat-input-area';
import { ChatMessageList } from '@/components/chat/chat-message-list';
import { ChatEmptyState } from '@/components/chat/chat-empty-state';
import { ChatMode } from '@/components/chat/chat-mode-selector';
import { MessageData } from '@/components/chat/chat-message-bubble';
import { ActiveContextIndicator } from '@/components/chat/active-context-indicator';
import { CHAT_MODES } from '@/lib/constants';
import { PaywallModal } from '@/components/modals/paywall-modal';
import { CONFIG } from '@/lib/config';

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('id');
  const funnelId = searchParams.get('funnelId');
  const rawCampaignId = searchParams.get('campaignId');
  
  // Limpeza de campaignId "undefined" vindo da URL (ST-11.6)
  const campaignId = (rawCampaignId === 'undefined' || !rawCampaignId) ? null : rawCampaignId;
  const urlMode = searchParams.get('mode') as ChatMode | null;
  const activeBrand = useActiveBrand(); // Marca ativa para vincular conversas
  const { user } = useUser();
  
  const [chatMode, setChatMode] = useState<ChatMode>('general');

  // US-20.2: Sincronizar modo da URL
  useEffect(() => {
    if (urlMode && ['general', 'funnel', 'copy', 'social', 'ads', 'design'].includes(urlMode)) {
      setChatMode(urlMode);
    }
  }, [urlMode]);
  const [isCreating, setIsCreating] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const modeConfig = CHAT_MODES[chatMode];
  const accentColor = modeConfig.accentColor;

  const isBlocked = CONFIG.ENABLE_CREDIT_LIMIT && user?.credits !== undefined && user.credits <= 0;

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
    error: chatError,
  } = useConversation(conversationId);

  // Monitor chat error for insufficient credits
  useEffect(() => {
    if (chatError === 'Saldo de créditos insuficiente') {
      setIsPaywallOpen(true);
    }
  }, [chatError]);

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

  const handleSend = async (message: string, partyOptions?: { selectedAgents?: string[], intensity?: 'debate' | 'consensus' }) => {
    const apiMode = 
      chatMode === 'funnel' ? 'funnel_creation' : 
      chatMode === 'copy' ? 'copy' : 
      chatMode === 'social' ? 'social' : 
      chatMode === 'ads' ? 'ads' : 
      chatMode === 'design' ? 'design' :
      chatMode === 'party' ? 'party' :
      'general';
    
    if (!conversationId) {
      const newId = await createConversation('Nova conversa', activeBrand?.id);
      let url = funnelId ? `/chat?id=${newId}&funnelId=${funnelId}` : `/chat?id=${newId}`;
      if (campaignId) url += `&campaignId=${campaignId}`;
      
      router.push(url);
      setTimeout(() => {
        sendMessage(message, apiMode as any, funnelId || undefined, partyOptions, campaignId || undefined);
      }, 500);
      return;
    }
    await sendMessage(message, apiMode as any, funnelId || undefined, partyOptions, campaignId || undefined);
  };

  return (
    <div className="flex h-screen flex-col">
      <Header 
        title={modeConfig.title} 
        subtitle={modeConfig.subtitle} 
        actions={<ActiveContextIndicator brandId={activeBrand?.id} />}
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

        <div className="flex flex-1 flex-col relative overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar bg-[#09090b]">
            <div className="min-h-full flex flex-col justify-end">
              {!conversationId || messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <ChatEmptyState onSuggestionClick={handleSend} mode={chatMode} />
                </div>
              ) : (
                <ChatMessageList 
                  messages={messages as MessageData[]} 
                  isSending={isSending} 
                  accentColor={accentColor} 
                  campaignId={campaignId}
                />
              )}
            </div>
          </div>

          <ChatInputArea 
            onSend={handleSend} 
            isLoading={isSending} 
            disabled={isBlocked}
            disabledMessage="Saldo de créditos insuficiente"
            mode={chatMode}
            onModeChange={setChatMode}
          />
        </div>
      </div>

      <PaywallModal 
        isOpen={isPaywallOpen} 
        onOpenChange={setIsPaywallOpen} 
      />
    </div>
  );
}
