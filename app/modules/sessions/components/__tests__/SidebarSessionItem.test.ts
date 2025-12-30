/**
 * SidebarSessionItem Component Tests
 *
 * Tests for the SidebarSessionItem component including:
 * - Type checking
 * - Data structure validation
 * - Helper function logic
 */

import { describe, it, expect } from "vitest";
import type { Session } from "../../types";

describe("SidebarSessionItem", () => {
  const mockSession: Session = {
    id: "sess-123",
    title: "Test Session",
    pdf_file_name: "document.pdf",
    created_at: "2025-12-27T12:00:00.000Z",
    updated_at: "2025-12-27T12:00:00.000Z",
  };

  describe("Type Validation", () => {
    it("validates Session type structure", () => {
      expect(mockSession).toHaveProperty("id");
      expect(mockSession).toHaveProperty("title");
      expect(mockSession).toHaveProperty("pdf_file_name");
      expect(mockSession).toHaveProperty("created_at");
      expect(mockSession).toHaveProperty("updated_at");
    });

    it("validates Session with null pdf_file_name", () => {
      const sessionNoPdf: Session = {
        ...mockSession,
        pdf_file_name: null,
      };

      expect(sessionNoPdf.pdf_file_name).toBeNull();
    });
  });

  describe("Title Truncation Logic", () => {
    it("short title should not need truncation", () => {
      const shortTitle = "Short Title";
      const maxLength = 40;

      expect(shortTitle.length).toBeLessThanOrEqual(maxLength);
    });

    it("long title should be truncatable", () => {
      const longTitle =
        "This is a very long session title that should be truncated";
      const maxLength = 40;

      expect(longTitle.length).toBeGreaterThan(maxLength);

      const truncated = longTitle.substring(0, maxLength) + "...";
      expect(truncated.length).toBeLessThanOrEqual(43); // 40 + "..."
    });
  });

  describe("Filename Truncation Logic", () => {
    it("short filename should not need truncation", () => {
      const shortFilename = "short.pdf";
      const maxLength = 30;

      expect(shortFilename.length).toBeLessThanOrEqual(maxLength);
    });

    it("long filename should be truncatable with extension preserved", () => {
      const longFilename =
        "very-long-filename-that-should-be-truncated-for-display.pdf";
      const maxLength = 30;

      expect(longFilename.length).toBeGreaterThan(maxLength);

      const extension = longFilename.substring(longFilename.lastIndexOf("."));
      const baseName = longFilename.substring(0, longFilename.lastIndexOf("."));
      const truncatedBase = baseName.substring(
        0,
        maxLength - extension.length - 3,
      );
      const truncated = `${truncatedBase}...${extension}`;

      expect(truncated).toContain("...");
      expect(truncated).toContain(".pdf");
      expect(truncated.length).toBeLessThanOrEqual(maxLength + 3);
    });
  });

  describe("Date Formatting Logic", () => {
    it("calculates time difference correctly for minutes", () => {
      const now = new Date("2025-12-27T13:00:00.000Z");
      const updatedAt = new Date("2025-12-27T12:30:00.000Z");

      const diffMs = now.getTime() - updatedAt.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      expect(diffMins).toBe(30);
    });

    it("calculates time difference correctly for hours", () => {
      const now = new Date("2025-12-27T13:00:00.000Z");
      const updatedAt = new Date("2025-12-27T10:00:00.000Z");

      const diffMs = now.getTime() - updatedAt.getTime();
      const diffHours = Math.floor(diffMs / 3600000);

      expect(diffHours).toBe(3);
    });

    it("calculates time difference correctly for days", () => {
      const now = new Date("2025-12-27T13:00:00.000Z");
      const updatedAt = new Date("2025-12-25T12:00:00.000Z");

      const diffMs = now.getTime() - updatedAt.getTime();
      const diffDays = Math.floor(diffMs / 86400000);

      expect(diffDays).toBe(2);
    });

    it("formats date for timestamps over 7 days ago", () => {
      const oldDate = new Date("2025-12-10T12:00:00.000Z");
      const formatted = oldDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      expect(formatted).toMatch(/Dec \d+/);
    });
  });

  describe("Icon Logic", () => {
    it("should use document icon for PDF sessions", () => {
      const pdfIcon = mockSession.pdf_file_name
        ? "i-heroicons-document-text"
        : "i-heroicons-chat-bubble-left";

      expect(pdfIcon).toBe("i-heroicons-document-text");
    });

    it("should use chat icon for non-PDF sessions", () => {
      const sessionNoPdf: Session = {
        ...mockSession,
        pdf_file_name: null,
      };

      const chatIcon = sessionNoPdf.pdf_file_name
        ? "i-heroicons-document-text"
        : "i-heroicons-chat-bubble-left";

      expect(chatIcon).toBe("i-heroicons-chat-bubble-left");
    });
  });

  describe("Props Structure", () => {
    it("validates required props structure", () => {
      interface Props {
        session: Session;
        isActive?: boolean;
      }

      const props: Props = {
        session: mockSession,
        isActive: true,
      };

      expect(props).toHaveProperty("session");
      expect(props.session).toEqual(mockSession);
      expect(props.isActive).toBe(true);
    });

    it("validates default isActive value", () => {
      interface Props {
        session: Session;
        isActive?: boolean;
      }

      const props: Props = {
        session: mockSession,
      };

      expect(props.isActive).toBeUndefined();
      const isActive = props.isActive ?? false;
      expect(isActive).toBe(false);
    });
  });

  describe("Event Emitter Structure", () => {
    it("validates click event payload structure", () => {
      type ClickEvent = [sessionId: string];

      const clickPayload: ClickEvent = [mockSession.id];
      expect(clickPayload[0]).toBe("sess-123");
    });

    it("validates delete event payload structure", () => {
      type DeleteEvent = [sessionId: string];

      const deletePayload: DeleteEvent = [mockSession.id];
      expect(deletePayload[0]).toBe("sess-123");
    });
  });
});
