<script setup lang="ts">
/**
 * AppHeader Component
 *
 * Page header with title, optional subtitle, breadcrumbs, and action buttons.
 * Used at the top of main content areas.
 */

// Props
interface BreadcrumbItem {
  label: string;
  to?: string;
  icon?: string;
}

interface Props {
  /** Page title */
  title?: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Breadcrumb items */
  breadcrumbs?: BreadcrumbItem[];
  /** Show back button */
  showBack?: boolean;
  /** Back button route (defaults to previous page) */
  backTo?: string;
  /** Additional CSS classes */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  subtitle: "",
  breadcrumbs: () => [],
  showBack: false,
  backTo: "",
  class: "",
});

// Emits
const emit = defineEmits<{
  back: [];
}>();

// Router
const router = useRouter();

// Methods
const handleBack = () => {
  emit("back");

  if (props.backTo) {
    router.push(props.backTo);
  } else {
    router.back();
  }
};

// Computed
const hasBreadcrumbs = computed(() => props.breadcrumbs.length > 0);
const hasTitle = computed(() => props.title.length > 0);
</script>

<template>
  <header :class="['app-header', props.class]">
    <!-- Breadcrumbs -->
    <nav v-if="hasBreadcrumbs" class="app-header__breadcrumbs" aria-label="Breadcrumb">
      <ol class="app-header__breadcrumb-list">
        <li
          v-for="(item, index) in props.breadcrumbs"
          :key="index"
          class="app-header__breadcrumb-item"
        >
          <UIcon
            v-if="item.icon"
            :name="item.icon"
            class="app-header__breadcrumb-icon"
          />
          <NuxtLink
            v-if="item.to && index < props.breadcrumbs.length - 1"
            :to="item.to"
            class="app-header__breadcrumb-link"
          >
            {{ item.label }}
          </NuxtLink>
          <span v-else class="app-header__breadcrumb-current">
            {{ item.label }}
          </span>
          <UIcon
            v-if="index < props.breadcrumbs.length - 1"
            name="i-heroicons-chevron-right"
            class="app-header__breadcrumb-separator"
          />
        </li>
      </ol>
    </nav>

    <!-- Title Row -->
    <div v-if="hasTitle || props.showBack || $slots.actions" class="app-header__title-row">
      <!-- Back Button -->
      <button
        v-if="props.showBack"
        class="app-header__back-button"
        aria-label="Go back"
        @click="handleBack"
      >
        <UIcon name="i-heroicons-arrow-left" />
      </button>

      <!-- Title and Subtitle -->
      <div v-if="hasTitle" class="app-header__title-content">
        <h1 class="app-header__title">{{ props.title }}</h1>
        <p v-if="props.subtitle" class="app-header__subtitle">
          {{ props.subtitle }}
        </p>
      </div>

      <!-- Spacer -->
      <div class="app-header__spacer" />

      <!-- Actions Slot -->
      <div v-if="$slots.actions" class="app-header__actions">
        <slot name="actions" />
      </div>
    </div>

    <!-- Default slot for additional content -->
    <slot />
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background-color: white;
  border-bottom: 1px solid rgb(229 231 235); /* gray-200 */
}

/* Breadcrumbs */
.app-header__breadcrumbs {
  margin-bottom: 0.25rem;
}

.app-header__breadcrumb-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.app-header__breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.app-header__breadcrumb-icon {
  font-size: 0.875rem;
  color: rgb(156 163 175); /* gray-400 */
}

.app-header__breadcrumb-link {
  font-size: 0.875rem;
  color: rgb(107 114 128); /* gray-500 */
  text-decoration: none;
  transition: color 0.2s;
}

.app-header__breadcrumb-link:hover {
  color: rgb(59 130 246); /* blue-500 */
}

.app-header__breadcrumb-current {
  font-size: 0.875rem;
  color: rgb(17 24 39); /* gray-900 */
  font-weight: 500;
}

.app-header__breadcrumb-separator {
  font-size: 0.75rem;
  color: rgb(209 213 219); /* gray-300 */
  margin: 0 0.125rem;
}

/* Title Row */
.app-header__title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.app-header__back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  border-radius: 0.5rem;
  background-color: rgb(243 244 246); /* gray-100 */
  color: rgb(107 114 128); /* gray-500 */
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.app-header__back-button:hover {
  background-color: rgb(229 231 235); /* gray-200 */
  color: rgb(55 65 81); /* gray-700 */
}

.app-header__title-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.app-header__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgb(17 24 39); /* gray-900 */
  margin: 0;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-header__subtitle {
  font-size: 0.875rem;
  color: rgb(107 114 128); /* gray-500 */
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-header__spacer {
  flex: 1;
}

.app-header__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* Mobile styles */
@media (max-width: 640px) {
  .app-header {
    padding: 0.75rem 1rem;
  }

  .app-header__title {
    font-size: 1.25rem;
  }

  .app-header__actions {
    gap: 0.375rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .app-header {
    background-color: rgb(31 41 55); /* gray-800 */
    border-bottom-color: rgb(55 65 81); /* gray-700 */
  }

  .app-header__breadcrumb-icon {
    color: rgb(107 114 128); /* gray-500 */
  }

  .app-header__breadcrumb-link {
    color: rgb(156 163 175); /* gray-400 */
  }

  .app-header__breadcrumb-link:hover {
    color: rgb(96 165 250); /* blue-400 */
  }

  .app-header__breadcrumb-current {
    color: rgb(243 244 246); /* gray-100 */
  }

  .app-header__breadcrumb-separator {
    color: rgb(75 85 99); /* gray-600 */
  }

  .app-header__back-button {
    background-color: rgb(55 65 81); /* gray-700 */
    color: rgb(156 163 175); /* gray-400 */
  }

  .app-header__back-button:hover {
    background-color: rgb(75 85 99); /* gray-600 */
    color: rgb(243 244 246); /* gray-100 */
  }

  .app-header__title {
    color: rgb(243 244 246); /* gray-100 */
  }

  .app-header__subtitle {
    color: rgb(156 163 175); /* gray-400 */
  }
}
</style>
