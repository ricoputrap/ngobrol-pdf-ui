/**
 * Tests for chat module types and helper functions
 */

import { describe, it, expect } from "vitest";
import {
  DEFAULT_CHAT_CONFIG,
  validateMessageContent,
  createEmptyChatState,
  createUserMessage,
  createAssistantMessage,
  createStreamingMessage,
  isTokenEvent,
  isDoneEvent,
  isErrorEvent,
  type SSEEvent,
  type SSETokenEvent,
  type SSEDoneEvent,
  type SSEErrorEvent,
  type Message,
  type StreamingMessage,
  type ChatState,
  type ChatConfig,
  type MessageSendState,
  type ChatConnectionState,
  type SSEEventType,
} from "../types";

describe("Chat Types", () => {
  describe("SSEEventType", () => {
    it("should include all expected event types", () => {
      const tokenType: SSEEventType = "token";
      const doneType: SSEEventType = "done";
      const errorType: SSEEventType = "error";

      expect(tokenType).toBe("token");
      expect(doneType).toBe("done");
      expect(errorType).toBe("error");
    });
  });

  describe("SSEEvent interfaces", () => {
    it("should create valid token event", () => {
      const event: SSETokenEvent = {
        type: "token",
        data: "Hello",
      };

      expect(event.type).toBe("token");
      expect(event.data).toBe("Hello");
    });

    it("should create valid done event", () => {
      const event: SSEDoneEvent = {
        type: "done",
        data: "",
      };

      expect(event.type).toBe("done");
      expect(event.data).toBe("");
    });

    it("should create valid error event", () => {
      const event: SSEErrorEvent = {
        type: "error",
        data: "Something went wrong",
      };

      expect(event.type).toBe("error");
      expect(event.data).toBe("Something went wrong");
    });
  });

  describe("MessageSendState", () => {
    it("should include all expected states", () => {
      const idle: MessageSendState = "idle";
      const sending: MessageSendState = "sending";
      const streaming: MessageSendState = "streaming";
      const error: MessageSendState = "error";

      expect(idle).toBe("idle");
      expect(sending).toBe("sending");
      expect(streaming).toBe("streaming");
      expect(error).toBe("error");
    });
  });

  describe("ChatConnectionState", () => {
    it("should include all expected states", () => {
      const disconnected: ChatConnectionState = "disconnected";
      const connecting: ChatConnectionState = "connecting";
      const connected: ChatConnectionState = "connected";
      const error: ChatConnectionState = "error";

      expect(disconnected).toBe("disconnected");
      expect(connecting).toBe("connecting");
      expect(connected).toBe("connected");
      expect(error).toBe("error");
    });
  });

  describe("StreamingMessage", () => {
    it("should extend Message with streaming properties", () => {
      const message: StreamingMessage = {
        id: "msg-1",
        session_id: "session-1",
        role: "assistant",
        content: "Hello, how can I help?",
        timestamp: "2024-01-15T10:30:00Z",
        is_streaming: true,
        streaming_progress: 50,
      };

      expect(message.id).toBe("msg-1");
      expect(message.session_id).toBe("session-1");
      expect(message.role).toBe("assistant");
      expect(message.content).toBe("Hello, how can I help?");
      expect(message.timestamp).toBe("2024-01-15T10:30:00Z");
      expect(message.is_streaming).toBe(true);
      expect(message.streaming_progress).toBe(50);
    });

    it("should allow null streaming_progress", () => {
      const message: StreamingMessage = {
        id: "msg-1",
        session_id: "session-1",
        role: "assistant",
        content: "",
        timestamp: "2024-01-15T10:30:00Z",
        is_streaming: false,
        streaming_progress: null,
      };

      expect(message.streaming_progress).toBeNull();
    });
  });

  describe("ChatState", () => {
    it("should have all required properties", () => {
      const state: ChatState = {
        messages: [],
        streaming_message: null,
        is_sending: false,
        is_streaming: false,
        error: null,
        connection_state: "disconnected",
      };

      expect(state.messages).toEqual([]);
      expect(state.streaming_message).toBeNull();
      expect(state.is_sending).toBe(false);
      expect(state.is_streaming).toBe(false);
      expect(state.error).toBeNull();
      expect(state.connection_state).toBe("disconnected");
    });

    it("should allow populated messages array", () => {
      const messages: Message[] = [
        {
          id: "msg-1",
          session_id: "session-1",
          role: "user",
          content: "Hello",
          timestamp: "2024-01-15T10:30:00Z",
        },
        {
          id: "msg-2",
          session_id: "session-1",
          role: "assistant",
          content: "Hi there!",
          timestamp: "2024-01-15T10:30:01Z",
        },
      ];

      const state: ChatState = {
        messages,
        streaming_message: null,
        is_sending: false,
        is_streaming: false,
        error: null,
        connection_state: "connected",
      };

      expect(state.messages).toHaveLength(2);
      expect(state.messages[0].role).toBe("user");
      expect(state.messages[1].role).toBe("assistant");
    });
  });

  describe("ChatConfig", () => {
    it("should have all required configuration options", () => {
      const config: ChatConfig = {
        max_message_length: 5000,
        min_message_length: 1,
        enable_streaming: true,
        auto_scroll: true,
        show_timestamps: true,
        timestamp_format: "relative",
      };

      expect(config.max_message_length).toBe(5000);
      expect(config.min_message_length).toBe(1);
      expect(config.enable_streaming).toBe(true);
      expect(config.auto_scroll).toBe(true);
      expect(config.show_timestamps).toBe(true);
      expect(config.timestamp_format).toBe("relative");
    });

    it("should support absolute timestamp format", () => {
      const config: ChatConfig = {
        max_message_length: 5000,
        min_message_length: 1,
        enable_streaming: false,
        auto_scroll: false,
        show_timestamps: true,
        timestamp_format: "absolute",
      };

      expect(config.timestamp_format).toBe("absolute");
    });
  });

  describe("DEFAULT_CHAT_CONFIG", () => {
    it("should have reasonable default values", () => {
      expect(DEFAULT_CHAT_CONFIG.max_message_length).toBe(10000);
      expect(DEFAULT_CHAT_CONFIG.min_message_length).toBe(1);
      expect(DEFAULT_CHAT_CONFIG.enable_streaming).toBe(true);
      expect(DEFAULT_CHAT_CONFIG.auto_scroll).toBe(true);
      expect(DEFAULT_CHAT_CONFIG.show_timestamps).toBe(true);
      expect(DEFAULT_CHAT_CONFIG.timestamp_format).toBe("relative");
    });

    it("should use snake_case for all properties", () => {
      const keys = Object.keys(DEFAULT_CHAT_CONFIG);

      keys.forEach((key) => {
        expect(key).toMatch(/^[a-z]+(_[a-z]+)*$/);
      });
    });
  });
});

