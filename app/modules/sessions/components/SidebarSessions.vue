<script setup lang="ts">
/**
 * SidebarSessions Component
 *
 * Main sidebar component that displays a list of all chat sessions.
 * Features:
 * - Scrollable list of sessions
 * - Search/filter functionality
 * - Loading state
 * - Empty state
 * - Click navigation to sessions
 * - Delete functionality
 * - Auto-refresh
 */

import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useSidebarSessions } from "../composables/useSidebarSessions";
import SidebarSessionItem from "./SidebarSessionItem.vue";
import { useSessionsStore } from "~/stores/sessions";

// Composables
const router = useRouter();
const {
    displaySessions,
    activeSessionId,
    isLoading,
    hasSessions,
    searchQuery,
    setSearchQuery,
    clearSearch,
    setActiveSession,
    refreshSessions,
} = useSidebarSessions();

const sessionStore = useSessionsStore();

// State
const showSearch = ref(false);
const deletingSessionId = ref<string | null>(null);

// Methods
const handleSessionClick = async (sessionId: string) => {
    setActiveSession(sessionId);
    await router.push(`/chat/${sessionId}`);
};

const handleSessionDelete = async (sessionId: string) => {
    if (deletingSessionId.value) return;

    if (!confirm("Are you sure you want to delete this session?")) {
        return;
    }

    try {
        deletingSessionId.value = sessionId;
        await sessionStore.deleteSession(sessionId);
        await refreshSessions();

        // If the deleted session was active, clear the active session
        if (activeSessionId.value === sessionId) {
            setActiveSession(null);
        }
    } catch (error) {
        console.error("Failed to delete session:", error);
        alert("Failed to delete session. Please try again.");
    } finally {
        deletingSessionId.value = null;
    }
};

const toggleSearch = () => {
    showSearch.value = !showSearch.value;
    if (!showSearch.value) {
        clearSearch();
    }
};

const handleSearchInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    setSearchQuery(target.value);
};

const noSearchResults = computed(() => {
    return (
        searchQuery.value.trim().length > 0 &&
        displaySessions.value.length === 0
    );
});

const showEmptyState = computed(() => {
    return !isLoading.value && !hasSessions.value && !searchQuery.value.trim();
});
</script>

<template>
    <div class="sidebar-sessions">
        <!-- Header -->
        <div class="sidebar-sessions__header">
            <h2 class="sidebar-sessions__title">Recent Chats</h2>
            <div class="sidebar-sessions__actions">
                <UButton
                    icon="i-heroicons-magnifying-glass"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    :aria-label="showSearch ? 'Hide search' : 'Show search'"
                    @click="toggleSearch"
                />
                <UButton
                    icon="i-heroicons-arrow-path"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    aria-label="Refresh sessions"
                    :loading="isLoading"
                    @click="refreshSessions"
                />
            </div>
        </div>

        <!-- Search Bar -->
        <Transition name="search-slide">
            <div v-if="showSearch" class="sidebar-sessions__search">
                <input
                    type="text"
                    :value="searchQuery"
                    placeholder="Search sessions..."
                    class="sidebar-sessions__search-input"
                    @input="handleSearchInput"
                />
                <UButton
                    v-if="searchQuery"
                    icon="i-heroicons-x-mark"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    aria-label="Clear search"
                    class="sidebar-sessions__search-clear"
                    @click="clearSearch"
                />
            </div>
        </Transition>

        <!-- Loading State -->
        <div v-if="isLoading && !hasSessions" class="sidebar-sessions__loading">
            <div v-for="i in 3" :key="i" class="sidebar-sessions__skeleton">
                <div class="sidebar-sessions__skeleton-icon" />
                <div class="sidebar-sessions__skeleton-content">
                    <div class="sidebar-sessions__skeleton-title" />
                    <div class="sidebar-sessions__skeleton-subtitle" />
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="showEmptyState" class="sidebar-sessions__empty">
            <UIcon
                name="i-heroicons-chat-bubble-left-ellipsis"
                class="sidebar-sessions__empty-icon"
            />
            <p class="sidebar-sessions__empty-text">No sessions yet</p>
            <p class="sidebar-sessions__empty-hint">
                Start a new chat to begin
            </p>
        </div>

        <!-- No Search Results -->
        <div v-else-if="noSearchResults" class="sidebar-sessions__empty">
            <UIcon
                name="i-heroicons-magnifying-glass"
                class="sidebar-sessions__empty-icon"
            />
            <p class="sidebar-sessions__empty-text">No results found</p>
            <p class="sidebar-sessions__empty-hint">
                Try a different search term
            </p>
        </div>

        <!-- Session List -->
        <div v-else class="sidebar-sessions__list">
            <SidebarSessionItem
                v-for="session in displaySessions"
                :key="session.id"
                :session="session"
                :is-active="activeSessionId === session.id"
                :class="{
                    'sidebar-sessions__item--deleting':
                        deletingSessionId === session.id,
                }"
                @click="handleSessionClick"
                @delete="handleSessionDelete"
            />
        </div>
    </div>
