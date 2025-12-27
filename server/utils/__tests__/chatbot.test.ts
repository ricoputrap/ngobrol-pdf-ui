import { describe, it, expect } from "vitest";
import { generate_response, stream_response } from "../chatbot";

describe("server/utils/chatbot", () => {
  it("generate_response returns a greeting for hello prompt", async () => {
    const resp = await generate_response("sess-hello", "Hello");
    expect(typeof resp).toBe("string");
    expect(resp.length).toBeGreaterThan(0);
    // The mock returns a greeting that includes "Hello"
    expect(resp.toLowerCase()).toContain("hello");
  });

  it("generate_response is deterministic for the same session_id and prompt", async () => {
    const sessionId = "sess-deterministic";
    const prompt = "Please summarize the document";
    const r1 = await generate_response(sessionId, prompt);
    const r2 = await generate_response(sessionId, prompt);
    expect(r1).toBe(r2);
  });

  it("stream_response yields token events followed by a done event", async () => {
    const sessionId = "sess-stream";
    const prompt = "Hello";

    // Use options to make stream fast and produce few tokens
    const options = { token_delay_ms: 0, token_chunk_size: 128 };

    const events: { type: string; data: string }[] = [];
    for await (const evt of stream_response(sessionId, prompt, options)) {
      events.push(evt as { type: string; data: string });
    }

    const tokenEvents = events.filter((e) => e.type === "token");
    const doneEvents = events.filter((e) => e.type === "done");
    const errorEvents = events.filter((e) => e.type === "error");

    expect(tokenEvents.length).toBeGreaterThan(0);
    expect(doneEvents.length).toBeGreaterThanOrEqual(1);
    expect(errorEvents.length).toBe(0);

    for (const t of tokenEvents) {
      expect(typeof t.data).toBe("string");
      expect(t.data.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("stream_response tokens concatenate to the generated full response (ignoring whitespace)", async () => {
    const sessionId = "sess-join";
    const prompt = "What is in the PDF?";
    // Make fewer tokens by increasing chunk size and removing delay
    const options = { token_delay_ms: 0, token_chunk_size: 256 };

    const full = await generate_response(sessionId, prompt);

    const tokens: string[] = [];
    for await (const evt of stream_response(sessionId, prompt, options)) {
      if (evt.type === "token") tokens.push(evt.data);
      if (evt.type === "error") {
        // fail early if error emitted
        throw new Error(
          "Unexpected error event from stream_response: " + evt.data,
        );
      }
    }

    // Normalize by removing whitespace and compare
    const fullNoSpace = full.replace(/\s+/g, "");
    const tokensJoined = tokens.join("").replace(/\s+/g, "");
    expect(tokensJoined).toBe(fullNoSpace);
  });
});
