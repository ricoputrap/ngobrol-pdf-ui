import { describe, it, expect, beforeEach } from "vitest";
import { reset_storage, create_session } from "../../../utils/storage";
import handler from "../stream.get";

describe("GET /api/messages/stream handler", () => {
  beforeEach(() => {
    // Ensure clean state before each test
    reset_storage();
  });

  it("streams a response with token and done events", async () => {
    const session = await create_session({ title: "Stream Test" });

    const stream = await handler({
      query: {
        session_id: session.id,
        prompt: "Hello",
      },
    } as any);

    expect(stream).toBeInstanceOf(ReadableStream);

    // Read the stream
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    const events: Array<{ type: string; data: string }> = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      // Parse SSE format: data: {...}\n\n
      const lines = chunk.split("\n\n").filter((line) => line.startsWith("data: "));
      for (const line of lines) {
        const jsonStr = line.replace("data: ", "");
        try {
          const event = JSON.parse(jsonStr);
          events.push(event);
        } catch {
          // Ignore parse errors
        }
      }
    }

    // Verify we got token events and a done event
    const tokenEvents = events.filter((e) => e.type === "token");
    const doneEvents = events.filter((e) => e.type === "done");
    const errorEvents = events.filter((e) => e.type === "error");

    expect(tokenEvents.length).toBeGreaterThan(0);
    expect(doneEvents.length).toBeGreaterThanOrEqual(1);
    expect(errorEvents.length).toBe(0);
  });

  it("returns 400 when session_id is missing", async () => {
    await expect(
      handler({
        query: {
          prompt: "Hello",
        },
      } as any)
    ).rejects.toThrow("session_id query parameter is required");
  });

  it("returns 400 when prompt is missing", async () => {
    const session = await create_session({ title: "Test" });

    await expect(
      handler({
        query: {
          session_id: session.id,
        },
      } as any)
    ).rejects.toThrow("prompt query parameter is required");
  });

  it("returns 400 when prompt is empty", async () => {
    const session = await create_session({ title: "Test" });

    await expect(
      handler({
        query: {
          session_id: session.id,
          prompt: "   ",
        },
      } as any)
    ).rejects.toThrow("prompt cannot be empty");
  });

  it("returns 404 when session does not exist", async () => {
    await expect(
      handler({
        query: {
          session_id: "non-existent-id",
          prompt: "Hello",
        },
      } as any)
    ).rejects.toThrow("Session not found");
  });

  it("streams deterministic responses for same session and prompt", async () => {
    const session = await create_session({ title: "Deterministic Stream Test" });

    // First stream
    const stream1 = await handler({
      query: {
        session_id: session.id,
        prompt: "Test prompt",
      },
    } as any);

    const reader1 = stream1.getReader();
    const decoder1 = new TextDecoder();
    const tokens1: string[] = [];

    while (true) {
      const { done, value } = await reader1.read();
      if (done) break;

      const chunk = decoder1.decode(value);
      const lines = chunk.split("\n\n").filter((line) => line.startsWith("data: "));
      for (const line of lines) {
        const jsonStr = line.replace("data: ", "");
        try {
          const event = JSON.parse(jsonStr);
          if (event.type === "token") {
            tokens1.push(event.data);
          }
        } catch {
          // Ignore
        }
      }
    }

    // Second stream with same parameters
    const stream2 = await handler({
      query: {
        session_id: session.id,
        prompt: "Test prompt",
      },
    } as any);

    const reader2 = stream2.getReader();
    const decoder2 = new TextDecoder();
    const tokens2: string[] = [];

    while (true) {
      const { done, value } = await reader2.read();
      if (done) break;

      const chunk = decoder2.decode(value);
      const lines = chunk.split("\n\n").filter((line) => line.startsWith("data: "));
      for (const line of lines) {
        const jsonStr = line.replace("data: ", "");
        try {
          const event = JSON.parse(jsonStr);
          if (event.type === "token") {
            tokens2.push(event.data);
          }
        } catch {
          // Ignore
        }
      }
    }

    // Tokens should be the same (deterministic)
    expect(tokens1.join("")).toBe(tokens2.join(""));
  });

  it("includes message_id in query parameters (optional)", async () => {
    const session = await create_session({ title: "Message ID Test" });

    const stream = await handler({
      query: {
        session_id: session.id,
        prompt: "Hello",
        message_id: "msg-123",
      },
    } as any);

    expect(stream).toBeInstanceOf(ReadableStream);

    // Read and verify stream works
    const reader = stream.getReader();
    const { done, value } = await reader.read();

    expect(value).toBeDefined();
    reader.cancel();
  });
});
