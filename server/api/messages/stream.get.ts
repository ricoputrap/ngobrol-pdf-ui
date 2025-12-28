/**
 * GET /api/messages/stream
 *
 * Streams an assistant response token-by-token using Server-Sent Events (SSE).
 *
 * Query Parameters:
 *   - session_id: string (required) - The session ID
 *   - message_id: string (optional) - The user message ID to respond to
 *   - prompt: string (required) - The user's prompt/question
 *
 * Response:
 *   Content-Type: text/event-stream
 *
 *   Stream format:
 *     data: {"type":"token","data":"Hello"}\n\n
 *     data: {"type":"token","data":" world"}\n\n
 *     data: {"type":"done","data":""}\n\n
 *
 * Event Types:
 *   - "token": A chunk of the assistant's response
 *   - "done": Signals the end of the stream
 *   - "error": An error occurred during generation
 *
 * Notes:
 * - Uses Server-Sent Events (SSE) protocol
 * - Creates typewriter effect for chat UI
 * - Uses mock chatbot for streaming in development
 * - Fields follow snake_case convention to match FastAPI backend
 */

import { createError, setResponseHeaders } from "h3";
import { get_session } from "../../utils/storage";
import { stream_response } from "../../utils/chatbot";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);

    // Validate query parameters
    if (!query.session_id || typeof query.session_id !== "string") {
      throw createError({
        statusCode: 400,
        statusMessage: "session_id query parameter is required",
      });
    }

    if (!query.prompt || typeof query.prompt !== "string") {
      throw createError({
        statusCode: 400,
        statusMessage: "prompt query parameter is required",
      });
    }

    if (query.prompt.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "prompt cannot be empty",
      });
    }

    // Check if session exists
    const session = await get_session(query.session_id);
    if (!session) {
      throw createError({
        statusCode: 404,
        statusMessage: "Session not found",
      });
    }

    // Set SSE headers
    setResponseHeaders(event, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });

    // Create the SSE stream response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          // Stream tokens from chatbot
          for await (const evt of stream_response(
            query.session_id as string,
            query.prompt as string
          )) {
            // Format as SSE event
            const sseData = `data: ${JSON.stringify(evt)}\n\n`;
            controller.enqueue(encoder.encode(sseData));
          }
        } catch (err) {
          // Send error event
          const errorEvent = {
            type: "error",
            data: err instanceof Error ? err.message : "Stream error",
          };
          const sseData = `data: ${JSON.stringify(errorEvent)}\n\n`;
          controller.enqueue(encoder.encode(sseData));

          // Send done event after error
          const doneEvent = { type: "done", data: "" };
          const doneData = `data: ${JSON.stringify(doneEvent)}\n\n`;
          controller.enqueue(encoder.encode(doneData));
        } finally {
          controller.close();
        }
      },
    });

    return stream;
  } catch (err) {
    // If it's already an H3 error, re-throw it
    if (err && typeof err === "object" && "statusCode" in err) {
      throw err;
    }

    // Log error server-side if you have a logger (omitted here).
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to stream message",
      data: err instanceof Error ? err.message : String(err),
    });
  }
});
