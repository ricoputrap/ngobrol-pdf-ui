/**
 * usePdfUpload Composable
 *
 * Centralized PDF upload logic with validation, state management, and progress tracking.
 * Reusable across components that need PDF upload functionality.
 *
 * @example
 * ```ts
 * const { uploadState, selectedFile, upload, selectFile, clearSelection, errorMessage } = usePdfUpload({
 *   sessionId: 'session-123',
 *   onSuccess: (fileName) => console.log('Uploaded:', fileName),
 *   onError: (error) => console.error('Upload failed:', error),
 * });
 * ```
 */

import { ref, computed, watch } from "vue";
import type { Ref, ComputedRef } from "vue";
import { useSessionsStore } from "~/stores/sessions";
import type { PdfFile, PdfUploadState, PdfValidationRules } from "../types";
import { DEFAULT_PDF_VALIDATION_RULES } from "../types";

export interface UsePdfUploadOptions {
  /** Session ID to upload PDF to */
  sessionId: string;
  /** Custom validation rules (merged with defaults) */
  validationRules?: Partial<PdfValidationRules>;
  /** Auto-reset after successful upload (ms). Default: 2000ms. Set to 0 to disable. */
  autoResetDelay?: number;
  /** Callback fired when upload succeeds */
  onSuccess?: (fileName: string) => void;
  /** Callback fired when upload or validation fails */
  onError?: (error: string) => void;
  /** Callback fired when upload state changes */
  onStateChange?: (state: PdfUploadState) => void;
}

export interface UsePdfUploadReturn {
  /** Current upload state */
  uploadState: Ref<PdfUploadState>;
  /** Currently selected file */
  selectedFile: Ref<PdfFile | null>;
  /** Error message (if any) */
  errorMessage: Ref<string | null>;
  /** Whether currently uploading */
  isUploading: ComputedRef<boolean>;
  /** Whether upload has error */
  hasError: ComputedRef<boolean>;
  /** Whether upload was successful */
  isSuccess: ComputedRef<boolean>;
  /** Whether file can be uploaded */
  canUpload: ComputedRef<boolean>;
  /** Merged validation rules */
  validationRules: ComputedRef<PdfValidationRules>;
  /** Validate a file against the rules */
  validateFile: (file: File) => { valid: boolean; error?: string };
  /** Select a file (validates and sets selectedFile) */
  selectFile: (file: File) => boolean;
  /** Upload the selected file */
  upload: () => Promise<void>;
  /** Clear selection and reset state */
  clearSelection: () => void;
}

export function usePdfUpload(options: UsePdfUploadOptions): UsePdfUploadReturn {
  const {
    sessionId,
    validationRules: customRules = {},
    autoResetDelay = 2000,
    onSuccess,
    onError,
    onStateChange,
  } = options;

  const sessionStore = useSessionsStore();

  // State
  const uploadState = ref<PdfUploadState>("idle");
  const selectedFile = ref<PdfFile | null>(null);
  const errorMessage = ref<string | null>(null);

  // Computed
  const validationRules = computed<PdfValidationRules>(() => ({
    ...DEFAULT_PDF_VALIDATION_RULES,
    ...customRules,
  }));

  const isUploading = computed(() => uploadState.value === "uploading");
  const hasError = computed(() => uploadState.value === "error");
  const isSuccess = computed(() => uploadState.value === "success");
  const canUpload = computed(
    () => !isUploading.value && selectedFile.value !== null,
  );

  // Watch state changes
  watch(uploadState, (newState) => {
    if (onStateChange) {
      onStateChange(newState);
    }
  });

  // Methods
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const rules = validationRules.value;

    // Check file type
    if (!rules.allowedTypes?.includes(file.type)) {
      return {
        valid: false,
        error: `Only PDF files are allowed. Got: ${file.type}`,
      };
    }

    // Check file size
    if (file.size > rules.maxSize) {
      const maxSizeMB = Math.round(rules.maxSize / (1024 * 1024));
      const fileSizeMB = Math.round(file.size / (1024 * 1024));
      return {
        valid: false,
        error: `File too large (${fileSizeMB}MB). Maximum size: ${maxSizeMB}MB`,
      };
    }

    // Check file name length
    if (file.name.length > rules.maxNameLength) {
      return {
        valid: false,
        error: `File name too long. Maximum: ${rules.maxNameLength} characters`,
      };
    }

    return { valid: true };
  };

  const selectFile = (file: File): boolean => {
    const validation = validateFile(file);

    if (!validation.valid) {
      uploadState.value = "error";
      errorMessage.value = validation.error || "Invalid file";
      selectedFile.value = null;

      if (onError) {
        onError(errorMessage.value);
      }

      return false;
    }

    selectedFile.value = {
      file,
      name: file.name,
      size: file.size,
      type: file.type,
    };

    uploadState.value = "idle";
    errorMessage.value = null;

    return true;
  };

  const upload = async (): Promise<void> => {
    if (!canUpload.value || !selectedFile.value) {
      throw new Error("No file selected or upload already in progress");
    }

    uploadState.value = "uploading";
    errorMessage.value = null;

    try {
      const response = await sessionStore.uploadPdf(
        sessionId,
        selectedFile.value.file,
      );

      uploadState.value = "success";

      if (onSuccess) {
        onSuccess(response.file_name);
      }

      // Auto-reset after success
      if (autoResetDelay > 0) {
        setTimeout(() => {
          clearSelection();
        }, autoResetDelay);
      }
    } catch (err) {
      uploadState.value = "error";
      errorMessage.value =
        err instanceof Error ? err.message : "Failed to upload PDF";

      if (onError) {
        onError(errorMessage.value);
      }

      throw err;
    }
  };

  const clearSelection = (): void => {
    selectedFile.value = null;
    uploadState.value = "idle";
    errorMessage.value = null;
  };

  return {
    // State
    uploadState,
    selectedFile,
    errorMessage,

    // Computed
    isUploading,
    hasError,
    isSuccess,
    canUpload,
    validationRules,

    // Methods
    validateFile,
    selectFile,
    upload,
    clearSelection,
  };
}
