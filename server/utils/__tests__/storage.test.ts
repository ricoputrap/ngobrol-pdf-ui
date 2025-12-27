import { describe, it, expect, beforeEach } from "vitest";
import {
  list_sessions,
  create_session,
  get_session,
  delete_session,
  save_pdf_file_name,
  add_message,
  list_messages_by_session,
  reset_storage,
  seed_sample_data,
} from "../storage";

describe("server/utils/storage (in-memory)", () => {
  beforeEach(() => {
    // Ensure a clean slate before each test
    reset_storage();
  });

  it("creates a session and lists it", async () => {
    const session = await create_session({ title: "Test Session" });
    expect(session).toHaveProperty("id");
    expect(session.title).toBe("Test Session");
    expect(session.pdf_file_name).toBeNull();
    expect(session).toHaveProperty("created_at");
    expect(session).toHaveProperty("updated_at");

    const sessions = await list_sessions();
    expect(Array.isArray(sessions)).toBe(true);
    expect(sessions.length).toBe(1);
    expect(sessions[0].id).toBe(session.id);
  });

  it("retrieves a session with empty messages initially", async () => {
    const session = await create_session({ title: "Get Session" });
    const result = await get_session(session.id);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.session.id).toBe(session.id);
      expect(Array.isArray(result.messages)).toBe(true);
      expect(result.messages.length).toBe(0);
    }
  });

  it("saves pdf file name and updates updated_at", async () => {
    const session = await create_session({ title: "Upload Test" });
    const beforeTime = new Date(session.updated_at).getTime();

    // Small delay to ensure timestamp changes
    await new Promise((resolve) => setTimeout(resolve, 10));

    const updated = await save_pdf_file_name(session.id, "doc.pdf");
    expect(updated).not.toBeNull();
    if (updated) {
      expect(updated.pdf_file_name).toBe("doc.pdf");
      const afterTime = new Date(updated.updated_at).getTime();
      expect(afterTime).toBeGreaterThanOrEqual(beforeTime);
    }
  });

  it("adds a message to a session and lists messages", async () => {
    const session = await create_session({ title: "Message Test" });

    const msg = await add_message(
      { session_id: session.id, content: "Hello world" },
      "user",
    );

    expect(msg).toHaveProperty("id");
    expect(msg.session_id).toBe(session.id);
    expect(msg.role).toBe("user");
    expect(msg.content).toBe("Hello world");
    expect(msg).toHaveProperty("timestamp");

    const msgs = await list_messages_by_session(session.id);
    expect(msgs.length).toBe(1);
    expect(msgs[0].id).toBe(msg.id);
  });

  it("supports limit and offset when listing messages", async () => {
    const session = await create_session({ title: "Paging Test" });

    // Add 5 messages
    for (let i = 1; i <= 5; i++) {
      await add_message(
        { session_id: session.id, content: `msg ${i}` },
        i % 2 === 0 ? "assistant" : "user",
      );
    }

    const all = await list_messages_by_session(session.id);
    expect(all.length).toBe(5);

    const firstTwo = await list_messages_by_session(session.id, 2, 0);
    expect(firstTwo.length).toBe(2);
    expect(firstTwo[0].content).toBe("msg 1");

    const offsetTwo = await list_messages_by_session(session.id, 2, 2);
    expect(offsetTwo.length).toBe(2);
    expect(offsetTwo[0].content).toBe("msg 3");
  });

  it("deletes a session and its messages", async () => {
    const session = await create_session({ title: "Delete Test" });
    await add_message(
      { session_id: session.id, content: "to be deleted" },
      "user",
    );

    const deleted = await delete_session(session.id);
    expect(deleted).toBe(true);

    const result = await get_session(session.id);
    expect(result).toBeNull();

    const sessions = await list_sessions();
    expect(sessions.find((s) => s.id === session.id)).toBeUndefined();
  });

  it("reset_storage clears seeded data", async () => {
    const seeded = await seed_sample_data();
    expect(seeded.length).toBeGreaterThanOrEqual(2);

    // after seeding there should be sessions
    const before = await list_sessions();
    expect(before.length).toBeGreaterThanOrEqual(2);

    // reset and check
    reset_storage();
    const after = await list_sessions();
    expect(after.length).toBe(0);
  });
});
