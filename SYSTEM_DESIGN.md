# Ngobrol PDF UI - System Design Document

Ngobrol PDF UI is a web-based chat application that allows users to have conversations with a chatbot about the content of PDF documents. The application provides a modern, responsive interface with real-time streaming responses.

## Features

1. **PDF Upload**: Upload a single PDF file to a chat session for AI-powered Q&A.
2. **AI Chat**: Ask questions about the PDF content and receive AI-generated responses.
3. **Streaming Responses**: Real-time token-by-token response streaming for a typewriter effect.
4. **Session Management**: Create, view, and delete chat sessions.
5. **Chat History**: View message history within each session.
6. **Sidebar Navigation**: Browse and switch between chat sessions easily.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Frontend (Nuxt 4)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Pages     │  │  Layouts    │  │  Modules    │  │   Stores    │ │
│  │  - index    │  │  - default  │  │  - chat     │  │  - sessions │ │
│  │  - chat/[id]│  │             │  │  - sessions │  │             │ │
│  └─────────────┘  └─────────────┘  │  - pdf      │  └─────────────┘ │
│                                    └─────────────┘                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP/SSE
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        Backend (FastAPI)                             │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │   Routers   │  │  Services   │  │     AI       │  │   Storage   │ │
│  │  - sessions │  │  - session  │  │  - chatbot   │  │  - database │ │
│  │  - messages │  │  - message  │  │  - embeddings│  │  - files    │ │
│  │  - health   │  │  - pdf      │  │              │  │             │ │
│  └─────────────┘  └─────────────┘  └──────────────┘  └─────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           Data Layer                                │
│  ┌─────────────────────────┐    ┌─────────────────────────────────┐ │
│  │   PostgreSQL Database   │    │     File Storage (S3/Local)     │ │
│  │   - sessions            │    │     - PDF files                 │ │
│  │   - messages            │    │     - Embeddings cache          │ │
│  └─────────────────────────┘    └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Database Design

### Entity Relationship Diagram

```
┌──────────────────────────┐         ┌──────────────────────────┐
│         sessions         │         │         messages         │
├──────────────────────────┤         ├──────────────────────────┤
│ id: UUID (PK)            │────┐    │ id: UUID (PK)            │
│ title: VARCHAR(255)      │    └───<│ session_id: UUID (FK)    │
│ pdf_file_name: VARCHAR   │         │ role: VARCHAR(20)        │
│ pdf_file_path: VARCHAR   │         │ content: TEXT            │
│ created_at: TIMESTAMP    │         │ timestamp: TIMESTAMP     │
│ updated_at: TIMESTAMP    │         │ created_at: TIMESTAMP    │
└──────────────────────────┘         └──────────────────────────┘
```

### Table Definitions

#### `sessions` Table

Stores chat session metadata.

