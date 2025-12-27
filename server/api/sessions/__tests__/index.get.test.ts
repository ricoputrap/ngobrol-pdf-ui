import { describe, it, expect, beforeEach } from "vitest";
import { reset_storage, seed_sample_data } from "../../../utils/storage";
import handler from "../index.get";

describe("GET /api/sessions handler", () => {
  beforeEach(() => {
    // Ensure clean state before each test
    reset_storage();
  });

  it("returns an empty sessions list when storage is empty", async () => {
    const res = await handler({} as any);
    expect(res).toHaveProperty("sessions");
    expect(Array.isArray(res.sessions)).toBe(true);
    expect(res.sessions.length).toBe(0);
  });

  it("returns seeded sessions list with expected fields", async () => {
    // Seed sample data
    const seeded = await seed_sample_data();
    expect(seeded.length).toBeGreaterThanOrEqual(2);

    const res = await handler({} as any);
    expect(res).toHaveProperty("sessions");
    expect(Array.isArray(res.sessions)).toBe(true);
    expect(res.sessions.length).toBeGreaterThanOrEqual(2);

    const session = res.sessions[0];
    // Verify snake_case fields exist
    expect(session).toHaveProperty("id");
    expect(session).toHaveProperty("title");
    expect(session).toHaveProperty("pdf_file_name");
    expect(session).toHaveProperty("created_at");
    expect(session).toHaveProperty("updated_at");
  });
});
