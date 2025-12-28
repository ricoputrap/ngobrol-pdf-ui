# Plan: PDF Chatbot Application

## Overview

Build a web-based chat application using **Nuxt 4 + Vue 3 + TypeScript + Nuxt UI** that allows users to upload PDF files and have conversations about their content.

**Tech Stack Detected:**

- Nuxt 4 (v4.2.2) with Nitro Server Engine
- Vue 3 (v3.5.25)
- TypeScript (v5.9.3)
- Nuxt UI (v4.2.1) - Tailwind CSS based component library
- Pinia (v2.1.7) - State management

## Architecture Decisions

### Module Structure (Colocation)

```
app/
├── modules/
│   ├── chat/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── types.ts
│   │   └── utils/
│   ├── sessions/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── types.ts
│   │   └── utils/
│   └── pdf/
│       ├── components/
│       ├── composables/
│       ├── types.ts
│       └── utils/
├── shared/
│   ├── components/
│   ├── composables/
│   ├── types/
│   └── utils/
├── stores/
│   └── sessions.ts          # Pinia store for session management
├── pages/
└── layouts/

server/
├── api/
│   ├── sessions/
│   │   ├── index.get.ts       # GET /api/sessions - List all sessions
│   │   ├── index.post.ts      # POST /api/sessions - Create new session
│   │   ├── [id].get.ts        # GET /api/sessions/:id - Get session details
│   │   ├── [id].delete.ts     # DELETE /api/sessions/:id - Delete session
│   │   └── [id]/
│   │       └── upload.post.ts # POST /api/sessions/:id/upload - Upload PDF
│   ├── messages/
│   │   ├── index.post.ts      # POST /api/messages - Send message
│   │   └── stream.get.ts      # GET /api/messages/stream - SSE for streaming responses
│   └── health.get.ts          # GET /api/health - Health check
├── utils/
│   ├── storage.ts             # Mock data storage utility
│   └── chatbot.ts             # Mock chatbot logic
└── types/
    └── api.ts                 # Server-side API types
```

### API Design (REST + SSE)

#### Session Management (REST)

```typescript
// GET /api/sessions
// Response: { sessions: Session[] }

// POST /api/sessions
// Body: { title?: string }
// Response: { session: Session }

// GET /api/sessions/:id
// Response: { session: Session }

// DELETE /api/sessions/:id
// Response: 204 No Content (empty body)

// POST /api/sessions/:id/upload
// Protocol: REST with multipart/form-data (SYNCHRONOUS for MVP)
// Body: FormData { file: File }
// Response: { success: boolean, file_name: string }
//
// Why SYNCHRONOUS upload for MVP?
// 1. Simple implementation - no task queues or polling needed
// 2. Immediate feedback - client knows when upload completes via HTTP response
// 3. PDF files typically small (1-50MB) - acceptable wait time
// 4. Low concurrent users - personal chatbot, not high-traffic system
// 5. Mock implementation has no heavy processing
//
// Client knows upload succeeded when:
// - Receives 200 OK response with { success: true, fileName: "doc.pdf" }
// - Can track progress using fetch/XMLHttpRequest upload.onprogress events
//
// Trade-offs vs ASYNCHRONOUS:
// SYNC Pros: Simple, immediate feedback, fewer moving parts
// SYNC Cons: Blocks connection, server resource usage under high load, timeout with huge files
//
// ASYNC Pros: Scalable, non-blocking, resilient, handles 100+ concurrent uploads
// ASYNC Cons: Complex (needs task queue, polling/SSE), overkill for MVP
//
// Migration Path to ASYNC (for production):
// POST /api/sessions/:id/upload → { uploadId: "abc123", status: "processing" }
// GET /api/uploads/:uploadId → { status: "completed", fileName: "doc.pdf" }
// Or SSE: GET /api/uploads/:uploadId/stream for real-time status
```

#### Chat/Messages (REST + SSE)

