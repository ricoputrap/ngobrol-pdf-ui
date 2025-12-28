/**
 * useSessions composable
 *
 * Convenience wrapper around the Pinia sessions store.
 * Provides direct access to the store for use in components.
 */

import { useSessionsStore } from "../../../stores/sessions";

export const useSessions = () => {
  const store = useSessionsStore();

  return {
    // State (computed from store)
    sessions: computed(() => store.sessions),
    currentSession: computed(() => store.currentSession),
    isLoading: computed(() => store.isLoading),
    error: computed(() => store.error),

    // Getters
    getSessionById: (id: string) => store.getSessionById(id),
    hasSessions: computed(() => store.hasSessions),
    sessionsCount: computed(() => store.sessionsCount),

    // Actions
    fetchSessions: store.fetchSessions,
    createSession: store.createSession,
    fetchSession: store.fetchSession,
    deleteSession: store.deleteSession,
    uploadPdf: store.uploadPdf,
    clearError: store.clearError,
    clearCurrentSession: store.clearCurrentSession,
  };
};
