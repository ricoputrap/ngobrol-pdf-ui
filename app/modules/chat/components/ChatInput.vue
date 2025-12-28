<script setup lang="ts">
/**
 * ChatInput Component
 *
 * Text input area for sending chat messages with validation and keyboard support.
 * Includes auto-resize textarea, character count, and send button.
 */

import { validateMessageContent, DEFAULT_CHAT_CONFIG } from "../types";
import type { ChatConfig } from "../types";

// Props
interface Props {
  /** Placeholder text for input */
  placeholder?: string;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Whether a message is currently being sent */
  sending?: boolean;
  /** Custom chat configuration */
  config?: Partial<ChatConfig>;
  /** Show character count */
  showCharacterCount?: boolean;
  /** Auto-focus input on mount */
  autoFocus?: boolean;
  /** Additional CSS classes */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "Type your message...",
  disabled: false,
  sending: false,
  config: () => ({}),
  showCharacterCount: true,
  autoFocus: false,
  class: "",
});

// Emits
const emit = defineEmits<{
  send: [content: string];
  input: [content: string];
}>();

// Refs
const inputRef = ref<HTMLTextAreaElement | null>(null);
const inputText = ref("");

// Computed
const mergedConfig = computed<ChatConfig>(() => ({
  ...DEFAULT_CHAT_CONFIG,
  ...props.config,
}));

const trimmedText = computed(() => inputText.value.trim());

const validation = computed(() =>
  validateMessageContent(inputText.value, mergedConfig.value)
);

const canSend = computed(
  () =>
    !props.disabled &&
    !props.sending &&
    trimmedText.value.length > 0 &&
    validation.value.valid
);

const characterCount = computed(() => trimmedText.value.length);

const maxLength = computed(() => mergedConfig.value.max_message_length);

const isNearLimit = computed(() => characterCount.value > maxLength.value * 0.9);

const isOverLimit = computed(() => characterCount.value > maxLength.value);

const characterCountClass = computed(() => {
  if (isOverLimit.value) return "chat-input__count--error";
  if (isNearLimit.value) return "chat-input__count--warning";
  return "";
});

// Methods
const handleSend = () => {
  if (!canSend.value) return;

  emit("send", trimmedText.value);
  inputText.value = "";
  resizeTextarea();
};

const handleKeyDown = (event: KeyboardEvent) => {
  // Send on Enter (without Shift)
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    handleSend();
  }
};

const handleInput = () => {
  emit("input", inputText.value);
  resizeTextarea();
};

const resizeTextarea = () => {
  if (!inputRef.value) return;

  // Reset height to auto to get accurate scrollHeight
  inputRef.value.style.height = "auto";

  // Set new height based on content (max 200px)
  const newHeight = Math.min(inputRef.value.scrollHeight, 200);
  inputRef.value.style.height = `${newHeight}px`;
};

const focus = () => {
  inputRef.value?.focus();
};

const clear = () => {
  inputText.value = "";
  resizeTextarea();
};

// Lifecycle
onMounted(() => {
  if (props.autoFocus) {
    nextTick(() => focus());
  }
});

// Expose methods for parent components
defineExpose({
  focus,
  clear,
});
</script>

<template>
  <div :class="['chat-input', props.disabled && 'chat-input--disabled', props.class]">
    <!-- Input container -->
    <div class="chat-input__container">
      <!-- Textarea -->
      <textarea
        ref="inputRef"
        v-model="inputText"
        :placeholder="props.placeholder"
        :disabled="props.disabled || props.sending"
        class="chat-input__textarea"
        rows="1"
        @keydown="handleKeyDown"
        @input="handleInput"
      />

      <!-- Send button -->
      <button
        type="button"
        class="chat-input__send"
        :disabled="!canSend"
        @click="handleSend"
      >
        <UIcon
          v-if="props.sending"
          name="i-heroicons-arrow-path"
          class="animate-spin"
        />
        <UIcon v-else name="i-heroicons-paper-airplane" />
      </button>
    </div>

    <!-- Footer -->
    <div class="chat-input__footer">
      <!-- Hint -->
      <span class="chat-input__hint">
        Press <kbd>Enter</kbd> to send, <kbd>Shift</kbd>+<kbd>Enter</kbd> for new line
      </span>

      <!-- Character count -->
      <span
        v-if="props.showCharacterCount"
        :class="['chat-input__count', characterCountClass]"
      >
        {{ characterCount }} / {{ maxLength }}
      </span>
    </div>

    <!-- Validation error -->
    <Transition name="slide">
      <p v-if="inputText.length > 0 && !validation.valid" class="chat-input__error">
        {{ validation.error }}
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.chat-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.chat-input--disabled {
  opacity: 0.6;
  pointer-events: none;
}

