import { create } from 'zustand'
import type { Message, ChatStats, RAGResult, SearchResult } from '../types'

interface ChatStore {
  messages: Message[]
  isStreaming: boolean
  stats: ChatStats
  currentContext: RAGResult[]
  currentSearchResults: SearchResult[]
  addMessage: (message: Message) => void
  updateMessage: (id: string, content: Partial<Message>) => void
  clearMessages: () => void
  setStreaming: (streaming: boolean) => void
  updateStats: (tokens: number, latency: number) => void
  setCurrentContext: (context: RAGResult[]) => void
  setCurrentSearchResults: (results: SearchResult[]) => void
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isStreaming: false,
  currentContext: [],
  currentSearchResults: [],
  stats: {
    totalTokens: 0,
    totalMessages: 0,
    averageLatency: 0,
    estimatedCost: 0,
    sessionStart: new Date(),
  },

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
      stats: {
        ...state.stats,
        totalMessages: state.stats.totalMessages + 1,
      },
    })),

  updateMessage: (id, content) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...content } : msg
      ),
    })),

  clearMessages: () =>
    set({
      messages: [],
      stats: {
        totalTokens: 0,
        totalMessages: 0,
        averageLatency: 0,
        estimatedCost: 0,
        sessionStart: new Date(),
      },
    }),

  setStreaming: (streaming) => set({ isStreaming: streaming }),

  updateStats: (tokens, latency) =>
    set((state) => {
      const newTotalTokens = state.stats.totalTokens + tokens
      const messageCount = state.stats.totalMessages
      const newAvgLatency =
        (state.stats.averageLatency * (messageCount - 1) + latency) / messageCount

      return {
        stats: {
          ...state.stats,
          totalTokens: newTotalTokens,
          averageLatency: newAvgLatency,
        },
      }
    }),

  setCurrentContext: (context) => set({ currentContext: context }),
  
  setCurrentSearchResults: (results) => set({ currentSearchResults: results }),
}))
