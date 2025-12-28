import { vi } from "vitest";

// Mock Nuxt's auto-imported defineEventHandler
globalThis.defineEventHandler = vi.fn((handler: Function) => handler);

// Mock Nuxt's auto-imported readBody
globalThis.readBody = vi.fn(async (event: any) => {
  return event.body || {};
});

// Mock Nuxt's auto-imported getRouterParam
globalThis.getRouterParam = vi.fn((event: any, name: string) => {
  return event?.context?.params?.[name] || null;
});

// Mock Nuxt's auto-imported getQuery
globalThis.getQuery = vi.fn((event: any) => {
  return event.query || {};
});

// Mock Nuxt's auto-imported readMultipartFormData
globalThis.readMultipartFormData = vi.fn(async (event: any) => {
  return event.multipartData || [];
});

// Mock h3's createError and setResponseStatus
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
      },
    ),
    setResponseStatus: vi.fn((event: any, status: number) => {
      if (event?.node?.res) {
        event.node.res.statusCode = status;
      }
    }),
    setResponseHeaders: vi.fn((event: any, headers: Record<string, string>) => {
      if (event?.node?.res) {
        event.node.res.headers = { ...event.node.res.headers, ...headers };
      }
    }),
  };
});
