import { create } from "zustand";
import { ResearchResult, ResearchProgress, ResearchStage } from "../types";

interface DeepResearchState {
  // Current research state
  currentResearch: ResearchResult | null;
  progress: ResearchProgress;
  isResearching: boolean;
  error: string | null;

  // Research history
  researchHistory: ResearchResult[];

  // Actions
  setProgress: (progress: ResearchProgress) => void;
  setCurrentResearch: (research: ResearchResult | null) => void;
  setIsResearching: (isResearching: boolean) => void;
  setError: (error: string | null) => void;
  addToHistory: (research: ResearchResult) => void;
  clearCurrentResearch: () => void;
  clearHistory: () => void;

  // Stage updaters
  updateStage: (
    stage: ResearchStage,
    message: string,
    progress?: number
  ) => void;
}

export const useDeepResearchStore = create<DeepResearchState>((set) => ({
  // Initial state
  currentResearch: null,
  progress: {
    stage: "idle",
    progress: 0,
    message: "Ready to research",
  },
  isResearching: false,
  error: null,
  researchHistory: [],

  // Actions
  setProgress: (progress) => set({ progress }),

  setCurrentResearch: (research) => set({ currentResearch: research }),

  setIsResearching: (isResearching) => set({ isResearching }),

  setError: (error) => set({ error, isResearching: false }),

  addToHistory: (research) =>
    set((state) => ({
      researchHistory: [research, ...state.researchHistory].slice(0, 10), // Keep last 10
    })),

  clearCurrentResearch: () =>
    set({
      currentResearch: null,
      progress: {
        stage: "idle",
        progress: 0,
        message: "Ready to research",
      },
      error: null,
    }),

  clearHistory: () => set({ researchHistory: [] }),

  updateStage: (stage, message, progress) =>
    set((state) => ({
      progress: {
        stage,
        message,
        progress: progress ?? state.progress.progress,
      },
    })),
}));
