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
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Subscribe to real-time messages
    const unsubscribe = subscribeToMessages(conversationId, (newMessages) => {
      setMessages(newMessages);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [conversationId]);

  const sendMessage = async (
    content: string, 
    mode: 'general' | 'funnel_creation' | 'funnel_evaluation' | 'copy' | 'social' | 'funnel_review' | 'ads' | 'design' | 'party' = 'general',
    funnelId?: string,
    partyOptions?: { selectedAgents?: string[], intensity?: 'debate' | 'consensus' },
    campaignId?: string
  ) => {
    if (!conversationId) return;

    setIsSending(true);
    setError(null);

    try {
      // Add user message to Firestore
      await addMessage(conversationId, {
        role: 'user',
        content,
      });

      // Call the chat API to get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          conversationId,
          mode,
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
          const insufficientCreditsMsg = '❌ **Saldo de créditos insuficiente.**\n\nSeu saldo de créditos acabou. Faça upgrade para continuar consultando o conselho.';
          
          await addMessage(conversationId, {
            role: 'assistant',
            content: insufficientCreditsMsg,
          });
          
          throw new Error('Saldo de créditos insuficiente');
        }

        throw new Error(errorData.error || 'Failed to get response');
      }

      // The response is automatically added to Firestore by the API
      // and will be picked up by the real-time subscription
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Erro ao enviar mensagem');
      
      // Add error message to show user
      await addMessage(conversationId, {
        role: 'assistant',
        content: `⚠️ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.\n\n*Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}*`,
      });
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
