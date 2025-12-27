/**
 * Mock chatbot utility
 *
 * Provides:
 * - generate_response(session_id, prompt): Promise<string>
 * - stream_response(session_id, prompt, options?): AsyncGenerator<StreamEvent>
 *
 * Notes:
 * - This is a lightweight mock for local development and testing.
 * - The stream_response function simulates token-by-token streaming (SSE friendly).
 * - All data shapes use snake_case for compatibility with FastAPI convention.
 */

import type { StreamEvent } from "../types/api";

/**
 * Options for streaming behavior
 */
export interface StreamOptions {
  /**
   * Delay between tokens in milliseconds.
   * Default: 80ms
   */
  token_delay_ms?: number;

  /**
   * Max token length (how many characters per chunk).
   * Default: 8 chars per token approximation
   */
  token_chunk_size?: number;
}

/* ---------------------------
 * Helper utilities
 * --------------------------- */

/**
 * Simple deterministic pseudo-random number generator (for consistent mock variance)
 * Uses a multiplicative linear congruential generator.
 */
function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Very small tokenizer: split by space and further chunk by characters to simulate tokens.
 */
function tokenize(text: string, chunk_size = 8): string[] {
  // basic split into words, then further split long words into character chunks
  const words = text.split(/\s+/).filter(Boolean);
  const tokens: string[] = [];
  for (const w of words) {
    if (w.length <= chunk_size) {
      tokens.push(w);
    } else {
      // split by chunk_size characters
      for (let i = 0; i < w.length; i += chunk_size) {
        tokens.push(w.slice(i, i + chunk_size));
      }
    }
  }
  return tokens;
}

/* ---------------------------
 * Mock response generation
 * --------------------------- */

/**
 * Create a deterministic mock response based on prompt and session_id.
 * This function is intentionally simple: keyword matching + template responses.
 *
 * @param session_id - id of the session (used to seed pseudo-randomness)
 * @param prompt - user prompt
 * @returns generated text
 */
export async function generate_response(
  session_id: string,
  prompt: string,
): Promise<string> {
  // lightweight processing delay to simulate some work
  await sleep(50);

  const seed = [...session_id].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rnd = mulberry32(seed);

  const lower = (prompt || "").toLowerCase();

  if (
    lower.includes("summarize") ||
    lower.includes("summary") ||
    lower.includes("summarise")
  ) {
    return "This document provides an overview of the main concepts, with sections detailing the background, methodology, and conclusions. Key takeaways: clear problem statement, step-by-step methods, and recommended next steps.";
  }

  if (lower.includes("hello") || lower.includes("hi")) {
    return "Hello! How can I help you with this PDF today?";
  }

  if (lower.includes("what") && lower.includes("pdf")) {
    return "I can read the PDF's metadata and content (if uploaded). Ask me to summarize, find keywords, or extract specific sections.";
  }

  // default: echo with slight variations using pseudo-randomness
  const templates = [
    "I reviewed the PDF and here are some points: %s",
    "Based on the content, the document focuses on: %s",
    "Here's a brief summary: %s",
    "High level: %s",
  ];

  const picks = [
    "introduction and objectives",
    "background and related work",
    "methodology and experiments",
    "results and conclusions",
    "recommendations and next steps",
  ];

  const chosenTemplate = templates[Math.floor(rnd() * templates.length)];
  // pick 2 topics
  const topicA = picks[Math.floor(rnd() * picks.length)];
  const topicB = picks[Math.floor(rnd() * picks.length)];
  const body = `${topicA}${topicA === topicB ? "" : " and " + topicB}`;

  return chosenTemplate.replace("%s", body);
}

/* ---------------------------
 * Streaming generator
 * --------------------------- */

/**
 * Stream a response token-by-token as an async generator.
 * Each yielded value is a StreamEvent ({ type, data }).
 *
 * Usage (server SSE handler):
 *   for await (const evt of stream_response(session_id, prompt)) {
 *     // write SSE event to client
 *   }
 *
 * @param session_id - session id to seed deterministic output
 * @param prompt - user prompt
 * @param options - stream options
 */
export async function* stream_response(
  session_id: string,
  prompt: string,
  options: StreamOptions = {},
): AsyncGenerator<StreamEvent, void, unknown> {
  const token_delay_ms = options.token_delay_ms ?? 80;
  const chunk_size = options.token_chunk_size ?? 8;

  try {
    // First, generate a full response (fast mock)
    const full = await generate_response(session_id, prompt);

    // If the response is very short, just yield it as a single token
    if (!full || full.trim().length === 0) {
      yield { type: "done", data: "" };
      return;
    }

    // Create tokens
    const tokens = tokenize(full, chunk_size);

    // Simulate streaming tokens with delay
    for (const t of tokens) {
      // simulate small variance
      await sleep(token_delay_ms);
      yield { type: "token", data: t };
    }

    // final done event
    await sleep(20);
    yield { type: "done", data: "" };
  } catch (err) {
    // If something goes wrong, yield an error event
    const msg =
      err instanceof Error ? `${err.message}` : "unknown error in chatbot";
    yield { type: "error", data: msg };
    // After error, send done to mark end of stream (optional)
    yield { type: "done", data: "" };
  }
}
