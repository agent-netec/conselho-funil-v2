'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useConversations, useConversation } from '@/lib/hooks/use-conversations';
import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import { useUser } from '@/lib/hooks/use-user';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatInputArea } from '@/components/chat/chat-input-area';
import { ChatMessageList } from '@/components/chat/chat-message-list';
import { ChatEmptyState } from '@/components/chat/chat-empty-state';
import { ChatMode, mapLegacyMode } from '@/components/chat/chat-mode-selector';
import { MessageData } from '@/components/chat/chat-message-bubble';
import { ActiveContextIndicator } from '@/components/chat/active-context-indicator';
import { CHAT_MODES } from '@/lib/constants';
import { PaywallModal } from '@/components/modals/paywall-modal';
import { CONFIG } from '@/lib/config';
import { toast } from 'sonner';
import { getAuthHeaders } from '@/lib/utils/auth-headers';

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('id');

  // Sprint 05.2: Only 1 optional param — campaignId (for campaign mode)
  const rawCampaignId = searchParams.get('campaignId') || searchParams.get('campaign');
  const campaignId = (rawCampaignId === 'undefined' || !rawCampaignId) ? null : rawCampaignId;

  // Legacy compat: funnelId still accepted for old links
  const funnelId = searchParams.get('funnelId');

  // Sprint R2.2: Detect if coming from onboarding
  const fromOnboarding = searchParams.get('from') === 'onboarding';

  // Sprint 05.1: Map legacy URL modes to new 3-mode system
  const urlMode = searchParams.get('mode');
  const activeBrand = useActiveBrand();
  const { user } = useUser();

  const [chatMode, setChatMode] = useState<ChatMode>('general');

  // Sprint R2.2: Verdict generation state
  const [isGeneratingVerdict, setIsGeneratingVerdict] = useState(false);
  const verdictGeneratedRef = useRef(false);

  // Sprint 05.1: Sync mode from URL — map legacy modes
  useEffect(() => {
    if (urlMode) {
      setChatMode(mapLegacyMode(urlMode));
    } else if (campaignId) {
      // Auto-switch to campaign mode when campaignId present
      setChatMode('campaign');
    }
  }, [urlMode, campaignId]);

  const [isCreating, setIsCreating] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const modeConfig = CHAT_MODES[chatMode];
  const accentColor = modeConfig.accentColor;

  // Credit blocking handled server-side by consumeCredits() (Sprint 02.3).
  // Legacy 'credits' field is no longer authoritative.
  const isBlocked = false;

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

  // Sprint R2.2: Generate proactive verdict after onboarding
  useEffect(() => {
    async function generateVerdict() {
      if (!fromOnboarding || !activeBrand?.id || verdictGeneratedRef.current || isGeneratingVerdict) {
        return;
      }

      verdictGeneratedRef.current = true;
      setIsGeneratingVerdict(true);

      try {
        const newConversationId = await createConversation(
          `Veredito - ${activeBrand.name}`,
          activeBrand.id
        );
        router.replace(`/chat?id=${newConversationId}`);

        const verdictHeaders = await getAuthHeaders();
        const response = await fetch('/api/chat/verdict', {
          method: 'POST',
          headers: verdictHeaders,
          body: JSON.stringify({
            conversationId: newConversationId,
            brandId: activeBrand.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao gerar veredito');
        }
      } catch (error) {
        console.error('[Chat] Error generating verdict:', error);
        toast.error('Erro ao gerar veredito. Tente novamente.');
        verdictGeneratedRef.current = false;
      } finally {
        setIsGeneratingVerdict(false);
      }
    }

    generateVerdict();
  }, [fromOnboarding, activeBrand?.id, activeBrand?.name, createConversation, router, isGeneratingVerdict]);

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
    // Sprint 05.1: Map UI modes to API modes
    const apiMode =
      chatMode === 'campaign' ? 'campaign' :
      chatMode === 'party' ? 'party' :
      'general';

    if (!conversationId) {
      const newId = await createConversation('Nova conversa', activeBrand?.id);
      let url = `/chat?id=${newId}`;
      if (campaignId) url += `&campaignId=${campaignId}`;

      router.push(url);
      await sendMessage(message, apiMode as any, funnelId || undefined, partyOptions, campaignId || undefined, newId, activeBrand?.id);
      return;
    }
    await sendMessage(message, apiMode as any, funnelId || undefined, partyOptions, campaignId || undefined, undefined, activeBrand?.id);
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Compact Bloomberg header for chat */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-white/[0.06]">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-black text-[#F5E8CE] tracking-tight">{modeConfig.title}</h1>
          <span className="text-[10px] font-mono text-[#6B5D4A] tracking-wider">{modeConfig.subtitle}</span>
        </div>
        <ActiveContextIndicator brandId={activeBrand?.id} />
      </div>

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
                  onFollowUpSelect={handleSend}
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