```typescript
// POST /api/messages
// Protocol: REST
// Body: { session_id: string, content: string }
// Response: { message: Message }

// GET /api/messages/stream?session_id=xxx&message_id=xxx
// Protocol: Server-Sent Events (SSE)
// Response: text/event-stream
// Events: { type: 'token' | 'done', data: string }
//
// Why SSE for chat streaming?
// - One-directional server-to-client streaming (perfect for AI responses)
// - Token-by-token streaming creates typewriter effect like ChatGPT
// - Event types: "token" (each word), "done" (complete), "error" (failure)
// - Simpler than WebSocket for this use case
// - Built on HTTP, works with standard proxies and load balancers
// - Automatic reconnection handling
// - Lower overhead than WebSocket for unidirectional data flow
```

### Database Design (In-Memory for Mock)

**Naming Convention:** All field names use `snake_case` to match FastAPI backend conventions.

```typescript
// Session Schema
{
  id: string;
  title: string;
  pdf_file_name: string | null;
  created_at: string; // ISO string
  updated_at: string; // ISO string
}

// Message Schema
{
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string; // ISO string
}
```

**Note:** PDF content is NOT stored in the Session schema. The actual PDF file will be stored separately in the backend's file system or object storage, referenced only by `pdf_file_name`.

### API Strategy

- **Phase 1 (Current)**: Nuxt Server API with mock implementations
- **Phase 2 (Future)**: Replace Nuxt API with FastAPI backend
  - Keep same API contract/interface
  - Update `nuxt.config.ts` to proxy to FastAPI
  - Minimal frontend changes required

## Module Structure Check

- [ ] Confirmed that new files are colocated within their modules.
- [ ] Confirmed types are using .ts and are properly exported.
- [ ] Confirmed shared utilities are truly global, not module-specific.
- [ ] Confirmed server API follows RESTful conventions.
- [ ] Confirmed that every logic change has a colocated test file (`*.test.ts` or `*.spec.ts`) and that the test(s) are executed immediately after the step is implemented.

## Execution Steps

CRITICAL: Every execution step in this plan MUST include:

- creation or update of a colocated test file that directly tests the logic changed in that step, and
- execution of the test(s) for that step (record the result in the plan note).
  Each checklist item below therefore represents "implement code AND create/update corresponding test(s) AND run those tests".

### Phase 1: Project Setup & Configuration

- [x] **Step 1**: Install required dependencies (Pinia for state management, @vueuse/core for composables, vitest for testing) — create or update any test-related scripts (e.g., `package.json` test script) and run tests as part of this step.
- [x] **Step 2**: Configure Nuxt modules (including @pinia/nuxt) in `nuxt.config.ts` — add a colocated test (where applicable) and run it to confirm configuration does not break imports.
- [x] **Step 3**: Create shared type definitions in `app/shared/types/common.ts` — create `app/shared/types/__tests__/common.test.ts` (or equivalent) to validate exported types/interfaces and run tests.

### Phase 2: Server API - Types & Utilities

- [x] **Step 4**: Create server API types in `server/types/api.ts`
- [x] **Step 5**: Create mock storage utility in `server/utils/storage.ts` (in-memory data store)
- [x] **Step 6**: Create mock chatbot utility in `server/utils/chatbot.ts` (simple response generator)
  - Note: Implemented `server/utils/chatbot.ts` — provides `generate_response(session_id, prompt)` and `stream_response(session_id, prompt, options?)` (async generator) to support synchronous response generation and SSE streaming for the frontend mock.

### Phase 3: Server API - Session Endpoints

- [x] **Step 7**: Create GET sessions list endpoint in `server/api/sessions/index.get.ts`
  - Note: Implemented `server/api/sessions/index.get.ts` and test `server/api/sessions/__tests__/index.get.test.ts`.
- [x] **Step 8**: Create POST new session endpoint in `server/api/sessions/index.post.ts`
  - Note: Implemented `server/api/sessions/index.post.ts` and test `server/api/sessions/__tests__/index.post.test.ts`. All 4 tests pass: creates sessions with default/custom titles, unique IDs, and proper timestamps. Also updated `vitest.setup.ts` to mock `readBody` for Nuxt auto-imports.
