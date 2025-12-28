import { describe, it, expect } from "vitest";
import type {
  Session,
  Message,
  GetSessionsResponse,
  CreateSessionResponse,
  GetSessionResponse,
  CreateSessionRequest,
  SessionWithMessages,
} from "../types";

describe("Session module types", () => {
  it("validates Session type structure", () => {
    const session: Session = {
      id: "sess-123",
      title: "Test Session",
      pdf_file_name: "document.pdf",
      created_at: "2025-12-27T12:00:00.000Z",
      updated_at: "2025-12-27T12:00:00.000Z",
    };

    expect(session).toHaveProperty("id");
    expect(session).toHaveProperty("title");
    expect(session).toHaveProperty("pdf_file_name");
    expect(session).toHaveProperty("created_at");
    expect(session).toHaveProperty("updated_at");
  });

  it("validates Session with null pdf_file_name", () => {
    const session: Session = {
      id: "sess-123",
      title: "No PDF Session",
      pdf_file_name: null,
      created_at: "2025-12-27T12:00:00.000Z",
      updated_at: "2025-12-27T12:00:00.000Z",
    };

    expect(session.pdf_file_name).toBeNull();
  });

  it("validates Message type structure", () => {
    const message: Message = {
      id: "msg-123",
      session_id: "sess-123",
      role: "user",
      content: "Hello, world!",
      timestamp: "2025-12-27T12:00:00.000Z",
    };

    expect(message).toHaveProperty("id");
    expect(message).toHaveProperty("session_id");
    expect(message).toHaveProperty("role");
    expect(message).toHaveProperty("content");
    expect(message).toHaveProperty("timestamp");
  });

  it("validates Message with assistant role", () => {
    const message: Message = {
      id: "msg-456",
      session_id: "sess-123",
      role: "assistant",
      content: "Hello! How can I help you?",
      timestamp: "2025-12-27T12:01:00.000Z",
    };

    expect(message.role).toBe("assistant");
  });

  it("validates GetSessionsResponse type structure", () => {
    const response: GetSessionsResponse = {
      sessions: [
        {
          id: "sess-1",
          title: "Session 1",
          pdf_file_name: "doc1.pdf",
          created_at: "2025-12-27T12:00:00.000Z",
          updated_at: "2025-12-27T12:00:00.000Z",
        },
        {
          id: "sess-2",
          title: "Session 2",
          pdf_file_name: null,
          created_at: "2025-12-27T12:00:00.000Z",
          updated_at: "2025-12-27T12:00:00.000Z",
        },
      ],
    };

    expect(response).toHaveProperty("sessions");
    expect(Array.isArray(response.sessions)).toBe(true);
    expect(response.sessions.length).toBe(2);
  });

  it("validates CreateSessionResponse type structure", () => {
    const response: CreateSessionResponse = {
      session: {
        id: "sess-123",
        title: "New Session",
        pdf_file_name: null,
        created_at: "2025-12-27T12:00:00.000Z",
        updated_at: "2025-12-27T12:00:00.000Z",
      },
    };

    expect(response).toHaveProperty("session");
    expect(response.session).toHaveProperty("id");
  });

  it("validates GetSessionResponse type structure", () => {
    const response: GetSessionResponse = {
      session: {
        id: "sess-123",
        title: "Session with Messages",
        pdf_file_name: "doc.pdf",
        created_at: "2025-12-27T12:00:00.000Z",
        updated_at: "2025-12-27T12:00:00.000Z",
      },
      messages: [
        {
          id: "msg-1",
          session_id: "sess-123",
          role: "user",
          content: "Hello",
          timestamp: "2025-12-27T12:00:00.000Z",
        },
        {
          id: "msg-2",
          session_id: "sess-123",
          role: "assistant",
          content: "Hi there!",
          timestamp: "2025-12-27T12:01:00.000Z",
        },
      ],
    };

    expect(response).toHaveProperty("session");
    expect(response).toHaveProperty("messages");
    expect(Array.isArray(response.messages)).toBe(true);
    expect(response.messages.length).toBe(2);
  });

  it("validates CreateSessionRequest with title", () => {
    const request: CreateSessionRequest = {
      title: "My Custom Session",
    };

    expect(request).toHaveProperty("title");
    expect(request.title).toBe("My Custom Session");
  });

  it("validates CreateSessionRequest without title", () => {
    const request: CreateSessionRequest = {};

    expect(request.title).toBeUndefined();
  });

  it("validates SessionWithMessages type structure", () => {
    const sessionWithMessages: SessionWithMessages = {
      session: {
        id: "sess-123",
        title: "Combined View",
        pdf_file_name: "doc.pdf",
        created_at: "2025-12-27T12:00:00.000Z",
        updated_at: "2025-12-27T12:00:00.000Z",
      },
      messages: [
        {
          id: "msg-1",
          session_id: "sess-123",
          role: "user",
          content: "Test",
          timestamp: "2025-12-27T12:00:00.000Z",
        },
      ],
    };

    expect(sessionWithMessages).toHaveProperty("session");
    expect(sessionWithMessages).toHaveProperty("messages");
    expect(sessionWithMessages.session.id).toBe("sess-123");
    expect(sessionWithMessages.messages.length).toBe(1);
  });

  it("validates snake_case naming convention", () => {
    const session: Session = {
      id: "sess-123",
      title: "Test",
      pdf_file_name: "doc.pdf", // snake_case
      created_at: "2025-12-27T12:00:00.000Z", // snake_case
      updated_at: "2025-12-27T12:00:00.000Z", // snake_case
    };

    const message: Message = {
      id: "msg-123",
      session_id: "sess-123", // snake_case
      role: "user",
      content: "Test",
      timestamp: "2025-12-27T12:00:00.000Z",
    };

    // Verify snake_case fields exist
    expect(session).toHaveProperty("pdf_file_name");
    expect(session).toHaveProperty("created_at");
    expect(session).toHaveProperty("updated_at");
    expect(message).toHaveProperty("session_id");

    // Verify camelCase fields don't exist
    expect(session).not.toHaveProperty("pdfFileName");
    expect(session).not.toHaveProperty("createdAt");
    expect(session).not.toHaveProperty("updatedAt");
    expect(message).not.toHaveProperty("sessionId");
  });
});
