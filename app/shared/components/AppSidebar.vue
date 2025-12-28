<script setup lang="ts">
/**
 * AppSidebar Component
 *
 * Sidebar content component with session list, new session button,
 * and navigation links. Designed to be used within the default layout's
 * sidebar slot.
 */

import { useSessionsStore } from "~/stores/sessions";
import SessionList from "~/modules/sessions/components/SessionList.vue";
import NewSessionButton from "~/modules/sessions/components/NewSessionButton.vue";

// Props
interface Props {
  /** Whether the sidebar is collapsed */
  collapsed?: boolean;
  /** Maximum sessions to show before "show more" */
  maxSessions?: number;
  /** Additional CSS classes */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  collapsed: false,
  maxSessions: 10,
  class: "",
});

// Emits
const emit = defineEmits<{
  sessionClick: [sessionId: string];
  sessionCreated: [sessionId: string];
}>();

// Store
const sessionStore = useSessionsStore();

// Router
const router = useRouter();
const route = useRoute();

// Computed
const currentSessionId = computed(() => {
  return route.params.id as string | undefined;
});

// Methods
const handleSessionClick = (sessionId: string) => {
  emit("sessionClick", sessionId);
  router.push(`/chat/${sessionId}`);
};

const handleSessionCreated = (sessionId: string) => {
  emit("sessionCreated", sessionId);
  router.push(`/chat/${sessionId}`);
};

const handleSessionDelete = async (sessionId: string) => {
  await sessionStore.deleteSession(sessionId);

  // If we deleted the current session, go home
  if (currentSessionId.value === sessionId) {
    router.push("/");
  }
};
</script>

<template>
  <div :class="['app-sidebar', props.collapsed && 'app-sidebar--collapsed', props.class]">
    <!-- New Session Button -->
    <div class="app-sidebar__new-session">
      <NewSessionButton
        :label="props.collapsed ? '' : 'New Chat'"
        :show-icon="true"
        :block="!props.collapsed"
        @created="handleSessionCreated"
      />
    </div>

    <!-- Session List -->
    <div class="app-sidebar__sessions">
      <h3 v-if="!props.collapsed" class="app-sidebar__section-title">
        Recent Chats
      </h3>
      <SessionList
        :max-items="props.maxSessions"
        :show-loading="true"
        @session-click="handleSessionClick"
        @session-delete="handleSessionDelete"
      />
    </div>

    <!-- Navigation Links -->
    <nav v-if="!props.collapsed" class="app-sidebar__nav">
      <NuxtLink to="/" class="app-sidebar__nav-link">
        <UIcon name="i-heroicons-home" />
        <span>Home</span>
      </NuxtLink>
    </nav>
  </div>
</template>

<style scoped>
.app-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 1rem;
}

.app-sidebar--collapsed {
  align-items: center;
}

.app-sidebar__new-session {
  flex-shrink: 0;
}

.app-sidebar--collapsed .app-sidebar__new-session {
  width: 100%;
  display: flex;
  justify-content: center;
}

.app-sidebar__sessions {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.app-sidebar__section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(107 114 128); /* gray-500 */
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.5rem 0;
  padding: 0 0.25rem;
}

.app-sidebar__nav {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgb(229 231 235); /* gray-200 */
}

.app-sidebar__nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: rgb(107 114 128); /* gray-500 */
  text-decoration: none;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.app-sidebar__nav-link:hover {
  background-color: rgb(243 244 246); /* gray-100 */
  color: rgb(17 24 39); /* gray-900 */
}

.app-sidebar__nav-link.router-link-active {
  background-color: rgb(239 246 255); /* blue-50 */
  color: rgb(59 130 246); /* blue-500 */
}

.app-sidebar__nav-link .i-heroicons-home {
  font-size: 1.125rem;
  flex-shrink: 0;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .app-sidebar__section-title {
    color: rgb(156 163 175); /* gray-400 */
  }

  .app-sidebar__nav {
    border-top-color: rgb(55 65 81); /* gray-700 */
  }

  .app-sidebar__nav-link {
    color: rgb(156 163 175); /* gray-400 */
  }

  .app-sidebar__nav-link:hover {
    background-color: rgb(55 65 81); /* gray-700 */
    color: rgb(243 244 246); /* gray-100 */
  }

  .app-sidebar__nav-link.router-link-active {
    background-color: rgb(30 58 138); /* blue-900 */
    color: rgb(96 165 250); /* blue-400 */
  }
}
</style>