describe("Helper Functions", () => {
  describe("validateMessageContent", () => {
    it("should validate valid message", () => {
      const result = validateMessageContent("Hello, how are you?");

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject empty message", () => {
      const result = validateMessageContent("");

      expect(result.valid).toBe(false);
      expect(result.error).toContain("at least 1 character");
    });

    it("should reject whitespace-only message", () => {
      const result = validateMessageContent("   ");

      expect(result.valid).toBe(false);
      expect(result.error).toContain("at least 1 character");
    });

    it("should reject message exceeding max length", () => {
      const longMessage = "a".repeat(10001);
      const result = validateMessageContent(longMessage);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("at most 10000 characters");
    });

    it("should accept message at max length boundary", () => {
      const maxMessage = "a".repeat(10000);
      const result = validateMessageContent(maxMessage);

      expect(result.valid).toBe(true);
    });

    it("should use custom config", () => {
      const customConfig: ChatConfig = {
        ...DEFAULT_CHAT_CONFIG,
        max_message_length: 100,
        min_message_length: 5,
      };

      const tooShort = validateMessageContent("Hi", customConfig);
      expect(tooShort.valid).toBe(false);
      expect(tooShort.error).toContain("at least 5 character");

      const tooLong = validateMessageContent("a".repeat(101), customConfig);
      expect(tooLong.valid).toBe(false);
      expect(tooLong.error).toContain("at most 100 characters");

      const valid = validateMessageContent("Hello there!", customConfig);
      expect(valid.valid).toBe(true);
    });

    it("should trim whitespace for validation", () => {
      const result = validateMessageContent("  Hello  ");

      expect(result.valid).toBe(true);
    });
  });

  describe("createEmptyChatState", () => {
    it("should create empty chat state with default values", () => {
      const state = createEmptyChatState();

      expect(state.messages).toEqual([]);
      expect(state.streaming_message).toBeNull();
      expect(state.is_sending).toBe(false);
      expect(state.is_streaming).toBe(false);
      expect(state.error).toBeNull();
      expect(state.connection_state).toBe("disconnected");
    });

    it("should create new instance each time", () => {
      const state1 = createEmptyChatState();
      const state2 = createEmptyChatState();

      expect(state1).not.toBe(state2);
      expect(state1.messages).not.toBe(state2.messages);
    });
  });

  describe("createUserMessage", () => {
    it("should create user message with required fields", () => {
      const message = createUserMessage("session-123", "Hello!");

      expect(message.session_id).toBe("session-123");
      expect(message.content).toBe("Hello!");
      expect(message.role).toBe("user");
      expect(message.id).toBeDefined();
      expect(message.id.startsWith("msg-")).toBe(true);
      expect(message.timestamp).toBeDefined();
    });

    it("should use provided id if given", () => {
      const message = createUserMessage("session-123", "Hello!", "custom-id");

      expect(message.id).toBe("custom-id");
    });

    it("should generate unique ids", () => {
      const msg1 = createUserMessage("session-1", "Hello");
      const msg2 = createUserMessage("session-1", "Hello");

      expect(msg1.id).not.toBe(msg2.id);
    });

    it("should generate valid ISO timestamp", () => {
      const message = createUserMessage("session-1", "Hello");
      const parsed = new Date(message.timestamp);

      expect(parsed.toISOString()).toBe(message.timestamp);
    });
  });

  describe("createAssistantMessage", () => {
    it("should create assistant message with required fields", () => {
      const message = createAssistantMessage("session-123", "How can I help?");

      expect(message.session_id).toBe("session-123");
      expect(message.content).toBe("How can I help?");
      expect(message.role).toBe("assistant");
      expect(message.id).toBeDefined();
      expect(message.timestamp).toBeDefined();
    });

    it("should default to empty content", () => {
      const message = createAssistantMessage("session-123");

      expect(message.content).toBe("");
    });

    it("should use provided id if given", () => {
      const message = createAssistantMessage(
        "session-123",
        "Hello",
        "custom-id",
      );

      expect(message.id).toBe("custom-id");
    });
  });

  describe("createStreamingMessage", () => {
    it("should add streaming properties to message", () => {
      const baseMessage: Message = {
        id: "msg-1",
        session_id: "session-1",
        role: "assistant",
        content: "Hello",
        timestamp: "2024-01-15T10:30:00Z",
      };

      const streaming = createStreamingMessage(baseMessage);

      expect(streaming.id).toBe("msg-1");
      expect(streaming.session_id).toBe("session-1");
      expect(streaming.role).toBe("assistant");
      expect(streaming.content).toBe("Hello");
      expect(streaming.timestamp).toBe("2024-01-15T10:30:00Z");
      expect(streaming.is_streaming).toBe(true);
      expect(streaming.streaming_progress).toBe(0);
    });

    it("should not mutate original message", () => {
      const baseMessage: Message = {
        id: "msg-1",
        session_id: "session-1",
        role: "assistant",
        content: "Hello",
        timestamp: "2024-01-15T10:30:00Z",
      };

      const streaming = createStreamingMessage(baseMessage);

      expect(baseMessage).not.toHaveProperty("is_streaming");
      expect(streaming).toHaveProperty("is_streaming");
    });
  });
});

