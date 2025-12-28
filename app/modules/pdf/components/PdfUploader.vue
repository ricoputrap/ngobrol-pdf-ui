<script setup lang="ts">
/**
 * PdfUploader Component
 *
 * Drag-and-drop PDF uploader with validation and progress tracking.
 * Integrates with sessions store to upload PDFs to specific sessions.
 */

import { useSessionsStore } from "~/stores/sessions";
import type {
  PdfFile,
  PdfUploadState,
  PdfValidationRules,
} from "../types";
import { DEFAULT_PDF_VALIDATION_RULES } from "../types";

// Props
interface Props {
  /** Session ID to upload PDF to */
  sessionId: string;
  /** Custom validation rules */
  validationRules?: PdfValidationRules;
  /** Allow multiple files (not supported, reserved for future) */
  multiple?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Show upload button (if false, only drag-and-drop) */
  showButton?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  validationRules: () => ({}),
  multiple: false,
  disabled: false,
  showButton: true,
});

// Emits
const emit = defineEmits<{
  uploaded: [fileName: string];
  error: [error: string];
}>();

// Store
const sessionStore = useSessionsStore();

// State
const uploadState = ref<PdfUploadState>("idle");
const selectedFile = ref<PdfFile | null>(null);
const isDragging = ref(false);
const errorMessage = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

// Computed
const mergedRules = computed(() => ({
  ...DEFAULT_PDF_VALIDATION_RULES,
  ...props.validationRules,
}));

const isUploading = computed(() => uploadState.value === "uploading");
const hasError = computed(() => uploadState.value === "error");
const isSuccess = computed(() => uploadState.value === "success");
const canUpload = computed(
  () => !props.disabled && !isUploading.value && selectedFile.value !== null
);

const statusMessage = computed(() => {
  if (isUploading.value) return "Uploading...";
  if (isSuccess.value) return "Upload successful!";
  if (hasError.value && errorMessage.value) return errorMessage.value;
  if (selectedFile.value) return `Selected: ${selectedFile.value.name}`;
  return "Drag and drop a PDF file here, or click to browse";
});

const statusColor = computed(() => {
  if (isUploading.value) return "primary";
  if (isSuccess.value) return "success";
  if (hasError.value) return "error";
  return "neutral";
});

