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
      // Each call corresponds to one completed assistant exchange. Track the
      // count here so the running average is correct regardless of how the
      // message list is managed (ChatInterface holds messages in local state).
      const newCount = state.stats.totalMessages + 1
      const newTotalTokens = state.stats.totalTokens + tokens
      const newAvgLatency =
        (state.stats.averageLatency * (newCount - 1) + latency) / newCount

      return {
        stats: {
          ...state.stats,
          totalMessages: newCount,
          totalTokens: newTotalTokens,
          averageLatency: newAvgLatency,
        },
      }
    }),

  setCurrentContext: (context) => set({ currentContext: context }),
  
  setCurrentSearchResults: (results) => set({ currentSearchResults: results }),
}))
