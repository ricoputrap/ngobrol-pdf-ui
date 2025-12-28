/**
 * DELETE /api/sessions/:id
 *
 * Deletes a session and all its messages.
 *
 * Response:
 *   204 No Content (empty body)
 *
 *   404 Not Found
 *   {
 *     "statusCode": 404,
 *     "statusMessage": "Session not found"
 *   }
 *
 * Notes:
 * - Uses in-memory mock storage during development.
 * - Returns 204 No Content on success per REST conventions.
 * - Deleting a non-existent session returns 404.
 */

import { createError, setResponseStatus } from "h3";
import { delete_session } from "../../utils/storage";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Session ID is required",
      });
    }

    const deleted = await delete_session(id);

    if (!deleted) {
      throw createError({
        statusCode: 404,
        statusMessage: "Session not found",
      });
    }

    // Set 204 No Content status and return null (no body)
    setResponseStatus(event, 204);
    return null;
  } catch (err) {
    // If it's already an H3 error, re-throw it
    if (err && typeof err === "object" && "statusCode" in err) {
      throw err;
    }

    // Log error server-side if you have a logger (omitted here).
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to delete session",
      data: err instanceof Error ? err.message : String(err),
    });
  }
});
