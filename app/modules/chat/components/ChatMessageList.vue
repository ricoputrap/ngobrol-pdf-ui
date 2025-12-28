<script setup lang="ts">
/**
 * ChatMessageList Component
 *
 * Displays a scrollable list of chat messages with auto-scroll support.
 * Handles empty state, loading state, and streaming messages.
 */

import type { Message, StreamingMessage } from "../types";
import MessageBubble from "./MessageBubble.vue";

// Props
interface Props {
    /** Array of messages to display */
    messages: Message[];
    /** Currently streaming message (if any) */
    streamingMessage?: StreamingMessage | null;
    /** Whether messages are loading */
    loading?: boolean;
    /** Enable auto-scroll to bottom on new messages */
    autoScroll?: boolean;
    /** Show timestamps on messages */
    showTimestamps?: boolean;
    /** Timestamp format */
    timestampFormat?: "relative" | "absolute";
    /** Empty state message */
    emptyMessage?: string;
    /** Additional CSS classes */
    class?: string;
}

const props = withDefaults(defineProps<Props>(), {
    streamingMessage: null,
    loading: false,
    autoScroll: true,
    showTimestamps: true,
    timestampFormat: "relative",
    emptyMessage: "No messages yet. Start a conversation!",
    class: "",
});

// Refs
const containerRef = ref<HTMLElement | null>(null);
const isUserScrolling = ref(false);
const scrollTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

// Computed
const allMessages = computed(() => {
    const msgs = [...props.messages];
    return msgs;
});

const isEmpty = computed(
    () =>
        props.messages.length === 0 &&
        !props.streamingMessage &&
        !props.loading,
);

const hasMessages = computed(
    () => props.messages.length > 0 || props.streamingMessage !== null,
);

// Methods
const scrollToBottom = (smooth = true) => {
    if (!containerRef.value) return;

    containerRef.value.scrollTo({
        top: containerRef.value.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
    });
};

const handleScroll = () => {
    if (!containerRef.value) return;

    // Clear existing timeout
    if (scrollTimeout.value) {
        clearTimeout(scrollTimeout.value);
    }

    // Check if user has scrolled up
    const { scrollTop, scrollHeight, clientHeight } = containerRef.value;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

    isUserScrolling.value = !isAtBottom;

    // Reset after user stops scrolling
    scrollTimeout.value = setTimeout(() => {
        if (isAtBottom) {
            isUserScrolling.value = false;
        }
    }, 150);
};

// Watch for new messages and auto-scroll
watch(
    () => props.messages.length,
    () => {
        if (props.autoScroll && !isUserScrolling.value) {
            nextTick(() => scrollToBottom());
        }
    },
);

// Watch streaming message content changes
watch(
    () => props.streamingMessage?.content,
    () => {
        if (props.autoScroll && !isUserScrolling.value) {
            nextTick(() => scrollToBottom());
        }
    },
);

// Expose scroll method for parent components
defineExpose({
    scrollToBottom,
});
</script>

<template>
    <div
        ref="containerRef"
        :class="['chat-message-list', props.class]"
        @scroll="handleScroll"
    >
        <!-- Loading state -->
        <div
            v-if="props.loading && !hasMessages"
            class="chat-message-list__loading"
        >
            <UIcon name="i-heroicons-arrow-path" class="animate-spin" />
            <span>Loading messages...</span>
        </div>

        <!-- Empty state -->
        <div v-else-if="isEmpty" class="chat-message-list__empty">
            <UIcon name="i-heroicons-chat-bubble-left-right" />
            <p>{{ props.emptyMessage }}</p>
        </div>

        <!-- Messages -->
        <div v-else class="chat-message-list__messages">
            <MessageBubble
                v-for="message in allMessages"
                :key="message.id"
                :message="message"
                :show-timestamp="props.showTimestamps"
                :timestamp-format="props.timestampFormat"
            />

            <!-- Streaming message -->
            <MessageBubble
                v-if="props.streamingMessage"
                :key="`streaming-${props.streamingMessage.id}`"
                :message="props.streamingMessage"
                :show-timestamp="props.showTimestamps"
                :timestamp-format="props.timestampFormat"
            />

            <!-- Loading indicator for new response -->
            <div
                v-if="props.loading && hasMessages && !props.streamingMessage"
                class="chat-message-list__thinking"
            >
                <div class="chat-message-list__thinking-dots">
                    <span />
                    <span />
                    <span />
                </div>
                <span class="chat-message-list__thinking-text"
                    >Thinking...</span
                >
            </div>
        </div>

        <!-- Scroll to bottom button -->
        <Transition name="fade">
            <button
                v-if="isUserScrolling && hasMessages"
                class="chat-message-list__scroll-button"
                @click="scrollToBottom(true)"
            >
                <UIcon name="i-heroicons-arrow-down" />
            </button>
        </Transition>
    </div>
