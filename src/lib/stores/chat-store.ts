import { create } from 'zustand';
import type { Message, Conversation } from '@/types';

interface ChatState {
  // State
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  isStreaming: boolean;
  
  // Actions
  createConversation: () => void;
  selectConversation: (id: string) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateLastMessage: (content: string) => void;
  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  clearCurrentConversation: () => void;
}

// Generate simple ID
const generateId = () => Math.random().toString(36).substring(2, 15);

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  conversations: [],
  currentConversation: null,
  isLoading: false,
  isStreaming: false,
  
  // Create new conversation
  createConversation: () => {
    const newConversation: Conversation = {
      id: generateId(),
      title: 'Nova Conversa',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    set((state) => ({
      conversations: [newConversation, ...state.conversations],
      currentConversation: newConversation,
    }));
  },
  
  // Select existing conversation
  selectConversation: (id: string) => {
    const conversation = get().conversations.find((c) => c.id === id);
    if (conversation) {
      set({ currentConversation: conversation });
    }
  },
  
  // Add message to current conversation
  addMessage: (message) => {
    const newMessage: Message = {
      ...message,
      id: generateId(),
      timestamp: new Date(),
    };
    
    set((state) => {
      if (!state.currentConversation) return state;
      
      const updatedConversation: Conversation = {
        ...state.currentConversation,
        messages: [...state.currentConversation.messages, newMessage],
        updatedAt: new Date(),
        // Update title from first user message
        title: state.currentConversation.messages.length === 0 && message.role === 'user'
          ? message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
          : state.currentConversation.title,
      };
      
      return {
        currentConversation: updatedConversation,
        conversations: state.conversations.map((c) =>
          c.id === updatedConversation.id ? updatedConversation : c
        ),
      };
    });
  },
  
  // Update last message (for streaming)
  updateLastMessage: (content: string) => {
    set((state) => {
      if (!state.currentConversation) return state;
      
      const messages = [...state.currentConversation.messages];
      if (messages.length === 0) return state;
      
      messages[messages.length - 1] = {
        ...messages[messages.length - 1],
        content,
      };
      
      const updatedConversation: Conversation = {
        ...state.currentConversation,
        messages,
        updatedAt: new Date(),
      };
      
      return {
        currentConversation: updatedConversation,
        conversations: state.conversations.map((c) =>
          c.id === updatedConversation.id ? updatedConversation : c
        ),
      };
    });
  },
  
  // Set loading state
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  
  // Set streaming state
  setStreaming: (streaming: boolean) => set({ isStreaming: streaming }),
  
  // Clear current conversation
  clearCurrentConversation: () => set({ currentConversation: null }),
}));


