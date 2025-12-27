/**
 * Server-side API types
 * These types define the shape of data for the Nuxt server API
 *
 * Convention: Using snake_case for all fields to match FastAPI backend
 */

/**
 * Session entity
 */
export interface Session {
  id: string;
  title: string;
  pdf_file_name: string | null;
  created_at: string; // ISO string
  updated_at: string; // ISO string
}

/**
 * Message entity
 */
export interface Message {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string; // ISO string
}

/**
 * Request body for creating a new session
 */
export interface CreateSessionRequest {
  title?: string;
}

/**
 * Response for session creation
 */
export interface CreateSessionResponse {
  session: Session;
}

/**
 * Response for getting sessions list
 */
export interface GetSessionsResponse {
  sessions: Session[];
}

/**
 * Response for getting a single session
 */
export interface GetSessionResponse {
  session: Session;
  messages: Message[];
}

/**
 * Response for PDF upload
 */
export interface UploadPdfResponse {
  success: boolean;
  file_name: string;
}

/**
 * Request body for sending a message
 */
export interface SendMessageRequest {
  session_id: string;
  content: string;
}

/**
 * Response for sending a message
 */
export interface SendMessageResponse {
  message: Message;
}

/**
 * SSE event types for streaming chat responses
 *
 * - "token": Each chunk/word of the AI response as it's generated (typewriter effect)
 * - "done": Signals the response is complete, client can stop listening
 * - "error": If something goes wrong during generation
 */
export type StreamEventType = "token" | "done" | "error";

/**
 * SSE event data structure
 */
export interface StreamEvent {
  type: StreamEventType;
  data: string;
}