</template>

<style scoped>
.chat-message-list {
    position: relative;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    height: 100%;
    scroll-behavior: smooth;
}

.chat-message-list__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    height: 100%;
    color: rgb(107 114 128); /* gray-500 */
    font-size: 0.875rem;
}

.chat-message-list__loading .i-heroicons-arrow-path {
    font-size: 1.5rem;
}

.chat-message-list__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    height: 100%;
    padding: 2rem;
    color: rgb(156 163 175); /* gray-400 */
    text-align: center;
}

.chat-message-list__empty .i-heroicons-chat-bubble-left-right {
    font-size: 3rem;
    opacity: 0.5;
}

.chat-message-list__empty p {
    font-size: 0.9375rem;
    margin: 0;
    max-width: 300px;
}

.chat-message-list__messages {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
}

.chat-message-list__thinking {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    margin-left: 2.75rem;
    background-color: rgb(249 250 251); /* gray-50 */
    border-radius: 0.75rem;
    width: fit-content;
}

.chat-message-list__thinking-dots {
    display: flex;
    gap: 0.25rem;
}

.chat-message-list__thinking-dots span {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background-color: rgb(156 163 175); /* gray-400 */
    animation: bounce 1.4s infinite ease-in-out both;
}

.chat-message-list__thinking-dots span:nth-child(1) {
    animation-delay: -0.32s;
}

.chat-message-list__thinking-dots span:nth-child(2) {
    animation-delay: -0.16s;
}

.chat-message-list__thinking-dots span:nth-child(3) {
    animation-delay: 0s;
}

@keyframes bounce {
    0%,
    80%,
    100% {
        transform: scale(0);
    }
    40% {
        transform: scale(1);
    }
}

.chat-message-list__thinking-text {
    font-size: 0.75rem;
    color: rgb(107 114 128); /* gray-500 */
}

.chat-message-list__scroll-button {
    position: absolute;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background-color: rgb(59 130 246); /* blue-500 */
    color: white;
    border: none;
    cursor: pointer;
    box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transition: all 0.2s;
}

.chat-message-list__scroll-button:hover {
    background-color: rgb(37 99 235); /* blue-600 */
    transform: translateX(-50%) scale(1.05);
}

.chat-message-list__scroll-button:active {
    transform: translateX(-50%) scale(0.95);
}

/* Fade transition for scroll button */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .chat-message-list__loading {
        color: rgb(156 163 175); /* gray-400 */
    }

    .chat-message-list__empty {
        color: rgb(107 114 128); /* gray-500 */
    }

    .chat-message-list__thinking {
        background-color: rgb(31 41 55); /* gray-800 */
    }

    .chat-message-list__thinking-dots span {
        background-color: rgb(107 114 128); /* gray-500 */
    }

    .chat-message-list__thinking-text {
        color: rgb(156 163 175); /* gray-400 */
    }

    .chat-message-list__scroll-button {
        background-color: rgb(37 99 235); /* blue-600 */
    }

    .chat-message-list__scroll-button:hover {
        background-color: rgb(29 78 216); /* blue-700 */
    }
}
</style>
