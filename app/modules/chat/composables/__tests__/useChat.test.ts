/**
 * Tests for useChat composable
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useChat } from "../useChat";
import { useSessionsStore } from "~/stores/sessions";
import { createPinia, setActivePinia } from "pinia";
import type { Message } from "~/modules/sessions/types";

// Mock the sessions store
vi.mock("~/stores/sessions", () => ({
  useSessionsStore: vi.fn(),
}));

// Mock fetch for SSE streaming
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock $fetch for sync requests
vi.stubGlobal("$fetch", vi.fn());

describe("useChat", () => {
  let mockStore: any;
  let mockFetchSession: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setActivePinia(createPinia());

    mockFetchSession = vi.fn();
    mockStore = {
      fetchSession: mockFetchSession,
      currentSession: null,
    };

    vi.mocked(useSessionsStore).mockReturnValue(mockStore);
    mockFetch.mockReset();
    vi.mocked($fetch).mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with default state", () => {
      const { messages, streamingMessage, isSending, isStreaming, error } =
        useChat({
          sessionId: "session-1",
          autoFetch: false,
        });

      expect(messages.value).toEqual([]);
      expect(streamingMessage.value).toBeNull();
      expect(isSending.value).toBe(false);
      expect(isStreaming.value).toBe(false);
      expect(error.value).toBeNull();
    });

    it("should merge custom config with defaults", () => {
      const { config } = useChat({
        sessionId: "session-1",
        config: {
          max_message_length: 5000,
        },
        autoFetch: false,
      });

      expect(config.value.max_message_length).toBe(5000);
      expect(config.value.enable_streaming).toBe(true);
      expect(config.value.auto_scroll).toBe(true);
    });

    it("should auto-fetch messages by default", async () => {
      mockFetchSession.mockResolvedValue(undefined);
      mockStore.currentSession = {
        session: { id: "session-1" },
        messages: [
          {
            id: "msg-1",
            session_id: "session-1",
            role: "user",
            content: "Hello",
            timestamp: "2024-01-15T10:00:00Z",
          },
        ],
      };

      const { messages, isLoading } = useChat({
        sessionId: "session-1",
        autoFetch: true,
      });

      // Wait for fetch
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockFetchSession).toHaveBeenCalledWith("session-1");
      expect(messages.value).toHaveLength(1);
    });

    it("should not auto-fetch when disabled", () => {
      useChat({
        sessionId: "session-1",
        autoFetch: false,
      });

      expect(mockFetchSession).not.toHaveBeenCalled();
    });
  });

  describe("validateMessage", () => {
    it("should validate valid message", () => {
      const { validateMessage } = useChat({
        sessionId: "session-1",
        autoFetch: false,
      });

      const result = validateMessage("Hello, world!");

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject empty message", () => {
      const { validateMessage } = useChat({
        sessionId: "session-1",
        autoFetch: false,
      });

      const result = validateMessage("");

      expect(result.valid).toBe(false);
      expect(result.error).toContain("at least 1 character");
    });

    it("should reject message exceeding max length", () => {
      const { validateMessage } = useChat({
        sessionId: "session-1",
        config: {
          max_message_length: 100,
        },
        autoFetch: false,
      });

      const longMessage = "a".repeat(101);
      const result = validateMessage(longMessage);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("at most 100 characters");
    });
  });

  describe("sendMessage (non-streaming)", () => {
    it("should send message and receive response", async () => {
      const userMsg: Message = {
        id: "user-1",
        session_id: "session-1",
        role: "user",
        content: "Hello",
        timestamp: "2024-01-15T10:00:00Z",
      };

      const assistantMsg: Message = {
        id: "assistant-1",
        session_id: "session-1",
        role: "assistant",
        content: "Hi there!",
        timestamp: "2024-01-15T10:00:01Z",
      };

      vi.mocked($fetch).mockResolvedValue({
        user_message: userMsg,
        assistant_message: assistantMsg,
      });

      const onMessageSent = vi.fn();
      const onMessageReceived = vi.fn();

      const { sendMessageSync, messages } = useChat({
        sessionId: "session-1",
        config: {
          enable_streaming: false,
        },
        onMessageSent,
        onMessageReceived,
        autoFetch: false,
      });

      await sendMessageSync("Hello");

      expect(vi.mocked($fetch)).toHaveBeenCalledWith("/api/messages", {
        method: "POST",
        body: {
          session_id: "session-1",
          content: "Hello",
        },
      });

      expect(messages.value).toHaveLength(2);
      expect(messages.value[0].role).toBe("user");
      expect(messages.value[1].role).toBe("assistant");
      expect(onMessageSent).toHaveBeenCalledWith(userMsg);
      expect(onMessageReceived).toHaveBeenCalledWith(assistantMsg);
    });

    it("should handle send error", async () => {
      vi.mocked($fetch).mockRejectedValue(new Error("Network error"));

      const onError = vi.fn();

      const { sendMessageSync, error } = useChat({
        sessionId: "session-1",
        onError,
        autoFetch: false,
      });

      await sendMessageSync("Hello");

      expect(error.value).toBe("Network error");
      expect(onError).toHaveBeenCalledWith("Network error");
    });

    it("should not send invalid message", async () => {
      const onError = vi.fn();

      const { sendMessageSync, error } = useChat({
        sessionId: "session-1",
        onError,
        autoFetch: false,
      });

      await sendMessageSync("");

      expect(vi.mocked($fetch)).not.toHaveBeenCalled();
      expect(error.value).toContain("at least 1 character");
      expect(onError).toHaveBeenCalled();
    });
  });

  describe("sendMessage (streaming)", () => {
    it("should add user message and start streaming", async () => {
      // Mock a basic SSE response
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(
              'data: {"type":"token","data":"Hello"}\n\n',
            ),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(
              'data: {"type":"done","data":""}\n\n',
            ),
          })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const onMessageSent = vi.fn();
      const onStreamStart = vi.fn();
      const onStreamEnd = vi.fn();

      const { sendMessage, messages } = useChat({
        sessionId: "session-1",
        config: {
          enable_streaming: true,
        },
        onMessageSent,
        onStreamStart,
        onStreamEnd,
        autoFetch: false,
      });

      await sendMessage("Hello");

      expect(messages.value.length).toBeGreaterThanOrEqual(1);
      expect(messages.value[0].role).toBe("user");
      expect(messages.value[0].content).toBe("Hello");
      expect(onMessageSent).toHaveBeenCalled();
    });

    it("should accumulate tokens during streaming", async () => {
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(
              'data: {"type":"token","data":"Hello"}\n\n',
            ),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(
              'data: {"type":"token","data":" world"}\n\n',
            ),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(
              'data: {"type":"done","data":""}\n\n',
            ),
          })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const onMessageReceived = vi.fn();

      const { sendMessage, messages } = useChat({
        sessionId: "session-1",
        config: {
          enable_streaming: true,
        },
        onMessageReceived,
        autoFetch: false,
      });

      await sendMessage("Test");

      // Should have user message + assistant message
      expect(messages.value).toHaveLength(2);
      expect(messages.value[1].role).toBe("assistant");
      expect(messages.value[1].content).toBe("Hello world");
      expect(onMessageReceived).toHaveBeenCalled();
    });

    it("should handle stream error event", async () => {
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(
              'data: {"type":"error","data":"Stream failed"}\n\n',
            ),
          })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const onError = vi.fn();

      const { sendMessage, error } = useChat({
        sessionId: "session-1",
        config: {
          enable_streaming: true,
        },
        onError,
        autoFetch: false,
      });

      await sendMessage("Test");

      expect(error.value).toBe("Stream failed");
      expect(onError).toHaveBeenCalledWith("Stream failed");
    });

    it("should handle fetch error", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: "Internal Server Error",
      });

      const onError = vi.fn();

      const { sendMessage, error } = useChat({
        sessionId: "session-1",
        config: {
          enable_streaming: true,
        },
        onError,
        autoFetch: false,
      });

      await sendMessage("Test");

      expect(error.value).toContain("Internal Server Error");
      expect(onError).toHaveBeenCalled();
    });
  });

  describe("stopStreaming", () => {
    it("should stop streaming and finalize message", async () => {
      // Create a never-ending reader that we can abort
      const mockReader = {
        read: vi.fn().mockImplementation(
          () =>
            new Promise((resolve) => {
              setTimeout(() => {
                resolve({
                  done: false,
                  value: new TextEncoder().encode(
                    'data: {"type":"token","data":"..."}\n\n',
                  ),
                });
              }, 1000);
            }),
        ),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const { sendMessage, stopStreaming, isStreaming, streamingMessage } =
        useChat({
          sessionId: "session-1",
          config: {
            enable_streaming: true,
          },
          autoFetch: false,
        });

      // Start streaming (don't await)
      const sendPromise = sendMessage("Test");

      // Wait for streaming to start
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Stop streaming
      stopStreaming();

      expect(isStreaming.value).toBe(false);
      expect(streamingMessage.value).toBeNull();
    });
  });

  describe("clearMessages", () => {
    it("should clear all messages", async () => {
      vi.mocked($fetch).mockResolvedValue({
        user_message: {
          id: "user-1",
          session_id: "session-1",
          role: "user",
          content: "Hello",
          timestamp: "2024-01-15T10:00:00Z",
        },
        assistant_message: {
          id: "assistant-1",
          session_id: "session-1",
          role: "assistant",
          content: "Hi!",
          timestamp: "2024-01-15T10:00:01Z",
        },
      });

      const { sendMessageSync, clearMessages, messages, error } = useChat({
        sessionId: "session-1",
        autoFetch: false,
      });

      await sendMessageSync("Hello");
      expect(messages.value).toHaveLength(2);

      clearMessages();

      expect(messages.value).toEqual([]);
      expect(error.value).toBeNull();
    });
  });

  describe("clearError", () => {
    it("should clear error", async () => {
      vi.mocked($fetch).mockRejectedValue(new Error("Failed"));

      const { sendMessageSync, clearError, error } = useChat({
        sessionId: "session-1",
        autoFetch: false,
      });

      await sendMessageSync("Hello");
      expect(error.value).toBe("Failed");

      clearError();
      expect(error.value).toBeNull();
    });
  });

  describe("fetchMessages", () => {
    it("should fetch messages from session", async () => {
      const mockMessages: Message[] = [
        {
          id: "msg-1",
          session_id: "session-1",
          role: "user",
          content: "Hello",
          timestamp: "2024-01-15T10:00:00Z",
        },
        {
          id: "msg-2",
          session_id: "session-1",
          role: "assistant",
          content: "Hi!",
          timestamp: "2024-01-15T10:00:01Z",
        },
      ];

      mockFetchSession.mockImplementation(async () => {
        mockStore.currentSession = {
          session: { id: "session-1" },
          messages: mockMessages,
        };
      });

      const { fetchMessages, messages, isLoading } = useChat({
        sessionId: "session-1",
        autoFetch: false,
      });

      await fetchMessages();

      expect(mockFetchSession).toHaveBeenCalledWith("session-1");
      expect(messages.value).toHaveLength(2);
      expect(isLoading.value).toBe(false);
    });

    it("should handle fetch error", async () => {
      mockFetchSession.mockRejectedValue(new Error("Network error"));

      const onError = vi.fn();

      const { fetchMessages, error } = useChat({
        sessionId: "session-1",
        onError,
        autoFetch: false,
      });

      await fetchMessages();

      expect(error.value).toBe("Network error");
      expect(onError).toHaveBeenCalledWith("Network error");
    });
  });

  describe("canSend", () => {
    it("should be true when idle", () => {
      const { canSend } = useChat({
        sessionId: "session-1",
        autoFetch: false,
      });

      expect(canSend.value).toBe(true);
    });

    it("should be false when sending", async () => {
      // Create a promise that we control
      let resolvePromise: () => void;
      const pendingPromise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked($fetch).mockImplementation(() => pendingPromise as any);

      const { sendMessageSync, canSend, isSending } = useChat({
        sessionId: "session-1",
        autoFetch: false,
      });

      const sendPromise = sendMessageSync("Hello");

      // Check state while sending
      expect(isSending.value).toBe(true);
      expect(canSend.value).toBe(false);

      // Resolve the promise
      resolvePromise!();
      await sendPromise;
    });
  });

  describe("connectionState", () => {
    it("should start as disconnected", () => {
      const { connectionState } = useChat({
        sessionId: "session-1",
        autoFetch: false,
      });

      expect(connectionState.value).toBe("disconnected");
    });
  });

  describe("callbacks", () => {
    it("should call onStreamStart and onStreamEnd", async () => {
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(
              'data: {"type":"done","data":""}\n\n',
            ),
          })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const onStreamStart = vi.fn();
      const onStreamEnd = vi.fn();

      const { sendMessage } = useChat({
        sessionId: "session-1",
        config: {
          enable_streaming: true,
        },
        onStreamStart,
        onStreamEnd,
        autoFetch: false,
      });

      await sendMessage("Test");

      expect(onStreamStart).toHaveBeenCalled();
      expect(onStreamEnd).toHaveBeenCalled();
    });
  });
});
