/**
 * POST /api/sessions
 *
 * Creates a new chat session.
 *
 * Request Body:
 *   {
 *     "title"?: string  // Optional session title. Defaults to "Untitled Session"
 *   }
 *
 * Response:
 *   200 OK
 *   {
 *     "session": Session
 *   }
 *
 * Notes:
 * - Uses in-memory mock storage during development.
 * - Fields follow snake_case convention to match FastAPI backend.
 */

import { createError } from "h3";
import { create_session } from "../../utils/storage";
import type {
  CreateSessionRequest,
  CreateSessionResponse,
} from "../../types/api";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<CreateSessionRequest>(event);

    // Validate request body (optional, but good practice)
    if (
      body &&
      typeof body.title !== "undefined" &&
      typeof body.title !== "string"
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid request body: title must be a string",
      });
    }

    const session = await create_session(body || {});
    const res: CreateSessionResponse = { session };
    return res;
  } catch (err) {
    // If it's already an H3 error, re-throw it
    if (err && typeof err === "object" && "statusCode" in err) {
      throw err;
    }

    // Log error server-side if you have a logger (omitted here).
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create session",
      data: err instanceof Error ? err.message : String(err),
    });
  }
});
