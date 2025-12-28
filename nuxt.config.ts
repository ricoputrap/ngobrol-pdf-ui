// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  // Modules
  modules: ["@nuxt/eslint", "@nuxt/ui", "@pinia/nuxt", "@vueuse/nuxt"],

  // App configuration
  app: {
    head: {
      title: "Ngobrol PDF",
      titleTemplate: "%s | Ngobrol PDF",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content: "Chat with your PDF documents using AI",
        },
        { name: "theme-color", content: "#3b82f6" },
      ],
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    },
    pageTransition: { name: "page", mode: "out-in" },
    layoutTransition: { name: "layout", mode: "out-in" },
  },

  // Runtime config for environment variables
  runtimeConfig: {
    // Server-side only
    apiSecret: "",
    // Client-side (public)
    public: {
      appName: "Ngobrol PDF",
      apiBase: "/api",
    },
  },

  // Nuxt UI configuration
  ui: {
    icons: ["heroicons"],
  },

  // TypeScript configuration
  // NOTE: type checking is disabled in dev to avoid requiring `vue-tsc` during local development.
  // Re-enable (`typeCheck: true`) for CI / production workflows where `vue-tsc` is available.
  typescript: {
    strict: true,
    typeCheck: false,
  },

  // Vite configuration
  vite: {
    css: {
      preprocessorOptions: {
        // Add any CSS preprocessor options here if needed
      },
    },
  },

  // Nitro server configuration
  nitro: {
    // Enable compression
    compressPublicAssets: true,
  },

  // Route rules
  routeRules: {
    // API routes - no prerendering
    "/api/**": { cors: true },
  },
});