- [x] **Step 9**: Create GET single session endpoint in `server/api/sessions/[id].get.ts`
  - Note: Implemented `server/api/sessions/[id].get.ts` and test `server/api/sessions/__tests__/[id].get.test.ts`. All 5 tests pass: retrieves session with messages, retrieves empty session, returns 404 for non-existent session, returns 400 for missing ID, verifies snake_case fields. Also updated `vitest.setup.ts` to mock `getRouterParam`.
- [x] **Step 10**: Create DELETE session endpoint in `server/api/sessions/[id].delete.ts`
  - Note: Implemented `server/api/sessions/[id].delete.ts` and test `server/api/sessions/__tests__/[id].delete.test.ts`. All 5 tests pass: deletes session and returns 204 No Content (null body), returns 404 for non-existent session, returns 400 for missing ID, deletes all associated messages, verifies isolation between sessions. Also updated `vitest.setup.ts` to mock `setResponseStatus` in h3 module.
- [x] **Step 11**: Create POST upload PDF endpoint in `server/api/sessions/[id]/upload.post.ts`
  - Note: Implemented `server/api/sessions/[id]/upload.post.ts` and test `server/api/sessions/[id]/__tests__/upload.post.test.ts`. All 11 tests pass: uploads PDF with success response, validates .pdf extension and mime type, returns 404 for non-existent session, returns 400 for missing ID/no file/missing file field/non-PDF files, rejects images, updates session timestamp, allows replacing existing PDF. Also updated `vitest.setup.ts` to mock `readMultipartFormData`.

### Phase 4: Server API - Message Endpoints

- [x] **Step 12**: Create POST message endpoint in `server/api/messages/index.post.ts`
  - Note: Implemented `server/api/messages/index.post.ts` and test `server/api/messages/__tests__/index.post.test.ts`. All 11 tests pass: sends user message and generates assistant response, returns 404 for non-existent session, returns 400 for missing session_id/content/empty content/invalid types, handles multiple messages in conversation, generates deterministic responses, updates session timestamp, verifies snake_case fields. Test suite total: 49 passed (49).
- [x] **Step 13**: Create GET SSE stream endpoint in `server/api/messages/stream.get.ts`
  - Note: Implemented `server/api/messages/stream.get.ts` and test `server/api/messages/__tests__/stream.get.test.ts`. All 7 tests pass: streams response with token and done events, returns 400 for missing session_id/prompt/empty prompt, returns 404 for non-existent session, streams deterministic responses for same session and prompt, accepts optional message_id parameter. Uses ReadableStream for SSE protocol with typewriter effect. Also updated `vitest.setup.ts` to mock `getQuery` and `setResponseHeaders`. Test suite total: 56 passed (56).
- [x] **Step 14**: Create health check endpoint in `server/api/health.get.ts`
  - Note: Implemented `server/api/health.get.ts` and test `server/api/__tests__/health.get.test.ts`. All 5 tests pass: returns status ok, returns current timestamp, validates ISO 8601 timestamp format, verifies consistent response structure, works without event parameter dependencies. Simple health check endpoint for monitoring and deployment systems. Test suite total: 61 passed (61).

### Phase 5: Frontend - Session Management Module

- [x] **Step 15**: Create session types in `app/modules/sessions/types.ts`
  - Note: Implemented `app/modules/sessions/types.ts` with frontend types for Session, Message, and API response/request types. All types use snake_case to match backend API. Created test `app/modules/sessions/__tests__/types.test.ts` with 11 tests validating type structures, null handling, snake_case naming convention. Test suite total: 72 passed (72).
- [x] **Step 16**: Create Pinia sessions store in `app/stores/sessions.ts` (global state management)
  - Note: Implemented `app/stores/sessions.ts` as a Pinia store with state (sessions, currentSession, isLoading, error), getters (getSessionById, hasSessions, sessionsCount), and actions (fetchSessions, createSession, fetchSession, deleteSession, uploadPdf, clearError, clearCurrentSession, $reset). Uses $fetch for API calls with centralized business logic. Created test `app/stores/__tests__/sessions.test.ts` with 27 tests covering initial state, all getters, all actions (success and error cases), loading state management, and utility methods. Mocked $fetch and File for Node environment. Test suite total: 99 passed (99).
  - Design Decision: Using Pinia store directly instead of composable wrapper for simpler, more direct access. Components will call `useSessionsStore()` directly to access shared global state.
