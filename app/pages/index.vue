<script setup lang="ts">
/**
 * Home Page
 *
 * Landing page displaying welcome message and recent sessions.
 * Provides quick actions to create new chat sessions.
 */

import { useSessionsStore } from "~/stores/sessions";
import AppHeader from "~/shared/components/AppHeader.vue";
import EmptyState from "~/shared/components/EmptyState.vue";
import NewSessionButton from "~/modules/sessions/components/NewSessionButton.vue";

// Store
const sessionStore = useSessionsStore();

// Fetch sessions on mount
onMounted(() => {
    sessionStore.fetchSessions();
});

// Computed
const hasSessions = computed(() => sessionStore.hasSessions);
const isLoading = computed(() => sessionStore.isLoading);

// Methods
const handleSessionCreated = async (sessionId: string) => {
    // Ensure pending DOM updates are applied before navigating
    await nextTick();

    try {
        // Primary navigation using Nuxt's navigateTo
        await navigateTo(`/chat/${sessionId}`, {
            replace: false,
            external: false,
        });
    } catch {
        // Fallback to Vue Router if navigateTo fails for any reason
        const router = useRouter();
        await router.push(`/chat/${sessionId}`);
    }
};

const handleSessionError = (error: string) => {
    // Placeholder for error handling (e.g. show toast or banner)
    // Currently intentionally left blank to avoid noisy logs in production
};

// Page meta
definePageMeta({
    layout: "default",
});
</script>

<template>
    <div class="home-page">
        <!-- Main Content -->
        <div class="home-page__content">
            <!-- Header -->
            <AppHeader
                title="Welcome to Ngobrol PDF"
                subtitle="Chat with your PDF documents using AI"
            />

            <!-- Main Area -->
            <div class="home-page__main">
                <!-- Loading State -->
                <div v-if="isLoading" class="home-page__loading">
                    <UIcon name="i-heroicons-arrow-path" class="animate-spin" />
                    <span>Loading...</span>
                </div>

                <!-- Empty State / Welcome -->
                <div v-if="!hasSessions" class="home-page__empty-wrapper">
                    <EmptyState
                        icon="i-heroicons-document-text"
                        title="Start Your First Conversation"
                        description="Upload a PDF document and start chatting with AI to extract insights, ask questions, and explore your documents."
                        size="lg"
                        class="home-page__empty"
                    />
                    <div class="home-page__empty-action">
                        <NewSessionButton
                            label="Create New Chat"
                            show-icon
                            size="lg"
                            @created="handleSessionCreated"
                            @error="handleSessionError"
                        />
                    </div>
                </div>

                <!-- Quick Start Section -->
                <div v-else class="home-page__quick-start">
                    <h2 class="home-page__section-title">Quick Start</h2>

                    <div class="home-page__cards">
                        <!-- New Chat Card -->
                        <div class="home-page__card">
                            <div
                                class="home-page__card-icon home-page__card-icon--primary"
                            >
                                <UIcon name="i-heroicons-plus-circle" />
                            </div>
                            <div class="home-page__card-content">
                                <h3 class="home-page__card-title">New Chat</h3>
                                <p class="home-page__card-description">
                                    Start a new conversation with a PDF document
                                </p>
                            </div>
                            <NewSessionButton
                                label="Create"
                                size="sm"
                                @created="handleSessionCreated"
                                @error="handleSessionError"
                            />
                        </div>

                        <!-- Recent Chats Card -->
                        <div class="home-page__card">
                            <div
                                class="home-page__card-icon home-page__card-icon--secondary"
                            >
                                <UIcon name="i-heroicons-clock" />
                            </div>
                            <div class="home-page__card-content">
                                <h3 class="home-page__card-title">
                                    Recent Chats
                                </h3>
                                <p class="home-page__card-description">
                                    You have
                                    {{ sessionStore.sessionsCount }} chat
                                    session{{
                                        sessionStore.sessionsCount !== 1
                                            ? "s"
                                            : ""
                                    }}
                                </p>
                            </div>
                            <span class="home-page__card-badge">
                                {{ sessionStore.sessionsCount }}
                            </span>
                        </div>
                    </div>

                    <!-- How It Works -->
                    <h2 class="home-page__section-title">How It Works</h2>

                    <div class="home-page__steps">
                        <div class="home-page__step">
                            <div class="home-page__step-number">1</div>
                            <div class="home-page__step-content">
                                <h4 class="home-page__step-title">
                                    Upload a PDF
                                </h4>
                                <p class="home-page__step-description">
                                    Drag and drop or browse to upload your PDF
                                    document
                                </p>
                            </div>
                        </div>

                        <div class="home-page__step">
                            <div class="home-page__step-number">2</div>
                            <div class="home-page__step-content">
                                <h4 class="home-page__step-title">
                                    Ask Questions
                                </h4>
                                <p class="home-page__step-description">
                                    Type your questions about the document
                                    content
                                </p>
                            </div>
                        </div>

                        <div class="home-page__step">
                            <div class="home-page__step-number">3</div>
                            <div class="home-page__step-content">
                                <h4 class="home-page__step-title">
                                    Get Answers
                                </h4>
                                <p class="home-page__step-description">
                                    Receive AI-powered responses based on your
                                    PDF
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.home-page {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

.home-page__content {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.home-page__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
}

.home-page__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    flex: 1;
    color: rgb(107 114 128); /* gray-500 */
}

