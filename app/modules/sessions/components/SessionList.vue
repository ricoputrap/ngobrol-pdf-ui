<script setup lang="ts">
/**
 * SessionList Component
 *
 * Displays a list of chat sessions.
 * Uses Pinia store for state management.
 */

import { useSessionsStore } from "~/stores/sessions";

const sessionStore = useSessionsStore();

// Props
interface Props {
    /** Whether to show the loading state */
    showLoading?: boolean;
    /** Maximum number of sessions to display */
    maxItems?: number;
}

const props = withDefaults(defineProps<Props>(), {
    showLoading: true,
    maxItems: undefined,
});

// Emits
const emit = defineEmits<{
    sessionClick: [sessionId: string];
    sessionDelete: [sessionId: string];
}>();

// Computed
const displaySessions = computed(() => {
    if (props.maxItems) {
        return sessionStore.sessions.slice(0, props.maxItems);
    }
    return sessionStore.sessions;
});

const isEmpty = computed(() => {
    return !sessionStore.isLoading && displaySessions.value.length === 0;
});

// Methods
const handleSessionClick = (sessionId: string) => {
    emit("sessionClick", sessionId);
};

const handleSessionDelete = (sessionId: string) => {
    emit("sessionDelete", sessionId);
};

// Lifecycle
onMounted(async () => {
    if (!sessionStore.hasSessions) {
        await sessionStore.fetchSessions();
    }
});
</script>

<template>
    <div class="session-list">
        <!-- Loading State -->
        <div
            v-if="props.showLoading && sessionStore.isLoading"
            class="loading-state"
        >
            <UIcon name="i-heroicons-arrow-path" class="animate-spin" />
            <span class="loading-text">Loading sessions...</span>
        </div>

        <!-- Error State -->
        <div v-else-if="sessionStore.error" class="error-state">
            <UIcon name="i-heroicons-exclamation-circle" />
            <span class="error-text">{{ sessionStore.error }}</span>
            <UButton size="xs" variant="ghost" @click="sessionStore.clearError">
                Dismiss
            </UButton>
        </div>

        <!-- Empty State -->
        <div v-else-if="isEmpty" class="empty-state">
            <UIcon
                name="i-heroicons-chat-bubble-left-right"
                class="empty-icon"
            />
            <p class="empty-title">No sessions yet</p>
            <p class="empty-description">
                Create a new session to start chatting about your PDFs
            </p>
        </div>

        <!-- Session List -->
        <div v-else class="sessions-container">
            <div
                v-for="session in displaySessions"
                :key="session.id"
                class="session-item-wrapper"
                @click="handleSessionClick(session.id)"
            >
                <div class="session-content">
                    <!-- Session Icon -->
                    <div class="session-icon">
                        <UIcon
                            :name="
                                session.pdf_file_name
                                    ? 'i-heroicons-document-text'
                                    : 'i-heroicons-chat-bubble-left'
                            "
                        />
                    </div>

                    <!-- Session Details -->
                    <div class="session-details">
                        <h3 class="session-title">{{ session.title }}</h3>
                        <p v-if="session.pdf_file_name" class="session-pdf">
                            <UIcon
                                name="i-heroicons-paper-clip"
                                class="pdf-icon"
                            />
                            {{ session.pdf_file_name }}
                        </p>
                        <p v-else class="session-no-pdf">No PDF uploaded</p>
                    </div>

                    <!-- Delete Button -->
                    <UButton
                        icon="i-heroicons-trash"
                        color="error"
                        variant="ghost"
                        size="xs"
                        class="delete-button"
                        @click.stop="handleSessionDelete(session.id)"
                    />
                </div>
            </div>

            <!-- Show More Indicator -->
            <div
                v-if="
                    props.maxItems &&
                    sessionStore.sessions.length > props.maxItems
                "
                class="show-more"
            >
                <span class="show-more-text">
                    + {{ sessionStore.sessions.length - props.maxItems }} more
                    sessions
                </span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.session-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

/* Loading State */
.loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 2rem;
    color: rgb(156 163 175); /* gray-400 */
}

.loading-text {
    font-size: 0.875rem;
}

/* Error State */
.error-state {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background-color: rgb(254 242 242); /* red-50 */
    border: 1px solid rgb(254 226 226); /* red-100 */
    border-radius: 0.5rem;
    color: rgb(185 28 28); /* red-700 */
    font-size: 0.875rem;
}

.error-text {
    flex: 1;
}

/* Empty State */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1.5rem;
    text-align: center;
    color: rgb(156 163 175); /* gray-400 */
}

.empty-icon {
    width: 3rem;
    height: 3rem;
    margin-bottom: 1rem;
    color: rgb(209 213 219); /* gray-300 */
}

.empty-title {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
    color: rgb(107 114 128); /* gray-500 */
}

.empty-description {
    font-size: 0.875rem;
    max-width: 20rem;
}

/* Sessions Container */
.sessions-container {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

/* Session Item */
.session-item-wrapper {
    cursor: pointer;
    border-radius: 0.5rem;
    transition: background-color 0.2s;
}

.session-item-wrapper:hover {
    background-color: rgb(249 250 251); /* gray-50 */
}

.session-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
}

.session-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.5rem;
    background-color: rgb(243 244 246); /* gray-100 */
    color: rgb(107 114 128); /* gray-500 */
    flex-shrink: 0;
}

.session-details {
    flex: 1;
    min-width: 0;
}

.session-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: rgb(17 24 39); /* gray-900 */
    margin-bottom: 0.125rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.session-pdf,
.session-no-pdf {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: rgb(107 114 128); /* gray-500 */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.pdf-icon {
    flex-shrink: 0;
}

.session-no-pdf {
    font-style: italic;
    color: rgb(156 163 175); /* gray-400 */
}

.delete-button {
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 0.2s;
}

.session-item-wrapper:hover .delete-button {
    opacity: 1;
}

/* Show More */
.show-more {
    padding: 0.5rem 0.75rem;
    text-align: center;
}

.show-more-text {
    font-size: 0.75rem;
    color: rgb(107 114 128); /* gray-500 */
    font-weight: 500;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .session-item-wrapper:hover {
        background-color: rgb(31 41 55); /* gray-800 */
    }

    .error-state {
        background-color: rgb(127 29 29); /* red-900 */
        border-color: rgb(153 27 27); /* red-800 */
        color: rgb(254 226 226); /* red-100 */
    }

    .empty-icon {
        color: rgb(75 85 99); /* gray-600 */
    }

    .empty-title {
        color: rgb(156 163 175); /* gray-400 */
    }

    .session-icon {
        background-color: rgb(31 41 55); /* gray-800 */
        color: rgb(156 163 175); /* gray-400 */
    }

    .session-title {
        color: rgb(243 244 246); /* gray-100 */
    }

    .session-pdf {
        color: rgb(156 163 175); /* gray-400 */
    }

    .session-no-pdf {
        color: rgb(107 114 128); /* gray-500 */
    }
}
</style>
