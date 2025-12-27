/**
 * GET /api/sessions
 *
 * Returns the list of sessions (most recently updated first).
 *
 * Response:
 *   200 OK
 *   {
 *     "sessions": [ Session, ... ]
 *   }
 *
 * Notes:
 * - Uses in-memory mock storage during development.
 * - Fields follow snake_case convention to match FastAPI backend.
 */

import { createError } from "h3";
import { list_sessions } from "../../utils/storage";
import type { GetSessionsResponse } from "../../types/api";

export default defineEventHandler(async (_event) => {
  try {
    const sessions = await list_sessions();
    const res: GetSessionsResponse = { sessions };
    return res;
  } catch (err) {
    // Log error server-side if you have a logger (omitted here).
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to list sessions",
      data: err instanceof Error ? err.message : String(err),
    });
  }
});
