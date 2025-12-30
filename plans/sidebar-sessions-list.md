# Plan: Sidebar Sessions List

## Problem Statement

The sidebar in `default.vue` layout has empty `<slot name="sidebar" />` and `<slot name="sidebar-footer" />` content areas. Users expect to see a list of all previous chat sessions in the sidebar for easy navigation.

## Solution Overview

Create a `SidebarSessions` component in the sessions module that displays a list of all chat sessions. Integrate it into the layout's sidebar slot and sidebar-footer slot.

## Architecture

```
app/
├── modules/
│   └── sessions/
│       ├── components/
│       │   ├── SidebarSessions.vue      # Main sidebar component
│       │   ├── SidebarSessionItem.vue   # Individual session item
│       │   └── SidebarNewChat.vue       # New chat button in footer
│       ├── composables/
│       │   └── useSidebarSessions.ts    # Session list logic
│       ├── types.ts                     # Already exists
│       └── utils/
│           └── sidebarHelpers.ts        # Formatting helpers
└── stores/
    └── sessions.ts                      # Already exists (Pinia)
```

## Module Structure Check

- [ ] Confirmed that new files are colocated within `app/modules/sessions/components/`
- [ ] Confirmed composables go in `app/modules/sessions/composables/`
- [ ] Confirmed types are using `.ts` and are properly exported
- [ ] Confirmed that every logic file has a sibling test file
- [ ] Confirmed layout integration follows existing patterns

## Execution Steps

### Phase 1: Component Foundation

- [x] **Step 1**: Create `SidebarSessionItem.vue` component **AND** create `SidebarSessionItem.test.ts`
  - Path: `app/modules/sessions/components/SidebarSessionItem.vue`
  - Path: `app/modules/sessions/components/__tests__/SidebarSessionItem.test.ts`
  - Features: Session title, truncated filename, timestamp, active state styling, hover effects
  - Props: `session` (Session type), `isActive` (boolean)
  - Events: `click`, `delete`
  - ✅ **Completed**: Component and test suite created. Component includes:
    - Session display with icon (document for PDF, chat for text-only)
    - Title truncation at 40 chars with tooltip
    - Filename truncation at 30 chars preserving extension
    - Smart date formatting (Just now, Xm ago, Xh ago, Xd ago, or date)
    - Active state styling with blue accent
    - Delete button on hover
    - Full dark mode support
      Test suite: 16 passing tests covering type validation, truncation logic, date formatting, icon logic, props structure, and event emitters.

- [x] **Step 2**: Create `useSidebarSessions.ts` composable **AND** create `useSidebarSessions.test.ts`
  - Path: `app/modules/sessions/composables/useSidebarSessions.ts`
  - Path: `app/modules/sessions/composables/__tests__/useSidebarSessions.test.ts`
  - Features: Session filtering, sorting (most recent first), search/filter capability, active session tracking
  - ✅ **Completed**: Composable and test suite created.
  - 🔧 **Refactored**: Simplified architecture to avoid redundant computed values:
    - **Before (problematic):** 3 separate computed values (`sortedSessions`, `filteredSessions`, `recentSessions`) causing 3x sorting overhead
    - **After (optimized):** Single `displaySessions` computed for UI, internal `sortedSessions` as base layer
    - Removed redundant `recentSessions` (can be added as optional filter if needed)
    - Renamed `filteredSessions` → `displaySessions` (clearer intent)
  - Composable now includes:
    - `displaySessions`: Single source of truth for UI (sorted + search filtered)
    - `activeSession`: Current session object
    - Session data access from Pinia store
    - Active session tracking with reactive state
    - Search functionality with case-insensitive filtering
    - Manual refresh capability
    - Auto-refresh on mount (30s interval)
    - Smart watchers for session state management
  - Test suite: 32 passing tests covering session data access, active tracking, sorting, filtering, search management, methods, and return structure.

### Phase 2: Main Sidebar Component

- [ ] **Step 3**: Create `SidebarSessions.vue` component **AND** create `SidebarSessions.test.vue`
  - Path: `app/modules/sessions/components/SidebarSessions.vue`
  - Path: `app/modules/sessions/components/SidebarSessions.test.vue`
  - Features: List of sessions, loading state, empty state, scrollable list, click navigation
  - Dependencies: `useSessionsStore`, `SidebarSessionItem`
  - Auto-refresh sessions on mount and periodically

- [ ] **Step 4**: Create `SidebarNewChat.vue` component **AND** create `SidebarNewChat.test.vue`
  - Path: `app/modules/sessions/components/SidebarNewChat.vue`
  - Path: `app/modules/sessions/components/SidebarNewChat.test.vue`
  - Features: "New Chat" button, icon, navigation to home or create new session
  - Placement: Sidebar footer slot

