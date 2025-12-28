<script setup lang="ts">
/**
 * Root App Component
 *
 * Main application entry point that sets up the layout and routing.
 * Uses NuxtLayout for layout management and NuxtPage for page routing.
 */

// Import global styles if needed
// import '~/assets/css/main.css';
</script>

<template>
    <div class="app">
        <!-- Accessibility: Announce route changes -->
        <NuxtRouteAnnouncer />

        <!-- Loading indicator for page transitions -->
        <NuxtLoadingIndicator color="#3b82f6" />

        <!-- Layout wrapper with page content -->
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </div>
</template>

<style>
/* Global styles */
*,
*::before,
*::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

html,
body {
    font-family:
        -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
        Arial, sans-serif;
    font-size: 16px;
    line-height: 1.5;
    color: rgb(17 24 39); /* gray-900 */
    background-color: rgb(249 250 251); /* gray-50 */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

/* Prevent horizontal scrolling */
html,
body,
#__nuxt {
    overflow-x: hidden;
}

/* Ensure full height */
html,
body,
#__nuxt,
.app {
    min-height: 100vh;
}

/* Focus styles for accessibility */
:focus-visible {
    outline: 2px solid rgb(59 130 246); /* blue-500 */
    outline-offset: 2px;
}

/* Scrollbar styles */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: rgb(243 244 246); /* gray-100 */
}

::-webkit-scrollbar-thumb {
    background: rgb(209 213 219); /* gray-300 */
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: rgb(156 163 175); /* gray-400 */
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    html,
    body {
        color: rgb(243 244 246); /* gray-100 */
        background-color: rgb(17 24 39); /* gray-900 */
    }

    ::-webkit-scrollbar-track {
        background: rgb(31 41 55); /* gray-800 */
    }

    ::-webkit-scrollbar-thumb {
        background: rgb(75 85 99); /* gray-600 */
    }

    ::-webkit-scrollbar-thumb:hover {
        background: rgb(107 114 128); /* gray-500 */
    }
}

/* Page transition animations */
.page-enter-active,
.page-leave-active {
    transition: opacity 0.2s ease;
}

.page-enter-from,
.page-leave-to {
    opacity: 0;
}

/* Layout transition animations */
.layout-enter-active,
.layout-leave-active {
    transition: opacity 0.2s ease;
}

.layout-enter-from,
.layout-leave-to {
    opacity: 0;
}
</style>
