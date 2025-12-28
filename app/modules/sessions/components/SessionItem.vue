<script setup lang="ts">
/**
 * SessionItem Component
 *
 * Displays a single session item with title, PDF info, and actions.
 * Reusable component for session lists.
 */

import type { Session } from "../types";

// Props
interface Props {
  /** Session data to display */
  session: Session;
  /** Whether this session is currently active/selected */
  isActive?: boolean;
  /** Show delete button */
  showDelete?: boolean;
  /** Custom CSS class */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  showDelete: true,
  class: "",
});

// Emits
const emit = defineEmits<{
  click: [sessionId: string];
  delete: [sessionId: string];
}>();

// Methods
const handleClick = () => {
  emit("click", props.session.id);
};

const handleDelete = (event: Event) => {
  event.stopPropagation();
  emit("delete", props.session.id);
};

// Computed
const formattedDate = computed(() => {
  const date = new Date(props.session.updated_at);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
});

const sessionIcon = computed(() => {
  return props.session.pdf_file_name
    ? "i-heroicons-document-text"
    : "i-heroicons-chat-bubble-left";
});
</script>

<template>
  <div
    :class="[
      'session-item',
      isActive && 'session-item--active',
      props.class,
    ]"
    @click="handleClick"
  >
    <div class="session-item__content">
      <!-- Session Icon -->
      <div class="session-item__icon">
        <UIcon :name="sessionIcon" />
      </div>

      <!-- Session Details -->
      <div class="session-item__details">
        <div class="session-item__header">
          <h3 class="session-item__title">{{ session.title }}</h3>
          <span class="session-item__date">{{ formattedDate }}</span>
        </div>

        <div class="session-item__meta">
          <div v-if="session.pdf_file_name" class="session-item__pdf">
            <UIcon name="i-heroicons-paper-clip" class="session-item__pdf-icon" />
            <span class="session-item__pdf-name">{{ session.pdf_file_name }}</span>
          </div>
          <span v-else class="session-item__no-pdf">No PDF uploaded</span>
        </div>
      </div>

      <!-- Delete Button -->
      <UButton
        v-if="showDelete"
        icon="i-heroicons-trash"
        color="error"
        variant="ghost"
        size="xs"
        class="session-item__delete"
        @click="handleDelete"
      />
    </div>
  </div>
</template>

<style scoped>
.session-item {
  cursor: pointer;
  border-radius: 0.5rem;
  transition: all 0.2s;
  position: relative;
}

.session-item:hover {
  background-color: rgb(249 250 251); /* gray-50 */
}

.session-item--active {
  background-color: rgb(243 244 246); /* gray-100 */
  border-left: 3px solid rgb(59 130 246); /* blue-500 */
  padding-left: calc(0.75rem - 3px);
}

.session-item__content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
}

.session-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background-color: rgb(243 244 246); /* gray-100 */
  color: rgb(107 114 128); /* gray-500 */
  flex-shrink: 0;
  transition: all 0.2s;
}

.session-item--active .session-item__icon {
  background-color: rgb(219 234 254); /* blue-100 */
  color: rgb(59 130 246); /* blue-500 */
}

.session-item__details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.session-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.session-item__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(17 24 39); /* gray-900 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.session-item__date {
  font-size: 0.75rem;
  color: rgb(156 163 175); /* gray-400 */
  flex-shrink: 0;
}

.session-item__meta {
  display: flex;
  align-items: center;
}

.session-item__pdf {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: rgb(107 114 128); /* gray-500 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.session-item__pdf-icon {
  flex-shrink: 0;
}

.session-item__pdf-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-item__no-pdf {
  font-size: 0.75rem;
  font-style: italic;
  color: rgb(156 163 175); /* gray-400 */
}

.session-item__delete {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.session-item:hover .session-item__delete {
  opacity: 1;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .session-item:hover {
    background-color: rgb(31 41 55); /* gray-800 */
  }

  .session-item--active {
    background-color: rgb(31 41 55); /* gray-800 */
    border-left-color: rgb(96 165 250); /* blue-400 */
  }

  .session-item__icon {
    background-color: rgb(31 41 55); /* gray-800 */
    color: rgb(156 163 175); /* gray-400 */
  }

  .session-item--active .session-item__icon {
    background-color: rgb(30 58 138); /* blue-900 */
    color: rgb(96 165 250); /* blue-400 */
  }

  .session-item__title {
    color: rgb(243 244 246); /* gray-100 */
  }

  .session-item__date {
    color: rgb(107 114 128); /* gray-500 */
  }

  .session-item__pdf {
    color: rgb(156 163 175); /* gray-400 */
  }

  .session-item__no-pdf {
    color: rgb(107 114 128); /* gray-500 */
  }
}
</style>
