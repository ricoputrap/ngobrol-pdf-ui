/**
 * Chat module types
 *
 * Types for chat functionality including messaging, streaming, and UI state.
 * SSE event types match the server stream format.
 */

import type { Message } from "~/modules/sessions/types";

// Re-export Message type for convenience
export type { Message };

/**
 * SSE event types from stream endpoint
 */
export type SSEEventType = "token" | "done" | "error";

/**
 * SSE event from stream endpoint
 */
export interface SSEEvent {
  type: SSEEventType;
  data: string;
}

/**
 * Token event - streaming response chunk
 */
export interface SSETokenEvent extends SSEEvent {
  type: "token";
  data: string; // The token/chunk text
}

/**
 * Done event - stream complete
 */
export interface SSEDoneEvent extends SSEEvent {
  type: "done";
  data: ""; // Empty string
}

/**
 * Error event - stream error
 */
export interface SSEErrorEvent extends SSEEvent {
  type: "error";
  data: string; // Error message
}

/**
 * Message sending state
 */
export type MessageSendState = "idle" | "sending" | "streaming" | "error";

/**
 * Chat connection state
 */
export type ChatConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

/**
 * Message with streaming state
 * Extends Message with additional UI state for streaming responses
 */
export interface StreamingMessage extends Message {
  /** Whether this message is currently being streamed */
  is_streaming: boolean;
  /** Streaming progress (0-100), null if not streaming */
  streaming_progress: number | null;
}

/**
 * Chat state for UI
 */
export interface ChatState {
  /** All messages in the conversation */
  messages: Message[];
  /** Current message being streamed (if any) */
  streaming_message: StreamingMessage | null;
  /** Whether a message is being sent */
  is_sending: boolean;
  /** Whether a response is being streamed */
  is_streaming: boolean;
  /** Current error message (if any) */
  error: string | null;
  /** Connection state */
  connection_state: ChatConnectionState;
}

/**
 * Request body for sending a message
 */
export interface SendMessageRequest {
  session_id: string;
  content: string;
}

/**
 * Response from sending a message
 */
export interface SendMessageResponse {
  user_message: Message;
  assistant_message: Message;
}

/**
 * Query parameters for streaming endpoint
 */
export interface StreamQueryParams {
  session_id: string;
  prompt: string;
  message_id?: string;
}

/**
 * Chat input state
 */
export interface ChatInputState {
  /** Current input text */
  text: string;
  /** Whether input is disabled */
  disabled: boolean;
  /** Placeholder text */
  placeholder: string;
}

/**
 * Chat configuration options
 */
export interface ChatConfig {
  /** Maximum message length */
  max_message_length: number;
  /** Minimum message length */
  min_message_length: number;
  /** Enable streaming responses */
  enable_streaming: boolean;
  /** Auto-scroll to new messages */
  auto_scroll: boolean;
  /** Show timestamps on messages */
  show_timestamps: boolean;
  /** Date/time format for timestamps */
  timestamp_format: "relative" | "absolute";
}

/**
 * Default chat configuration
 */
export const DEFAULT_CHAT_CONFIG: ChatConfig = {
  max_message_length: 10000,
  min_message_length: 1,
  enable_streaming: true,
  auto_scroll: true,
  show_timestamps: true,
  timestamp_format: "relative",
};

/**
 * Message validation result
 */
export interface MessageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a message content against config
 */
export function validateMessageContent(
  content: string,
  config: ChatConfig = DEFAULT_CHAT_CONFIG,
): MessageValidationResult {
  const trimmed = content.trim();

  if (trimmed.length < config.min_message_length) {
    return {
      valid: false,
      error: `Message must be at least ${config.min_message_length} character(s)`,
    };
  }

  if (trimmed.length > config.max_message_length) {
    return {
      valid: false,
      error: `Message must be at most ${config.max_message_length} characters`,
    };
  }

  return { valid: true };
}

/**
 * Create an empty chat state
 */
export function createEmptyChatState(): ChatState {
  return {
    messages: [],
    streaming_message: null,
    is_sending: false,
    is_streaming: false,
    error: null,
    connection_state: "disconnected",
  };
}

/**
 * Create a user message object
 */
export function createUserMessage(
  sessionId: string,
  content: string,
  id?: string,
): Message {
  return {
    id: id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    session_id: sessionId,
    role: "user",
    content,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create an assistant message object (for streaming)
 */
export function createAssistantMessage(
  sessionId: string,
  content: string = "",
  id?: string,
): Message {
  return {
    id: id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    session_id: sessionId,
    role: "assistant",
    content,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a streaming message from a base message
 */
export function createStreamingMessage(message: Message): StreamingMessage {
  return {
    ...message,
    is_streaming: true,
    streaming_progress: 0,
  };
}

/**
 * Type guard for token event
 */
export function isTokenEvent(event: SSEEvent): event is SSETokenEvent {
  return event.type === "token";
}

/**
 * Type guard for done event
 */
export function isDoneEvent(event: SSEEvent): event is SSEDoneEvent {
  return event.type === "done";
}

/**
 * Type guard for error event
 */
export function isErrorEvent(event: SSEEvent): event is SSEErrorEvent {
  return event.type === "error";
}