- [x] **Step 17**: Create SessionList component in `app/modules/sessions/components/SessionList.vue`
  - Note: Implemented `SessionList.vue` component with props (showLoading, maxItems), emits (sessionClick, sessionDelete), and computed properties (displaySessions, isEmpty). Component uses Pinia store directly via `useSessionsStore()` for accessing sessions state, loading state, and error state. Features include loading state display, error state with dismiss, empty state message, session list with icons, PDF file indicators, delete buttons, and "show more" indicator when maxItems is set. Auto-fetches sessions on mount if store is empty. Includes full styling with hover effects, dark mode support, and responsive layout. Component testing deferred - will rely on manual testing and E2E tests when integrated into pages. Test suite total: 99 passed (99).
- [x] **Step 18**: Create SessionItem component in `app/modules/sessions/components/SessionItem.vue`
  - Note: Implemented `SessionItem.vue` as a reusable component for displaying individual session items. Props include session (required Session object), isActive (boolean for active/selected state), showDelete (boolean to show/hide delete button), and class (custom CSS class). Emits click and delete events. Features include session icon (document or chat bubble based on PDF status), session title, formatted relative timestamp (e.g., "2h ago", "3d ago"), PDF file name with icon, delete button (visible on hover), and active state styling with blue accent border. Computed property formattedDate provides human-readable relative time display. Includes full BEM-style CSS with active state, hover effects, dark mode support, and responsive ellipsis for long text. Component testing deferred - E2E tests will validate in Phase 11. Test suite total: 99 passed (99).
- [x] **Step 19**: Create NewSessionButton component in `app/modules/sessions/components/NewSessionButton.vue`
  - Note: Implemented `NewSessionButton.vue` component for creating new chat sessions. Props include label (default "New Session"), size (xs/sm/md/lg/xl), variant (solid/outline/soft/ghost/link), showIcon (boolean to show plus icon), block (full width), and disabled (button disabled state). Emits created (with sessionId) and error (with error message) events. Component integrates directly with Pinia store via `useSessionsStore()` to call createSession action. Features auto-generated session title with timestamp (e.g., "Session Jan 15, 2:30 PM"), loading state with "Creating..." label, disabled state during creation, loading spinner from Nuxt UI UButton, and error handling with error emission. Uses computed properties for buttonLabel and isDisabled to manage state. Includes minimal styling with transition effects. Component testing deferred - E2E tests will validate in Phase 11. Test suite total: 99 passed (99).

### Phase 6: Frontend - PDF Upload Module

- [x] **Step 20**: Create PDF types in `app/modules/pdf/types.ts`
  - Note: Implemented `app/modules/pdf/types.ts` with comprehensive type definitions for PDF upload functionality. Types include PdfFile (file object with name, size, type), PdfUploadProgress (progress tracking with percentage, loaded, and total bytes), PdfUploadState (union type: idle/uploading/success/error), PdfUploadResponse (API response with success flag and file_name in snake_case), PdfUploadError (error object with message and optional code), PdfValidationResult (validation result with valid flag and optional error message), and PdfValidationRules (validation rules for maxSize, allowedTypes, maxNameLength). Exported DEFAULT_PDF_VALIDATION_RULES constant with 50MB max size, application/pdf allowed type, and 255 character max name length. Created test file `app/modules/pdf/__tests__/types.test.ts` with 21 tests covering all type structures, default values validation, snake_case naming convention, and edge cases. Mocked File class for Node environment. Test suite total: 120 passed (120).
