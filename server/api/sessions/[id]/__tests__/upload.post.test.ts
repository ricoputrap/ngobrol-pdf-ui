import { describe, it, expect, beforeEach } from "vitest";
import { reset_storage, create_session, get_session } from "../../../../utils/storage";
import handler from "../upload.post";

describe("POST /api/sessions/:id/upload handler", () => {
  beforeEach(() => {
    // Ensure clean state before each test
    reset_storage();
  });

  it("uploads a PDF file and returns success with filename", async () => {
    const session = await create_session({ title: "Upload Test" });

    const res = await handler({
      context: { params: { id: session.id } },
      multipartData: [
        {
          name: "file",
          filename: "document.pdf",
          type: "application/pdf",
          data: Buffer.from("fake pdf content"),
        },
      ],
    } as any);

    expect(res).toHaveProperty("success");
    expect(res.success).toBe(true);
    expect(res).toHaveProperty("file_name");
    expect(res.file_name).toBe("document.pdf");

    // Verify session was updated
    const updated = await get_session(session.id);
    expect(updated?.session.pdf_file_name).toBe("document.pdf");
  });

  it("accepts PDF files with .pdf extension", async () => {
    const session = await create_session({ title: "PDF Extension Test" });

    const res = await handler({
      context: { params: { id: session.id } },
      multipartData: [
        {
          name: "file",
          filename: "MyDocument.PDF",
          type: "application/octet-stream",
          data: Buffer.from("content"),
        },
      ],
    } as any);

    expect(res.success).toBe(true);
    expect(res.file_name).toBe("MyDocument.PDF");
  });

  it("accepts PDF files with correct mime type", async () => {
    const session = await create_session({ title: "PDF MIME Test" });

    const res = await handler({
      context: { params: { id: session.id } },
      multipartData: [
        {
          name: "file",
          filename: "report",
          type: "application/pdf",
          data: Buffer.from("content"),
        },
      ],
    } as any);

    expect(res.success).toBe(true);
    expect(res.file_name).toBe("report");
  });

  it("returns 404 when session does not exist", async () => {
    await expect(
      handler({
        context: { params: { id: "non-existent-id" } },
        multipartData: [
          {
            name: "file",
            filename: "document.pdf",
            type: "application/pdf",
            data: Buffer.from("content"),
          },
        ],
      } as any)
    ).rejects.toThrow("Session not found");
  });

  it("returns 400 when session ID is missing", async () => {
    await expect(
      handler({
        context: { params: {} },
        multipartData: [
          {
            name: "file",
            filename: "document.pdf",
            type: "application/pdf",
            data: Buffer.from("content"),
          },
        ],
      } as any)
    ).rejects.toThrow("Session ID is required");
  });

  it("returns 400 when no file is uploaded", async () => {
    const session = await create_session({ title: "No File Test" });

    await expect(
      handler({
        context: { params: { id: session.id } },
        multipartData: [],
      } as any)
    ).rejects.toThrow("No file uploaded");
  });

  it("returns 400 when file field is missing", async () => {
    const session = await create_session({ title: "Missing Field Test" });

    await expect(
      handler({
        context: { params: { id: session.id } },
        multipartData: [
          {
            name: "other_field",
            data: Buffer.from("content"),
          },
        ],
      } as any)
    ).rejects.toThrow("No file field found in form data");
  });

  it("returns 400 when file is not a PDF", async () => {
    const session = await create_session({ title: "Non-PDF Test" });

    await expect(
      handler({
        context: { params: { id: session.id } },
        multipartData: [
          {
            name: "file",
            filename: "document.docx",
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            data: Buffer.from("content"),
          },
        ],
      } as any)
    ).rejects.toThrow("Only PDF files are allowed");
  });

  it("rejects image files", async () => {
    const session = await create_session({ title: "Image Test" });

    await expect(
      handler({
        context: { params: { id: session.id } },
        multipartData: [
          {
            name: "file",
            filename: "photo.jpg",
            type: "image/jpeg",
            data: Buffer.from("content"),
          },
        ],
      } as any)
    ).rejects.toThrow("Only PDF files are allowed");
  });

  it("updates session updated_at timestamp", async () => {
    const session = await create_session({ title: "Timestamp Test" });
    const beforeTime = new Date(session.updated_at).getTime();

    // Small delay to ensure timestamp changes
    await new Promise((resolve) => setTimeout(resolve, 10));

    await handler({
      context: { params: { id: session.id } },
      multipartData: [
        {
          name: "file",
          filename: "test.pdf",
          type: "application/pdf",
          data: Buffer.from("content"),
        },
      ],
    } as any);

    const updated = await get_session(session.id);
    const afterTime = new Date(updated!.session.updated_at).getTime();
    expect(afterTime).toBeGreaterThan(beforeTime);
  });

  it("allows uploading a new PDF to replace existing one", async () => {
    const session = await create_session({ title: "Replace Test" });

    // First upload
    await handler({
      context: { params: { id: session.id } },
      multipartData: [
        {
          name: "file",
          filename: "first.pdf",
          type: "application/pdf",
          data: Buffer.from("content"),
        },
      ],
    } as any);

    let updated = await get_session(session.id);
    expect(updated?.session.pdf_file_name).toBe("first.pdf");

    // Second upload (replace)
    const res = await handler({
      context: { params: { id: session.id } },
      multipartData: [
        {
          name: "file",
          filename: "second.pdf",
          type: "application/pdf",
          data: Buffer.from("new content"),
        },
      ],
    } as any);

    expect(res.file_name).toBe("second.pdf");
    updated = await get_session(session.id);
    expect(updated?.session.pdf_file_name).toBe("second.pdf");
  });
});
