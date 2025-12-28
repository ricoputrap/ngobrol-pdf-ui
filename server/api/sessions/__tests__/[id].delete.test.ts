import { describe, it, expect, beforeEach } from "vitest";
import { reset_storage, create_session, add_message, get_session } from "../../../utils/storage";
import handler from "../[id].delete";

describe("DELETE /api/sessions/:id handler", () => {
  beforeEach(() => {
    // Ensure clean state before each test
    reset_storage();
  });

  it("deletes an existing session and returns 204 No Content", async () => {
    // Create a session
    const session = await create_session({ title: "To Be Deleted" });
    await add_message({ session_id: session.id, content: "Test message" }, "user");

    // Delete the session
    const res = await handler({
      context: { params: { id: session.id } },
      node: { res: { statusCode: 200 } },
    } as any);

    // Should return null (no body)
    expect(res).toBeNull();

    // Verify session is deleted
    const result = await get_session(session.id);
    expect(result).toBeNull();
  });

  it("returns 404 when trying to delete non-existent session", async () => {
    const nonExistentId = "non-existent-id";

    await expect(
      handler({
        context: { params: { id: nonExistentId } },
        node: { res: { statusCode: 200 } },
      } as any)
    ).rejects.toThrow("Session not found");
  });

  it("returns 400 when id parameter is missing", async () => {
    await expect(
      handler({
        context: { params: {} },
        node: { res: { statusCode: 200 } },
      } as any)
    ).rejects.toThrow("Session ID is required");
  });

  it("deletes session and all associated messages", async () => {
    // Create a session with multiple messages
    const session = await create_session({ title: "Session with Messages" });
    await add_message({ session_id: session.id, content: "Message 1" }, "user");
    await add_message({ session_id: session.id, content: "Message 2" }, "assistant");
    await add_message({ session_id: session.id, content: "Message 3" }, "user");

    // Verify messages exist
    const beforeDelete = await get_session(session.id);
    expect(beforeDelete).not.toBeNull();
    expect(beforeDelete?.messages.length).toBe(3);

    // Delete the session
    const res = await handler({
      context: { params: { id: session.id } },
      node: { res: { statusCode: 200 } },
    } as any);

    expect(res).toBeNull();

    // Verify session and all messages are deleted
    const afterDelete = await get_session(session.id);
    expect(afterDelete).toBeNull();
  });

  it("deleting one session does not affect other sessions", async () => {
    // Create multiple sessions
    const session1 = await create_session({ title: "Session 1" });
    const session2 = await create_session({ title: "Session 2" });
    await add_message({ session_id: session1.id, content: "Message in session 1" }, "user");
    await add_message({ session_id: session2.id, content: "Message in session 2" }, "user");

    // Delete session 1
    await handler({
      context: { params: { id: session1.id } },
      node: { res: { statusCode: 200 } },
    } as any);

    // Verify session 1 is deleted
    const result1 = await get_session(session1.id);
    expect(result1).toBeNull();

    // Verify session 2 still exists with its message
    const result2 = await get_session(session2.id);
    expect(result2).not.toBeNull();
    expect(result2?.session.id).toBe(session2.id);
    expect(result2?.messages.length).toBe(1);
    expect(result2?.messages[0].content).toBe("Message in session 2");
  });
});