| Column          | Type                       | Constraints                                 | Description                                    |
| --------------- | -------------------------- | ------------------------------------------- | ---------------------------------------------- |
| `id`            | `UUID`                     | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()` | Unique session identifier                      |
| `title`         | `VARCHAR(255)`             | `NOT NULL`                                  | Session title (auto-generated or user-defined) |
| `pdf_file_name` | `VARCHAR(255)`             | `NULL`                                      | Original filename of uploaded PDF              |
| `pdf_file_path` | `VARCHAR(500)`             | `NULL`                                      | Storage path/URL of the PDF file               |
| `created_at`    | `TIMESTAMP WITH TIME ZONE` | `NOT NULL`, `DEFAULT NOW()`                 | Session creation timestamp                     |
| `updated_at`    | `TIMESTAMP WITH TIME ZONE` | `NOT NULL`, `DEFAULT NOW()`                 | Last update timestamp                          |

**Indexes:**

- `idx_sessions_created_at` on `created_at DESC`
- `idx_sessions_updated_at` on `updated_at DESC`

#### `messages` Table

Stores chat messages within sessions.

| Column       | Type                       | Constraints                                         | Description                 |
| ------------ | -------------------------- | --------------------------------------------------- | --------------------------- |
| `id`         | `UUID`                     | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()`         | Unique message identifier   |
| `session_id` | `UUID`                     | `NOT NULL`, `FOREIGN KEY`                           | Reference to parent session |
| `role`       | `VARCHAR(20)`              | `NOT NULL`, `CHECK (role IN ('user', 'assistant'))` | Message sender role         |
| `content`    | `TEXT`                     | `NOT NULL`                                          | Message content             |
| `timestamp`  | `TIMESTAMP WITH TIME ZONE` | `NOT NULL`, `DEFAULT NOW()`                         | Message creation timestamp  |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL`, `DEFAULT NOW()`                         | Record creation timestamp   |

**Indexes:**

- `idx_messages_session_id` on `session_id`
- `idx_messages_session_timestamp` on `(session_id, timestamp)`

**Foreign Keys:**

- `fk_messages_session` → `sessions(id)` with `ON DELETE CASCADE`

### SQL Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    pdf_file_name VARCHAR(255),
    pdf_file_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX idx_sessions_updated_at ON sessions(updated_at DESC);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_messages_session FOREIGN KEY (session_id)
        REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_session_timestamp ON messages(session_id, timestamp);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update sessions.updated_at
CREATE TRIGGER trigger_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## API Design

### Base URL

```
Production: https://api.ngobrol-pdf.com/api/v1
Development: http://localhost:8000/api/v1
```

### Common Conventions

- **Content-Type**: `application/json` (except file uploads)
- **Date Format**: ISO 8601 (`2024-01-15T10:30:00Z`)
- **Field Naming**: `snake_case` for all fields
- **Pagination**: Cursor-based where applicable
- **Error Format**: Consistent error response structure

### Authentication

> **Note**: Authentication is not implemented in MVP. Future versions will use JWT tokens.

```
Authorization: Bearer <jwt_token>
```

---

### API Endpoints

#### Health Check

##### `GET /api/v1/health`

Check API health status.

**Response: `200 OK`**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

---

#### Sessions

##### `GET /api/v1/sessions`

List all chat sessions, sorted by most recently updated.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|--------|----------|---------|--------------------------------|
| `limit` | int | No | 50 | Maximum number of sessions |
| `offset` | int | No | 0 | Number of sessions to skip |

**Response: `200 OK`**

```json
{
  "sessions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Q&A about Annual Report",
      "pdf_file_name": "annual-report-2024.pdf",
      "created_at": "2024-01-15T09:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "title": "New Chat",
      "pdf_file_name": null,
      "created_at": "2024-01-14T15:00:00Z",
      "updated_at": "2024-01-14T15:00:00Z"
    }
  ]
}
```

---

##### `POST /api/v1/sessions`

Create a new chat session.

**Request Body:**

```json
{
  "title": "My PDF Chat"
}
```

| Field   | Type   | Required | Description                           |
| ------- | ------ | -------- | ------------------------------------- |
| `title` | string | No       | Session title. Defaults to "New Chat" |

**Response: `201 Created`**

```json
{
  "session": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "title": "My PDF Chat",
    "pdf_file_name": null,
    "created_at": "2024-01-15T11:00:00Z",
    "updated_at": "2024-01-15T11:00:00Z"
  }
}
```

---

##### `GET /api/v1/sessions/{session_id}`

Get a single session with its messages.

**Path Parameters:**
| Parameter | Type | Required | Description |
|--------------|------|----------|----------------------|
| `session_id` | UUID | Yes | The session ID |

**Response: `200 OK`**

```json
{
  "session": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Q&A about Annual Report",
    "pdf_file_name": "annual-report-2024.pdf",
    "created_at": "2024-01-15T09:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "messages": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "session_id": "550e8400-e29b-41d4-a716-446655440000",
      "role": "user",
      "content": "What is the total revenue?",
      "timestamp": "2024-01-15T10:00:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "session_id": "550e8400-e29b-41d4-a716-446655440000",
      "role": "assistant",
      "content": "Based on the annual report, the total revenue for 2024 was $15.2 billion.",
      "timestamp": "2024-01-15T10:00:05Z"
    }
  ]
}
```

**Error Response: `404 Not Found`**

```json
{
  "detail": "Session not found",
  "status_code": 404
}
```

---

##### `DELETE /api/v1/sessions/{session_id}`

Delete a session and all its messages.

**Path Parameters:**
| Parameter | Type | Required | Description |
|--------------|------|----------|----------------------|
| `session_id` | UUID | Yes | The session ID |

**Response: `204 No Content`**

_Empty response body_

**Error Response: `404 Not Found`**

```json
{
  "detail": "Session not found",
  "status_code": 404
}
```

---

##### `POST /api/v1/sessions/{session_id}/upload`

Upload a PDF file to a session.

**Path Parameters:**
| Parameter | Type | Required | Description |
|--------------|------|----------|----------------------|
| `session_id` | UUID | Yes | The session ID |

**Request:**

- **Content-Type**: `multipart/form-data`
- **Body**: Form data with `file` field containing the PDF

| Field  | Type | Required | Description         |
| ------ | ---- | -------- | ------------------- |
| `file` | File | Yes      | PDF file (max 50MB) |

**Response: `200 OK`**

```json
{
  "success": true,
  "file_name": "document.pdf"
}
```

**Error Responses:**

`400 Bad Request` - Invalid file

```json
{
  "detail": "Only PDF files are allowed",
  "status_code": 400
}
```

`404 Not Found` - Session not found

```json
{
  "detail": "Session not found",
  "status_code": 404
}
```

`413 Payload Too Large` - File too large

```json
{
  "detail": "File size exceeds maximum limit of 50MB",
  "status_code": 413
}
```

---

#### Messages

##### `POST /api/v1/messages`

Send a user message and receive an assistant response (non-streaming).

**Request Body:**

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "content": "What is the main topic of this document?"
}
```

