<script setup lang="ts">
/**
 * NewSessionButton Component
 *
 * Button for creating new chat sessions.
 * Integrates with Pinia store to create sessions and handle loading state.
 */

import { useSessionsStore } from "~/stores/sessions";

// Props
interface Props {
  /** Button text */
  label?: string;
  /** Button size */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Button variant */
  variant?: "solid" | "outline" | "soft" | "ghost" | "link";
  /** Show icon */
  showIcon?: boolean;
  /** Full width button */
  block?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: "New Session",
  size: "md",
  variant: "solid",
  showIcon: true,
  block: false,
  disabled: false,
});

// Emits
const emit = defineEmits<{
  created: [sessionId: string];
  error: [error: string];
}>();

// Store
const sessionStore = useSessionsStore();

// State
const isCreating = ref(false);

// Methods
const handleClick = async () => {
  if (isCreating.value || props.disabled) return;

  isCreating.value = true;

  try {
    const session = await sessionStore.createSession({
      title: `Session ${new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })}`,
    });

    emit("created", session.id);
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to create session";
    emit("error", errorMessage);
  } finally {
    isCreating.value = false;
  }
};

// Computed
const buttonLabel = computed(() => {
  return isCreating.value ? "Creating..." : props.label;
});

const isDisabled = computed(() => {
  return props.disabled || isCreating.value;
});
</script>

<template>
  <UButton
    :label="buttonLabel"
    :size="props.size"
    :variant="props.variant"
    :disabled="isDisabled"
    :block="props.block"
    :icon="props.showIcon ? 'i-heroicons-plus' : undefined"
    :loading="isCreating"
    class="new-session-button"
    @click="handleClick"
  />
</template>

<style scoped>
.new-session-button {
  transition: all 0.2s;
}
</style>
