<script setup lang="ts">
/**
 * EmptyState Component
 *
 * Displays a centered empty state with icon, title, description,
 * and optional action button. Used for empty lists, no results,
 * and placeholder content.
 */

// Props
interface Props {
  /** Icon name (Heroicons) */
  icon?: string;
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Action button label */
  actionLabel?: string;
  /** Action button icon */
  actionIcon?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  icon: "i-heroicons-inbox",
  title: "",
  description: "",
  actionLabel: "",
  actionIcon: "",
  size: "md",
  class: "",
});

// Emits
const emit = defineEmits<{
  action: [];
}>();

// Methods
const handleAction = () => {
  emit("action");
};

// Computed
const hasAction = computed(() => props.actionLabel.length > 0);
const hasTitle = computed(() => props.title.length > 0);
const hasDescription = computed(() => props.description.length > 0);

const iconSizeClass = computed(() => {
  switch (props.size) {
    case "sm":
      return "empty-state__icon--sm";
    case "lg":
      return "empty-state__icon--lg";
    default:
      return "empty-state__icon--md";
  }
});

const containerSizeClass = computed(() => {
  switch (props.size) {
    case "sm":
      return "empty-state--sm";
    case "lg":
      return "empty-state--lg";
    default:
      return "empty-state--md";
  }
});
</script>

<template>
  <div :class="['empty-state', containerSizeClass, props.class]">
    <!-- Icon -->
    <div :class="['empty-state__icon-wrapper', iconSizeClass]">
      <UIcon :name="props.icon" class="empty-state__icon" />
    </div>

    <!-- Content -->
    <div class="empty-state__content">
      <h3 v-if="hasTitle" class="empty-state__title">
        {{ props.title }}
      </h3>
      <p v-if="hasDescription" class="empty-state__description">
        {{ props.description }}
      </p>
    </div>

    <!-- Action Button -->
    <UButton
      v-if="hasAction"
      :label="props.actionLabel"
      :icon="props.actionIcon"
      class="empty-state__action"
      @click="handleAction"
    />

    <!-- Custom Slot -->
    <div v-if="$slots.default" class="empty-state__custom">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  gap: 1rem;
}

.empty-state--sm {
  padding: 1.5rem;
  gap: 0.75rem;
}

.empty-state--lg {
  padding: 3rem;
  gap: 1.25rem;
}

/* Icon */
.empty-state__icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: rgb(243 244 246); /* gray-100 */
}

.empty-state__icon-wrapper--sm {
  width: 3rem;
  height: 3rem;
}

.empty-state__icon-wrapper--md {
  width: 4rem;
  height: 4rem;
}

.empty-state__icon-wrapper--lg {
  width: 5rem;
  height: 5rem;
}

.empty-state__icon {
  color: rgb(156 163 175); /* gray-400 */
}

.empty-state__icon-wrapper--sm .empty-state__icon {
  font-size: 1.5rem;
}

.empty-state__icon-wrapper--md .empty-state__icon {
  font-size: 2rem;
}

.empty-state__icon-wrapper--lg .empty-state__icon {
  font-size: 2.5rem;
}

/* Content */
.empty-state__content {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  max-width: 320px;
}

.empty-state--lg .empty-state__content {
  max-width: 400px;
}

.empty-state__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: rgb(17 24 39); /* gray-900 */
}

.empty-state--sm .empty-state__title {
  font-size: 0.875rem;
}

.empty-state--lg .empty-state__title {
  font-size: 1.125rem;
}

.empty-state__description {
  margin: 0;
  font-size: 0.875rem;
  color: rgb(107 114 128); /* gray-500 */
  line-height: 1.5;
}

.empty-state--sm .empty-state__description {
  font-size: 0.8125rem;
}

.empty-state--lg .empty-state__description {
  font-size: 0.9375rem;
}

/* Action */
.empty-state__action {
  margin-top: 0.5rem;
}

/* Custom slot */
.empty-state__custom {
  margin-top: 0.5rem;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .empty-state__icon-wrapper {
    background-color: rgb(55 65 81); /* gray-700 */
  }

  .empty-state__icon {
    color: rgb(107 114 128); /* gray-500 */
  }

  .empty-state__title {
    color: rgb(243 244 246); /* gray-100 */
  }

  .empty-state__description {
    color: rgb(156 163 175); /* gray-400 */
  }
}
</style>
