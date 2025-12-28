<script setup lang="ts">
/**
 * MessageBubble Component
 *
 * Displays a single chat message with appropriate styling based on role.
 * Supports user and assistant messages with different visual treatments.
 */

import type { Message, StreamingMessage } from "../types";

// Props
interface Props {
  /** The message to display */
  message: Message | StreamingMessage;
  /** Show timestamp below message */
  showTimestamp?: boolean;
  /** Timestamp format */
  timestampFormat?: "relative" | "absolute";
  /** Additional CSS classes */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  showTimestamp: true,
  timestampFormat: "relative",
  class: "",
});

// Computed
const isUser = computed(() => props.message.role === "user");
const isAssistant = computed(() => props.message.role === "assistant");

const isStreaming = computed(() => {
  return "is_streaming" in props.message && props.message.is_streaming;
});

const formattedTimestamp = computed(() => {
  const date = new Date(props.message.timestamp);

  if (props.timestampFormat === "absolute") {
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Relative format
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
});

const roleLabel = computed(() => {
  return isUser.value ? "You" : "Assistant";
});

const roleIcon = computed(() => {
  return isUser.value ? "i-heroicons-user-circle" : "i-heroicons-cpu-chip";
});
</script>

<template>
  <div
    :class="[
      'message-bubble',
      isUser && 'message-bubble--user',
      isAssistant && 'message-bubble--assistant',
      isStreaming && 'message-bubble--streaming',
      props.class,
    ]"
  >
    <!-- Avatar/Icon -->
    <div class="message-bubble__avatar">
      <UIcon :name="roleIcon" class="message-bubble__avatar-icon" />
    </div>

    <!-- Content -->
    <div class="message-bubble__content">
      <!-- Header -->
      <div class="message-bubble__header">
        <span class="message-bubble__role">{{ roleLabel }}</span>
        <span v-if="props.showTimestamp" class="message-bubble__timestamp">
          {{ formattedTimestamp }}
        </span>
      </div>

      <!-- Message text -->
      <div class="message-bubble__text">
        <p class="message-bubble__message">{{ message.content }}</p>

        <!-- Streaming indicator -->
        <span v-if="isStreaming" class="message-bubble__cursor">▊</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message-bubble {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.75rem;
  transition: background-color 0.2s;
}

.message-bubble--user {
  background-color: rgb(239 246 255); /* blue-50 */
}

.message-bubble--assistant {
  background-color: rgb(249 250 251); /* gray-50 */
}

.message-bubble--streaming {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.message-bubble__avatar {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: white;
  border: 1px solid rgb(229 231 235); /* gray-200 */
}

.message-bubble--user .message-bubble__avatar {
  background-color: rgb(219 234 254); /* blue-100 */
  border-color: rgb(191 219 254); /* blue-200 */
}

.message-bubble--assistant .message-bubble__avatar {
  background-color: rgb(243 244 246); /* gray-100 */
  border-color: rgb(229 231 235); /* gray-200 */
}

.message-bubble__avatar-icon {
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.375rem;
  color: rgb(107 114 128); /* gray-500 */
}

.message-bubble--user .message-bubble__avatar-icon {
  color: rgb(59 130 246); /* blue-500 */
}

.message-bubble--assistant .message-bubble__avatar-icon {
  color: rgb(107 114 128); /* gray-500 */
}

.message-bubble__content {
  flex: 1;
  min-width: 0;
}

.message-bubble__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.message-bubble__role {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(17 24 39); /* gray-900 */
}

.message-bubble--user .message-bubble__role {
  color: rgb(30 64 175); /* blue-800 */
}

.message-bubble__timestamp {
  font-size: 0.75rem;
  color: rgb(156 163 175); /* gray-400 */
}

.message-bubble__text {
  display: flex;
  align-items: flex-end;
  gap: 0.25rem;
}

.message-bubble__message {
  font-size: 0.9375rem;
  line-height: 1.625;
  color: rgb(55 65 81); /* gray-700 */
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

.message-bubble--user .message-bubble__message {
  color: rgb(30 58 138); /* blue-900 */
}

.message-bubble__cursor {
  display: inline-block;
  font-size: 0.875rem;
  color: rgb(59 130 246); /* blue-500 */
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .message-bubble--user {
    background-color: rgb(30 58 138); /* blue-900 */
  }

  .message-bubble--assistant {
    background-color: rgb(31 41 55); /* gray-800 */
  }

  .message-bubble__avatar {
    background-color: rgb(55 65 81); /* gray-700 */
    border-color: rgb(75 85 99); /* gray-600 */
  }

  .message-bubble--user .message-bubble__avatar {
    background-color: rgb(30 64 175); /* blue-800 */
    border-color: rgb(37 99 235); /* blue-600 */
  }

  .message-bubble--assistant .message-bubble__avatar {
    background-color: rgb(55 65 81); /* gray-700 */
    border-color: rgb(75 85 99); /* gray-600 */
  }

  .message-bubble__avatar-icon {
    color: rgb(156 163 175); /* gray-400 */
  }

  .message-bubble--user .message-bubble__avatar-icon {
    color: rgb(147 197 253); /* blue-300 */
  }

  .message-bubble__role {
    color: rgb(243 244 246); /* gray-100 */
  }

  .message-bubble--user .message-bubble__role {
    color: rgb(191 219 254); /* blue-200 */
  }

  .message-bubble__timestamp {
    color: rgb(107 114 128); /* gray-500 */
  }

  .message-bubble__message {
    color: rgb(209 213 219); /* gray-300 */
  }

  .message-bubble--user .message-bubble__message {
    color: rgb(219 234 254); /* blue-100 */
  }

  .message-bubble__cursor {
    color: rgb(96 165 250); /* blue-400 */
  }
}
</style>
