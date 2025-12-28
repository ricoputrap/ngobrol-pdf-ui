/**
 * POST /api/messages
 *
 * Sends a user message and generates an assistant response.
 *
 * Request Body:
 *   {
 *     "session_id": string,
 *     "content": string
 *   }
 *
 * Response:
 *   200 OK
 *   {
 *     "message": Message  // The user's message
 *   }
 *
 *   Note: The assistant's response is generated immediately but returned
 *   separately. For streaming responses, use GET /api/messages/stream.
 *
 * Flow:
 *   1. Validate request body and session existence
 *   2. Add user message to session
 *   3. Generate assistant response using chatbot utility
 *   4. Add assistant message to session
 *   5. Return user message (assistant message available via GET /api/sessions/:id)
 *
 * Notes:
 * - Uses in-memory mock storage during development.
 * - Fields follow snake_case convention to match FastAPI backend.
 * - For streaming responses, use GET /api/messages/stream instead.
 */

import { createError } from "h3";
import { get_session, add_message } from "../../utils/storage";
import { generate_response } from "../../utils/chatbot";
import type { SendMessageRequest, SendMessageResponse } from "../../types/api";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<SendMessageRequest>(event);

    // Validate request body
    if (!body || !body.session_id || !body.content) {
      throw createError({
        statusCode: 400,
        statusMessage: "session_id and content are required",
      });
    }

    if (typeof body.session_id !== "string" || typeof body.content !== "string") {
      throw createError({
        statusCode: 400,
        statusMessage: "session_id and content must be strings",
      });
    }

    if (body.content.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "content cannot be empty",
      });
    }

    // Check if session exists
    const session = await get_session(body.session_id);
    if (!session) {
      throw createError({
        statusCode: 404,
        statusMessage: "Session not found",
      });
    }

    // Add user message
    const userMessage = await add_message(
      { session_id: body.session_id, content: body.content },
      "user"
    );

    // Generate assistant response
    const assistantContent = await generate_response(body.session_id, body.content);

    // Add assistant message
    await add_message(
      { session_id: body.session_id, content: assistantContent },
      "assistant"
    );

    // Return the user's message
    const res: SendMessageResponse = {
      message: userMessage,
    };

    return res;
  } catch (err) {
    // If it's already an H3 error, re-throw it
    if (err && typeof err === "object" && "statusCode" in err) {
      throw err;
    }

    // Log error server-side if you have a logger (omitted here).
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to send message",
      data: err instanceof Error ? err.message : String(err),
    });
  }
});
