/**
 * useSidebarSessions Composable
 *
 * Manages sidebar session list functionality including:
 * - Session sorting (single source of truth)
 * - Search/filter capability
 * - Active session tracking
 * - Real-time updates
 */

import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import type { ComputedRef, Ref } from "vue";
import type { Session } from "../types";
import { useSessionsStore } from "~/stores/sessions";

export interface UseSidebarSessionsReturn {
  // Session data
  sessions: ComputedRef<Session[]>;
  displaySessions: ComputedRef<Session[]>;
  activeSessionId: Ref<string | null>;
  isLoading: ComputedRef<boolean>;
  hasSessions: ComputedRef<boolean>;

  // Search & Filters
  searchQuery: Ref<string>;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;

  // Session management
  setActiveSession: (sessionId: string | null) => void;
  refreshSessions: () => Promise<void>;

  // Computed helpers
  activeSession: ComputedRef<Session | null>;
}

export function useSidebarSessions(): UseSidebarSessionsReturn {
  // Store
  const sessionStore = useSessionsStore();

  // State
  const activeSessionId = ref<string | null>(null);
  const searchQuery = ref<string>("");
  const refreshInterval = ref<ReturnType<typeof setInterval> | null>(null);

  // Computed - from store
  const sessions = computed(() => sessionStore.sessions);
  const isLoading = computed(() => sessionStore.isLoading);

  // Computed - derived data
  const hasSessions = computed(() => sessions.value.length > 0);

  /**
   * Single sorted sessions - base layer for all session display
   * Sort by updated_at descending (most recent first)
   */
  const sortedSessions = computed(() => {
    return [...sessions.value].sort((a, b) => {
      const dateA = new Date(a.updated_at).getTime();
      const dateB = new Date(b.updated_at).getTime();

      if (dateA !== dateB) {
        return dateB - dateA;
      }

      // Fallback: sort by created_at if updated_at is the same
      const createdA = new Date(a.created_at).getTime();
      const createdB = new Date(b.created_at).getTime();

      return createdB - createdA;
    });
  });

  /**
   * Display sessions - the final output for UI rendering
   * Applies search filter on top of sorted sessions
   * This is the ONLY computed value that should be used in templates
   */
  const displaySessions = computed(() => {
    const query = searchQuery.value.toLowerCase().trim();

    // No search query - return all sorted sessions
    if (!query) {
      return sortedSessions.value;
    }

    // Apply search filter
    return sortedSessions.value.filter((session) => {
      const titleMatch = session.title.toLowerCase().includes(query);
      const fileNameMatch =
        session.pdf_file_name?.toLowerCase().includes(query) || false;

      return titleMatch || fileNameMatch;
    });
  });

  /**
   * Active session object - derived from activeSessionId
   */
  const activeSession = computed(() => {
    if (!activeSessionId.value) return null;

    return (
      sessions.value.find((session) => session.id === activeSessionId.value) ||
      null
    );
  });

  // Methods
  const setSearchQuery = (query: string) => {
    searchQuery.value = query;
  };

  const clearSearch = () => {
    searchQuery.value = "";
  };

  const setActiveSession = (sessionId: string | null) => {
    activeSessionId.value = sessionId;
  };

  const refreshSessions = async () => {
    try {
      await sessionStore.fetchSessions();
    } catch (error) {
      console.error("Failed to refresh sessions:", error);
    }
  };

  // Auto-refresh sessions periodically
  const startAutoRefresh = () => {
    // Refresh every 30 seconds
    refreshInterval.value = setInterval(() => {
      refreshSessions();
    }, 30_000);
  };

  const stopAutoRefresh = () => {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value);
      refreshInterval.value = null;
    }
  };

  // Initialize
  onMounted(async () => {
    // Fetch sessions if not already loaded
    if (sessions.value.length === 0 && !isLoading.value) {
      await refreshSessions();
    }

    // Start auto-refresh
    startAutoRefresh();
  });

  // Cleanup
  onUnmounted(() => {
    stopAutoRefresh();
  });

  // Reset active session when sessions change
  watch(
    () => sessions.value.length,
    (newLength, oldLength) => {
      // If sessions were loaded for the first time or cleared, reset active session
      if (newLength === 0 || oldLength === 0) {
        activeSessionId.value = null;
      } else {
        // Verify active session still exists
        if (activeSessionId.value) {
          const stillExists = sessions.value.some(
            (session) => session.id === activeSessionId.value,
          );
          if (!stillExists) {
            activeSessionId.value = null;
          }
        }
      }
    },
  );

  return {
    // Session data
    sessions,
    displaySessions,
    activeSessionId,
    isLoading,
    hasSessions,

    // Search & Filters
    searchQuery,
    setSearchQuery,
    clearSearch,

    // Session management
    setActiveSession,
    refreshSessions,

    // Computed helpers
    activeSession,
  };
}