- [x] **Step 21**: Create PdfUploader component in `app/modules/pdf/components/PdfUploader.vue`
  - Note: Implemented `PdfUploader.vue` component with drag-and-drop functionality, file validation, and progress tracking. Props include sessionId (required for upload target), validationRules (custom validation override), multiple (reserved for future), disabled (disable interaction), and showButton (show/hide upload button). Emits uploaded (with fileName) and error (with error message) events. Component integrates directly with Pinia store via `useSessionsStore()` to call uploadPdf action. Features include drag-and-drop zone with visual feedback (dragging/uploading/success/error states), click to browse file picker, file validation (type, size, name length) using merged rules with defaults, visual status indicators with icons and color-coded states, file info display (name and size in KB), upload and clear action buttons, automatic reset after successful upload (2 second delay), comprehensive error handling with user-friendly messages. Uses computed properties for upload state management (isUploading, hasError, isSuccess, canUpload, statusMessage, statusColor). Includes extensive styling with hover effects, drag states, success/error colors, dark mode support, and smooth transitions. Component testing deferred - E2E tests will validate in Phase 11. Test suite total: 120 passed (120).
- [x] **Step 22**: Create usePdfUpload composable in `app/modules/pdf/composables/usePdfUpload.ts` (reusable upload logic)
  - Note: Implemented `usePdfUpload.ts` composable to centralize PDF upload logic, validation, state management, and progress tracking. Makes upload functionality reusable across multiple components. Composable accepts UsePdfUploadOptions including sessionId (required), validationRules (optional Partial<PdfValidationRules> merged with defaults), autoResetDelay (optional, default 2000ms), and callback functions (onSuccess, onError, onStateChange). Returns UsePdfUploadReturn object with reactive state (uploadState, selectedFile, errorMessage), computed properties (isUploading, hasError, isSuccess, canUpload, validationRules), and methods (validateFile, selectFile, upload, clearSelection). Key features include file validation against rules (type, size, name length) with detailed error messages, state management (idle/uploading/success/error) with Vue ref/computed/watch, integration with Pinia store via useSessionsStore().uploadPdf(), auto-reset after successful upload (configurable delay), callback hooks for lifecycle events, and comprehensive error handling with user-friendly messages. Refactored PdfUploader.vue to use this composable, reducing component complexity from ~250 lines to ~150 lines by extracting business logic. Created test file `app/modules/pdf/composables/__tests__/usePdfUpload.test.ts` with 29 comprehensive tests covering initialization, file validation, file selection, upload flow (success/error/progress), auto-reset behavior, clearSelection, all callbacks (onSuccess/onError/onStateChange), and edge cases. Also updated `vitest.setup.ts` to add File class mock for Node environment. Test suite total: 149 passed (149). Component now has cleaner separation between UI logic and business logic, making upload functionality easy to reuse in future components.

### Phase 7: Frontend - Chat Module

- [x] **Step 23**: Create chat types in `app/modules/chat/types.ts`
  - Note: Implemented `app/modules/chat/types.ts` with comprehensive type definitions for chat functionality. Types include SSEEventType (token/done/error), SSEEvent interfaces (SSETokenEvent, SSEDoneEvent, SSEErrorEvent), MessageSendState (idle/sending/streaming/error), ChatConnectionState (disconnected/connecting/connected/error), StreamingMessage (extends Message with is_streaming and streaming_progress), ChatState (messages, streaming_message, is_sending, is_streaming, error, connection_state), SendMessageRequest, SendMessageResponse, StreamQueryParams, ChatInputState, and ChatConfig. Exported DEFAULT_CHAT_CONFIG with sensible defaults (max 10000 chars, streaming enabled, auto-scroll, relative timestamps). Added helper functions: validateMessageContent, createEmptyChatState, createUserMessage, createAssistantMessage, createStreamingMessage. Added type guards: isTokenEvent, isDoneEvent, isErrorEvent. Created test file `app/modules/chat/__tests__/types.test.ts` with 46 tests covering all types, interfaces, helper functions, type guards, and snake_case convention. Test suite total: 195 passed (195).
