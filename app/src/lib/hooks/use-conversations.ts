'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  getUserConversations,
  createConversation,
  getConversationMessages,
  addMessage,
  deleteConversation,
  subscribeToMessages,
} from '@/lib/firebase/firestore';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import type { Conversation, Message } from '@/types/database';

export function useConversations() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getUserConversations(user.uid);
      setConversations(data);
      setError(null);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Erro ao carregar conversas');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const create = async (title: string = 'Nova conversa', brandId?: string) => {
    if (!user) throw new Error('User not authenticated');

    const conversationId = await createConversation({
      userId: user.uid,
      title,
      context: { mode: 'general' },
      brandId, // Vincula à marca se fornecido
    });

    await loadConversations();
    return conversationId;
  };

  const remove = async (conversationId: string) => {
    await deleteConversation(conversationId);
    await loadConversations();
  };

  return {
    conversations,
    isLoading,
    error,
    create,
    remove,
    refresh: loadConversations,
  };
}

export function useConversation(conversationId: string | null) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId || !user?.uid) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Guard with user.uid to avoid auth race condition that permanently kills the listener
    const unsubscribe = subscribeToMessages(conversationId, (newMessages) => {
      setMessages(newMessages);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [conversationId, user?.uid]);

  const sendMessage = async (
    content: string,
    mode: 'general' | 'funnel_creation' | 'funnel_evaluation' | 'copy' | 'social' | 'funnel_review' | 'ads' | 'design' | 'party' = 'general',
    funnelId?: string,
    partyOptions?: { selectedAgents?: string[], intensity?: 'debate' | 'consensus' },
    campaignId?: string,
    overrideConversationId?: string,
    activeBrandId?: string
  ) => {
    const activeConversationId = overrideConversationId || conversationId;
    if (!activeConversationId) return;

    setIsSending(true);
    setError(null);

    try {
      // Add user message to Firestore
      await addMessage(activeConversationId, {
        role: 'user',
        content,
      });

      // Call the chat API to get AI response
      const headers = await getAuthHeaders();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: content,
          conversationId: activeConversationId,
          mode,
          ...(activeBrandId ? { brandId: activeBrandId } : {}),
          ...(funnelId ? { funnelId } : {}),
          ...(campaignId ? { campaignId } : {}), // ST-11.15: Contexto da Linha de Ouro
          ...(partyOptions ? {
            selectedAgents: partyOptions.selectedAgents,
            intensity: partyOptions.intensity
          } : {}),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // US-16.1: Tratar erro de créditos insuficientes
        if (response.status === 403 && errorData.error === 'insufficient_credits') {
          const insufficientCreditsMsg = '❌ **Saldo de créditos insuficiente.**\n\nSeu saldo de créditos acabou. Faça upgrade para continuar consultando o MKTHONEY.';
          
          await addMessage(activeConversationId, {
            role: 'assistant',
            content: insufficientCreditsMsg,
          });

          throw new Error('Saldo de créditos insuficiente');
        }

        throw new Error(errorData.error || 'Failed to get response');
      }

      // Optimistic update: inject AI response into local state immediately
      // so user doesn't wait for the Firestore listener round-trip
      const data = await response.json();
      const aiContent = data?.data?.response;
      if (aiContent) {
        setMessages(prev => {
          // Avoid duplicate if listener already delivered it
          if (prev.some(m => m.role === 'assistant' && m.content === aiContent)) return prev;
          return [...prev, {
            id: `optimistic-${Date.now()}`,
            role: 'assistant',
            content: aiContent,
            timestamp: { toDate: () => new Date() } as any,
          } as Message];
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Erro ao enviar mensagem');

      // ERR-4: Separate try/catch for error message persistence
      try {
        await addMessage(activeConversationId, {
          role: 'assistant',
          content: `⚠️ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.\n\n*Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}*`,
        });
      } catch (addErr) {
        console.error('Error persisting error message:', addErr);
      }
    } finally {
      setIsSending(false);
    }
  };

  return {
    messages,
    isLoading,
    isSending,
    error,
    sendMessage,
  };
}