// Methods
const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (!mergedRules.value.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Only PDF files are allowed. Got: ${file.type}`,
    };
  }

  // Check file size
  if (file.size > mergedRules.value.maxSize) {
    const maxSizeMB = Math.round(mergedRules.value.maxSize / (1024 * 1024));
    const fileSizeMB = Math.round(file.size / (1024 * 1024));
    return {
      valid: false,
      error: `File too large (${fileSizeMB}MB). Maximum size: ${maxSizeMB}MB`,
    };
  }

  // Check file name length
  if (file.name.length > mergedRules.value.maxNameLength) {
    return {
      valid: false,
      error: `File name too long. Maximum: ${mergedRules.value.maxNameLength} characters`,
    };
  }

  return { valid: true };
};

const handleFileSelect = (file: File) => {
  const validation = validateFile(file);

  if (!validation.valid) {
    uploadState.value = "error";
    errorMessage.value = validation.error || "Invalid file";
    selectedFile.value = null;
    emit("error", errorMessage.value);
    return;
  }

  selectedFile.value = {
    file,
    name: file.name,
    size: file.size,
    type: file.type,
  };

  uploadState.value = "idle";
  errorMessage.value = null;
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;

  if (props.disabled) return;

  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    handleFileSelect(files[0]);
  }
};

const handleDragOver = (event: DragEvent) => {
  if (!props.disabled) {
    isDragging.value = true;
  }
};

const handleDragLeave = () => {
  isDragging.value = false;
};

const handleFileInputChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = input.files;

  if (files && files.length > 0) {
    handleFileSelect(files[0]);
  }
};

const openFilePicker = () => {
  if (!props.disabled && fileInputRef.value) {
    fileInputRef.value.click();
  }
};

const handleUpload = async () => {
  if (!canUpload.value || !selectedFile.value) return;

  uploadState.value = "uploading";
  errorMessage.value = null;

  try {
    const response = await sessionStore.uploadPdf(
      props.sessionId,
      selectedFile.value.file
    );

    uploadState.value = "success";
    emit("uploaded", response.file_name);

    // Reset after success
    setTimeout(() => {
      selectedFile.value = null;
      uploadState.value = "idle";
      if (fileInputRef.value) {
        fileInputRef.value.value = "";
      }
    }, 2000);
  } catch (err) {
    uploadState.value = "error";
    errorMessage.value =
      err instanceof Error ? err.message : "Failed to upload PDF";
    emit("error", errorMessage.value);
  }
};

const clearSelection = () => {
  selectedFile.value = null;
  uploadState.value = "idle";
  errorMessage.value = null;
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};
</script>

<template>
  <div class="pdf-uploader">
    <!-- Drop Zone -->
    <div
      :class="[
        'pdf-uploader__dropzone',
        isDragging && 'pdf-uploader__dropzone--dragging',
        isUploading && 'pdf-uploader__dropzone--uploading',
        hasError && 'pdf-uploader__dropzone--error',
        isSuccess && 'pdf-uploader__dropzone--success',
        props.disabled && 'pdf-uploader__dropzone--disabled',
      ]"
      @drop.prevent="handleDrop"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @click="openFilePicker"
    >
      <!-- Icon -->
      <div class="pdf-uploader__icon">
        <UIcon
          v-if="isUploading"
          name="i-heroicons-arrow-path"
          class="animate-spin"
        />
        <UIcon
          v-else-if="isSuccess"
          name="i-heroicons-check-circle"
        />
        <UIcon
          v-else-if="hasError"
          name="i-heroicons-exclamation-circle"
        />
        <UIcon
          v-else
          name="i-heroicons-document-arrow-up"
        />
      </div>

      <!-- Status Message -->
      <p class="pdf-uploader__message">
        {{ statusMessage }}
      </p>

      <!-- File Info -->
      <div v-if="selectedFile && !isSuccess" class="pdf-uploader__file-info">
        <span class="pdf-uploader__file-name">{{ selectedFile.name }}</span>
        <span class="pdf-uploader__file-size">
          {{ Math.round(selectedFile.size / 1024) }} KB
        </span>
      </div>
    </div>

    <!-- Hidden File Input -->
    <input
      ref="fileInputRef"
      type="file"
      accept="application/pdf"
      class="pdf-uploader__input"
      :disabled="props.disabled"
      @change="handleFileInputChange"
    />

    <!-- Actions -->
    <div v-if="selectedFile && !isSuccess" class="pdf-uploader__actions">
      <UButton
        v-if="props.showButton"
        label="Upload PDF"
        icon="i-heroicons-arrow-up-tray"
        :disabled="!canUpload"
        :loading="isUploading"
        @click.stop="handleUpload"
      />
      <UButton
        v-if="!isUploading"
        label="Clear"
        variant="ghost"
        color="neutral"
        icon="i-heroicons-x-mark"
        @click.stop="clearSelection"
      />
    </div>
  </div>
</template>

<style scoped>
.pdf-uploader {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pdf-uploader__dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem 2rem;
  border: 2px dashed rgb(209 213 219); /* gray-300 */
  border-radius: 0.75rem;
  background-color: rgb(249 250 251); /* gray-50 */
  cursor: pointer;
  transition: all 0.2s;
  min-height: 200px;
}

.pdf-uploader__dropzone:hover:not(.pdf-uploader__dropzone--disabled) {
  border-color: rgb(59 130 246); /* blue-500 */
  background-color: rgb(239 246 255); /* blue-50 */
}

.pdf-uploader__dropzone--dragging {
  border-color: rgb(59 130 246); /* blue-500 */
  background-color: rgb(219 234 254); /* blue-100 */
  transform: scale(1.02);
}

.pdf-uploader__dropzone--uploading {
  border-color: rgb(59 130 246); /* blue-500 */
  background-color: rgb(239 246 255); /* blue-50 */
  cursor: default;
}

.pdf-uploader__dropzone--success {
  border-color: rgb(34 197 94); /* green-500 */
  background-color: rgb(240 253 244); /* green-50 */
  cursor: default;
}

.pdf-uploader__dropzone--error {
  border-color: rgb(239 68 68); /* red-500 */
  background-color: rgb(254 242 242); /* red-50 */
}

.pdf-uploader__dropzone--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: rgb(243 244 246); /* gray-100 */
}

.pdf-uploader__icon {
  font-size: 3rem;
  color: rgb(156 163 175); /* gray-400 */
  transition: color 0.2s;
}

.pdf-uploader__dropzone--dragging .pdf-uploader__icon {
  color: rgb(59 130 246); /* blue-500 */
}

.pdf-uploader__dropzone--uploading .pdf-uploader__icon {
  color: rgb(59 130 246); /* blue-500 */
}

.pdf-uploader__dropzone--success .pdf-uploader__icon {
  color: rgb(34 197 94); /* green-500 */
}

.pdf-uploader__dropzone--error .pdf-uploader__icon {
  color: rgb(239 68 68); /* red-500 */
}

.pdf-uploader__message {
  font-size: 0.875rem;
  color: rgb(107 114 128); /* gray-500 */
  text-align: center;
  max-width: 300px;
  transition: color 0.2s;
}

.pdf-uploader__dropzone--error .pdf-uploader__message {
  color: rgb(185 28 28); /* red-700 */
}

.pdf-uploader__dropzone--success .pdf-uploader__message {
  color: rgb(21 128 61); /* green-700 */
}

.pdf-uploader__file-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  background-color: white;
  border-radius: 0.5rem;
  border: 1px solid rgb(229 231 235); /* gray-200 */
}

.pdf-uploader__file-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(17 24 39); /* gray-900 */
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pdf-uploader__file-size {
  font-size: 0.75rem;
  color: rgb(107 114 128); /* gray-500 */
}

.pdf-uploader__input {
  display: none;
}

.pdf-uploader__actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .pdf-uploader__dropzone {
    border-color: rgb(75 85 99); /* gray-600 */
    background-color: rgb(31 41 55); /* gray-800 */
  }

  .pdf-uploader__dropzone:hover:not(.pdf-uploader__dropzone--disabled) {
    border-color: rgb(96 165 250); /* blue-400 */
    background-color: rgb(30 58 138); /* blue-900 */
  }

  .pdf-uploader__dropzone--dragging {
    border-color: rgb(96 165 250); /* blue-400 */
    background-color: rgb(30 64 175); /* blue-800 */
  }

  .pdf-uploader__dropzone--uploading {
    border-color: rgb(96 165 250); /* blue-400 */
    background-color: rgb(30 58 138); /* blue-900 */
  }

  .pdf-uploader__dropzone--success {
    border-color: rgb(74 222 128); /* green-400 */
    background-color: rgb(20 83 45); /* green-900 */
  }

  .pdf-uploader__dropzone--error {
    border-color: rgb(248 113 113); /* red-400 */
    background-color: rgb(127 29 29); /* red-900 */
  }

  .pdf-uploader__dropzone--disabled {
    background-color: rgb(55 65 81); /* gray-700 */
  }

  .pdf-uploader__icon {
    color: rgb(107 114 128); /* gray-500 */
  }

  .pdf-uploader__dropzone--dragging .pdf-uploader__icon {
    color: rgb(96 165 250); /* blue-400 */
  }

  .pdf-uploader__dropzone--uploading .pdf-uploader__icon {
    color: rgb(96 165 250); /* blue-400 */
  }

  .pdf-uploader__dropzone--success .pdf-uploader__icon {
    color: rgb(74 222 128); /* green-400 */
  }

  .pdf-uploader__dropzone--error .pdf-uploader__icon {
    color: rgb(248 113 113); /* red-400 */
  }

  .pdf-uploader__message {
    color: rgb(156 163 175); /* gray-400 */
  }

  .pdf-uploader__dropzone--error .pdf-uploader__message {
    color: rgb(254 226 226); /* red-100 */
  }

  .pdf-uploader__dropzone--success .pdf-uploader__message {
    color: rgb(187 247 208); /* green-200 */
  }

  .pdf-uploader__file-info {
    background-color: rgb(17 24 39); /* gray-900 */
    border-color: rgb(55 65 81); /* gray-700 */
  }

  .pdf-uploader__file-name {
    color: rgb(243 244 246); /* gray-100 */
  }

  .pdf-uploader__file-size {
    color: rgb(156 163 175); /* gray-400 */
  }
}
</style>