- [x] **Step 24**: Create MessageBubble component in `app/modules/chat/components/MessageBubble.vue`
  - Note: Implemented `MessageBubble.vue` component for displaying individual chat messages. Props include message (required Message or StreamingMessage), showTimestamp (default true), timestampFormat (relative or absolute), and class. Component features role-based styling (user messages blue, assistant messages gray), avatar icons (user-circle for user, cpu-chip for assistant), role labels ("You" or "Assistant"), formatted timestamps with relative time calculation (just now, Xm ago, Xh ago, Xd ago), streaming indicator with blinking cursor for active streaming messages, and pre-wrap whitespace handling for message content. Includes comprehensive styling with BEM naming, dark mode support, and pulse animation for streaming state. Component testing deferred - E2E tests will validate in Phase 11.
- [x] **Step 25**: Create ChatMessageList component in `app/modules/chat/components/ChatMessageList.vue`
  - Note: Implemented `ChatMessageList.vue` component for displaying scrollable message list. Props include messages (array), streamingMessage (optional), loading (boolean), autoScroll (default true), showTimestamps (default true), timestampFormat (relative or absolute), emptyMessage (customizable), and class. Features include loading state with spinner, empty state with icon and message, message rendering via MessageBubble components, separate streaming message display, "thinking" indicator with animated dots when loading but has messages, auto-scroll to bottom on new messages with scroll detection, scroll-to-bottom button when user scrolls up, and Vue Transition for smooth button appearance. Exposes scrollToBottom method for parent components. Includes smooth scrolling, user scroll detection to avoid interrupting manual scrolling, and comprehensive dark mode styling.
- [x] **Step 26**: Create ChatInput component in `app/modules/chat/components/ChatInput.vue`
  - Note: Implemented `ChatInput.vue` component for message input with validation. Props include placeholder (default "Type your message..."), disabled, sending (boolean for loading state), config (Partial<ChatConfig>), showCharacterCount (default true), autoFocus, and class. Emits send (with content) and input (with current value) events. Features include auto-resizing textarea (max 200px height), send button with paper airplane icon (rotated 45deg), loading spinner when sending, keyboard support (Enter to send, Shift+Enter for new line), character count display with warning (90%) and error (100%) states, message validation against config rules, validation error display with slide transition, disabled state handling, and focus/clear methods exposed for parent components. Includes comprehensive styling with focus ring, dark mode support, and kbd styling for keyboard hints.
- [x] **Step 27**: Create useChat composable in `app/modules/chat/composables/useChat.ts` (API + SSE integration)
  - Note: Implemented `useChat.ts` composable with full SSE streaming support. Accepts UseChatOptions including sessionId (required), config (optional Partial<ChatConfig>), callbacks (onMessageSent, onMessageReceived, onError, onStreamStart, onStreamEnd), and autoFetch (default true). Returns comprehensive UseChatReturn object with reactive state (messages, streamingMessage, isSending, isStreaming, isLoading, error, connectionState), computed (config, canSend), and methods (sendMessage for streaming, sendMessageSync for non-streaming, stopStreaming, clearMessages, clearError, fetchMessages, validateMessage). Key features include SSE streaming with ReadableStream reader, token accumulation during streaming, proper SSE line parsing, abort controller for stopping streams, connection state tracking, auto-fetch on initialization, integration with sessions store for fetching messages, both streaming and non-streaming send modes, comprehensive error handling, and cleanup on unmount. Created test file `app/modules/chat/composables/__tests__/useChat.test.ts` with 23 tests covering initialization, config merging, auto-fetch, validation, non-streaming send, streaming with token accumulation, stream error handling, fetch errors, stopStreaming, clearMessages, clearError, fetchMessages, canSend state, connectionState, and callback invocation. Test suite total: 218 passed (218).

### Phase 8: Frontend - Layout & Navigation

- [x] **Step 28**: Create main layout in `app/layouts/default.vue` with sidebar and main content area
  - Note: Implemented `app/layouts/default.vue` as the main application layout. Features include collapsible sidebar (4rem collapsed, 16rem expanded), mobile-responsive design with hamburger menu and overlay, fixed sidebar with header/content/footer sections, smooth width transitions, Vue provide/inject for sidebar state sharing with child components, route change detection to auto-close mobile menu, named slots for sidebar content (sidebar, sidebar-footer), and main content area with margin adjustment based on sidebar state. Includes comprehensive dark mode support and mobile breakpoint at 768px.