| Field        | Type   | Required | Description                         |
| ------------ | ------ | -------- | ----------------------------------- |
| `session_id` | UUID   | Yes      | The session ID                      |
| `content`    | string | Yes      | The message content (1-10000 chars) |

**Response: `200 OK`**

```json
{
  "user_message": {
    "id": "660e8400-e29b-41d4-a716-446655440010",
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "role": "user",
    "content": "What is the main topic of this document?",
    "timestamp": "2024-01-15T11:00:00Z"
  },
  "assistant_message": {
    "id": "660e8400-e29b-41d4-a716-446655440011",
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "role": "assistant",
    "content": "The main topic of this document is...",
    "timestamp": "2024-01-15T11:00:02Z"
  }
}
```

**Error Responses:**

`400 Bad Request` - Invalid request

```json
{
  "detail": "session_id and content are required",
  "status_code": 400
}
```

`404 Not Found` - Session not found

```json
{
  "detail": "Session not found",
  "status_code": 404
}
```

---

##### `GET /api/v1/messages/stream`

Stream an assistant response token-by-token using Server-Sent Events (SSE).

**Query Parameters:**
| Parameter | Type | Required | Description |
|--------------|--------|----------|--------------------------------|
| `session_id` | UUID | Yes | The session ID |
| `prompt` | string | Yes | The user's question |
| `message_id` | UUID | No | Optional user message ID |

**Response: `200 OK`**

- **Content-Type**: `text/event-stream`
- **Cache-Control**: `no-cache`
- **Connection**: `keep-alive`

**Stream Format:**

```
data: {"type":"token","data":"The"}\n\n
data: {"type":"token","data":" main"}\n\n
data: {"type":"token","data":" topic"}\n\n
data: {"type":"token","data":" is..."}\n\n
data: {"type":"done","data":""}\n\n
```

**Event Types:**

| Type    | Description                         |
| ------- | ----------------------------------- |
| `token` | A chunk of the assistant's response |
| `done`  | Signals the end of the stream       |
| `error` | An error occurred during generation |

**Error Event:**

```
data: {"type":"error","data":"Failed to generate response"}\n\n
data: {"type":"done","data":""}\n\n
```

---

### Error Response Format

All error responses follow this structure:

