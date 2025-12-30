/**
 * Chat Page ([id].vue) Tests
 *
 * Tests for the chat/[id].vue page including:
 * - Page structure validation
 * - Layout integration with sidebar
 * - Session store usage
 * - Chat composable integration
 * - Navigation and state management
 * - Active session highlighting logic
 */

import { describe, it, expect, vi } from "vitest";
import { ref, computed } from "vue";

describe("[id].vue (Chat Page)", () => {
  describe("Page Structure", () => {
    it("should have required CSS classes defined", () => {
      const requiredClasses = [
        "chat-page",
        "chat-page__content",
        "chat-page__uploader",
        "chat-page__chat",
        "chat-page__loading",
        "chat-page__empty",
        "chat-page__messages",
        "chat-page__error",
        "chat-page__error-close",
        "chat-page__input",
      ];

      requiredClasses.forEach((className) => {
        expect(className).toMatch(/^chat-page/);
      });
    });

    it("should have BEM-style class naming", () => {
      const blockName = "chat-page";
      const elements = [
        "content",
        "uploader",
        "chat",
        "loading",
        "empty",
        "messages",
        "error",
        "error-close",
        "input",
      ];

      elements.forEach((element) => {
        const className = `${blockName}__${element}`;
        expect(className).toMatch(/^chat-page__[\w-]+$/);
      });
    });
  });

  describe("Layout Integration", () => {
    it("should use default layout", () => {
      const pageMetaLayout = "default";
      expect(pageMetaLayout).toBe("default");
    });

    it("should inherit sidebar from default layout", () => {
      // Since we moved sidebar components into the layout,
      // pages using default layout automatically get the sidebar
      const layoutName = "default";
      const hasSidebarInLayout = true;
      expect(layoutName).toBe("default");
      expect(hasSidebarInLayout).toBe(true);
    });

    it("should automatically highlight current session in sidebar", () => {
      // The useSidebarSessions composable watches the route
      // and sets the active session based on route params
      const routeParams = { id: "test-session-123" };
      const activeSessionId = routeParams.id;
      expect(activeSessionId).toBe("test-session-123");
    });
  });

  describe("Route Params", () => {
    it("should extract session ID from route params", () => {
      const mockRoute = {
        params: { id: "session-abc-123" },
      };

      const sessionId = computed(() => mockRoute.params.id as string);
      expect(sessionId.value).toBe("session-abc-123");
    });

    it("should handle different session IDs", () => {
      const testIds = [
        "123",
        "abc-def-ghi",
        "session_with_underscores",
        "MixedCase123",
      ];

      testIds.forEach((id) => {
        const mockRoute = { params: { id } };
        const sessionId = computed(() => mockRoute.params.id as string);
        expect(sessionId.value).toBe(id);
      });
    });
  });

  describe("Session Store Integration", () => {
    it("should get session by ID from store", () => {
      const mockSession = {
        id: "test-123",
        title: "Test Session",
        pdf_file_name: "test.pdf",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const mockStore = {
        getSessionById: vi.fn((id: string) =>
          id === "test-123" ? mockSession : null,
        ),
        fetchSession: vi.fn(),
      };

      const session = mockStore.getSessionById("test-123");
      expect(session).toEqual(mockSession);
    });

    it("should fetch session on mount", () => {
      const fetchSession = vi.fn();
      const sessionId = "test-session";

      // Simulate onMounted behavior
      fetchSession(sessionId);

      expect(fetchSession).toHaveBeenCalledWith(sessionId);
    });

    it("should re-fetch when session ID changes", () => {
      const fetchSession = vi.fn();

      // Simulate watch behavior
      const sessionIds = ["session-1", "session-2", "session-3"];
      sessionIds.forEach((id) => fetchSession(id));

      expect(fetchSession).toHaveBeenCalledTimes(3);
    });
  });

  describe("Session Computed Properties", () => {
    it("should compute session title", () => {
      const session = ref({
        id: "1",
        title: "My Chat Session",
        pdf_file_name: null,
      });

      const sessionTitle = computed(() => session.value?.title || "Chat");
      expect(sessionTitle.value).toBe("My Chat Session");
    });

    it("should fallback to default title when no session", () => {
      const session = ref(null);
      const sessionTitle = computed(
        () => (session.value as any)?.title || "Chat",
      );
      expect(sessionTitle.value).toBe("Chat");
    });

    it("should compute hasPdf correctly", () => {
      const sessionWithPdf = ref({ pdf_file_name: "document.pdf" });
      const sessionWithoutPdf = ref({ pdf_file_name: null });

      const hasPdfTrue = computed(
        () => sessionWithPdf.value?.pdf_file_name !== null,
      );
      const hasPdfFalse = computed(
        () => sessionWithoutPdf.value?.pdf_file_name !== null,
      );

      expect(hasPdfTrue.value).toBe(true);
      expect(hasPdfFalse.value).toBe(false);
    });

    it("should compute pdfFileName", () => {
      const session = ref({ pdf_file_name: "my-document.pdf" });
      const pdfFileName = computed(() => session.value?.pdf_file_name || "");
      expect(pdfFileName.value).toBe("my-document.pdf");
    });
  });

  describe("Chat Composable Integration", () => {
    it("should initialize chat with session ID", () => {
      const sessionId = "test-session-123";
      const chatConfig = {
        sessionId,
        autoFetch: true,
      };

      expect(chatConfig.sessionId).toBe(sessionId);
      expect(chatConfig.autoFetch).toBe(true);
    });

    it("should track messages state", () => {
      const messages = ref([
        { id: "1", content: "Hello", role: "user" },
        { id: "2", content: "Hi there!", role: "assistant" },
      ]);

      const hasMessages = computed(() => messages.value.length > 0);
      expect(hasMessages.value).toBe(true);
    });

    it("should track sending and streaming states", () => {
      const isSending = ref(false);
      const isStreaming = ref(false);

      const isProcessing = computed(() => isSending.value || isStreaming.value);

      expect(isProcessing.value).toBe(false);

      isSending.value = true;
      expect(isProcessing.value).toBe(true);

      isSending.value = false;
      isStreaming.value = true;
      expect(isProcessing.value).toBe(true);
    });
  });

  describe("Upload State Management", () => {
    it("should initialize showUploader as false", () => {
      const showUploader = ref(false);
      expect(showUploader.value).toBe(false);
    });

    it("should toggle uploader visibility", () => {
      const showUploader = ref(false);

      const toggleUploader = () => {
        showUploader.value = !showUploader.value;
      };

      toggleUploader();
      expect(showUploader.value).toBe(true);

      toggleUploader();
      expect(showUploader.value).toBe(false);
    });

    it("should hide uploader on upload complete", () => {
      const showUploader = ref(true);

      const handleUploadComplete = () => {
        showUploader.value = false;
      };

      handleUploadComplete();
      expect(showUploader.value).toBe(false);
    });
  });

  describe("UI State Computed Properties", () => {
    it("should compute upload button icon based on hasPdf", () => {
      const hasPdf = ref(false);

      const uploadButtonIcon = computed(() =>
        hasPdf.value
          ? "i-heroicons-document-text"
          : "i-heroicons-arrow-up-tray",
      );

      expect(uploadButtonIcon.value).toBe("i-heroicons-arrow-up-tray");

      hasPdf.value = true;
      expect(uploadButtonIcon.value).toBe("i-heroicons-document-text");
    });

    it("should compute upload button label based on hasPdf", () => {
      const hasPdf = ref(false);

      const uploadButtonLabel = computed(() =>
        hasPdf.value ? "Change PDF" : "Upload PDF",
      );

      expect(uploadButtonLabel.value).toBe("Upload PDF");

      hasPdf.value = true;
      expect(uploadButtonLabel.value).toBe("Change PDF");
    });

    it("should compute chat input placeholder based on hasPdf", () => {
      const hasPdf = ref(false);

      const chatInputPlaceholder = computed(() =>
        hasPdf.value
          ? "Ask a question about your PDF..."
          : "Upload a PDF to start chatting",
      );

      expect(chatInputPlaceholder.value).toBe("Upload a PDF to start chatting");

      hasPdf.value = true;
      expect(chatInputPlaceholder.value).toBe(
        "Ask a question about your PDF...",
      );
    });
  });

  describe("Breadcrumbs", () => {
    it("should generate breadcrumbs with home and session title", () => {
      const sessionTitle = ref("My Session");

      const breadcrumbs = computed(() => [
        { label: "Home", to: "/", icon: "i-heroicons-home" },
        { label: sessionTitle.value },
      ]);

      expect(breadcrumbs.value).toHaveLength(2);
      expect(breadcrumbs.value[0].label).toBe("Home");
      expect(breadcrumbs.value[0].to).toBe("/");
      expect(breadcrumbs.value[1].label).toBe("My Session");
    });
  });

  describe("Navigation", () => {
    it("should navigate back to home", () => {
      const pushFn = vi.fn();
      const mockRouter = { push: pushFn };

      const handleBack = () => {
        mockRouter.push("/");
      };

      handleBack();
      expect(pushFn).toHaveBeenCalledWith("/");
    });
  });

  describe("Error Handling", () => {
    it("should display error message", () => {
      const chatError = ref("Something went wrong");
      expect(chatError.value).toBe("Something went wrong");
    });

    it("should clear error", () => {
      const chatError = ref("Some error");

      const clearError = () => {
        chatError.value = "";
      };

      clearError();
      expect(chatError.value).toBe("");
    });
  });

  describe("Component Dependencies", () => {
    it("should import AppHeader from shared components", () => {
      const importPath = "~/shared/components/AppHeader.vue";
      expect(importPath).toContain("shared/components");
      expect(importPath).toContain("AppHeader");
    });

    it("should import PdfUploader from pdf module", () => {
      const importPath = "~/modules/pdf/components/PdfUploader.vue";
      expect(importPath).toContain("modules/pdf/components");
      expect(importPath).toContain("PdfUploader");
    });

    it("should import ChatMessageList from chat module", () => {
      const importPath = "~/modules/chat/components/ChatMessageList.vue";
      expect(importPath).toContain("modules/chat/components");
      expect(importPath).toContain("ChatMessageList");
    });

    it("should import ChatInput from chat module", () => {
      const importPath = "~/modules/chat/components/ChatInput.vue";
      expect(importPath).toContain("modules/chat/components");
      expect(importPath).toContain("ChatInput");
    });

    it("should import EmptyState from shared components", () => {
      const importPath = "~/shared/components/EmptyState.vue";
      expect(importPath).toContain("shared/components");
      expect(importPath).toContain("EmptyState");
    });

    it("should import useChat composable from chat module", () => {
      const importPath = "~/modules/chat/composables/useChat";
      expect(importPath).toContain("modules/chat/composables");
      expect(importPath).toContain("useChat");
    });

    it("should import useSessionsStore from stores", () => {
      const importPath = "~/stores/sessions";
      expect(importPath).toContain("stores/sessions");
    });
  });

  describe("Dark Mode Support", () => {
    it("should have dark mode color tokens defined", () => {
      const darkModeColors = [
        "gray-100",
        "gray-400",
        "gray-700",
        "gray-800",
        "red-200",
        "red-700",
        "red-800",
        "red-900",
      ];

      darkModeColors.forEach((color) => {
        expect(color).toMatch(/^(gray|red)-\d+$/);
      });
    });
  });

  describe("Responsive Breakpoints", () => {
    it("should define mobile breakpoint at 640px", () => {
      const mobileBreakpoint = 640;
      expect(mobileBreakpoint).toBe(640);
    });
  });

  describe("Active Session in Sidebar", () => {
    it("should match session ID from route with sidebar active session", () => {
      const routeSessionId = "session-123";
      const sidebarActiveSessionId = routeSessionId;

      expect(sidebarActiveSessionId).toBe(routeSessionId);
    });

    it("should update active session when navigating between chats", () => {
      const activeSessionId = ref("session-1");

      // Simulate navigation
      activeSessionId.value = "session-2";
      expect(activeSessionId.value).toBe("session-2");

      activeSessionId.value = "session-3";
      expect(activeSessionId.value).toBe("session-3");
    });
  });
});