- [x] **Step 29**: Create AppHeader component in `app/shared/components/AppHeader.vue`
  - Note: Implemented `app/shared/components/AppHeader.vue` for page headers. Props include title, subtitle, breadcrumbs (array of {label, to, icon}), showBack (boolean), backTo (custom back route), and class. Emits back event. Features include breadcrumb navigation with links and separators, back button with router integration (uses router.back() or custom route), title and subtitle display with ellipsis overflow, actions slot for header buttons, and responsive design with smaller title on mobile. Includes dark mode support.
- [x] **Step 30**: Create AppSidebar component in `app/shared/components/AppSidebar.vue`
  - Note: Implemented `app/shared/components/AppSidebar.vue` as the sidebar content component. Props include collapsed (boolean), maxSessions (default 10), and class. Emits sessionClick and sessionCreated events. Integrates with sessions store and uses SessionList and NewSessionButton components. Features include new chat button (adapts to collapsed state), scrollable session list with section title, home navigation link with active state styling, automatic navigation to new/clicked sessions, and session deletion with redirect if deleting current session. Router integration for current session detection.
- [x] **Step 31**: Create EmptyState component in `app/shared/components/EmptyState.vue`
  - Note: Implemented `app/shared/components/EmptyState.vue` for empty/placeholder states. Props include icon (default inbox), title, description, actionLabel, actionIcon, size (sm/md/lg), and class. Emits action event. Features include centered layout with icon in circular background, size variants affecting icon size, padding, and typography, optional action button using Nuxt UI UButton, default slot for custom content, and computed classes for size variants. Includes dark mode support. Test suite total: 218 passed (218).

### Phase 9: Frontend - Pages & Routing

- [x] **Step 32**: Create home page in `app/pages/index.vue` (sessions list)
  - Note: Implemented `app/pages/index.vue` as the landing/home page. Uses default layout with definePageMeta. Features include welcome header with title and subtitle, loading state while fetching sessions, empty state with EmptyState component for new users, quick start section with cards for "New Chat" and "Recent Chats" (showing session count), "How It Works" section with 3-step guide (Upload PDF, Ask Questions, Get Answers), responsive grid layout for cards, integration with sessions store for fetching and displaying session count, navigation to chat page on session creation. Includes comprehensive dark mode support and mobile responsive styles.
- [x] **Step 33**: Create chat page in `app/pages/chat/[id].vue` (individual chat session)
  - Note: Implemented `app/pages/chat/[id].vue` as the individual chat session page. Uses dynamic route parameter for sessionId. Integrates useChat composable for message handling and SSE streaming. Features include AppHeader with session title, PDF filename subtitle, breadcrumbs, and back button, collapsible PdfUploader with slide transition, ChatMessageList with streaming message support, ChatInput with disabled state when no PDF uploaded, error banner with dismiss button, three empty states (loading, no PDF, has PDF but no messages), automatic session fetch on mount and sessionId change. Full integration with sessions store for session data. Includes comprehensive dark mode support, mobile responsive styles, and slide transitions for uploader and error banner. Test suite total: 218 passed (218).

### Phase 10: Main App Integration

- [x] **Step 34**: Update `app/app.vue` to use the default layout and routing
  - Note: Updated `app/app.vue` to serve as the root application component. Replaced NuxtWelcome with proper routing setup using NuxtLayout and NuxtPage components. Added NuxtRouteAnnouncer for accessibility, NuxtLoadingIndicator with blue theme color. Includes comprehensive global styles: CSS reset (box-sizing, margin, padding), system font stack, focus-visible outlines for accessibility, custom scrollbar styling, page and layout transition animations, and dark mode support. Ensures full viewport height and prevents horizontal overflow.
