import { describe, it, expect } from "vitest";
import handler from "../health.get";

describe("GET /api/health handler", () => {
  it("returns status ok", async () => {
    const res = await handler({} as any);

    expect(res).toHaveProperty("status");
    expect(res.status).toBe("ok");
  });

  it("returns current timestamp", async () => {
    const beforeTime = Date.now();
    const res = await handler({} as any);
    const afterTime = Date.now();

    expect(res).toHaveProperty("timestamp");
    expect(typeof res.timestamp).toBe("string");

    // Verify timestamp is in ISO format
    const timestamp = new Date(res.timestamp).getTime();
    expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
    expect(timestamp).toBeLessThanOrEqual(afterTime);
  });

  it("returns valid ISO 8601 timestamp format", async () => {
    const res = await handler({} as any);

    // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    expect(res.timestamp).toMatch(isoRegex);
  });

  it("returns consistent response structure", async () => {
    const res = await handler({} as any);

    // Verify only expected fields are present
    const keys = Object.keys(res);
    expect(keys).toEqual(["status", "timestamp"]);
  });

  it("works without any event parameter dependencies", async () => {
    // Health check should not depend on any event properties
    const res1 = await handler({} as any);
    const res2 = await handler(null as any);
    const res3 = await handler(undefined as any);

    expect(res1.status).toBe("ok");
    expect(res2.status).toBe("ok");
    expect(res3.status).toBe("ok");
  });
});
