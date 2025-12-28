/**
 * Sessions Store (Pinia)
 *
 * Global store for managing sessions via API calls.
 * Provides state and actions to list, create, get, and delete sessions.
 */

import { defineStore } from "pinia";
import type {
  Session,
  GetSessionsResponse,
  CreateSessionRequest,
  CreateSessionResponse,
  GetSessionResponse,
} from "../modules/sessions/types";

interface SessionsState {
  sessions: Session[];
  currentSession: GetSessionResponse | null;
  isLoading: boolean;
  error: string | null;
}

export const useSessionsStore = defineStore("sessions", {
  state: (): SessionsState => ({
    sessions: [],
    currentSession: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    /**
     * Get session by ID from the sessions array
     */
    getSessionById: (state) => (id: string) => {
      return state.sessions.find((s: Session) => s.id === id);
    },

    /**
     * Check if there are any sessions
     */
    hasSessions: (state) => state.sessions.length > 0,

    /**
     * Get the number of sessions
     */
    sessionsCount: (state) => state.sessions.length,
  },

  actions: {
    /**
     * Fetch all sessions
     */
    async fetchSessions() {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await $fetch<GetSessionsResponse>("/api/sessions");
        this.sessions = response.sessions;
        return response.sessions;
      } catch (err) {
        this.error =
          err instanceof Error ? err.message : "Failed to fetch sessions";
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Create a new session
     */
    async createSession(request: CreateSessionRequest = {}) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await $fetch<CreateSessionResponse>("/api/sessions", {
          method: "POST",
          body: request,
        });

        // Add to local sessions array (at the beginning)
        this.sessions.unshift(response.session);

        return response.session;
      } catch (err) {
        this.error =
          err instanceof Error ? err.message : "Failed to create session";
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Fetch a single session with messages
     */
    async fetchSession(id: string) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await $fetch<GetSessionResponse>(
          `/api/sessions/${id}`,
        );
        this.currentSession = response;
        return response;
      } catch (err) {
        this.error =
          err instanceof Error ? err.message : "Failed to fetch session";
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Delete a session
     */
    async deleteSession(id: string) {
      this.isLoading = true;
      this.error = null;

      try {
        await $fetch(`/api/sessions/${id}`, {
          method: "DELETE",
        });

        // Remove from local sessions array
        this.sessions = this.sessions.filter((s: Session) => s.id !== id);

        // Clear current session if it was deleted
        if (this.currentSession?.session.id === id) {
          this.currentSession = null;
        }

        return true;
      } catch (err) {
        this.error =
          err instanceof Error ? err.message : "Failed to delete session";
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Upload PDF to a session
     */
    async uploadPdf(sessionId: string, file: File) {
      this.isLoading = true;
      this.error = null;

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await $fetch<{ success: boolean; file_name: string }>(
          `/api/sessions/${sessionId}/upload`,
          {
            method: "POST",
            body: formData,
          },
        );

        // Update session in local array
        const sessionIndex = this.sessions.findIndex(
          (s: Session) => s.id === sessionId,
        );
        if (sessionIndex !== -1) {
          const session = this.sessions[sessionIndex];
          if (session) {
            session.pdf_file_name = response.file_name;
          }
        }

        // Update current session if it matches
        if (this.currentSession?.session.id === sessionId) {
          this.currentSession.session.pdf_file_name = response.file_name;
        }

        return response;
      } catch (err) {
        this.error =
          err instanceof Error ? err.message : "Failed to upload PDF";
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Clear error
     */
    clearError() {
      this.error = null;
    },

    /**
     * Clear current session
     */
    clearCurrentSession() {
      this.currentSession = null;
    },

    /**
     * Reset the entire store to initial state
     */
    $reset() {
      this.sessions = [];
      this.currentSession = null;
      this.isLoading = false;
      this.error = null;
    },
  },
});
