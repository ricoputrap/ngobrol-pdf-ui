/**
 * GET /api/sessions/:id
 *
 * Retrieves a single session and its messages.
 *
 * Response:
 *   200 OK
 *   {
 *     "session": Session,
 *     "messages": Message[]
 *   }
 *
 *   404 Not Found
 *   {
 *     "statusCode": 404,
 *     "statusMessage": "Session not found"
 *   }
 *
 * Notes:
 * - Uses in-memory mock storage during development.
 * - Fields follow snake_case convention to match FastAPI backend.
 */

import { createError } from "h3";
import { get_session } from "../../utils/storage";
import type { GetSessionResponse } from "../../types/api";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Session ID is required",
      });
    }

    const result = await get_session(id);

    if (!result) {
      throw createError({
        statusCode: 404,
        statusMessage: "Session not found",
      });
    }

    const res: GetSessionResponse = {
      session: result.session,
      messages: result.messages,
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
      statusMessage: "Failed to retrieve session",
      data: err instanceof Error ? err.message : String(err),
    });
  }
});
