/**
 * In-memory mock storage utility for sessions and messages.
 *
 * Purpose:
 * - Simple, synchronous in-memory store used by Nuxt server API routes during development/MVP.
 * - Keeps sessions and messages in Maps keyed by session id.
 * - Uses snake_case fields to match FastAPI / backend conventions.
 *
 * Notes:
 * - This storage is ephemeral and will be reset when the server restarts.
 * - For production, replace with persistent storage (database + object storage for PDFs).
 */

import type {
  Session,
  Message,
  CreateSessionRequest,
  SendMessageRequest,
} from "../types/api";

/* ---------------------------
 * Internal in-memory storage
 * --------------------------- */
const sessions = new Map<string, Session>();
const messages = new Map<string, Message[]>();

/* ---------------------------
 * Helpers
 * --------------------------- */
function nowIso(): string {
  return new Date().toISOString();
}

function genId(prefix = "id"): string {
  try {
    // Node 18+ and modern runtimes
    // crypto.randomUUID is the preferred method when available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cryptoAny = globalThis.crypto as any | undefined;
    if (cryptoAny && typeof cryptoAny.randomUUID === "function") {
      return cryptoAny.randomUUID();
    }
  } catch {
    // ignore and fallback
  }
  // fallback
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

/* ---------------------------
 * Public API
 * --------------------------- */

/**
 * List all sessions, sorted by updated_at desc (most recently updated first).
 */
export async function list_sessions(): Promise<Session[]> {
  const arr = Array.from(sessions.values());
  arr.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  return arr;
}

/**
 * Create a new session.
 * - Returns the created Session object.
 */
export async function create_session(
  body: CreateSessionRequest
): Promise<Session> {
  const id = genId("sess");
  const timestamp = nowIso();
  const session: Session = {
    id,
    title: body.title ?? "Untitled Session",
    pdf_file_name: null,
    created_at: timestamp,
    updated_at: timestamp,
  };
  sessions.set(id, session);
  messages.set(id, []);
  return session;
}

/**
 * Get a session and its messages.
 * - Returns { session, messages } or null if not found.
 */
export async function get_session(
  id: string
): Promise<{ session: Session; messages: Message[] } | null> {
  const s = sessions.get(id);
  if (!s) return null;
  const msgs = messages.get(id) ?? [];
  return { session: s, messages: msgs };
}

/**
 * Delete a session and its messages.
 * - Returns true if something was deleted, false otherwise.
 *
 * Note: The API layer should return 204 No Content on success.
 */
export async function delete_session(id: string): Promise<boolean> {
  const existedSession = sessions.delete(id);
  const existedMessages = messages.delete(id);
  return existedSession || existedMessages;
}

/**
 * Save/assign a PDF file name for a session.
 * - Updates updated_at and returns the updated Session or null if session not found.
 */
export async function save_pdf_file_name(
  id: string,
  file_name: string
): Promise<Session | null> {
  const s = sessions.get(id);
  if (!s) return null;
  s.pdf_file_name = file_name;
  s.updated_at = nowIso();
  sessions.set(id, s);
  return s;
}

/**
 * Add a message to a session.
 * - `role` is optional if the caller wants to set assistant messages.
 * - Returns the created Message.
 */
export async function add_message(
  body: SendMessageRequest,
  role: "user" | "assistant" = "user"
): Promise<Message> {
  const id = genId("msg");
  const timestamp = nowIso();
  const msg: Message = {
    id,
    session_id: body.session_id,
    role,
    content: body.content,
    timestamp,
  };
  const arr = messages.get(body.session_id) ?? [];
  arr.push(msg);
  messages.set(body.session_id, arr);

  // update session's updated_at if session exists
  const s = sessions.get(body.session_id);
  if (s) {
    s.updated_at = timestamp;
    sessions.set(body.session_id, s);
  }

  return msg;
}

/**
 * List messages for a session.
 * - Returns messages array (may be empty).
 * - `limit` and `offset` parameters are optional; we keep them here for future use (no pagination by default).
 */
export async function list_messages_by_session(
  session_id: string,
  limit?: number,
  offset = 0
): Promise<Message[]> {
  const arr = messages.get(session_id) ?? [];
  if (typeof limit === "number") {
    return arr.slice(offset, offset + limit);
  }
  if (offset > 0) {
    return arr.slice(offset);
  }
  return arr;
}

/* ---------------------------
 * Test / Dev Utilities
 * --------------------------- */

/**
 * Reset the in-memory storage (useful for tests or restart behavior).
 */
export function reset_storage(): void {
  sessions.clear();
  messages.clear();
}

/**
 * Seed helper (convenience for local development).
 * Returns array of created sessions.
 */
export async function seed_sample_data(): Promise<Session[]> {
  reset_storage();
  const s1 = await create_session({ title: "Example PDF: AI Overview" });
  await save_pdf_file_name(s1.id, "ai_overview.pdf");
  await add_message({ session_id: s1.id, content: "Hi, what is this PDF about?" }, "user");
  await add_message({ session_id: s1.id, content: "This PDF discusses foundational AI concepts." }, "assistant");

  const s2 = await create_session({ title: "Meeting Notes" });
  await save_pdf_file_name(s2.id, "meeting_notes.pdf");
  await add_message({ session_id: s2.id, content: "Summarize key takeaways." }, "user");
  await add_message({ session_id: s2.id, content: "Key takeaways: project timeline, action items." }, "assistant");

  return [s1, s2];
}
