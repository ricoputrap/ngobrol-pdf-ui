# Plan: PDF Chatbot Application

## Overview

Build a web-based chat application using **Nuxt 4 + Vue 3 + TypeScript + Nuxt UI** that allows users to upload PDF files and have conversations about their content.

**Tech Stack Detected:**

- Nuxt 4 (v4.2.2) with Nitro Server Engine
- Vue 3 (v3.5.25)
- TypeScript (v5.9.3)
- Nuxt UI (v4.2.1) - Tailwind CSS based component library
- Pinia (will be added for state management)

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

- [x] **Step 1**: Install required dependencies (Pinia, @vueuse/core for composables) — create or update any test-related scripts (e.g., `package.json` test script) and run tests as part of this step.
- [x] **Step 2**: Configure Nuxt modules and add Pinia store setup in `nuxt.config.ts` — add a colocated test (where applicable) and run it to confirm configuration does not break imports.
- [x] **Step 3**: Create shared type definitions in `app/shared/types/common.ts` — create `app/shared/types/__tests__/common.test.ts` (or equivalent) to validate exported types/interfaces and run tests.

### Phase 2: Server API - Types & Utilities

- [x] **Step 4**: Create server API types in `server/types/api.ts`
- [x] **Step 5**: Create mock storage utility in `server/utils/storage.ts` (in-memory data store)
- [x] **Step 6**: Create mock chatbot utility in `server/utils/chatbot.ts` (simple response generator)
  - Note: Implemented `server/utils/chatbot.ts` — provides `generate_response(session_id, prompt)` and `stream_response(session_id, prompt, options?)` (async generator) to support synchronous response generation and SSE streaming for the frontend mock.

### Phase 3: Server API - Session Endpoints

- [x] **Step 7**: Create GET sessions list endpoint in `server/api/sessions/index.get.ts`
  - Note: Implemented `server/api/sessions/index.get.ts` and test `server/api/sessions/__tests__/index.get.test.ts`.
- [ ] **Step 8**: Create POST new session endpoint in `server/api/sessions/index.post.ts`
- [ ] **Step 9**: Create GET single session endpoint in `server/api/sessions/[id].get.ts`
- [ ] **Step 10**: Create DELETE session endpoint in `server/api/sessions/[id].delete.ts`
- [ ] **Step 11**: Create POST upload PDF endpoint in `server/api/sessions/[id]/upload.post.ts`

### Phase 4: Server API - Message Endpoints

- [ ] **Step 12**: Create POST message endpoint in `server/api/messages/index.post.ts`
- [ ] **Step 13**: Create GET SSE stream endpoint in `server/api/messages/stream.get.ts`
- [ ] **Step 14**: Create health check endpoint in `server/api/health.get.ts`

### Phase 5: Frontend - Session Management Module

- [ ] **Step 15**: Create session types in `app/modules/sessions/types.ts`
- [ ] **Step 16**: Create session composable in `app/modules/sessions/composables/useSessions.ts` (API integration)
- [ ] **Step 17**: Create SessionList component in `app/modules/sessions/components/SessionList.vue`
- [ ] **Step 18**: Create SessionItem component in `app/modules/sessions/components/SessionItem.vue`
- [ ] **Step 19**: Create NewSessionButton component in `app/modules/sessions/components/NewSessionButton.vue`

### Phase 6: Frontend - PDF Upload Module

- [ ] **Step 20**: Create PDF types in `app/modules/pdf/types.ts`
- [ ] **Step 21**: Create PdfUploader component in `app/modules/pdf/components/PdfUploader.vue`
- [ ] **Step 22**: Create usePdfUpload composable in `app/modules/pdf/composables/usePdfUpload.ts` (API integration)

### Phase 7: Frontend - Chat Module

- [ ] **Step 23**: Create chat types in `app/modules/chat/types.ts`
- [ ] **Step 24**: Create MessageBubble component in `app/modules/chat/components/MessageBubble.vue`
- [ ] **Step 25**: Create ChatMessageList component in `app/modules/chat/components/ChatMessageList.vue`
- [ ] **Step 26**: Create ChatInput component in `app/modules/chat/components/ChatInput.vue`
- [ ] **Step 27**: Create useChat composable in `app/modules/chat/composables/useChat.ts` (API + SSE integration)

### Phase 8: Frontend - Layout & Navigation

- [ ] **Step 28**: Create main layout in `app/layouts/default.vue` with sidebar and main content area
- [ ] **Step 29**: Create AppHeader component in `app/shared/components/AppHeader.vue`
- [ ] **Step 30**: Create AppSidebar component in `app/shared/components/AppSidebar.vue`
- [ ] **Step 31**: Create EmptyState component in `app/shared/components/EmptyState.vue`

### Phase 9: Frontend - Pages & Routing

- [ ] **Step 32**: Create home page in `app/pages/index.vue` (sessions list)
- [ ] **Step 33**: Create chat page in `app/pages/chat/[id].vue` (individual chat session)

### Phase 10: Main App Integration

- [ ] **Step 34**: Update `app/app.vue` to use the default layout and routing
- [ ] **Step 35**: Add app-wide styles and Nuxt UI theme configuration in `nuxt.config.ts`

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
