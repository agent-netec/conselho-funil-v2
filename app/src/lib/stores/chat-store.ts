import { create } from 'zustand';

type ChatMode = 'general' | 'funnel_creation' | 'funnel_evaluation' | 'funnel_review' | 'copy' | 'social' | 'ads' | 'design' | 'party';

interface ChatUIState {
  isSidebarOpen: boolean;
  inputMode: ChatMode;
  isStreaming: boolean;
  isLoading: boolean;
  activeConversationId: string | null;
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  setInputMode: (mode: ChatMode) => void;
  setStreaming: (streaming: boolean) => void;
  setLoading: (loading: boolean) => void;
  setActiveConversationId: (id: string | null) => void;
}

export const useChatStore = create<ChatUIState>((set) => ({
  isSidebarOpen: true,
  inputMode: 'general',
  isStreaming: false,
  isLoading: false,
  activeConversationId: null,
  
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setInputMode: (mode) => set({ inputMode: mode }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  setLoading: (loading) => set({ isLoading: loading }),
  setActiveConversationId: (id) => set({ activeConversationId: id }),
}));
