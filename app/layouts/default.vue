<script setup lang="ts">
/**
 * Default Layout
 *
 * Main application layout with collapsible sidebar and main content area.
 * Provides responsive design with mobile menu support.
 */

// Import sidebar components
import SidebarSessions from "~/modules/sessions/components/SidebarSessions.vue";
import SidebarNewChat from "~/modules/sessions/components/SidebarNewChat.vue";

// State
const isSidebarOpen = ref(true);
const isMobileMenuOpen = ref(false);

// Methods
const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value;
};

const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
    isMobileMenuOpen.value = false;
};

// Close mobile menu on route change
const route = useRoute();
watch(
    () => route.path,
    () => {
        closeMobileMenu();
    },
);

// Provide sidebar state to child components
provide("sidebarOpen", isSidebarOpen);
provide("toggleSidebar", toggleSidebar);
</script>

<template>
    <div class="default-layout">
        <!-- Mobile Header -->
        <header class="default-layout__mobile-header">
            <button
                class="default-layout__menu-button"
                aria-label="Toggle menu"
                @click="toggleMobileMenu"
            >
                <UIcon name="i-heroicons-bars-3" />
            </button>
            <div class="default-layout__logo">
                <UIcon name="i-heroicons-document-text" />
                <span>Ngobrol PDF</span>
            </div>
            <div class="default-layout__mobile-header-spacer" />
        </header>

        <!-- Mobile Menu Overlay -->
        <Transition name="fade">
            <div
                v-if="isMobileMenuOpen"
                class="default-layout__overlay"
                @click="closeMobileMenu"
            />
        </Transition>

        <!-- Sidebar -->
        <aside
            :class="[
                'default-layout__sidebar',
                isSidebarOpen && 'default-layout__sidebar--open',
                isMobileMenuOpen && 'default-layout__sidebar--mobile-open',
            ]"
        >
            <!-- Sidebar Header -->
            <div class="default-layout__sidebar-header">
                <div class="default-layout__logo">
                    <UIcon name="i-heroicons-document-text" />
                    <span v-if="isSidebarOpen">Ngobrol PDF</span>
                </div>
                <button
                    class="default-layout__collapse-button"
                    aria-label="Toggle sidebar"
                    @click="toggleSidebar"
                >
                    <UIcon
                        :name="
                            isSidebarOpen
                                ? 'i-heroicons-chevron-left'
                                : 'i-heroicons-chevron-right'
                        "
                    />
                </button>
            </div>

            <!-- Sidebar Content -->
            <div class="default-layout__sidebar-content">
                <SidebarSessions />
            </div>

            <!-- Sidebar Footer -->
            <div class="default-layout__sidebar-footer">
                <SidebarNewChat />
            </div>
        </aside>

        <!-- Main Content -->
        <main
            :class="[
                'default-layout__main',
                isSidebarOpen && 'default-layout__main--sidebar-open',
            ]"
        >
            <slot />
        </main>
    </div>
</template>

<style scoped>
.default-layout {
    display: flex;
    min-height: 100vh;
    background-color: rgb(249 250 251); /* gray-50 */
}

/* Mobile Header - Hidden on desktop */
.default-layout__mobile-header {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 40;
    height: 3.5rem;
    padding: 0 1rem;
    background-color: white;
    border-bottom: 1px solid rgb(229 231 235); /* gray-200 */
    align-items: center;
    gap: 0.75rem;
}

.default-layout__menu-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border: none;
    border-radius: 0.5rem;
    background-color: transparent;
    color: rgb(107 114 128); /* gray-500 */
    cursor: pointer;
    transition: background-color 0.2s;
}

.default-layout__menu-button:hover {
    background-color: rgb(243 244 246); /* gray-100 */
}

.default-layout__mobile-header-spacer {
    width: 2.25rem;
}

/* Overlay for mobile menu */
.default-layout__overlay {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 45;
    background-color: rgba(0, 0, 0, 0.5);
}

/* Sidebar */
.default-layout__sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 50;
    display: flex;
    flex-direction: column;
    width: 4rem;
    background-color: white;
    border-right: 1px solid rgb(229 231 235); /* gray-200 */
    transition: width 0.3s ease;
    overflow: hidden;
}

.default-layout__sidebar--open {
    width: 16rem;
}

.default-layout__sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 3.5rem;
    padding: 0 0.75rem;
    border-bottom: 1px solid rgb(229 231 235); /* gray-200 */
    flex-shrink: 0;
}

.default-layout__logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    font-size: 1.125rem;
    color: rgb(17 24 39); /* gray-900 */
    white-space: nowrap;
    overflow: hidden;
}

.default-layout__logo .i-heroicons-document-text {
    flex-shrink: 0;
    font-size: 1.5rem;
    color: rgb(59 130 246); /* blue-500 */
}

.default-layout__collapse-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border: none;
    border-radius: 0.375rem;
    background-color: transparent;
    color: rgb(107 114 128); /* gray-500 */
    cursor: pointer;
    transition: background-color 0.2s;
    flex-shrink: 0;
}

.default-layout__collapse-button:hover {
    background-color: rgb(243 244 246); /* gray-100 */
}

.default-layout__sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 0.75rem;
}

.default-layout__sidebar-footer {
    padding: 0.75rem;
    border-top: 1px solid rgb(229 231 235); /* gray-200 */
    flex-shrink: 0;
}

/* Main Content */
.default-layout__main {
    flex: 1;
    margin-left: 4rem;
    min-height: 100vh;
    transition: margin-left 0.3s ease;
}

.default-layout__main--sidebar-open {
    margin-left: 16rem;
}

/* Fade transition for overlay */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* Mobile styles */
@media (max-width: 768px) {
    .default-layout__mobile-header {
        display: flex;
    }

    .default-layout__sidebar {
        transform: translateX(-100%);
        width: 16rem;
    }

    .default-layout__sidebar--mobile-open {
        transform: translateX(0);
    }

    .default-layout__sidebar--open {
        width: 16rem;
    }

    .default-layout__collapse-button {
        display: none;
    }

    .default-layout__overlay {
        display: block;
    }

    .default-layout__main {
        margin-left: 0;
        padding-top: 3.5rem;
    }

    .default-layout__main--sidebar-open {
        margin-left: 0;
    }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .default-layout {
        background-color: rgb(17 24 39); /* gray-900 */
    }

    .default-layout__mobile-header {
        background-color: rgb(31 41 55); /* gray-800 */
        border-bottom-color: rgb(55 65 81); /* gray-700 */
    }

    .default-layout__menu-button {
        color: rgb(156 163 175); /* gray-400 */
    }

    .default-layout__menu-button:hover {
        background-color: rgb(55 65 81); /* gray-700 */
    }

    .default-layout__sidebar {
        background-color: rgb(31 41 55); /* gray-800 */
        border-right-color: rgb(55 65 81); /* gray-700 */
    }

    .default-layout__sidebar-header {
        border-bottom-color: rgb(55 65 81); /* gray-700 */
    }

    .default-layout__logo {
        color: rgb(243 244 246); /* gray-100 */
    }

    .default-layout__logo .i-heroicons-document-text {
        color: rgb(96 165 250); /* blue-400 */
    }

    .default-layout__collapse-button {
        color: rgb(156 163 175); /* gray-400 */
    }

    .default-layout__collapse-button:hover {
        background-color: rgb(55 65 81); /* gray-700 */
    }

    .default-layout__sidebar-footer {
        border-top-color: rgb(55 65 81); /* gray-700 */
    }
}
</style>
