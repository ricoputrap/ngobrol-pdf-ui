<script setup lang="ts">
/**
 * Chat Page
 *
 * Individual chat session page with PDF upload, message list, and chat input.
 * Handles real-time streaming responses and session management.
 */

import { useSessionsStore } from "~/stores/sessions";
import { useChat } from "~/modules/chat/composables/useChat";
import AppHeader from "~/shared/components/AppHeader.vue";
import PdfUploader from "~/modules/pdf/components/PdfUploader.vue";
import ChatMessageList from "~/modules/chat/components/ChatMessageList.vue";
import ChatInput from "~/modules/chat/components/ChatInput.vue";
import EmptyState from "~/shared/components/EmptyState.vue";

// Route params
const route = useRoute();
const router = useRouter();

const sessionId = computed(() => route.params.id as string);

// Store
const sessionStore = useSessionsStore();

// Chat composable
const {
    messages,
    streamingMessage,
    isSending,
    isStreaming,
    isLoading,
    error: chatError,
    sendMessage,
    clearError,
} = useChat({
    sessionId: sessionId.value,
    autoFetch: true,
    onError: (error) => {
        console.error("Chat error:", error);
    },
});

// Local state
const showUploader = ref(false);

// Computed
const session = computed(() => {
    return sessionStore.getSessionById(sessionId.value);
});

const sessionTitle = computed(() => {
    return session.value?.title || "Chat";
});

const hasPdf = computed(() => {
    return session.value?.pdf_file_name !== null;
});

const pdfFileName = computed(() => {
    return session.value?.pdf_file_name || "";
});

const breadcrumbs = computed(() => [
    { label: "Home", to: "/", icon: "i-heroicons-home" },
    { label: sessionTitle.value },
]);

const hasMessages = computed(() => messages.value.length > 0);

const isProcessing = computed(() => isSending.value || isStreaming.value);

const uploadButtonIcon = computed(() =>
    hasPdf.value ? "i-heroicons-document-text" : "i-heroicons-arrow-up-tray",
);

const uploadButtonLabel = computed(() =>
    hasPdf.value ? "Change PDF" : "Upload PDF",
);

const uploadButtonVariant = computed(() => (hasPdf.value ? "ghost" : "solid"));

const chatInputPlaceholder = computed(() =>
    hasPdf.value
        ? "Ask a question about your PDF..."
        : "Upload a PDF to start chatting",
);

const headerSubtitle = computed(() =>
    hasPdf.value ? pdfFileName.value : "No PDF uploaded",
);

const pdfStartDescription = computed(
    () =>
        `Your PDF '${pdfFileName.value}' is ready. Ask a question to begin chatting!`,
);

// Methods
const handleSend = async (content: string) => {
    await sendMessage(content);
};

const handleUploadComplete = (fileName: string) => {
    showUploader.value = false;
    // Refresh session to get updated pdf_file_name
    sessionStore.fetchSession(sessionId.value);
};

const handleUploadError = (error: string) => {
    console.error("Upload error:", error);
};

const toggleUploader = () => {
    showUploader.value = !showUploader.value;
};

const handleBack = () => {
    router.push("/");
};

// Fetch session on mount
onMounted(async () => {
    if (sessionId.value) {
        await sessionStore.fetchSession(sessionId.value);
    }
});

// Watch for session ID changes
watch(sessionId, async (newId) => {
    if (newId) {
        await sessionStore.fetchSession(newId);
    }
});

// Page meta
definePageMeta({
    layout: "default",
});
</script>

