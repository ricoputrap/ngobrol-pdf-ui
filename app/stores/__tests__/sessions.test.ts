import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useSessionsStore } from "../sessions";
import type {
  Session,
  GetSessionsResponse,
  CreateSessionResponse,
  GetSessionResponse,
} from "../../modules/sessions/types";

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

describe("useSessionsStore", () => {
  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("initializes with empty state", () => {
      const store = useSessionsStore();

      expect(store.sessions).toEqual([]);
      expect(store.currentSession).toBeNull();
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  describe("getters", () => {
    it("getSessionById returns session when it exists", () => {
      const store = useSessionsStore();
      const mockSession: Session = {
        id: "sess-1",
        title: "Session 1",
        pdf_file_name: "doc1.pdf",
        created_at: "2025-12-27T12:00:00.000Z",
        updated_at: "2025-12-27T12:00:00.000Z",
      };

      store.sessions = [mockSession];

      expect(store.getSessionById("sess-1")).toEqual(mockSession);
    });

    it("getSessionById returns undefined when session does not exist", () => {
      const store = useSessionsStore();

      expect(store.getSessionById("non-existent")).toBeUndefined();
    });

    it("hasSessions returns true when sessions exist", () => {
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

      expect(store.hasSessions).toBe(true);
    });

    it("hasSessions returns false when no sessions exist", () => {
      const store = useSessionsStore();

      expect(store.hasSessions).toBe(false);
    });

    it("sessionsCount returns correct count", () => {
      const store = useSessionsStore();
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

      expect(store.sessionsCount).toBe(2);
    });
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

      const store = useSessionsStore();
      const result = await store.fetchSessions();

      expect(mockFetch).toHaveBeenCalledWith("/api/sessions");
      expect(result).toEqual(mockSessions);
      expect(store.sessions).toEqual(mockSessions);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });

    it("sets loading state during fetch", async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ sessions: [] }), 100),
          ),
      );

      const store = useSessionsStore();
      const promise = store.fetchSessions();

      expect(store.isLoading).toBe(true);

      await promise;

      expect(store.isLoading).toBe(false);
    });

    it("handles fetch sessions error", async () => {
      const errorMessage = "Network error";
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const store = useSessionsStore();

      await expect(store.fetchSessions()).rejects.toThrow(errorMessage);

      expect(store.error).toBe(errorMessage);
      expect(store.isLoading).toBe(false);
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

      const store = useSessionsStore();
      const result = await store.createSession({ title: "New Session" });

      expect(mockFetch).toHaveBeenCalledWith("/api/sessions", {
        method: "POST",
        body: { title: "New Session" },
      });
      expect(result).toEqual(newSession);
      expect(store.sessions[0]).toEqual(newSession);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
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

      const store = useSessionsStore();
      const result = await store.createSession();

      expect(mockFetch).toHaveBeenCalledWith("/api/sessions", {
        method: "POST",
        body: {},
      });
      expect(result).toEqual(newSession);
    });

    it("adds new session to beginning of array", async () => {
      const existingSession: Session = {
        id: "sess-1",
        title: "Existing",
        pdf_file_name: null,
        created_at: "2025-12-27T12:00:00.000Z",
        updated_at: "2025-12-27T12:00:00.000Z",
      };

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

      const store = useSessionsStore();
      store.sessions = [existingSession];

      await store.createSession({ title: "New Session" });

      expect(store.sessions[0]).toEqual(newSession);
      expect(store.sessions[1]).toEqual(existingSession);
    });

    it("handles create session error", async () => {
      const errorMessage = "Failed to create";
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const store = useSessionsStore();

      await expect(store.createSession({ title: "Test" })).rejects.toThrow(
        errorMessage,
      );

      expect(store.error).toBe(errorMessage);
      expect(store.isLoading).toBe(false);
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

      const store = useSessionsStore();
      const result = await store.fetchSession("sess-1");

      expect(mockFetch).toHaveBeenCalledWith("/api/sessions/sess-1");
      expect(result).toEqual(mockResponse);
      expect(store.currentSession).toEqual(mockResponse);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });

    it("handles fetch session error", async () => {
      const errorMessage = "Session not found";
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const store = useSessionsStore();

      await expect(store.fetchSession("non-existent")).rejects.toThrow(
        errorMessage,
      );

      expect(store.error).toBe(errorMessage);
      expect(store.isLoading).toBe(false);
    });
  });

  describe("deleteSession", () => {
    it("deletes a session successfully", async () => {
      mockFetch.mockResolvedValueOnce(null);

      const store = useSessionsStore();
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

      const result = await store.deleteSession("sess-1");

      expect(mockFetch).toHaveBeenCalledWith("/api/sessions/sess-1", {
        method: "DELETE",
      });
      expect(result).toBe(true);
      expect(store.sessions.length).toBe(1);
      expect(store.sessions[0].id).toBe("sess-2");
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });

    it("clears current session if it matches deleted session", async () => {
      mockFetch.mockResolvedValueOnce(null);

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

      await store.deleteSession("sess-1");

      expect(store.currentSession).toBeNull();
    });

    it("does not clear current session if it does not match deleted session", async () => {
      mockFetch.mockResolvedValueOnce(null);

      const store = useSessionsStore();
      const currentSessionData = {
        session: {
          id: "sess-2",
          title: "Session 2",
          pdf_file_name: null,
          created_at: "2025-12-27T12:00:00.000Z",
          updated_at: "2025-12-27T12:00:00.000Z",
        },
        messages: [],
      };
      store.currentSession = currentSessionData;

      await store.deleteSession("sess-1");

      expect(store.currentSession).toEqual(currentSessionData);
    });

    it("handles delete session error", async () => {
      const errorMessage = "Failed to delete";
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const store = useSessionsStore();

      await expect(store.deleteSession("sess-1")).rejects.toThrow(errorMessage);

      expect(store.error).toBe(errorMessage);
      expect(store.isLoading).toBe(false);
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

      const store = useSessionsStore();
      const result = await store.uploadPdf("sess-1", mockFile);

      expect(mockFetch).toHaveBeenCalledWith("/api/sessions/sess-1/upload", {
        method: "POST",
        body: expect.any(FormData),
      });
      expect(result.success).toBe(true);
      expect(result.file_name).toBe("document.pdf");
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });

    it("updates session pdf_file_name in local array", async () => {
      const mockFile = new File(["content"], "document.pdf", {
        type: "application/pdf",
      });

      mockFetch.mockResolvedValueOnce({
        success: true,
        file_name: "document.pdf",
      });

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

      await store.uploadPdf("sess-1", mockFile);

      const session = store.sessions[0];
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

      await store.uploadPdf("sess-1", mockFile);

      expect(store.currentSession?.session.pdf_file_name).toBe("document.pdf");
    });

    it("does not update current session if it does not match", async () => {
      const mockFile = new File(["content"], "document.pdf", {
        type: "application/pdf",
      });

      mockFetch.mockResolvedValueOnce({
        success: true,
        file_name: "document.pdf",
      });

      const store = useSessionsStore();
      store.currentSession = {
        session: {
          id: "sess-2",
          title: "Session 2",
          pdf_file_name: null,
          created_at: "2025-12-27T12:00:00.000Z",
          updated_at: "2025-12-27T12:00:00.000Z",
        },
        messages: [],
      };

      await store.uploadPdf("sess-1", mockFile);

      expect(store.currentSession.session.pdf_file_name).toBeNull();
    });

    it("handles upload PDF error", async () => {
      const mockFile = new File(["content"], "document.pdf", {
        type: "application/pdf",
      });
      const errorMessage = "Upload failed";
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const store = useSessionsStore();

      await expect(store.uploadPdf("sess-1", mockFile)).rejects.toThrow(
        errorMessage,
      );

      expect(store.error).toBe(errorMessage);
      expect(store.isLoading).toBe(false);
    });
  });

  describe("utility actions", () => {
    it("clears error", () => {
      const store = useSessionsStore();
      store.error = "Some error";

      store.clearError();

      expect(store.error).toBeNull();
    });

    it("clears current session", () => {
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

      store.clearCurrentSession();

      expect(store.currentSession).toBeNull();
    });

    it("resets store to initial state", () => {
      const store = useSessionsStore();

      // Populate store with data
      store.sessions = [
        {
          id: "sess-1",
          title: "Session 1",
          pdf_file_name: null,
          created_at: "2025-12-27T12:00:00.000Z",
          updated_at: "2025-12-27T12:00:00.000Z",
        },
      ];
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
      store.isLoading = true;
      store.error = "Some error";

      // Reset
      store.$reset();

      // Verify reset
      expect(store.sessions).toEqual([]);
      expect(store.currentSession).toBeNull();
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });
  });
});
