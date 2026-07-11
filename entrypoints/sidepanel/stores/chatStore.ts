import { create } from 'zustand';
import type { ChatMessage, PageInfo } from '../../../shared/types';

interface ChatState {
  messages: ChatMessage[];
  isAnalyzing: boolean;
  error: string | null;
  pageInfo: PageInfo | null;

  addMessage: (msg: ChatMessage) => void;
  updateLastMessage: (content: string) => void;
  setAnalyzing: (v: boolean) => void;
  setError: (e: string | null) => void;
  setPageInfo: (info: PageInfo) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isAnalyzing: false,
  error: null,
  pageInfo: null,

  addMessage: (msg) => set((s) => ({
    messages: [...s.messages, msg],
    error: null,
  })),

  updateLastMessage: (content) => set((s) => {
    const msgs = [...s.messages];
    const last = msgs[msgs.length - 1];
    if (last && last.role === 'assistant') {
      msgs[msgs.length - 1] = { ...last, content, isStreaming: false };
    }
    return { messages: msgs };
  }),

  setAnalyzing: (v) => set({ isAnalyzing: v }),
  setError: (e) => set({ error: e, isAnalyzing: false }),
  setPageInfo: (info) => set({ pageInfo: info }),
  clearMessages: () => set({ messages: [], error: null }),
}));