.home-page__loading .i-heroicons-arrow-path {
    font-size: 1.5rem;
}

.home-page__empty-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.home-page__empty {
    flex: 1;
}

.home-page__empty-action {
    margin-top: -0.5rem;
}

/* Quick Start Section */
.home-page__quick-start {
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
}

.home-page__section-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: rgb(17 24 39); /* gray-900 */
    margin: 0 0 1rem 0;
}

/* Cards */
.home-page__cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.home-page__card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    background-color: white;
    border: 1px solid rgb(229 231 235); /* gray-200 */
    border-radius: 0.75rem;
    transition: box-shadow 0.2s;
}

.home-page__card:hover {
    box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.home-page__card-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: 0.75rem;
    flex-shrink: 0;
}

.home-page__card-icon--primary {
    background-color: rgb(239 246 255); /* blue-50 */
    color: rgb(59 130 246); /* blue-500 */
}

.home-page__card-icon--secondary {
    background-color: rgb(243 244 246); /* gray-100 */
    color: rgb(107 114 128); /* gray-500 */
}

.home-page__card-icon .i-heroicons-plus-circle,
.home-page__card-icon .i-heroicons-clock {
    font-size: 1.5rem;
}

.home-page__card-content {
    flex: 1;
    min-width: 0;
}

.home-page__card-title {
    font-size: 1rem;
    font-weight: 600;
    color: rgb(17 24 39); /* gray-900 */
    margin: 0 0 0.25rem 0;
}

.home-page__card-description {
    font-size: 0.875rem;
    color: rgb(107 114 128); /* gray-500 */
    margin: 0;
}

.home-page__card-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
    height: 2rem;
    padding: 0 0.5rem;
    background-color: rgb(243 244 246); /* gray-100 */
    color: rgb(55 65 81); /* gray-700 */
    font-size: 0.875rem;
    font-weight: 600;
    border-radius: 9999px;
}

/* Steps */
.home-page__steps {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.home-page__step {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background-color: white;
    border: 1px solid rgb(229 231 235); /* gray-200 */
    border-radius: 0.75rem;
}

.home-page__step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    background-color: rgb(59 130 246); /* blue-500 */
    color: white;
    font-size: 0.875rem;
    font-weight: 600;
    border-radius: 50%;
    flex-shrink: 0;
}

.home-page__step-content {
    flex: 1;
}

.home-page__step-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: rgb(17 24 39); /* gray-900 */
    margin: 0 0 0.25rem 0;
}

.home-page__step-description {
    font-size: 0.875rem;
    color: rgb(107 114 128); /* gray-500 */
    margin: 0;
}

/* Mobile styles */
@media (max-width: 640px) {
    .home-page__main {
        padding: 1rem;
    }

    .home-page__cards {
        grid-template-columns: 1fr;
    }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .home-page__loading {
        color: rgb(156 163 175); /* gray-400 */
    }

    .home-page__section-title {
        color: rgb(243 244 246); /* gray-100 */
    }

    .home-page__card {
        background-color: rgb(31 41 55); /* gray-800 */
        border-color: rgb(55 65 81); /* gray-700 */
    }

    .home-page__card-icon--primary {
        background-color: rgb(30 58 138); /* blue-900 */
        color: rgb(96 165 250); /* blue-400 */
    }

    .home-page__card-icon--secondary {
        background-color: rgb(55 65 81); /* gray-700 */
        color: rgb(156 163 175); /* gray-400 */
    }

    .home-page__card-title {
        color: rgb(243 244 246); /* gray-100 */
    }

    .home-page__card-description {
        color: rgb(156 163 175); /* gray-400 */
    }

    .home-page__card-badge {
        background-color: rgb(55 65 81); /* gray-700 */
        color: rgb(209 213 219); /* gray-300 */
    }

    .home-page__step {
        background-color: rgb(31 41 55); /* gray-800 */
        border-color: rgb(55 65 81); /* gray-700 */
    }

    .home-page__step-number {
        background-color: rgb(37 99 235); /* blue-600 */
    }

    .home-page__step-title {
        color: rgb(243 244 246); /* gray-100 */
    }

    .home-page__step-description {
        color: rgb(156 163 175); /* gray-400 */
    }
}
</style>