describe("Type Guards", () => {
  describe("isTokenEvent", () => {
    it("should return true for token event", () => {
      const event: SSEEvent = { type: "token", data: "Hello" };

      expect(isTokenEvent(event)).toBe(true);
    });

    it("should return false for done event", () => {
      const event: SSEEvent = { type: "done", data: "" };

      expect(isTokenEvent(event)).toBe(false);
    });

    it("should return false for error event", () => {
      const event: SSEEvent = { type: "error", data: "Error" };

      expect(isTokenEvent(event)).toBe(false);
    });
  });

  describe("isDoneEvent", () => {
    it("should return true for done event", () => {
      const event: SSEEvent = { type: "done", data: "" };

      expect(isDoneEvent(event)).toBe(true);
    });

    it("should return false for token event", () => {
      const event: SSEEvent = { type: "token", data: "Hello" };

      expect(isDoneEvent(event)).toBe(false);
    });

    it("should return false for error event", () => {
      const event: SSEEvent = { type: "error", data: "Error" };

      expect(isDoneEvent(event)).toBe(false);
    });
  });

  describe("isErrorEvent", () => {
    it("should return true for error event", () => {
      const event: SSEEvent = { type: "error", data: "Something failed" };

      expect(isErrorEvent(event)).toBe(true);
    });

    it("should return false for token event", () => {
      const event: SSEEvent = { type: "token", data: "Hello" };

      expect(isErrorEvent(event)).toBe(false);
    });

    it("should return false for done event", () => {
      const event: SSEEvent = { type: "done", data: "" };

      expect(isErrorEvent(event)).toBe(false);
    });
  });

  describe("Type guard narrowing", () => {
    it("should narrow types correctly in conditional", () => {
      const events: SSEEvent[] = [
        { type: "token", data: "Hello" },
        { type: "token", data: " World" },
        { type: "done", data: "" },
      ];

      let tokenCount = 0;
      let doneCount = 0;

      events.forEach((event) => {
        if (isTokenEvent(event)) {
          tokenCount++;
          // TypeScript knows event.data is string here
          expect(typeof event.data).toBe("string");
        } else if (isDoneEvent(event)) {
          doneCount++;
          // TypeScript knows event.data is "" here
          expect(event.data).toBe("");
        }
      });

      expect(tokenCount).toBe(2);
      expect(doneCount).toBe(1);
    });
  });
});

