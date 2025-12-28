import { describe, it, expect, beforeAll } from "vitest";
import type {
  PdfFile,
  PdfUploadProgress,
  PdfUploadState,
  PdfUploadResponse,
  PdfUploadError,
  PdfValidationResult,
  PdfValidationRules,
} from "../types";
import { DEFAULT_PDF_VALIDATION_RULES } from "../types";

// Mock File for Node environment
if (typeof File === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.File = class File {
    name: string;
    type: string;
    size: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(bits: any[], name: string, options?: { type?: string }) {
      this.name = name;
      this.type = options?.type || "";
      this.size = bits.reduce((acc, bit) => acc + (bit.length || 0), 0);
    }
  } as typeof File;
}

describe("PDF module types", () => {
  describe("PdfFile type", () => {
    it("validates PdfFile structure", () => {
      const mockFile = new File(["content"], "document.pdf", {
        type: "application/pdf",
      });

      const pdfFile: PdfFile = {
        file: mockFile,
        name: "document.pdf",
        size: 1024,
        type: "application/pdf",
      };

      expect(pdfFile).toHaveProperty("file");
      expect(pdfFile).toHaveProperty("name");
      expect(pdfFile).toHaveProperty("size");
      expect(pdfFile).toHaveProperty("type");
      expect(pdfFile.name).toBe("document.pdf");
      expect(pdfFile.type).toBe("application/pdf");
    });
  });

  describe("PdfUploadProgress type", () => {
    it("validates PdfUploadProgress structure", () => {
      const progress: PdfUploadProgress = {
        progress: 50,
        loaded: 512,
        total: 1024,
      };

      expect(progress).toHaveProperty("progress");
      expect(progress).toHaveProperty("loaded");
      expect(progress).toHaveProperty("total");
      expect(progress.progress).toBe(50);
      expect(progress.loaded).toBe(512);
      expect(progress.total).toBe(1024);
    });

    it("validates progress at 0%", () => {
      const progress: PdfUploadProgress = {
        progress: 0,
        loaded: 0,
        total: 1024,
      };

      expect(progress.progress).toBe(0);
    });

    it("validates progress at 100%", () => {
      const progress: PdfUploadProgress = {
        progress: 100,
        loaded: 1024,
        total: 1024,
      };

      expect(progress.progress).toBe(100);
      expect(progress.loaded).toBe(progress.total);
    });
  });

  describe("PdfUploadState type", () => {
    it("validates idle state", () => {
      const state: PdfUploadState = "idle";
      expect(state).toBe("idle");
    });

    it("validates uploading state", () => {
      const state: PdfUploadState = "uploading";
      expect(state).toBe("uploading");
    });

    it("validates success state", () => {
      const state: PdfUploadState = "success";
      expect(state).toBe("success");
    });

    it("validates error state", () => {
      const state: PdfUploadState = "error";
      expect(state).toBe("error");
    });
  });

  describe("PdfUploadResponse type", () => {
    it("validates successful upload response", () => {
      const response: PdfUploadResponse = {
        success: true,
        file_name: "document.pdf",
      };

      expect(response).toHaveProperty("success");
      expect(response).toHaveProperty("file_name");
      expect(response.success).toBe(true);
      expect(response.file_name).toBe("document.pdf");
    });

    it("validates snake_case naming convention", () => {
      const response: PdfUploadResponse = {
        success: true,
        file_name: "test.pdf",
      };

      expect(response).toHaveProperty("file_name");
      expect(response).not.toHaveProperty("fileName");
    });
  });

  describe("PdfUploadError type", () => {
    it("validates error with message only", () => {
      const error: PdfUploadError = {
        message: "Upload failed",
      };

      expect(error).toHaveProperty("message");
      expect(error.message).toBe("Upload failed");
      expect(error.code).toBeUndefined();
    });

    it("validates error with message and code", () => {
      const error: PdfUploadError = {
        message: "File too large",
        code: "FILE_TOO_LARGE",
      };

      expect(error).toHaveProperty("message");
      expect(error).toHaveProperty("code");
      expect(error.message).toBe("File too large");
      expect(error.code).toBe("FILE_TOO_LARGE");
    });
  });

  describe("PdfValidationResult type", () => {
    it("validates successful validation result", () => {
      const result: PdfValidationResult = {
        valid: true,
      };

      expect(result).toHaveProperty("valid");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("validates failed validation result", () => {
      const result: PdfValidationResult = {
        valid: false,
        error: "File is too large",
      };

      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("error");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("File is too large");
    });
  });

  describe("PdfValidationRules type", () => {
    it("validates rules with all properties", () => {
      const rules: PdfValidationRules = {
        maxSize: 10485760, // 10MB
        allowedTypes: ["application/pdf"],
        maxNameLength: 255,
      };

      expect(rules).toHaveProperty("maxSize");
      expect(rules).toHaveProperty("allowedTypes");
      expect(rules).toHaveProperty("maxNameLength");
      expect(rules.maxSize).toBe(10485760);
      expect(rules.allowedTypes).toEqual(["application/pdf"]);
      expect(rules.maxNameLength).toBe(255);
    });

    it("validates rules with partial properties", () => {
      const rules: PdfValidationRules = {
        maxSize: 5242880, // 5MB
      };

      expect(rules.maxSize).toBe(5242880);
      expect(rules.allowedTypes).toBeUndefined();
      expect(rules.maxNameLength).toBeUndefined();
    });

    it("validates empty rules object", () => {
      const rules: PdfValidationRules = {};

      expect(rules.maxSize).toBeUndefined();
      expect(rules.allowedTypes).toBeUndefined();
      expect(rules.maxNameLength).toBeUndefined();
    });
  });

  describe("DEFAULT_PDF_VALIDATION_RULES constant", () => {
    it("has correct default maxSize (50MB)", () => {
      expect(DEFAULT_PDF_VALIDATION_RULES.maxSize).toBe(50 * 1024 * 1024);
      expect(DEFAULT_PDF_VALIDATION_RULES.maxSize).toBe(52428800);
    });

    it("has correct default allowedTypes", () => {
      expect(DEFAULT_PDF_VALIDATION_RULES.allowedTypes).toEqual([
        "application/pdf",
      ]);
      expect(Array.isArray(DEFAULT_PDF_VALIDATION_RULES.allowedTypes)).toBe(
        true,
      );
      expect(DEFAULT_PDF_VALIDATION_RULES.allowedTypes.length).toBe(1);
    });

    it("has correct default maxNameLength", () => {
      expect(DEFAULT_PDF_VALIDATION_RULES.maxNameLength).toBe(255);
    });

    it("has all required properties", () => {
      expect(DEFAULT_PDF_VALIDATION_RULES).toHaveProperty("maxSize");
      expect(DEFAULT_PDF_VALIDATION_RULES).toHaveProperty("allowedTypes");
      expect(DEFAULT_PDF_VALIDATION_RULES).toHaveProperty("maxNameLength");
    });
  });
});