```json
{
  "detail": "Human-readable error message",
  "status_code": 400,
  "errors": [
    {
      "field": "content",
      "message": "Field is required"
    }
  ]
}
```

| Field         | Type   | Description                             |
| ------------- | ------ | --------------------------------------- |
| `detail`      | string | Human-readable error message            |
| `status_code` | int    | HTTP status code                        |
| `errors`      | array  | Optional. Field-level validation errors |

### HTTP Status Codes

| Code | Description                               |
| ---- | ----------------------------------------- |
| 200  | OK - Request succeeded                    |
| 201  | Created - Resource created successfully   |
| 204  | No Content - Request succeeded, no body   |
| 400  | Bad Request - Invalid request data        |
| 404  | Not Found - Resource not found            |
| 413  | Payload Too Large - File size exceeded    |
| 422  | Unprocessable Entity - Validation error   |
| 500  | Internal Server Error - Server-side error |

---

## Data Types (Pydantic Models)

### Session Models

```python
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from typing import Optional

class SessionBase(BaseModel):
    title: str = Field(default="New Chat", max_length=255)

class SessionCreate(SessionBase):
    pass

class Session(SessionBase):
    id: UUID
    pdf_file_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SessionWithMessages(BaseModel):
    session: Session
    messages: list["Message"]
```

### Message Models

```python
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from typing import Literal

class MessageBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)

class MessageCreate(MessageBase):
    session_id: UUID

class Message(MessageBase):
    id: UUID
    session_id: UUID
    role: Literal["user", "assistant"]
    timestamp: datetime

    class Config:
        from_attributes = True

class SendMessageRequest(BaseModel):
    session_id: UUID
    content: str = Field(..., min_length=1, max_length=10000)

class SendMessageResponse(BaseModel):
    user_message: Message
    assistant_message: Message
```

### Upload Models

```python
from pydantic import BaseModel

class UploadPdfResponse(BaseModel):
    success: bool
    file_name: str
```

### Stream Event Models

```python
from pydantic import BaseModel
from typing import Literal

class StreamEvent(BaseModel):
    type: Literal["token", "done", "error"]
    data: str
```

---

## UI Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ ┌─────────────┐ ┌─────────────────────────────────────────────────┐ │
│ │             │ │                    Main Content                 │ │
│ │   Sidebar   │ │  ┌───────────────────────────────────────────┐  │ │
│ │             │ │  │               App Header                  │  │ │
│ │  ┌───────┐  │ │  └───────────────────────────────────────────┘  │ │
│ │  │ Logo  │  │ │  ┌───────────────────────────────────────────┐  │ │
│ │  └───────┘  │ │  │                                           │  │ │
│ │             │ │  │            Content Area                   │  │ │
│ │  ┌───────┐  │ │  │                                           │  │ │
│ │  │Recent │  │ │  │   - Home: Welcome + Quick Start           │  │ │
│ │  │ Chats │  │ │  │   - Chat: Messages + Input                │  │ │
│ │  │       │  │ │  │                                           │  │ │
│ │  │ Item1 │  │ │  │                                           │  │ │
│ │  │ Item2 │  │ │  └───────────────────────────────────────────┘  │ │
│ │  │ Item3 │  │ │                                                 │ │
│ │  └───────┘  │ │                                                 │ │
│ │             │ │                                                 │ │
│ │  ┌───────┐  │ │                                                 │ │
│ │  │New    │  │ │                                                 │ │
│ │  │ Chat  │  │ │                                                 │ │
│ │  └───────┘  │ │                                                 │ │
│ └─────────────┘ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Pages

#### Home Page (`/`)

- Welcome message and app description
- Quick start cards for new users
- "How it works" steps
- Create new chat button

#### Chat Page (`/chat/{id}`)

- PDF upload area (collapsible)
- Message list with user/assistant bubbles
- Streaming response with typewriter effect
- Chat input with send button
- Empty states for no PDF / no messages

### Components

#### Sidebar Components

| Component            | Description                                      |
| -------------------- | ------------------------------------------------ |
| `SidebarSessions`    | List of recent chat sessions with search         |
| `SidebarSessionItem` | Individual session item with title, date, delete |
| `SidebarNewChat`     | "New Chat" button in footer                      |

