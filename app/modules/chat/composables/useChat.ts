/**
 * useChat Composable
 *
 * Centralized chat functionality with SSE streaming support, message management,
 * and comprehensive error handling. Integrates with the sessions store and
 * streaming API endpoint.
 *
 * @example
 * ```ts
 * const {
 *   messages,
 *   isStreaming,
 *   isSending,
 *   error,
 *   sendMessage,
 *   clearMessages,
 * } = useChat({
 *   sessionId: 'session-123',
 *   onMessageReceived: (message) => console.log('Received:', message),
 * });
 * ```
 */

import { ref, computed, onUnmounted } from "vue";
import type { Ref, ComputedRef } from "vue";
import { useSessionsStore } from "~/stores/sessions";
import type { Message } from "~/modules/sessions/types";
import {
  type StreamingMessage,
  type SSEEvent,
  type ChatConfig,
  type ChatConnectionState,
  DEFAULT_CHAT_CONFIG,
  createUserMessage,
  createAssistantMessage,
  createStreamingMessage,
  validateMessageContent,
  isTokenEvent,
  isDoneEvent,
  isErrorEvent,
} from "../types";

export interface UseChatOptions {
  /** Session ID for the chat */
  sessionId: string;
  /** Custom chat configuration */
  config?: Partial<ChatConfig>;
  /** Callback when a message is sent */
  onMessageSent?: (message: Message) => void;
  /** Callback when a message is received (streaming complete) */
  onMessageReceived?: (message: Message) => void;
  /** Callback when an error occurs */
  onError?: (error: string) => void;
  /** Callback when streaming starts */
  onStreamStart?: () => void;
  /** Callback when streaming ends */
  onStreamEnd?: () => void;
  /** Auto-fetch messages on init */
  autoFetch?: boolean;
}

export interface UseChatReturn {
  /** All messages in the conversation */
  messages: Ref<Message[]>;
  /** Currently streaming message (if any) */
  streamingMessage: Ref<StreamingMessage | null>;
  /** Whether a message is being sent */
  isSending: Ref<boolean>;
  /** Whether a response is being streamed */
  isStreaming: Ref<boolean>;
  /** Whether the chat is loading initial messages */
  isLoading: Ref<boolean>;
  /** Current error message */
  error: Ref<string | null>;
  /** Connection state for streaming */
  connectionState: Ref<ChatConnectionState>;
  /** Merged chat configuration */
  config: ComputedRef<ChatConfig>;
  /** Whether chat can send messages */
  canSend: ComputedRef<boolean>;
  /** Send a message and stream the response */
  sendMessage: (content: string) => Promise<void>;
  /** Send without streaming (for non-streaming mode) */
  sendMessageSync: (content: string) => Promise<void>;
  /** Stop current streaming */
  stopStreaming: () => void;
  /** Clear all messages */
  clearMessages: () => void;
  /** Clear error */
  clearError: () => void;
  /** Fetch messages from server */
  fetchMessages: () => Promise<void>;
  /** Validate message content */
  validateMessage: (content: string) => { valid: boolean; error?: string };
}

