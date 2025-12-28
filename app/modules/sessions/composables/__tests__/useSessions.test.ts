import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useSessions } from "../useSessions";
import { useSessionsStore } from "../../../../stores/sessions";
import type {
  Session,
  GetSessionsResponse,
  CreateSessionResponse,
  GetSessionResponse,
} from "../../types";

// Mock $fetch globally
const mockFetch = vi.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
globalThis.$fetch = mockFetch as any;

// Mock File for Node environment
if (typeof File === "undefined") {
  globalThis.File = class File {
    name: string;
    type: string;
    size: number;
    constructor(bits: any[], name: string, options?: { type?: string }) {
      this.name = name;
      this.type = options?.type || "";
      this.size = bits.reduce((acc, bit) => acc + (bit.length || 0), 0);
    }
  } as typeof File;
}

// Mock computed from Vue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).computed = vi.fn((getter: () => unknown) => {
  return {
    get value() {
      return getter();
    },
  };
});

describe("useSessions composable", () => {
  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("exposes store state as computed properties", () => {
    const { sessions, currentSession, isLoading, error } = useSessions();

    expect(sessions.value).toEqual([]);
    expect(currentSession.value).toBeNull();
    expect(isLoading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it("exposes store getters", () => {
    const { hasSessions, sessionsCount, getSessionById } = useSessions();
    const store = useSessionsStore();

    store.sessions = [
      {
        id: "sess-1",
        title: "Session 1",
        pdf_file_name: null,
        created_at: "2025-12-27T12:00:00.000Z",
        updated_at: "2025-12-27T12:00:00.000Z",
      },
    ];

    expect(hasSessions.value).toBe(true);
    expect(sessionsCount.value).toBe(1);
    expect(getSessionById("sess-1")).toEqual(store.sessions[0]);
  });

  describe("fetchSessions", () => {
    it("fetches all sessions successfully", async () => {
      const mockSessions: Session[] = [
        {
          id: "sess-1",
          title: "Session 1",
          pdf_file_name: "doc1.pdf",
          created_at: "2025-12-27T12:00:00.000Z",
          updated_at: "2025-12-27T12:00:00.000Z",
        },
        {
          id: "sess-2",
          title: "Session 2",
          pdf_file_name: null,
          created_at: "2025-12-27T12:00:00.000Z",
          updated_at: "2025-12-27T12:00:00.000Z",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        sessions: mockSessions,
      } as GetSessionsResponse);

      const { fetchSessions, sessions } = useSessions();
      const result = await fetchSessions();

      expect(mockFetch).toHaveBeenCalledWith("/api/sessions");
      expect(result).toEqual(mockSessions);
      expect(sessions.value).toEqual(mockSessions);
    });

    it("handles fetch sessions error", async () => {
      const errorMessage = "Network error";
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const { fetchSessions, error } = useSessions();

      await expect(fetchSessions()).rejects.toThrow(errorMessage);
      expect(error.value).toBe(errorMessage);
    });
  });

  describe("createSession", () => {
    it("creates a new session successfully", async () => {
      const newSession: Session = {
        id: "sess-new",
        title: "New Session",
        pdf_file_name: null,
        created_at: "2025-12-27T12:00:00.000Z",
        updated_at: "2025-12-27T12:00:00.000Z",
      };

      mockFetch.mockResolvedValueOnce({
        session: newSession,
      } as CreateSessionResponse);

      const { createSession, sessions } = useSessions();
      const result = await createSession({ title: "New Session" });

      expect(mockFetch).toHaveBeenCalledWith("/api/sessions", {
        method: "POST",
        body: { title: "New Session" },
      });
      expect(result).toEqual(newSession);
      expect(sessions.value[0]).toEqual(newSession);
    });

    it("creates session without title", async () => {
      const newSession: Session = {
        id: "sess-new",
        title: "Untitled Session",
        pdf_file_name: null,
        created_at: "2025-12-27T12:00:00.000Z",
        updated_at: "2025-12-27T12:00:00.000Z",
      };

      mockFetch.mockResolvedValueOnce({
        session: newSession,
      } as CreateSessionResponse);

      const { createSession } = useSessions();
      const result = await createSession();

      expect(mockFetch).toHaveBeenCalledWith("/api/sessions", {
        method: "POST",
        body: {},
      });
      expect(result).toEqual(newSession);
    });

    it("handles create session error", async () => {
      const errorMessage = "Failed to create";
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const { createSession, error } = useSessions();

      await expect(createSession({ title: "Test" })).rejects.toThrow(
        errorMessage,
      );
      expect(error.value).toBe(errorMessage);
    });
  });

  describe("fetchSession", () => {
    it("fetches a single session with messages successfully", async () => {
      const mockResponse: GetSessionResponse = {
        session: {
          id: "sess-1",
          title: "Session 1",
          pdf_file_name: "doc.pdf",
          created_at: "2025-12-27T12:00:00.000Z",
          updated_at: "2025-12-27T12:00:00.000Z",
        },
        messages: [
          {
            id: "msg-1",
            session_id: "sess-1",
            role: "user",
            content: "Hello",
            timestamp: "2025-12-27T12:00:00.000Z",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const { fetchSession, currentSession } = useSessions();
      const result = await fetchSession("sess-1");

      expect(mockFetch).toHaveBeenCalledWith("/api/sessions/sess-1");
      expect(result).toEqual(mockResponse);
      expect(currentSession.value).toEqual(mockResponse);
    });

    it("handles fetch session error", async () => {
      const errorMessage = "Session not found";
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const { fetchSession, error } = useSessions();

      await expect(fetchSession("non-existent")).rejects.toThrow(errorMessage);
      expect(error.value).toBe(errorMessage);
    });
  });

  describe("deleteSession", () => {
    it("deletes a session successfully", async () => {
      mockFetch.mockResolvedValueOnce(null);

      const { deleteSession, sessions } = useSessions();
      const store = useSessionsStore();

      // Pre-populate sessions
      store.sessions = [
        {
          id: "sess-1",
          title: "Session 1",
          pdf_file_name: null,
          created_at: "2025-12-27T12:00:00.000Z",
          updated_at: "2025-12-27T12:00:00.000Z",
        },
        {
          id: "sess-2",
          title: "Session 2",
          pdf_file_name: null,
          created_at: "2025-12-27T12:00:00.000Z",
          updated_at: "2025-12-27T12:00:00.000Z",
        },
      ];

      const result = await deleteSession("sess-1");

      expect(mockFetch).toHaveBeenCalledWith("/api/sessions/sess-1", {
        method: "DELETE",
      });
      expect(result).toBe(true);
      expect(sessions.value.length).toBe(1);
      expect(sessions.value[0].id).toBe("sess-2");
    });

    it("clears current session if it matches deleted session", async () => {
      mockFetch.mockResolvedValueOnce(null);

      const { deleteSession, currentSession } = useSessions();
      const store = useSessionsStore();

      // Set current session
      store.currentSession = {
        session: {
          id: "sess-1",
          title: "Session 1",
          pdf_file_name: null,
          created_at: "2025-12-27T12:00:00.000Z",
          updated_at: "2025-12-27T12:00:00.000Z",
        },
        messages: [],
      };

      await deleteSession("sess-1");

      expect(currentSession.value).toBeNull();
    });

    it("handles delete session error", async () => {
      const errorMessage = "Failed to delete";
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const { deleteSession, error } = useSessions();

      await expect(deleteSession("sess-1")).rejects.toThrow(errorMessage);
      expect(error.value).toBe(errorMessage);
    });
  });

  describe("uploadPdf", () => {
    it("uploads PDF successfully", async () => {
      const mockFile = new File(["content"], "document.pdf", {
        type: "application/pdf",
      });

      mockFetch.mockResolvedValueOnce({
        success: true,
        file_name: "document.pdf",
      });

      const { uploadPdf } = useSessions();
      const result = await uploadPdf("sess-1", mockFile);

      expect(mockFetch).toHaveBeenCalledWith("/api/sessions/sess-1/upload", {
        method: "POST",
        body: expect.any(FormData),
      });
      expect(result.success).toBe(true);
      expect(result.file_name).toBe("document.pdf");
    });

    it("updates session pdf_file_name in local array", async () => {
      const mockFile = new File(["content"], "document.pdf", {
        type: "application/pdf",
      });

      mockFetch.mockResolvedValueOnce({
        success: true,
        file_name: "document.pdf",
      });

      const { uploadPdf, sessions } = useSessions();
      const store = useSessionsStore();

      // Pre-populate sessions
      store.sessions = [
        {
          id: "sess-1",
          title: "Session 1",
          pdf_file_name: null,
          created_at: "2025-12-27T12:00:00.000Z",
          updated_at: "2025-12-27T12:00:00.000Z",
        },
      ];

      await uploadPdf("sess-1", mockFile);

      const session = sessions.value[0];
      expect(session?.pdf_file_name).toBe("document.pdf");
    });

    it("updates current session pdf_file_name if it matches", async () => {
      const mockFile = new File(["content"], "document.pdf", {
        type: "application/pdf",
      });

      mockFetch.mockResolvedValueOnce({
        success: true,
        file_name: "document.pdf",
      });

      const { uploadPdf, currentSession } = useSessions();
      const store = useSessionsStore();

      // Set current session
      store.currentSession = {
        session: {
          id: "sess-1",
          title: "Session 1",
          pdf_file_name: null,
          created_at: "2025-12-27T12:00:00.000Z",
          updated_at: "2025-12-27T12:00:00.000Z",
        },
        messages: [],
      };

      await uploadPdf("sess-1", mockFile);

      expect(currentSession.value?.session.pdf_file_name).toBe("document.pdf");
    });

    it("handles upload PDF error", async () => {
      const mockFile = new File(["content"], "document.pdf", {
        type: "application/pdf",
      });
      const errorMessage = "Upload failed";
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const { uploadPdf, error } = useSessions();

      await expect(uploadPdf("sess-1", mockFile)).rejects.toThrow(errorMessage);
      expect(error.value).toBe(errorMessage);
    });
  });

  describe("utility methods", () => {
    it("clears error", () => {
      const { error, clearError } = useSessions();
      const store = useSessionsStore();
      store.error = "Some error";

      clearError();

      expect(error.value).toBeNull();
    });

    it("clears current session", () => {
      const { currentSession, clearCurrentSession } = useSessions();
      const store = useSessionsStore();
      store.currentSession = {
        session: {
          id: "sess-1",
          title: "Session 1",
          pdf_file_name: null,
          created_at: "2025-12-27T12:00:00.000Z",
          updated_at: "2025-12-27T12:00:00.000Z",
        },
        messages: [],
      };

      clearCurrentSession();

      expect(currentSession.value).toBeNull();
    });
  });

  describe("loading state", () => {
    it("sets loading state during fetch operations", async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ sessions: [] }), 100),
          ),
      );

      const { fetchSessions, isLoading } = useSessions();

      const promise = fetchSessions();
      expect(isLoading.value).toBe(true);

      await promise;
      expect(isLoading.value).toBe(false);
    });
  });
});