</template>

<style scoped>
.sidebar-sessions {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 0.75rem;
}

/* Header */
.sidebar-sessions__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
}

.sidebar-sessions__title {
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgb(107 114 128); /* gray-500 */
    margin: 0;
}

.sidebar-sessions__actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

/* Search */
.sidebar-sessions__search {
    position: relative;
    display: flex;
    align-items: center;
}

.sidebar-sessions__search-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    padding-right: 2rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: rgb(17 24 39); /* gray-900 */
    background-color: rgb(249 250 251); /* gray-50 */
    border: 1px solid rgb(229 231 235); /* gray-200 */
    border-radius: 0.5rem;
    outline: none;
    transition: all 0.2s ease-in-out;
}

.sidebar-sessions__search-input:focus {
    background-color: white;
    border-color: rgb(59 130 246); /* blue-500 */
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.sidebar-sessions__search-input::placeholder {
    color: rgb(156 163 175); /* gray-400 */
}

.sidebar-sessions__search-clear {
    position: absolute;
    right: 0.25rem;
}

/* Search transition */
.search-slide-enter-active,
.search-slide-leave-active {
    transition: all 0.3s ease;
    overflow: hidden;
}

.search-slide-enter-from,
.search-slide-leave-to {
    max-height: 0;
    opacity: 0;
    margin-top: 0;
    margin-bottom: 0;
}

.search-slide-enter-to,
.search-slide-leave-from {
    max-height: 3rem;
    opacity: 1;
}

/* Loading State */
.sidebar-sessions__loading {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.sidebar-sessions__skeleton {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.sidebar-sessions__skeleton-icon {
    width: 2rem;
    height: 2rem;
    border-radius: 0.375rem;
    background-color: rgb(229 231 235); /* gray-200 */
    flex-shrink: 0;
}

.sidebar-sessions__skeleton-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
}

.sidebar-sessions__skeleton-title {
    height: 0.875rem;
    width: 70%;
    border-radius: 0.25rem;
    background-color: rgb(229 231 235); /* gray-200 */
}

.sidebar-sessions__skeleton-subtitle {
    height: 0.75rem;
    width: 50%;
    border-radius: 0.25rem;
    background-color: rgb(229 231 235); /* gray-200 */
}

@keyframes pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

/* Empty State */
.sidebar-sessions__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    text-align: center;
}

.sidebar-sessions__empty-icon {
    font-size: 3rem;
    color: rgb(209 213 219); /* gray-300 */
    margin-bottom: 0.75rem;
}

.sidebar-sessions__empty-text {
    font-size: 0.875rem;
    font-weight: 600;
    color: rgb(107 114 128); /* gray-500 */
    margin: 0 0 0.25rem 0;
}

.sidebar-sessions__empty-hint {
    font-size: 0.75rem;
    color: rgb(156 163 175); /* gray-400 */
    margin: 0;
}

/* Session List */
.sidebar-sessions__list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.125rem;
}

.sidebar-sessions__list::-webkit-scrollbar {
    width: 0.375rem;
}

.sidebar-sessions__list::-webkit-scrollbar-track {
    background-color: transparent;
}

.sidebar-sessions__list::-webkit-scrollbar-thumb {
    background-color: rgb(209 213 219); /* gray-300 */
    border-radius: 0.25rem;
}

.sidebar-sessions__list::-webkit-scrollbar-thumb:hover {
    background-color: rgb(156 163 175); /* gray-400 */
}

.sidebar-sessions__item--deleting {
    opacity: 0.5;
    pointer-events: none;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .sidebar-sessions__title {
        color: rgb(156 163 175); /* gray-400 */
    }

    .sidebar-sessions__search-input {
        color: rgb(243 244 246); /* gray-100 */
        background-color: rgb(31 41 55); /* gray-800 */
        border-color: rgb(55 65 81); /* gray-700 */
    }

    .sidebar-sessions__search-input:focus {
        background-color: rgb(31 41 55); /* gray-800 */
        border-color: rgb(96 165 250); /* blue-400 */
        box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
    }

    .sidebar-sessions__search-input::placeholder {
        color: rgb(107 114 128); /* gray-500 */
    }

    .sidebar-sessions__skeleton-icon {
        background-color: rgb(55 65 81); /* gray-700 */
    }

    .sidebar-sessions__skeleton-title,
    .sidebar-sessions__skeleton-subtitle {
        background-color: rgb(55 65 81); /* gray-700 */
    }

    .sidebar-sessions__empty-icon {
        color: rgb(55 65 81); /* gray-700 */
    }

    .sidebar-sessions__empty-text {
        color: rgb(156 163 175); /* gray-400 */
    }

    .sidebar-sessions__empty-hint {
        color: rgb(107 114 128); /* gray-500 */
    }

    .sidebar-sessions__list::-webkit-scrollbar-thumb {
        background-color: rgb(55 65 81); /* gray-700 */
    }

    .sidebar-sessions__list::-webkit-scrollbar-thumb:hover {
        background-color: rgb(107 114 128); /* gray-500 */
    }
}
</style>
