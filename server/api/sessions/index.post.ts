/**
 * POST /api/sessions
 *
 * Creates a new chat session.
 *
 * Request Body:
 *   {
 *     "title"?: string  // Optional session title. Defaults to auto-generated title
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

import { create_session } from "../../utils/storage";
import type {
  CreateSessionRequest,
  CreateSessionResponse,
} from "../../types/api";

export default defineEventHandler(async (event) => {
  try {
    // Read body - handle both empty and populated bodies
    let body: CreateSessionRequest = {};

    try {
      const parsedBody = await readBody<CreateSessionRequest>(event);
      if (parsedBody && typeof parsedBody === "object") {
        body = parsedBody;
      }
    } catch (bodyError) {
      // If body parsing fails (empty body, invalid JSON, etc), continue with empty object
      console.warn("Failed to parse request body, using defaults:", bodyError);
    }

    // Validate title if provided
    if (body.title !== undefined && typeof body.title !== "string") {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid request body: title must be a string",
      });
    }

    // Create session
    const session = await create_session(body);

    const response: CreateSessionResponse = { session };
    return response;
  } catch (err) {
    // If it's already an H3 error, re-throw it
    if (err && typeof err === "object" && "statusCode" in err) {
      throw err;
    }

    // Log and return 500 error
    console.error("Error creating session:", err);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create session",
      data: err instanceof Error ? err.message : String(err),
    });
  }
});
