/**
 * useSidebarSessions Composable Tests
 *
 * Tests for the useSidebarSessions composable including:
 * - Session sorting (single source of truth)
 * - Search/filter capability
 * - Active session tracking
 * - Methods functionality
 * - Auto-refresh behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useSidebarSessions } from "../useSidebarSessions";

// Mock the sessions store
const mockFetchSessions = vi.fn();
const mockSessionsStore = {
  sessions: [
    {
      id: "sess-1",
      title: "Session 1",
      pdf_file_name: "doc1.pdf",
      created_at: "2025-12-27T10:00:00.000Z",
      updated_at: "2025-12-27T12:00:00.000Z",
    },
    {
      id: "sess-2",
      title: "Session 2",
      pdf_file_name: null,
      created_at: "2025-12-27T11:00:00.000Z",
      updated_at: "2025-12-27T13:00:00.000Z",
    },
    {
      id: "sess-3",
      title: "Old Session",
      pdf_file_name: "doc3.pdf",
      created_at: "2025-12-20T10:00:00.000Z",
      updated_at: "2025-12-20T10:00:00.000Z",
    },
  ],
  isLoading: false,
  fetchSessions: mockFetchSessions,
};

vi.mock("~/stores/sessions", () => ({
  useSessionsStore: vi.fn(() => mockSessionsStore),
}));

// Mock setInterval and clearInterval
const mockSetInterval = vi.fn();
const mockClearInterval = vi.fn();

vi.stubGlobal("setInterval", mockSetInterval);
vi.stubGlobal("clearInterval", mockClearInterval);

describe("useSidebarSessions", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Reset mock sessions to default
    mockSessionsStore.sessions = [
      {
        id: "sess-1",
        title: "Session 1",
        pdf_file_name: "doc1.pdf",
        created_at: "2025-12-27T10:00:00.000Z",
        updated_at: "2025-12-27T12:00:00.000Z",
      },
      {
        id: "sess-2",
        title: "Session 2",
        pdf_file_name: null,
        created_at: "2025-12-27T11:00:00.000Z",
        updated_at: "2025-12-27T13:00:00.000Z",
      },
      {
        id: "sess-3",
        title: "Old Session",
        pdf_file_name: "doc3.pdf",
        created_at: "2025-12-20T10:00:00.000Z",
        updated_at: "2025-12-20T10:00:00.000Z",
      },
    ];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Session Data Access", () => {
    it("provides access to sessions from store", () => {
      const { sessions } = useSidebarSessions();

      expect(sessions.value).toEqual(mockSessionsStore.sessions);
      expect(sessions.value.length).toBe(3);
    });

    it("provides access to isLoading from store", () => {
      const { isLoading } = useSidebarSessions();

      expect(isLoading.value).toBe(false);
    });

    it("calculates hasSessions correctly", () => {
      const { hasSessions } = useSidebarSessions();

      expect(hasSessions.value).toBe(true);
    });

    it("returns false for hasSessions when no sessions", () => {
      mockSessionsStore.sessions = [];

      const { hasSessions } = useSidebarSessions();

      expect(hasSessions.value).toBe(false);
    });
  });

  describe("Active Session Tracking", () => {
    it("initializes with null active session id", () => {
      const { activeSessionId } = useSidebarSessions();

      expect(activeSessionId.value).toBeNull();
    });

    it("allows setting active session", () => {
      const { activeSessionId, setActiveSession } = useSidebarSessions();

      setActiveSession("sess-1");

      expect(activeSessionId.value).toBe("sess-1");
    });

    it("allows clearing active session", () => {
      const { activeSessionId, setActiveSession } = useSidebarSessions();

      setActiveSession("sess-1");
      expect(activeSessionId.value).toBe("sess-1");

      setActiveSession(null);
      expect(activeSessionId.value).toBeNull();
    });

    it("computes activeSession correctly", () => {
      const { activeSession, setActiveSession } = useSidebarSessions();

      setActiveSession("sess-1");

      expect(activeSession.value).not.toBeNull();
      expect(activeSession.value?.id).toBe("sess-1");
    });

    it("returns null for activeSession when no active session", () => {
      const { activeSession } = useSidebarSessions();

      expect(activeSession.value).toBeNull();
    });

    it("returns null for activeSession when active session doesn't exist", () => {
      const { activeSession, setActiveSession } = useSidebarSessions();

      setActiveSession("non-existent-id");

      expect(activeSession.value).toBeNull();
    });
  });

  describe("Display Sessions (Sorting & Filtering)", () => {
    it("sorts sessions by updated_at descending (most recent first)", () => {
      const { displaySessions } = useSidebarSessions();

      expect(displaySessions.value[0].id).toBe("sess-2"); // Most recent
      expect(displaySessions.value[1].id).toBe("sess-1");
      expect(displaySessions.value[2].id).toBe("sess-3"); // Oldest
    });

    it("returns a new array (doesn't mutate original)", () => {
      const { sessions, displaySessions } = useSidebarSessions();

      expect(displaySessions.value).not.toBe(sessions.value);
      expect(displaySessions.value).toEqual(
        expect.arrayContaining(sessions.value),
      );
    });

    it("returns all sessions when search query is empty", () => {
      const { displaySessions, searchQuery } = useSidebarSessions();

      expect(searchQuery.value).toBe("");
      expect(displaySessions.value.length).toBe(3);
    });

    it("filters sessions by title", () => {
      mockSessionsStore.sessions = [
        {
          id: "sess-1",
          title: "React Tutorial",
          pdf_file_name: "react-guide.pdf",
          created_at: "2025-12-27T10:00:00.000Z",
          updated_at: "2025-12-27T12:00:00.000Z",
        },
        {
          id: "sess-2",
          title: "Vue Documentation",
          pdf_file_name: null,
          created_at: "2025-12-27T11:00:00.000Z",
          updated_at: "2025-12-27T13:00:00.000Z",
        },
        {
          id: "sess-3",
          title: "Angular Basics",
          pdf_file_name: "angular-notes.pdf",
          created_at: "2025-12-27T09:00:00.000Z",
          updated_at: "2025-12-27T11:00:00.000Z",
        },
      ];

      const { displaySessions, setSearchQuery } = useSidebarSessions();

      setSearchQuery("React");

      expect(displaySessions.value.length).toBe(1);
      expect(displaySessions.value[0].id).toBe("sess-1");
    });

    it("filters sessions case-insensitively", () => {
      mockSessionsStore.sessions = [
        {
          id: "sess-1",
          title: "React Tutorial",
          pdf_file_name: "react-guide.pdf",
          created_at: "2025-12-27T10:00:00.000Z",
          updated_at: "2025-12-27T12:00:00.000Z",
        },
      ];

      const { displaySessions, setSearchQuery } = useSidebarSessions();

      setSearchQuery("REACT");

      expect(displaySessions.value.length).toBe(1);
      expect(displaySessions.value[0].id).toBe("sess-1");
    });

    it("filters sessions by PDF filename", () => {
      mockSessionsStore.sessions = [
        {
          id: "sess-1",
          title: "React Tutorial",
          pdf_file_name: "react-guide.pdf",
          created_at: "2025-12-27T10:00:00.000Z",
          updated_at: "2025-12-27T12:00:00.000Z",
        },
        {
          id: "sess-3",
          title: "Angular Basics",
          pdf_file_name: "angular-notes.pdf",
          created_at: "2025-12-27T09:00:00.000Z",
          updated_at: "2025-12-27T11:00:00.000Z",
        },
      ];

      const { displaySessions, setSearchQuery } = useSidebarSessions();

      setSearchQuery("angular-notes");

      expect(displaySessions.value.length).toBe(1);
      expect(displaySessions.value[0].id).toBe("sess-3");
    });

    it("filters sessions by partial filename match", () => {
      mockSessionsStore.sessions = [
        {
          id: "sess-1",
          title: "React Tutorial",
          pdf_file_name: "react-guide.pdf",
          created_at: "2025-12-27T10:00:00.000Z",
          updated_at: "2025-12-27T12:00:00.000Z",
        },
        {
          id: "sess-3",
          title: "Angular Basics",
          pdf_file_name: "angular-notes.pdf",
          created_at: "2025-12-27T09:00:00.000Z",
          updated_at: "2025-12-27T11:00:00.000Z",
        },
      ];

      const { displaySessions, setSearchQuery } = useSidebarSessions();

      setSearchQuery("notes");

      expect(displaySessions.value.length).toBe(1);
      expect(displaySessions.value[0].id).toBe("sess-3");
    });

    it("returns empty array when no sessions match search", () => {
      const { displaySessions, setSearchQuery } = useSidebarSessions();

      setSearchQuery("NonExistent");

      expect(displaySessions.value.length).toBe(0);
    });

    it("handles sessions with null pdf_file_name in search", () => {
      mockSessionsStore.sessions = [
        {
          id: "sess-2",
          title: "Vue Documentation",
          pdf_file_name: null,
          created_at: "2025-12-27T11:00:00.000Z",
          updated_at: "2025-12-27T13:00:00.000Z",
        },
      ];

      const { displaySessions, setSearchQuery } = useSidebarSessions();

      setSearchQuery("Vue");

      expect(displaySessions.value.length).toBe(1);
      expect(displaySessions.value[0].id).toBe("sess-2");
    });

    it("clears search and shows all sessions", () => {
      mockSessionsStore.sessions = [
        {
          id: "sess-1",
          title: "React Tutorial",
          pdf_file_name: "react-guide.pdf",
          created_at: "2025-12-27T10:00:00.000Z",
          updated_at: "2025-12-27T12:00:00.000Z",
        },
        {
          id: "sess-2",
          title: "Vue Documentation",
          pdf_file_name: null,
          created_at: "2025-12-27T11:00:00.000Z",
          updated_at: "2025-12-27T13:00:00.000Z",
        },
      ];

      const { displaySessions, setSearchQuery, clearSearch } =
        useSidebarSessions();

      setSearchQuery("React");
      expect(displaySessions.value.length).toBe(1);

      clearSearch();
      expect(displaySessions.value.length).toBe(2);
    });
  });

  describe("Session Management", () => {
    it("refreshes sessions via store", async () => {
      mockFetchSessions.mockResolvedValue(undefined);

      const { refreshSessions } = useSidebarSessions();

      await refreshSessions();

      expect(mockFetchSessions).toHaveBeenCalledTimes(1);
    });

    it("handles refreshSessions errors gracefully", async () => {
      mockFetchSessions.mockRejectedValue(new Error("Network error"));

      const { refreshSessions } = useSidebarSessions();

      await refreshSessions(); // Should not throw

      expect(mockFetchSessions).toHaveBeenCalledTimes(1);
    });
  });

  describe("Search Query Management", () => {
    it("initializes with empty search query", () => {
      const { searchQuery } = useSidebarSessions();

      expect(searchQuery.value).toBe("");
    });

    it("sets search query", () => {
      const { searchQuery, setSearchQuery } = useSidebarSessions();

      setSearchQuery("test query");

      expect(searchQuery.value).toBe("test query");
    });

    it("stores exact value (trimming happens during filtering)", () => {
      const { searchQuery, setSearchQuery } = useSidebarSessions();

      setSearchQuery("  test  ");

      expect(searchQuery.value).toBe("  test  ");
    });
  });

  describe("Methods", () => {
    it("has refreshSessions method for manual refresh", () => {
      const { refreshSessions } = useSidebarSessions();

      expect(refreshSessions).toBeDefined();
      expect(typeof refreshSessions).toBe("function");
    });

    it("exposes setActiveSession method", () => {
      const { setActiveSession } = useSidebarSessions();

      expect(setActiveSession).toBeDefined();
      expect(typeof setActiveSession).toBe("function");
    });

    it("exposes clearSearch method", () => {
      const { clearSearch } = useSidebarSessions();

      expect(clearSearch).toBeDefined();
      expect(typeof clearSearch).toBe("function");
    });
  });

  describe("Return Object Structure", () => {
    it("returns all expected properties", () => {
      const result = useSidebarSessions();

      // Session data
      expect(result).toHaveProperty("sessions");
      expect(result).toHaveProperty("displaySessions");
      expect(result).toHaveProperty("activeSessionId");
      expect(result).toHaveProperty("isLoading");
      expect(result).toHaveProperty("hasSessions");

      // Search & Filters
      expect(result).toHaveProperty("searchQuery");
      expect(result).toHaveProperty("setSearchQuery");
      expect(result).toHaveProperty("clearSearch");

      // Session management
      expect(result).toHaveProperty("setActiveSession");
      expect(result).toHaveProperty("refreshSessions");

      // Computed helpers
      expect(result).toHaveProperty("activeSession");
    });

    it("does NOT expose internal sortedSessions or recentSessions", () => {
      const result = useSidebarSessions();

      // These should NOT be in the return object
      expect(result).not.toHaveProperty("sortedSessions");
      expect(result).not.toHaveProperty("recentSessions");
      expect(result).not.toHaveProperty("filteredSessions");
    });

    it("returns computed refs for reactive data", () => {
      const result = useSidebarSessions();

      expect(result.sessions).toHaveProperty("value");
      expect(result.displaySessions).toHaveProperty("value");
      expect(result.activeSessionId).toHaveProperty("value");
      expect(result.isLoading).toHaveProperty("value");
      expect(result.hasSessions).toHaveProperty("value");
      expect(result.searchQuery).toHaveProperty("value");
      expect(result.activeSession).toHaveProperty("value");
    });

    it("returns functions for methods", () => {
      const result = useSidebarSessions();

      expect(typeof result.setSearchQuery).toBe("function");
      expect(typeof result.clearSearch).toBe("function");
      expect(typeof result.setActiveSession).toBe("function");
      expect(typeof result.refreshSessions).toBe("function");
    });
  });
});