describe("Snake Case Convention", () => {
  it("should use snake_case for Message fields", () => {
    const message: Message = {
      id: "msg-1",
      session_id: "session-1",
      role: "user",
      content: "Hello",
      timestamp: "2024-01-15T10:30:00Z",
    };

    expect(message).toHaveProperty("session_id");
  });

  it("should use snake_case for StreamingMessage fields", () => {
    const message: StreamingMessage = {
      id: "msg-1",
      session_id: "session-1",
      role: "assistant",
      content: "Hello",
      timestamp: "2024-01-15T10:30:00Z",
      is_streaming: true,
      streaming_progress: 50,
    };

    expect(message).toHaveProperty("is_streaming");
    expect(message).toHaveProperty("streaming_progress");
  });

  it("should use snake_case for ChatState fields", () => {
    const state = createEmptyChatState();

    expect(state).toHaveProperty("streaming_message");
    expect(state).toHaveProperty("is_sending");
    expect(state).toHaveProperty("is_streaming");
    expect(state).toHaveProperty("connection_state");
  });

  it("should use snake_case for ChatConfig fields", () => {
    expect(DEFAULT_CHAT_CONFIG).toHaveProperty("max_message_length");
    expect(DEFAULT_CHAT_CONFIG).toHaveProperty("min_message_length");
    expect(DEFAULT_CHAT_CONFIG).toHaveProperty("enable_streaming");
    expect(DEFAULT_CHAT_CONFIG).toHaveProperty("auto_scroll");
    expect(DEFAULT_CHAT_CONFIG).toHaveProperty("show_timestamps");
    expect(DEFAULT_CHAT_CONFIG).toHaveProperty("timestamp_format");
  });
});
