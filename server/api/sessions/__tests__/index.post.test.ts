import { describe, it, expect, beforeEach } from "vitest";
import { reset_storage } from "../../../utils/storage";
import handler from "../index.post";

describe("POST /api/sessions handler", () => {
  beforeEach(() => {
    // Ensure clean state before each test
    reset_storage();
  });

  it("creates a new session with default title when no body provided", async () => {
    const res = await handler({ body: {} } as any);
    expect(res).toHaveProperty("session");
    expect(res.session).toHaveProperty("id");
    expect(res.session.title).toBe("Untitled Session");
    expect(res.session.pdf_file_name).toBeNull();
    expect(res.session).toHaveProperty("created_at");
    expect(res.session).toHaveProperty("updated_at");
  });

  it("creates a new session with custom title", async () => {
    const res = await handler({
      body: { title: "My Custom Session" },
    } as any);
    expect(res).toHaveProperty("session");
    expect(res.session).toHaveProperty("id");
    expect(res.session.title).toBe("My Custom Session");
    expect(res.session.pdf_file_name).toBeNull();
  });

  it("creates multiple sessions with unique IDs", async () => {
    const res1 = await handler({ body: { title: "Session 1" } } as any);
    const res2 = await handler({ body: { title: "Session 2" } } as any);

    expect(res1.session.id).not.toBe(res2.session.id);
    expect(res1.session.title).toBe("Session 1");
    expect(res2.session.title).toBe("Session 2");
  });

  it("sets created_at and updated_at timestamps", async () => {
    const beforeTime = Date.now();
    const res = await handler({ body: { title: "Time Test" } } as any);
    const afterTime = Date.now();

    const createdTime = new Date(res.session.created_at).getTime();
    const updatedTime = new Date(res.session.updated_at).getTime();

    expect(createdTime).toBeGreaterThanOrEqual(beforeTime);
    expect(createdTime).toBeLessThanOrEqual(afterTime);
    expect(updatedTime).toBe(createdTime);
  });
});