<template>
    <div class="chat-page">
        <div class="chat-page__content">
            <AppHeader
                :title="sessionTitle"
                :subtitle="headerSubtitle"
                :breadcrumbs="breadcrumbs"
                show-back
                @back="handleBack"
            >
                <template #actions>
                    <UButton
                        :icon="uploadButtonIcon"
                        :label="uploadButtonLabel"
                        :variant="uploadButtonVariant"
                        size="sm"
                        @click="toggleUploader"
                    />
                </template>
            </AppHeader>

            <Transition name="slide">
                <div v-if="showUploader" class="chat-page__uploader">
                    <PdfUploader
                        :session-id="sessionId"
                        @uploaded="handleUploadComplete"
                        @error="handleUploadError"
                    />
                </div>
            </Transition>

            <div class="chat-page__chat">
                <div
                    v-if="isLoading && !hasMessages"
                    class="chat-page__loading"
                >
                    <UIcon name="i-heroicons-arrow-path" class="animate-spin" />
                    <span>Loading conversation...</span>
                </div>

                <EmptyState
                    v-else-if="!hasPdf && !hasMessages"
                    icon="i-heroicons-document-arrow-up"
                    title="Upload a PDF to Start"
                    description="Upload a PDF document to begin chatting. You can ask questions about the content and get AI-powered responses."
                    action-label="Upload PDF"
                    action-icon="i-heroicons-arrow-up-tray"
                    size="lg"
                    class="chat-page__empty"
                    @action="toggleUploader"
                />

                <EmptyState
                    v-else-if="hasPdf && !hasMessages"
                    icon="i-heroicons-chat-bubble-left-right"
                    title="Start the Conversation"
                    :description="pdfStartDescription"
                    size="lg"
                    class="chat-page__empty"
                />

                <ChatMessageList
                    v-else
                    :messages="messages"
                    :streaming-message="streamingMessage"
                    :loading="isProcessing"
                    class="chat-page__messages"
                />
            </div>

            <Transition name="slide">
                <div v-if="chatError" class="chat-page__error">
                    <UIcon name="i-heroicons-exclamation-triangle" />
                    <span>{{ chatError }}</span>
                    <button class="chat-page__error-close" @click="clearError">
                        <UIcon name="i-heroicons-x-mark" />
                    </button>
                </div>
            </Transition>

            <div class="chat-page__input">
                <ChatInput
                    :disabled="!hasPdf"
                    :sending="isProcessing"
                    :placeholder="chatInputPlaceholder"
                    @send="handleSend"
                />
            </div>
        </div>
    </div>
</template>

<style scoped>
.chat-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
}

.chat-page__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
}

.chat-page__uploader {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid rgb(229 231 235);
    background-color: rgb(249 250 251);
}

.chat-page__chat {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
}

.chat-page__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    flex: 1;
    color: rgb(107 114 128);
}

.chat-page__loading .i-heroicons-arrow-path {
    font-size: 1.5rem;
}

.chat-page__empty {
    flex: 1;
}

.chat-page__messages {
    flex: 1;
    overflow-y: auto;
}

.chat-page__error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background-color: rgb(254 242 242);
    border-top: 1px solid rgb(254 226 226);
    color: rgb(185 28 28);
    font-size: 0.875rem;
}

.chat-page__error .i-heroicons-exclamation-triangle {
    font-size: 1.125rem;
    flex-shrink: 0;
}

.chat-page__error span {
    flex: 1;
}

.chat-page__error-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    border: none;
    border-radius: 0.25rem;
    background-color: transparent;
    color: rgb(185 28 28);
    cursor: pointer;
    transition: background-color 0.2s;
}

.chat-page__error-close:hover {
    background-color: rgb(254 226 226);
}

.chat-page__input {
    padding: 1rem 1.5rem;
    border-top: 1px solid rgb(229 231 235);
    background-color: white;
}

.slide-enter-active,
.slide-leave-active {
    transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    overflow: hidden;
}

.slide-enter-to,
.slide-leave-from {
    max-height: 400px;
}

@media (max-width: 640px) {
    .chat-page__uploader {
        padding: 0.75rem 1rem;
    }

    .chat-page__input {
        padding: 0.75rem 1rem;
    }
}

@media (prefers-color-scheme: dark) {
    .chat-page__uploader {
        background-color: rgb(17 24 39);
        border-bottom-color: rgb(55 65 81);
    }

    .chat-page__loading {
        color: rgb(156 163 175);
    }

    .chat-page__error {
        background-color: rgb(127 29 29);
        border-top-color: rgb(153 27 27);
        color: rgb(254 202 202);
    }

    .chat-page__error-close {
        color: rgb(254 202 202);
    }

    .chat-page__error-close:hover {
        background-color: rgb(153 27 27);
    }

    .chat-page__input {
        background-color: rgb(31 41 55);
        border-top-color: rgb(55 65 81);
    }
}
</style>
