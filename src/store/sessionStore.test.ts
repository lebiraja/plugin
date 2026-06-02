import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the API module before importing the store.
vi.mock("../api/sessions", () => ({
  sessionApi: {
    listSessions: vi.fn(),
    createSession: vi.fn(),
    getSession: vi.fn(),
    deleteSession: vi.fn(),
    renameSession: vi.fn(),
  },
}));

import { useSessionStore } from "./sessionStore";
import { sessionApi } from "../api/sessions";

const reset = () =>
  useSessionStore.setState({
    sessions: [],
    currentSessionId: null,
    currentSession: null,
    error: null,
  });

describe("sessionStore", () => {
  beforeEach(() => {
    reset();
    vi.clearAllMocks();
  });

  it("fetchSessions populates the list", async () => {
    (sessionApi.listSessions as ReturnType<typeof vi.fn>).mockResolvedValue({
      sessions: [{ session_id: "s1", title: "One" }],
      total: 1,
    });
    await useSessionStore.getState().fetchSessions();
    expect(useSessionStore.getState().sessions).toHaveLength(1);
  });

  it("createSession returns the new id and refreshes", async () => {
    (sessionApi.createSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      session_id: "new-id",
      title: "New Chat",
    });
    (sessionApi.listSessions as ReturnType<typeof vi.fn>).mockResolvedValue({
      sessions: [],
      total: 0,
    });
    const id = await useSessionStore.getState().createSession("ollama", "m");
    expect(id).toBe("new-id");
  });

  it("deleteSession removes it from the list and clears current", async () => {
    useSessionStore.setState({
      sessions: [{ session_id: "s1" } as never],
      currentSessionId: "s1",
    });
    (sessionApi.deleteSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
    });
    await useSessionStore.getState().deleteSession("s1");
    expect(useSessionStore.getState().sessions).toHaveLength(0);
    expect(useSessionStore.getState().currentSessionId).toBeNull();
  });

  it("renameSession updates the title in place", async () => {
    useSessionStore.setState({
      sessions: [{ session_id: "s1", title: "Old" } as never],
    });
    (sessionApi.renameSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      title: "New",
    });
    await useSessionStore.getState().renameSession("s1", "New");
    expect(useSessionStore.getState().sessions[0].title).toBe("New");
  });
});
