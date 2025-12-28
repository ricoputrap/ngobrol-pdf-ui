/**
 * Session module types
 *
 * Frontend types for session management.
 * These types mirror the backend API but are used in the Vue frontend.
 */

/**
 * Session entity from API
 */
export interface Session {
  id: string;
  title: string;
  pdf_file_name: string | null;
  created_at: string; // ISO string
  updated_at: string; // ISO string
}

/**
 * Message entity from API
 */
export interface Message {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string; // ISO string
}

/**
 * API response for getting sessions list
 */
export interface GetSessionsResponse {
  sessions: Session[];
}

/**
 * API response for creating a session
 */
export interface CreateSessionResponse {
  session: Session;
}

/**
 * API response for getting a single session with messages
 */
export interface GetSessionResponse {
  session: Session;
  messages: Message[];
}

/**
 * Request body for creating a session
 */
export interface CreateSessionRequest {
  title?: string;
}

/**
 * Session with messages (combined view)
 */
export interface SessionWithMessages {
  session: Session;
  messages: Message[];
}
