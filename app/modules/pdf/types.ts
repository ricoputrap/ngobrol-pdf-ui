/**
 * PDF Module Types
 *
 * Type definitions for PDF upload and management functionality.
 */

/**
 * PDF file information
 */
export interface PdfFile {
  /** File object */
  file: File;
  /** File name */
  name: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  type: string;
}

/**
 * PDF upload progress information
 */
export interface PdfUploadProgress {
  /** Upload progress percentage (0-100) */
  progress: number;
  /** Bytes uploaded */
  loaded: number;
  /** Total bytes to upload */
  total: number;
}

/**
 * PDF upload state
 */
export type PdfUploadState = "idle" | "uploading" | "success" | "error";

/**
 * PDF upload result from API
 */
export interface PdfUploadResponse {
  /** Whether upload was successful */
  success: boolean;
  /** Uploaded file name */
  file_name: string;
}

/**
 * PDF upload error
 */
export interface PdfUploadError {
  /** Error message */
  message: string;
  /** Error code (optional) */
  code?: string;
}

/**
 * PDF validation result
 */
export interface PdfValidationResult {
  /** Whether the file is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
}

/**
 * PDF validation rules
 */
export interface PdfValidationRules {
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Allowed MIME types */
  allowedTypes?: string[];
  /** Maximum file name length */
  maxNameLength?: number;
}

/**
 * Default PDF validation rules
 */
export const DEFAULT_PDF_VALIDATION_RULES: Required<PdfValidationRules> = {
  maxSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: ["application/pdf"],
  maxNameLength: 255,
};
