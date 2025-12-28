/**
 * Tests for usePdfUpload composable
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { usePdfUpload } from "../usePdfUpload";
import { useSessionsStore } from "~/stores/sessions";
import { createPinia, setActivePinia } from "pinia";
import type { PdfUploadResponse } from "~/modules/sessions/types";

// Mock the sessions store
vi.mock("~/stores/sessions", () => ({
  useSessionsStore: vi.fn(),
}));

describe("usePdfUpload", () => {
  let mockUploadPdf: ReturnType<typeof vi.fn>;
  let mockStore: any;

  beforeEach(() => {
    // Setup Pinia
    setActivePinia(createPinia());

    // Setup mock store
    mockUploadPdf = vi.fn();
    mockStore = {
      uploadPdf: mockUploadPdf,
    };

    vi.mocked(useSessionsStore).mockReturnValue(mockStore);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with idle state", () => {
      const { uploadState, selectedFile, errorMessage } = usePdfUpload({
        sessionId: "session-1",
      });

      expect(uploadState.value).toBe("idle");
      expect(selectedFile.value).toBeNull();
      expect(errorMessage.value).toBeNull();
    });

    it("should merge custom validation rules with defaults", () => {
      const { validationRules } = usePdfUpload({
        sessionId: "session-1",
        validationRules: {
          maxSize: 5 * 1024 * 1024, // 5MB
        },
      });

      expect(validationRules.value.maxSize).toBe(5 * 1024 * 1024);
      expect(validationRules.value.allowedTypes).toEqual(["application/pdf"]);
      expect(validationRules.value.maxNameLength).toBe(255);
    });

    it("should initialize computed properties correctly", () => {
      const { isUploading, hasError, isSuccess, canUpload } = usePdfUpload({
        sessionId: "session-1",
      });

      expect(isUploading.value).toBe(false);
      expect(hasError.value).toBe(false);
      expect(isSuccess.value).toBe(false);
      expect(canUpload.value).toBe(false);
    });
  });

  describe("validateFile", () => {
    it("should validate a valid PDF file", () => {
      const { validateFile } = usePdfUpload({
        sessionId: "session-1",
      });

      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      const result = validateFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject non-PDF file types", () => {
      const { validateFile } = usePdfUpload({
        sessionId: "session-1",
      });

      const file = new File(["content"], "test.txt", {
        type: "text/plain",
      });

      const result = validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Only PDF files are allowed");
      expect(result.error).toContain("text/plain");
    });

    it("should reject files exceeding max size", () => {
      const { validateFile } = usePdfUpload({
        sessionId: "session-1",
        validationRules: {
          maxSize: 1024, // 1KB
        },
      });

      const largeContent = new Array(2000).fill("a").join("");
      const file = new File([largeContent], "large.pdf", {
        type: "application/pdf",
      });

      const result = validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("File too large");
      expect(result.error).toContain("Maximum size");
    });

    it("should reject files with names exceeding max length", () => {
      const { validateFile } = usePdfUpload({
        sessionId: "session-1",
        validationRules: {
          maxNameLength: 10,
        },
      });

      const file = new File(["content"], "very-long-filename.pdf", {
        type: "application/pdf",
      });

      const result = validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("File name too long");
      expect(result.error).toContain("10 characters");
    });
  });

  describe("selectFile", () => {
    it("should select a valid file", () => {
      const { selectFile, selectedFile, uploadState, errorMessage } =
        usePdfUpload({
          sessionId: "session-1",
        });

      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      const result = selectFile(file);

      expect(result).toBe(true);
      expect(selectedFile.value).toEqual({
        file,
        name: "test.pdf",
        size: file.size,
        type: "application/pdf",
      });
      expect(uploadState.value).toBe("idle");
      expect(errorMessage.value).toBeNull();
    });

    it("should reject an invalid file and set error state", () => {
      const onError = vi.fn();
      const { selectFile, selectedFile, uploadState, errorMessage } =
        usePdfUpload({
          sessionId: "session-1",
          onError,
        });

      const file = new File(["content"], "test.txt", {
        type: "text/plain",
      });

      const result = selectFile(file);

      expect(result).toBe(false);
      expect(selectedFile.value).toBeNull();
      expect(uploadState.value).toBe("error");
      expect(errorMessage.value).toContain("Only PDF files are allowed");
      expect(onError).toHaveBeenCalledWith(errorMessage.value);
    });

    it("should update canUpload when file is selected", () => {
      const { selectFile, canUpload } = usePdfUpload({
        sessionId: "session-1",
      });

      expect(canUpload.value).toBe(false);

      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      selectFile(file);

      expect(canUpload.value).toBe(true);
    });

    it("should clear previous error when selecting valid file", () => {
      const { selectFile, uploadState, errorMessage } = usePdfUpload({
        sessionId: "session-1",
      });

      // First select invalid file
      const invalidFile = new File(["content"], "test.txt", {
        type: "text/plain",
      });
      selectFile(invalidFile);

      expect(uploadState.value).toBe("error");
      expect(errorMessage.value).toBeTruthy();

      // Then select valid file
      const validFile = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });
      selectFile(validFile);

      expect(uploadState.value).toBe("idle");
      expect(errorMessage.value).toBeNull();
    });
  });

  describe("upload", () => {
    it("should upload a selected file successfully", async () => {
      const mockResponse: PdfUploadResponse = {
        session_id: "session-1",
        file_name: "test.pdf",
        file_size: 1024,
        uploaded_at: new Date().toISOString(),
      };

      mockUploadPdf.mockResolvedValue(mockResponse);

      const onSuccess = vi.fn();
      const { selectFile, upload, uploadState, isSuccess } = usePdfUpload({
        sessionId: "session-1",
        onSuccess,
        autoResetDelay: 0, // Disable auto-reset for testing
      });

      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      selectFile(file);

      await upload();

      expect(mockUploadPdf).toHaveBeenCalledWith("session-1", file);
      expect(uploadState.value).toBe("success");
      expect(isSuccess.value).toBe(true);
      expect(onSuccess).toHaveBeenCalledWith("test.pdf");
    });

    it("should set uploading state during upload", async () => {
      mockUploadPdf.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      const { selectFile, upload, uploadState, isUploading } = usePdfUpload({
        sessionId: "session-1",
        autoResetDelay: 0,
      });

      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      selectFile(file);

      const uploadPromise = upload();

      expect(uploadState.value).toBe("uploading");
      expect(isUploading.value).toBe(true);

      await uploadPromise;
    });

    it("should handle upload errors", async () => {
      const error = new Error("Network error");
      mockUploadPdf.mockRejectedValue(error);

      const onError = vi.fn();
      const { selectFile, upload, uploadState, errorMessage, hasError } =
        usePdfUpload({
          sessionId: "session-1",
          onError,
        });

      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      selectFile(file);

      await expect(upload()).rejects.toThrow("Network error");

      expect(uploadState.value).toBe("error");
      expect(hasError.value).toBe(true);
      expect(errorMessage.value).toBe("Network error");
      expect(onError).toHaveBeenCalledWith("Network error");
    });

    it("should handle non-Error exceptions", async () => {
      mockUploadPdf.mockRejectedValue("String error");

      const { selectFile, upload, errorMessage } = usePdfUpload({
        sessionId: "session-1",
      });

      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      selectFile(file);

      await expect(upload()).rejects.toBe("String error");

      expect(errorMessage.value).toBe("Failed to upload PDF");
    });

    it("should throw error if no file is selected", async () => {
      const { upload } = usePdfUpload({
        sessionId: "session-1",
      });

      await expect(upload()).rejects.toThrow("No file selected");
    });

    it("should throw error if upload already in progress", async () => {
      mockUploadPdf.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      const { selectFile, upload } = usePdfUpload({
        sessionId: "session-1",
      });

      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      selectFile(file);

      const firstUpload = upload();

      await expect(upload()).rejects.toThrow("upload already in progress");

      await firstUpload;
    });

    it("should auto-reset after successful upload", async () => {
      vi.useFakeTimers();

      const mockResponse: PdfUploadResponse = {
        session_id: "session-1",
        file_name: "test.pdf",
        file_size: 1024,
        uploaded_at: new Date().toISOString(),
      };

      mockUploadPdf.mockResolvedValue(mockResponse);

      const { selectFile, upload, selectedFile, uploadState } = usePdfUpload({
        sessionId: "session-1",
        autoResetDelay: 2000,
      });

      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      selectFile(file);
      await upload();

      expect(uploadState.value).toBe("success");
      expect(selectedFile.value).not.toBeNull();

      // Fast-forward time
      vi.advanceTimersByTime(2000);

      expect(uploadState.value).toBe("idle");
      expect(selectedFile.value).toBeNull();

      vi.useRealTimers();
    });

    it("should not auto-reset if autoResetDelay is 0", async () => {
      vi.useFakeTimers();

      const mockResponse: PdfUploadResponse = {
        session_id: "session-1",
        file_name: "test.pdf",
        file_size: 1024,
        uploaded_at: new Date().toISOString(),
      };

      mockUploadPdf.mockResolvedValue(mockResponse);

      const { selectFile, upload, selectedFile, uploadState } = usePdfUpload({
        sessionId: "session-1",
        autoResetDelay: 0,
      });

      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      selectFile(file);
      await upload();

      expect(uploadState.value).toBe("success");

      // Fast-forward time
      vi.advanceTimersByTime(5000);

      // Should still be in success state
      expect(uploadState.value).toBe("success");
      expect(selectedFile.value).not.toBeNull();

      vi.useRealTimers();
    });
  });

  describe("clearSelection", () => {
    it("should clear selection and reset state", () => {
      const {
        selectFile,
        clearSelection,
        selectedFile,
        uploadState,
        errorMessage,
      } = usePdfUpload({
        sessionId: "session-1",
      });

      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      selectFile(file);

      expect(selectedFile.value).not.toBeNull();

      clearSelection();

      expect(selectedFile.value).toBeNull();
      expect(uploadState.value).toBe("idle");
      expect(errorMessage.value).toBeNull();
    });

    it("should clear error state", () => {
      const { selectFile, clearSelection, uploadState, errorMessage } =
        usePdfUpload({
          sessionId: "session-1",
        });

      // Select invalid file to trigger error
      const file = new File(["content"], "test.txt", {
        type: "text/plain",
      });

      selectFile(file);

      expect(uploadState.value).toBe("error");
      expect(errorMessage.value).toBeTruthy();

      clearSelection();

      expect(uploadState.value).toBe("idle");
      expect(errorMessage.value).toBeNull();
    });
  });

  describe("callbacks", () => {
    it("should call onStateChange when state changes", async () => {
      const onStateChange = vi.fn();
      const mockResponse: PdfUploadResponse = {
        session_id: "session-1",
        file_name: "test.pdf",
        file_size: 1024,
        uploaded_at: new Date().toISOString(),
      };

      mockUploadPdf.mockResolvedValue(mockResponse);

      const { selectFile, upload, uploadState } = usePdfUpload({
        sessionId: "session-1",
        onStateChange,
        autoResetDelay: 0,
      });

      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      selectFile(file);
      await upload();

      // onStateChange should have been called with 'uploading' and 'success'
      expect(onStateChange).toHaveBeenCalled();
      expect(
        onStateChange.mock.calls.some((call: any[]) => call[0] === "uploading"),
      ).toBe(true);
      expect(
        onStateChange.mock.calls.some((call: any[]) => call[0] === "success"),
      ).toBe(true);
    });

    it("should call onSuccess callback on successful upload", async () => {
      const onSuccess = vi.fn();
      const mockResponse: PdfUploadResponse = {
        session_id: "session-1",
        file_name: "uploaded.pdf",
        file_size: 2048,
        uploaded_at: new Date().toISOString(),
      };

      mockUploadPdf.mockResolvedValue(mockResponse);

      const { selectFile, upload } = usePdfUpload({
        sessionId: "session-1",
        onSuccess,
        autoResetDelay: 0,
      });

      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      selectFile(file);
      await upload();

      expect(onSuccess).toHaveBeenCalledOnce();
      expect(onSuccess).toHaveBeenCalledWith("uploaded.pdf");
    });

    it("should call onError callback on validation error", () => {
      const onError = vi.fn();
      const { selectFile } = usePdfUpload({
        sessionId: "session-1",
        onError,
      });

      const file = new File(["content"], "test.txt", {
        type: "text/plain",
      });

      selectFile(file);

      expect(onError).toHaveBeenCalledOnce();
      expect(onError).toHaveBeenCalledWith(
        expect.stringContaining("Only PDF files are allowed"),
      );
    });

    it("should call onError callback on upload error", async () => {
      const onError = vi.fn();
      const error = new Error("Upload failed");
      mockUploadPdf.mockRejectedValue(error);

      const { selectFile, upload } = usePdfUpload({
        sessionId: "session-1",
        onError,
      });

      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      selectFile(file);
      await expect(upload()).rejects.toThrow();

      expect(onError).toHaveBeenCalledOnce();
      expect(onError).toHaveBeenCalledWith("Upload failed");
    });
  });

  describe("edge cases", () => {
    it("should handle multiple file selections", () => {
      const { selectFile, selectedFile } = usePdfUpload({
        sessionId: "session-1",
      });

      const file1 = new File(["content1"], "test1.pdf", {
        type: "application/pdf",
      });

      const file2 = new File(["content2"], "test2.pdf", {
        type: "application/pdf",
      });

      selectFile(file1);
      expect(selectedFile.value?.name).toBe("test1.pdf");

      selectFile(file2);
      expect(selectedFile.value?.name).toBe("test2.pdf");
    });

    it("should handle file with exact max size", () => {
      const { validateFile } = usePdfUpload({
        sessionId: "session-1",
        validationRules: {
          maxSize: 1024,
        },
      });

      const content = new Array(1024).fill("a").join("");
      const file = new File([content], "exact.pdf", {
        type: "application/pdf",
      });

      const result = validateFile(file);

      expect(result.valid).toBe(true);
    });

    it("should handle file with exact max name length", () => {
      const { validateFile } = usePdfUpload({
        sessionId: "session-1",
        validationRules: {
          maxNameLength: 10,
        },
      });

      const file = new File(["content"], "exact.pdf", {
        type: "application/pdf",
      });

      expect(file.name.length).toBe(9);

      const result = validateFile(file);

      expect(result.valid).toBe(true);
    });

    it("should preserve file metadata", () => {
      const { selectFile, selectedFile } = usePdfUpload({
        sessionId: "session-1",
      });

      const content = "test content";
      const file = new File([content], "metadata.pdf", {
        type: "application/pdf",
      });

      selectFile(file);

      expect(selectedFile.value).toEqual({
        file,
        name: "metadata.pdf",
        size: file.size,
        type: "application/pdf",
      });
    });
  });
});
