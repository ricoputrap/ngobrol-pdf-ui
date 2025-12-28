import { describe, it, expect, beforeEach } from "vitest";
import { reset_storage, create_session, add_message } from "../../../utils/storage";
import handler from "../[id].get";

describe("GET /api/sessions/:id handler", () => {
  beforeEach(() => {
    // Ensure clean state before each test
    reset_storage();
  });

  it("retrieves a session with its messages", async () => {
    // Create a session
    const session = await create_session({ title: "Test Session" });

    // Add some messages
    await add_message({ session_id: session.id, content: "Hello" }, "user");
    await add_message({ session_id: session.id, content: "Hi there!" }, "assistant");

    const res = await handler({
      context: { params: { id: session.id } },
    } as any);

    expect(res).toHaveProperty("session");
    expect(res).toHaveProperty("messages");
    expect(res.session.id).toBe(session.id);
    expect(res.session.title).toBe("Test Session");
    expect(Array.isArray(res.messages)).toBe(true);
    expect(res.messages.length).toBe(2);
    expect(res.messages[0].content).toBe("Hello");
    expect(res.messages[0].role).toBe("user");
    expect(res.messages[1].content).toBe("Hi there!");
    expect(res.messages[1].role).toBe("assistant");
  });

  it("retrieves a session with no messages", async () => {
    const session = await create_session({ title: "Empty Session" });

    const res = await handler({
      context: { params: { id: session.id } },
    } as any);

    expect(res).toHaveProperty("session");
    expect(res).toHaveProperty("messages");
    expect(res.session.id).toBe(session.id);
    expect(res.messages.length).toBe(0);
  });

  it("returns 404 when session does not exist", async () => {
    const nonExistentId = "non-existent-id";

    await expect(
      handler({
        context: { params: { id: nonExistentId } },
      } as any)
    ).rejects.toThrow("Session not found");
  });

  it("returns 400 when id parameter is missing", async () => {
    await expect(
      handler({
        context: { params: {} },
      } as any)
    ).rejects.toThrow("Session ID is required");
  });

  it("verifies snake_case fields in response", async () => {
    const session = await create_session({ title: "Field Test" });
    await add_message({ session_id: session.id, content: "Test message" }, "user");

    const res = await handler({
      context: { params: { id: session.id } },
    } as any);

    // Verify session has snake_case fields
    expect(res.session).toHaveProperty("pdf_file_name");
    expect(res.session).toHaveProperty("created_at");
    expect(res.session).toHaveProperty("updated_at");

    // Verify message has snake_case fields
    expect(res.messages[0]).toHaveProperty("session_id");
    expect(res.messages[0].session_id).toBe(session.id);
  });
});