### Phase 3: Layout Integration

- [ ] **Step 5**: Update `app/layouts/default.vue` to use sidebar components
  - Add `<SidebarSessions />` to `<slot name="sidebar" />`
  - Add `<SidebarNewChat />` to `<slot name="sidebar-footer" />`
  - Import components from sessions module
  - Update `default.vue.test.ts` (create if missing)

### Phase 4: Page Integration

- [ ] **Step 6**: Update `app/pages/index.vue` (home page) integration
  - Add `<template #sidebar>` block with `<SidebarSessions />`
  - Add `<template #sidebar-footer>` block with `<SidebarNewChat />`
  - Ensure sessions are fetched on page load
  - Update `index.vue.test.ts` (create if missing)

- [ ] **Step 7**: Update `app/pages/chat/[id].vue` (chat page) integration
  - Add `<template #sidebar>` block with `<SidebarSessions />`
  - Add `<template #sidebar-footer>` block with `<SidebarNewChat />`
  - Highlight current session in sidebar
  - Update or create chat page test

## UI/UX Requirements

### Sidebar Sessions List

- **Title**: "Recent Chats"
- **List items**: Session title, PDF filename, last updated timestamp
- **Active state**: Highlight current session with different background color
- **Empty state**: "No sessions yet" message with call-to-action
- **Loading state**: Skeleton or spinner
- **Interactions**: Click to navigate to session, hover effects
- **Scroll**: Scrollable if many sessions (max-height with overflow-y-auto)

### Sidebar Footer

- **New Chat button**: Primary action to start new conversation
- **Icon**: Plus icon
- **Responsive**: Show on both desktop and mobile

### Styling Consistency

- Use Nuxt UI color tokens (gray-50, gray-100, gray-200, etc.)
- Dark mode support via `prefers-color-scheme: dark`
- Consistent with existing component styling in `default.vue`
- Transitions for hover and active states

## Technical Details

### Session Type Reference

```typescript
// From app/modules/sessions/types.ts
interface Session {
  id: string;
  title: string;
  pdf_file_name: string | null;
  created_at: string;
  updated_at: string;
}
```

### Store Integration

```typescript
// From app/stores/sessions.ts
const sessionStore = useSessionsStore();
// Required: sessions (ref/array), fetchSessions (function), isLoading (computed)
```

### Navigation

```typescript
const router = useRouter();
await router.push(`/chat/${sessionId}`);
```

## Testing Strategy

### Unit Tests (Vitest)

- `SidebarSessionItem.test.vue`: Props rendering, event emission, active state styling
- `useSidebarSessions.test.ts`: Filtering, sorting, computed properties
- `SidebarSessions.test.vue`: List rendering, empty/loading states, navigation
- `SidebarNewChat.test.vue`: Button rendering, click handler, navigation

### Integration Tests

- `default.vue.test.ts`: Sidebar slots populated correctly
- `index.vue.test.ts`: Sidebar components rendered in home page
- `chat/[id].vue.test.ts`: Sidebar components rendered in chat page, active state

### E2E Tests (Optional - Future)

- Click session navigates to correct page
- New chat button creates session and navigates
- Sidebar responsive behavior

## Dependencies

- Nuxt UI components: `UIcon`, `UButton` (if needed)
- Pinia store: `useSessionsStore`
- Vue Router: `useRouter`, `navigateTo`

## Estimated Files to Create

1. `app/modules/sessions/components/SidebarSessionItem.vue`
2. `app/modules/sessions/components/SidebarSessionItem.test.vue`
3. `app/modules/sessions/composables/useSidebarSessions.ts`
4. `app/modules/sessions/composables/useSidebarSessions.test.ts`
5. `app/modules/sessions/components/SidebarSessions.vue`
6. `app/modules/sessions/components/SidebarSessions.test.vue`
7. `app/modules/sessions/components/SidebarNewChat.vue`
8. `app/modules/sessions/components/SidebarNewChat.test.vue`
9. Updated `app/layouts/default.vue`
10. Updated `app/layouts/default.test.ts` (or created)
11. Updated `app/pages/index.vue`
12. Updated `app/pages/index.test.ts` (or created)

## Estimated Files to Modify

- `app/layouts/default.vue` - Add sidebar slot content
- `app/pages/index.vue` - Add sidebar template slots
- `app/pages/chat/[id].vue` - Add sidebar template slots (check if exists)

## Success Criteria

- [ ] Sidebar displays list of all previous chat sessions
- [ ] Current session is highlighted in sidebar
- [ ] Clicking a session navigates to that chat
- [ ] "New Chat" button in sidebar footer creates new session
- [ ] All components have passing unit tests
- [ ] Layout and pages have passing integration tests
- [ ] Dark mode styling works correctly
- [ ] Responsive design works on mobile and desktop