.chat-input__container {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: white;
  border: 1px solid rgb(229 231 235); /* gray-200 */
  border-radius: 0.75rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.chat-input__container:focus-within {
  border-color: rgb(59 130 246); /* blue-500 */
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.chat-input__textarea {
  flex: 1;
  min-height: 1.5rem;
  max-height: 200px;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: rgb(17 24 39); /* gray-900 */
  resize: none;
  overflow-y: auto;
}

.chat-input__textarea::placeholder {
  color: rgb(156 163 175); /* gray-400 */
}

.chat-input__textarea:disabled {
  cursor: not-allowed;
}

.chat-input__send {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  border-radius: 0.5rem;
  background-color: rgb(59 130 246); /* blue-500 */
  color: white;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}

.chat-input__send:hover:not(:disabled) {
  background-color: rgb(37 99 235); /* blue-600 */
}

.chat-input__send:active:not(:disabled) {
  transform: scale(0.95);
}

.chat-input__send:disabled {
  background-color: rgb(209 213 219); /* gray-300 */
  cursor: not-allowed;
}

.chat-input__send .i-heroicons-paper-airplane {
  font-size: 1.125rem;
  transform: rotate(-45deg);
}

.chat-input__send .i-heroicons-arrow-path {
  font-size: 1.125rem;
}

.chat-input__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0.25rem;
}

.chat-input__hint {
  font-size: 0.75rem;
  color: rgb(156 163 175); /* gray-400 */
}

.chat-input__hint kbd {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  font-family: inherit;
  font-size: 0.6875rem;
  background-color: rgb(243 244 246); /* gray-100 */
  border: 1px solid rgb(229 231 235); /* gray-200 */
  border-radius: 0.25rem;
  color: rgb(107 114 128); /* gray-500 */
}

.chat-input__count {
  font-size: 0.75rem;
  color: rgb(156 163 175); /* gray-400 */
  transition: color 0.2s;
}

.chat-input__count--warning {
  color: rgb(245 158 11); /* amber-500 */
}

.chat-input__count--error {
  color: rgb(239 68 68); /* red-500 */
  font-weight: 500;
}

.chat-input__error {
  margin: 0;
  padding: 0 0.25rem;
  font-size: 0.75rem;
  color: rgb(239 68 68); /* red-500 */
}

/* Slide transition for error message */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .chat-input__container {
    background-color: rgb(31 41 55); /* gray-800 */
    border-color: rgb(75 85 99); /* gray-600 */
  }

  .chat-input__container:focus-within {
    border-color: rgb(96 165 250); /* blue-400 */
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
  }

  .chat-input__textarea {
    color: rgb(243 244 246); /* gray-100 */
  }

  .chat-input__textarea::placeholder {
    color: rgb(107 114 128); /* gray-500 */
  }

  .chat-input__send {
    background-color: rgb(37 99 235); /* blue-600 */
  }

  .chat-input__send:hover:not(:disabled) {
    background-color: rgb(29 78 216); /* blue-700 */
  }

  .chat-input__send:disabled {
    background-color: rgb(75 85 99); /* gray-600 */
  }

  .chat-input__hint {
    color: rgb(107 114 128); /* gray-500 */
  }

  .chat-input__hint kbd {
    background-color: rgb(55 65 81); /* gray-700 */
    border-color: rgb(75 85 99); /* gray-600 */
    color: rgb(156 163 175); /* gray-400 */
  }

  .chat-input__count {
    color: rgb(107 114 128); /* gray-500 */
  }

  .chat-input__count--warning {
    color: rgb(251 191 36); /* amber-400 */
  }

  .chat-input__count--error {
    color: rgb(248 113 113); /* red-400 */
  }

  .chat-input__error {
    color: rgb(248 113 113); /* red-400 */
  }
}
</style>
