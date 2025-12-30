<script setup lang="ts">
/**
 * SidebarSessionItem Component
 *
 * Specialized session item component for sidebar display.
 * Displays a compact version of session information optimized for sidebar layout.
 */

import type { Session } from "../types";

// Props
interface Props {
    /** Session data to display */
    session: Session;
    /** Whether this session is currently active/selected */
    isActive?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    isActive: false,
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

const truncatedTitle = computed(() => {
    const maxLength = 40;
    if (props.session.title.length <= maxLength) {
        return props.session.title;
    }
    return props.session.title.substring(0, maxLength) + "...";
});

const truncatedFileName = computed(() => {
    if (!props.session.pdf_file_name) return null;

    const maxLength = 30;
    const fileName = props.session.pdf_file_name;

    if (fileName.length <= maxLength) {
        return fileName;
    }

    const extension = fileName.substring(fileName.lastIndexOf("."));
    const baseName = fileName.substring(0, fileName.lastIndexOf("."));
    const truncatedBase = baseName.substring(
        0,
        maxLength - extension.length - 3,
    );

    return `${truncatedBase}...${extension}`;
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
            'sidebar-session-item',
            isActive && 'sidebar-session-item--active',
        ]"
        @click="handleClick"
    >
        <!-- Session Icon -->
        <div class="sidebar-session-item__icon">
            <UIcon :name="sessionIcon" />
        </div>

        <!-- Session Details -->
        <div class="sidebar-session-item__details">
            <h3 class="sidebar-session-item__title" :title="session.title">
                {{ truncatedTitle }}
            </h3>

            <div class="sidebar-session-item__meta">
                <span
                    v-if="truncatedFileName"
                    class="sidebar-session-item__filename"
                    :title="session.pdf_file_name || ''"
                >
                    {{ truncatedFileName }}
                </span>
                <span v-else class="sidebar-session-item__no-pdf">No PDF</span>
            </div>

            <div class="sidebar-session-item__footer">
                <span class="sidebar-session-item__date">{{
                    formattedDate
                }}</span>
            </div>
        </div>

        <!-- Delete Button -->
        <UButton
            icon="i-heroicons-trash"
            color="neutral"
            variant="ghost"
            size="xs"
            class="sidebar-session-item__delete"
            @click="handleDelete"
        />
    </div>
</template>

<style scoped>
.sidebar-session-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    position: relative;
    border-left: 3px solid transparent;
}

.sidebar-session-item:hover {
    background-color: rgb(249 250 251); /* gray-50 */
}

.sidebar-session-item--active {
    background-color: rgb(243 244 246); /* gray-100 */
    border-left-color: rgb(59 130 246); /* blue-500 */
}

.sidebar-session-item__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 0.375rem;
    background-color: rgb(243 244 246); /* gray-100 */
    color: rgb(107 114 128); /* gray-500 */
    flex-shrink: 0;
    transition: all 0.2s ease-in-out;
}

.sidebar-session-item--active .sidebar-session-item__icon {
    background-color: rgb(219 234 254); /* blue-100 */
    color: rgb(59 130 246); /* blue-500 */
}

.sidebar-session-item__details {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.sidebar-session-item__title {
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.25rem;
    color: rgb(17 24 39); /* gray-900 */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin: 0;
}

.sidebar-session-item__meta {
    display: flex;
    align-items: center;
}

.sidebar-session-item__filename {
    font-size: 0.75rem;
    line-height: 1rem;
    color: rgb(107 114 128); /* gray-500 */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.sidebar-session-item__no-pdf {
    font-size: 0.75rem;
    line-height: 1rem;
    font-style: italic;
    color: rgb(156 163 175); /* gray-400 */
}

.sidebar-session-item__footer {
    display: flex;
    align-items: center;
}

.sidebar-session-item__date {
    font-size: 0.75rem;
    line-height: 1rem;
    color: rgb(156 163 175); /* gray-400 */
}

.sidebar-session-item__delete {
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
}

.sidebar-session-item:hover .sidebar-session-item__delete {
    opacity: 1;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .sidebar-session-item:hover {
        background-color: rgb(31 41 55); /* gray-800 */
    }

    .sidebar-session-item--active {
        background-color: rgb(31 41 55); /* gray-800 */
        border-left-color: rgb(96 165 250); /* blue-400 */
    }

    .sidebar-session-item__icon {
        background-color: rgb(31 41 55); /* gray-800 */
        color: rgb(156 163 175); /* gray-400 */
    }

    .sidebar-session-item--active .sidebar-session-item__icon {
        background-color: rgb(30 58 138); /* blue-900 */
        color: rgb(96 165 250); /* blue-400 */
    }

    .sidebar-session-item__title {
        color: rgb(243 244 246); /* gray-100 */
    }

    .sidebar-session-item__filename {
        color: rgb(156 163 175); /* gray-400 */
    }

    .sidebar-session-item__no-pdf {
        color: rgb(107 114 128); /* gray-500 */
    }

    .sidebar-session-item__date {
        color: rgb(107 114 128); /* gray-500 */
    }
}
</style>
