import { describe, it, expect, beforeEach } from "vitest";
import { reset_storage, create_session, get_session } from "../../../utils/storage";
import handler from "../index.post";

describe("POST /api/messages handler", () => {
  beforeEach(() => {
    // Ensure clean state before each test
    reset_storage();
  });

  it("sends a user message and generates assistant response", async () => {
    const session = await create_session({ title: "Chat Test" });

    const res = await handler({
      body: {
        session_id: session.id,
        content: "Hello, how are you?",
      },
    } as any);

    expect(res).toHaveProperty("message");
    expect(res.message).toHaveProperty("id");
    expect(res.message.session_id).toBe(session.id);
    expect(res.message.role).toBe("user");
    expect(res.message.content).toBe("Hello, how are you?");
    expect(res.message).toHaveProperty("timestamp");

    // Verify both messages were added to the session
    const updated = await get_session(session.id);
    expect(updated?.messages.length).toBe(2);
    expect(updated?.messages[0].role).toBe("user");
    expect(updated?.messages[0].content).toBe("Hello, how are you?");
    expect(updated?.messages[1].role).toBe("assistant");
    expect(updated?.messages[1].content.length).toBeGreaterThan(0);
  });

  it("returns 404 when session does not exist", async () => {
    await expect(
      handler({
        body: {
          session_id: "non-existent-id",
          content: "Hello",
        },
      } as any)
    ).rejects.toThrow("Session not found");
  });

  it("returns 400 when session_id is missing", async () => {
    await expect(
      handler({
        body: {
          content: "Hello",
        },
      } as any)
    ).rejects.toThrow("session_id and content are required");
  });

  it("returns 400 when content is missing", async () => {
    const session = await create_session({ title: "Test" });

    await expect(
      handler({
        body: {
          session_id: session.id,
        },
      } as any)
    ).rejects.toThrow("session_id and content are required");
  });

  it("returns 400 when content is empty string", async () => {
    const session = await create_session({ title: "Test" });

    await expect(
      handler({
        body: {
          session_id: session.id,
          content: "   ",
        },
      } as any)
    ).rejects.toThrow("content cannot be empty");
  });

  it("returns 400 when session_id is not a string", async () => {
    await expect(
      handler({
        body: {
          session_id: 123,
          content: "Hello",
        },
      } as any)
    ).rejects.toThrow("session_id and content must be strings");
  });

  it("returns 400 when content is not a string", async () => {
    const session = await create_session({ title: "Test" });

    await expect(
      handler({
        body: {
          session_id: session.id,
          content: 456,
        },
      } as any)
    ).rejects.toThrow("session_id and content must be strings");
  });

  it("handles multiple messages in a conversation", async () => {
    const session = await create_session({ title: "Conversation Test" });

    // First message
    await handler({
      body: {
        session_id: session.id,
        content: "What is this PDF about?",
      },
    } as any);

    // Second message
    await handler({
      body: {
        session_id: session.id,
        content: "Can you summarize it?",
      },
    } as any);

    // Third message
    await handler({
      body: {
        session_id: session.id,
        content: "Thank you!",
      },
    } as any);

    // Verify all messages were added (3 user + 3 assistant = 6 total)
    const updated = await get_session(session.id);
    expect(updated?.messages.length).toBe(6);
    expect(updated?.messages[0].content).toBe("What is this PDF about?");
    expect(updated?.messages[2].content).toBe("Can you summarize it?");
    expect(updated?.messages[4].content).toBe("Thank you!");
  });

  it("generates deterministic assistant responses", async () => {
    const session = await create_session({ title: "Deterministic Test" });

    // Send same message twice to same session
    await handler({
      body: {
        session_id: session.id,
        content: "Test message",
      },
    } as any);

    await handler({
      body: {
        session_id: session.id,
        content: "Test message",
      },
    } as any);

    const updated = await get_session(session.id);
    // Should have 4 messages (2 user + 2 assistant)
    expect(updated?.messages.length).toBe(4);

    // Assistant responses should be the same (deterministic based on session_id)
    const firstAssistantMsg = updated?.messages[1].content;
    const secondAssistantMsg = updated?.messages[3].content;
    expect(firstAssistantMsg).toBe(secondAssistantMsg);
  });

  it("updates session updated_at timestamp", async () => {
    const session = await create_session({ title: "Timestamp Test" });
    const beforeTime = new Date(session.updated_at).getTime();

    // Small delay to ensure timestamp changes
    await new Promise((resolve) => setTimeout(resolve, 10));

    await handler({
      body: {
        session_id: session.id,
        content: "Update timestamp",
      },
    } as any);

    const updated = await get_session(session.id);
    const afterTime = new Date(updated!.session.updated_at).getTime();
    expect(afterTime).toBeGreaterThan(beforeTime);
  });

  it("verifies snake_case fields in returned message", async () => {
    const session = await create_session({ title: "Fields Test" });

    const res = await handler({
      body: {
        session_id: session.id,
        content: "Test",
      },
    } as any);

    // Verify message has snake_case fields
    expect(res.message).toHaveProperty("session_id");
    expect(res.message.session_id).toBe(session.id);
    expect(res.message).not.toHaveProperty("sessionId");
  });
});
