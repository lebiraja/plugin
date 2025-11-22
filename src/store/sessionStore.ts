import { create } from "zustand";
import { persist } from "zustand/middleware";
import { sessionApi, Session, SessionDetail } from "../api/sessions";

interface SessionStore {
  sessions: Session[];
  currentSessionId: string | null;
  currentSession: SessionDetail | null;
  isLoadingSession: boolean;
  isLoadingSessions: boolean;
  error: string | null;

  // Actions
  fetchSessions: () => Promise<void>;
  createSession: (
    backend: string,
    model: string,
    config?: any
  ) => Promise<string>;
  loadSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, title: string) => Promise<void>;
  setCurrentSessionId: (sessionId: string | null) => void;
  clearCurrentSession: () => void;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      currentSession: null,
      isLoadingSession: false,
      isLoadingSessions: false,
      error: null,

      fetchSessions: async () => {
        set({ isLoadingSessions: true, error: null });
        try {
          const result = await sessionApi.listSessions(0, 100);
          set({ sessions: result.sessions, isLoadingSessions: false });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to fetch sessions";
          set({ error: errorMessage, isLoadingSessions: false });
        }
      },

      createSession: async (backend: string, model: string, config?: any) => {
        set({ error: null });
        try {
          const result = await sessionApi.createSession({
            backend,
            model,
            config,
          });
          // Refresh sessions list
          await get().fetchSessions();
          return result.session_id;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to create session";
          set({ error: errorMessage });
          throw error;
        }
      },

      loadSession: async (sessionId: string) => {
        set({ isLoadingSession: true, error: null });
        try {
          const session = await sessionApi.getSession(sessionId);
          set({
            currentSession: session,
            currentSessionId: sessionId,
            isLoadingSession: false,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to load session";
          set({ error: errorMessage, isLoadingSession: false });
        }
      },

      deleteSession: async (sessionId: string) => {
        set({ error: null });
        try {
          await sessionApi.deleteSession(sessionId);
          // Remove from sessions list
          set((state) => ({
            sessions: state.sessions.filter((s) => s.session_id !== sessionId),
          }));
          // Clear current session if it was deleted
          if (get().currentSessionId === sessionId) {
            set({ currentSession: null, currentSessionId: null });
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to delete session";
          set({ error: errorMessage });
          throw error;
        }
      },

      renameSession: async (sessionId: string, title: string) => {
        set({ error: null });
        try {
          await sessionApi.renameSession(sessionId, title);
          // Update sessions list
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.session_id === sessionId ? { ...s, title } : s
            ),
          }));
          // Update current session if it's the one being renamed
          if (get().currentSession?.session_id === sessionId) {
            set((state) => ({
              currentSession: state.currentSession
                ? { ...state.currentSession, title }
                : null,
            }));
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to rename session";
          set({ error: errorMessage });
          throw error;
        }
      },

      setCurrentSessionId: (sessionId: string | null) => {
        set({ currentSessionId: sessionId });
      },

      clearCurrentSession: () => {
        set({ currentSession: null, currentSessionId: null });
      },
    }),
    {
      name: "session-storage",
      partialize: (state) => ({
        currentSessionId: state.currentSessionId,
      }),
    }
  )
);