export function useChat(options: UseChatOptions): UseChatReturn {
  const {
    sessionId,
    config: customConfig = {},
    onMessageSent,
    onMessageReceived,
    onError,
    onStreamStart,
    onStreamEnd,
    autoFetch = true,
  } = options;

  const sessionStore = useSessionsStore();

  // State
  const messages = ref<Message[]>([]);
  const streamingMessage = ref<StreamingMessage | null>(null);
  const isSending = ref(false);
  const isStreaming = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const connectionState = ref<ChatConnectionState>("disconnected");
  const abortController = ref<AbortController | null>(null);

  // Computed
  const config = computed<ChatConfig>(() => ({
    ...DEFAULT_CHAT_CONFIG,
    ...customConfig,
  }));

  const canSend = computed(
    () => !isSending.value && !isStreaming.value && !isLoading.value,
  );

  // Methods
  const validateMessage = (content: string) => {
    return validateMessageContent(content, config.value);
  };

  const clearError = () => {
    error.value = null;
  };

  const clearMessages = () => {
    messages.value = [];
    streamingMessage.value = null;
    error.value = null;
  };

  const stopStreaming = () => {
    if (abortController.value) {
      abortController.value.abort();
      abortController.value = null;
    }

    if (streamingMessage.value) {
      // Finalize the streaming message
      const finalMessage: Message = {
        id: streamingMessage.value.id,
        session_id: streamingMessage.value.session_id,
        role: streamingMessage.value.role,
        content: streamingMessage.value.content,
        timestamp: streamingMessage.value.timestamp,
      };
      messages.value.push(finalMessage);
      streamingMessage.value = null;
    }

    isStreaming.value = false;
    connectionState.value = "disconnected";

    if (onStreamEnd) {
      onStreamEnd();
    }
  };

  const fetchMessages = async () => {
    if (!sessionId) return;

    isLoading.value = true;
    error.value = null;

    try {
      await sessionStore.fetchSession(sessionId);

      if (sessionStore.currentSession) {
        messages.value = [...sessionStore.currentSession.messages];
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to fetch messages";
      error.value = errorMsg;

      if (onError) {
        onError(errorMsg);
      }
    } finally {
      isLoading.value = false;
    }
  };

  const parseSSELine = (line: string): SSEEvent | null => {
    if (!line.startsWith("data: ")) return null;

    try {
      const jsonStr = line.slice(6); // Remove "data: " prefix
      return JSON.parse(jsonStr) as SSEEvent;
    } catch {
      return null;
    }
  };

  const streamResponse = async (prompt: string, userMessageId: string) => {
    // Create abort controller for this stream
    abortController.value = new AbortController();

    isStreaming.value = true;
    connectionState.value = "connecting";

    if (onStreamStart) {
      onStreamStart();
    }

    // Create initial streaming message
    const assistantMessage = createAssistantMessage(sessionId, "");
    streamingMessage.value = createStreamingMessage(assistantMessage);

    try {
      // Build query string
      const params = new URLSearchParams({
        session_id: sessionId,
        prompt: prompt,
        message_id: userMessageId,
      });

      const response = await fetch(`/api/messages/stream?${params}`, {
        method: "GET",
        headers: {
          Accept: "text/event-stream",
        },
        signal: abortController.value.signal,
      });

      if (!response.ok) {
        throw new Error(`Stream request failed: ${response.statusText}`);
      }

      connectionState.value = "connected";

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          const event = parseSSELine(trimmedLine);
          if (!event) continue;

          if (isTokenEvent(event)) {
            // Append token to streaming message
            if (streamingMessage.value) {
              streamingMessage.value.content += event.data;
            }
          } else if (isDoneEvent(event)) {
            // Streaming complete
            if (streamingMessage.value) {
              const finalMessage: Message = {
                id: streamingMessage.value.id,
                session_id: streamingMessage.value.session_id,
                role: streamingMessage.value.role,
                content: streamingMessage.value.content,
                timestamp: streamingMessage.value.timestamp,
              };
              messages.value.push(finalMessage);

              if (onMessageReceived) {
                onMessageReceived(finalMessage);
              }
            }
            streamingMessage.value = null;
            break;
          } else if (isErrorEvent(event)) {
            throw new Error(event.data || "Stream error");
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        // Stream was intentionally stopped
        return;
      }

      const errorMsg =
        err instanceof Error ? err.message : "Failed to stream response";
      error.value = errorMsg;

      if (onError) {
        onError(errorMsg);
      }

      // Clean up streaming message on error
      streamingMessage.value = null;
    } finally {
      isStreaming.value = false;
      connectionState.value = "disconnected";
      abortController.value = null;

      if (onStreamEnd) {
        onStreamEnd();
      }
    }
  };

  const sendMessage = async (content: string) => {
    // Validate
    const validation = validateMessage(content);
    if (!validation.valid) {
      error.value = validation.error || "Invalid message";
      if (onError) {
        onError(error.value);
      }
      return;
    }

    if (!canSend.value) {
      return;
    }

    const trimmedContent = content.trim();
    isSending.value = true;
    error.value = null;

    try {
      // Create and add user message
      const userMessage = createUserMessage(sessionId, trimmedContent);
      messages.value.push(userMessage);

      if (onMessageSent) {
        onMessageSent(userMessage);
      }

      isSending.value = false;

      // Stream the response
      if (config.value.enable_streaming) {
        await streamResponse(trimmedContent, userMessage.id);
      } else {
        // Non-streaming mode
        await sendMessageSync(trimmedContent);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to send message";
      error.value = errorMsg;

      if (onError) {
        onError(errorMsg);
      }
    } finally {
      isSending.value = false;
    }
  };

  const sendMessageSync = async (content: string) => {
    // Validate
    const validation = validateMessage(content);
    if (!validation.valid) {
      error.value = validation.error || "Invalid message";
      if (onError) {
        onError(error.value);
      }
      return;
    }

    const trimmedContent = content.trim();
    isSending.value = true;
    error.value = null;

    try {
      // Use the messages API directly
      const response = await $fetch<{
        user_message: Message;
        assistant_message: Message;
      }>("/api/messages", {
        method: "POST",
        body: {
          session_id: sessionId,
          content: trimmedContent,
        },
      });

      // Add both messages
      messages.value.push(response.user_message);
      messages.value.push(response.assistant_message);

      if (onMessageSent) {
        onMessageSent(response.user_message);
      }

      if (onMessageReceived) {
        onMessageReceived(response.assistant_message);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to send message";
      error.value = errorMsg;

      if (onError) {
        onError(errorMsg);
      }
    } finally {
      isSending.value = false;
    }
  };

  // Cleanup on unmount
  onUnmounted(() => {
    stopStreaming();
  });

  // Auto-fetch messages if enabled
  if (autoFetch) {
    fetchMessages();
  }

  return {
    // State
    messages,
    streamingMessage,
    isSending,
    isStreaming,
    isLoading,
    error,
    connectionState,

    // Computed
    config,
    canSend,

    // Methods
    sendMessage,
    sendMessageSync,
    stopStreaming,
    clearMessages,
    clearError,
    fetchMessages,
    validateMessage,
  };
}
