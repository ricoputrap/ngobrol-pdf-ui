/**
 * POST /api/sessions/:id/upload
 *
 * Uploads a PDF file to a session.
 *
 * Protocol: REST with multipart/form-data (SYNCHRONOUS)
 *
 * Request:
 *   Content-Type: multipart/form-data
 *   Body: FormData { file: File }
 *
 * Response:
 *   200 OK
 *   {
 *     "success": true,
 *     "file_name": "document.pdf"
 *   }
 *
 *   400 Bad Request
 *   - No file uploaded
 *   - File is not a PDF
 *   - Session ID missing
 *
 *   404 Not Found
 *   - Session not found
 *
 * Notes:
 * - Uses in-memory mock storage during development.
 * - Only accepts PDF files (checks mime type and extension).
 * - Synchronous upload - client waits for response.
 * - In production, file would be saved to object storage (S3, GCS).
 * - For MVP, we only store the filename, not the actual file content.
 */

import { createError } from "h3";
import { save_pdf_file_name, get_session } from "../../../utils/storage";
import type { UploadPdfResponse } from "../../../types/api";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Session ID is required",
      });
    }

    // Check if session exists
    const session = await get_session(id);
    if (!session) {
      throw createError({
        statusCode: 404,
        statusMessage: "Session not found",
      });
    }

    // Read multipart form data
    const formData = await readMultipartFormData(event);

    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "No file uploaded",
      });
    }

    // Find the file field in form data
    const fileField = formData.find(
      (field) => field.name === "file" && field.filename
    );

    if (!fileField || !fileField.filename) {
      throw createError({
        statusCode: 400,
        statusMessage: "No file field found in form data",
      });
    }

    // Validate file is a PDF
    const filename = fileField.filename;
    const isPdf =
      filename.toLowerCase().endsWith(".pdf") ||
      fileField.type === "application/pdf";

    if (!isPdf) {
      throw createError({
        statusCode: 400,
        statusMessage: "Only PDF files are allowed",
      });
    }

    // Save the PDF filename to the session
    const updated = await save_pdf_file_name(id, filename);

    if (!updated) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to update session with PDF filename",
      });
    }

    const res: UploadPdfResponse = {
      success: true,
      file_name: filename,
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
      statusMessage: "Failed to upload PDF",
      data: err instanceof Error ? err.message : String(err),
    });
  }
});