#### Chat Components

| Component         | Description                                |
| ----------------- | ------------------------------------------ |
| `ChatMessageList` | Scrollable list of chat messages           |
| `ChatMessage`     | Individual message bubble (user/assistant) |
| `ChatInput`       | Text input with send button                |

#### PDF Components

| Component     | Description                   |
| ------------- | ----------------------------- |
| `PdfUploader` | Drag-and-drop PDF upload area |

#### Shared Components

| Component    | Description                                  |
| ------------ | -------------------------------------------- |
| `AppHeader`  | Page header with title, breadcrumbs, actions |
| `EmptyState` | Empty state with icon, title, description    |

### Responsive Breakpoints

| Breakpoint | Width      | Behavior                       |
| ---------- | ---------- | ------------------------------ |
| Mobile     | < 768px    | Sidebar hidden, hamburger menu |
| Tablet     | 768-1024px | Collapsible sidebar            |
| Desktop    | > 1024px   | Full sidebar visible           |

### Color Palette

| Token          | Light Mode           | Dark Mode            |
| -------------- | -------------------- | -------------------- |
| Background     | `gray-50` (#f9fafb)  | `gray-900` (#111827) |
| Surface        | `white` (#ffffff)    | `gray-800` (#1f2937) |
| Border         | `gray-200` (#e5e7eb) | `gray-700` (#374151) |
| Text Primary   | `gray-900` (#111827) | `gray-100` (#f3f4f6) |
| Text Secondary | `gray-500` (#6b7280) | `gray-400` (#9ca3af) |
| Primary        | `blue-500` (#3b82f6) | `blue-400` (#60a5fa) |
| Error          | `red-500` (#ef4444)  | `red-400` (#f87171)  |

---

## Project Structure

```
ngobrol-pdf-ui/
├── app/
│   ├── layouts/
│   │   └── default.vue              # Main layout with sidebar
│   ├── pages/
│   │   ├── index.vue                # Home page
│   │   └── chat/
│   │       └── [id].vue             # Chat page
│   ├── modules/
│   │   ├── chat/
│   │   │   ├── components/          # Chat UI components
│   │   │   ├── composables/         # useChat composable
│   │   │   └── types.ts             # Chat types
│   │   ├── sessions/
│   │   │   ├── components/          # Sidebar components
│   │   │   ├── composables/         # useSidebarSessions
│   │   │   └── types.ts             # Session types
│   │   └── pdf/
│   │       ├── components/          # PDF uploader
│   │       └── composables/         # usePdfUpload
│   ├── stores/
│   │   └── sessions.ts              # Pinia store
│   └── shared/
│       └── components/              # Shared UI components
├── server/
│   ├── api/                         # Mock API endpoints
│   ├── types/                       # Server types
│   └── utils/                       # Storage, chatbot utils
└── plans/                           # Development plans
```

---

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- Python 3.11+ (for backend)

### Frontend Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

### Backend Setup (FastAPI)

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn main:app --reload --port 8000

# Run tests
pytest
```

---

## Environment Variables

### Frontend (.env)

```bash
# API Base URL
NUXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ngobrol_pdf

# File Storage
STORAGE_TYPE=local  # or "s3"
STORAGE_PATH=./uploads
# S3_BUCKET=my-bucket
# AWS_ACCESS_KEY_ID=xxx
# AWS_SECRET_ACCESS_KEY=xxx

# AI/LLM
OPENAI_API_KEY=sk-xxx
# Or other LLM provider

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=true
```

---

## Future Enhancements

1. **Authentication**: JWT-based user authentication
2. **Multi-PDF Support**: Upload multiple PDFs per session
3. **PDF Preview**: In-app PDF viewer with highlight
4. **Export Chat**: Export conversation as PDF/Markdown
5. **Search**: Full-text search across sessions and messages
6. **Rate Limiting**: API rate limiting for production
7. **Analytics**: Usage analytics and metrics
8. **Webhooks**: Webhook notifications for events
