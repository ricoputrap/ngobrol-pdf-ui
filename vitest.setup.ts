import { vi } from "vitest";

// Mock Nuxt's auto-imported defineEventHandler
globalThis.defineEventHandler = vi.fn((handler: Function) => handler);

// Mock h3's createError
vi.mock("h3", async () => {
  const actual = await vi.importActual<typeof import("h3")>("h3");
  return {
    ...actual,
    createError: vi.fn(
      (opts: { statusCode: number; statusMessage: string; data?: any }) => {
        const error = new Error(opts.statusMessage || "Error");
        (error as any).statusCode = opts.statusCode;
        (error as any).data = opts.data;
        return error;
      }
    ),
  };
});