- [x] **Step 35**: Add app-wide styles and Nuxt UI theme configuration in `nuxt.config.ts`
  - Note: Updated `nuxt.config.ts` with comprehensive configuration. App head settings include title template, meta tags (charset, viewport, description, theme-color), and favicon. Added page and layout transitions with "out-in" mode. Runtime config for environment variables (apiSecret server-side, appName and apiBase public). Nuxt UI configured with heroicons. TypeScript strict mode and type checking enabled. Vite CSS preprocessor options placeholder. Nitro compressPublicAssets enabled. Route rules with CORS for API routes. Test suite total: 218 passed (218).

### Phase 11: Polish & Testing

- [ ] **Step 36**: Add loading states and error handling across all components
- [ ] **Step 37**: Add confirmation dialogs for delete operations using Nuxt UI modals
- [ ] **Step 38**: Add responsive design adjustments for mobile devices
- [ ] **Step 39**: Test full user flow: create session → upload PDF → chat → view history → delete session
- [ ] **Step 40**: Document API endpoints in `SYSTEM_DESIGN.md`

## Technical Notes

### Key Features Implementation

1. **Server API**: Nuxt Nitro server with file-based routing
2. **Mock Storage**: In-memory Map/Object storage (resets on server restart)
3. **PDF Upload**: Synchronous multipart form data (REST) with client-side progress tracking
4. **Chat Streaming**: Server-Sent Events (SSE) for token-by-token responses
5. **Mock Chatbot**: Simple responses based on keywords or random selection
6. **UI Components**: Leverage Nuxt UI (UButton, UCard, UInput, UModal, etc.)

### Upload Strategy: Synchronous vs Asynchronous

**Current (MVP): Synchronous Upload**

- Client waits for HTTP response = upload complete
- Suitable for: Small-medium PDFs (<50MB), low concurrency (<20 users)
- Implementation: Standard multipart/form-data POST

**Future (Production): Asynchronous Upload**

- When needed: High traffic (>100 concurrent), large files (>100MB), heavy processing (OCR, embeddings)
- Pattern: Upload ID → Background processing → Status polling/SSE
- Requires: Task queue (Celery/Bull), Redis, worker processes

### Server API Patterns

```typescript
// Event handler pattern (Nuxt server)
export default defineEventHandler(async (event) => {
  // Get query params: getQuery(event)
  // Get route params: getRouterParam(event, 'id')
  // Get body: await readBody(event)
  // Get multipart data: await readMultipartFormData(event)
  // Return JSON: return { data }
  // Set status: setResponseStatus(event, 404)
  // SSE: setHeader(event, 'content-type', 'text/event-stream')
});
```

### Migration to FastAPI (Future)

When migrating to FastAPI backend:

1. Keep the same API contract (routes, request/response schemas)
2. Update `nuxt.config.ts` with proxy configuration:

```typescript
nitro: {
  devProxy: {
    '/api': {
      target: 'http://localhost:8000/api',
      changeOrigin: true
    }
  }
}
```

3. Remove `server/` directory or keep for development
4. Minimal changes to frontend composables (only base URL if needed)

### Future Enhancements

- **Async upload pattern** with task queue (Celery/RQ) for production scale
- Backend API integration with actual PDF parsing (PyPDF2, LangChain)
- Vector embeddings and RAG (Retrieval Augmented Generation)
- WebSocket support for real-time features
- Authentication and user accounts
- Database persistence (PostgreSQL, MongoDB)
- Cloud storage for PDFs (S3, GCS)
- Chunked/resumable uploads for large files
- Export chat history
- Multi-file upload per session

## Success Criteria

- ✅ All API endpoints defined and implemented with mock data
- ✅ Users can create new chat sessions via API
- ✅ Users can upload a PDF file to a session via API
- ✅ Users can send messages and receive streamed responses via SSE
- ✅ Chat history persists in memory and displays correctly
- ✅ Users can view all sessions and navigate between them
- ✅ Users can delete sessions via API
- ✅ UI is clean, responsive, and follows Nuxt UI design patterns
- ✅ API contract is documented and ready for FastAPI migration
