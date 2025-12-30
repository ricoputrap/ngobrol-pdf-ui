<script setup lang="ts">
const router = useRouter()

const handleNewChat = async () => {
  await router.push('/')
}
</script>

<template>
  <div class="border-t border-gray-200 dark:border-gray-700 p-4">
    <button
      type="button"
      class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      aria-label="Start a new chat"
      @click="handleNewChat"
    >
      <svg
        class="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 4v16m8-8H4"
        />
      </svg>
      <span>New Chat</span>
    </button>
  </div>
</template>
