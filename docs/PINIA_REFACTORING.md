# Pinia Store Refactoring Documentation

## Overview

This document describes the refactoring of the `useSessions` composable from a local state management approach to a global Pinia store-based architecture.

## Motivation

The original `useSessions` composable used local refs that were created per composable invocation. This meant:

- **State was not shared**: Each component calling `useSessions()` got its own isolated state
- **Data duplication**: Multiple components fetching the same data would create duplicate requests
- **No single source of truth**: State could become inconsistent across components

By refactoring to Pinia, we achieve:

- **Global shared state**: All components access the same store instance
- **Single source of truth**: Session data is centralized and consistent
- **Better scalability**: Easier to add features like caching, optimistic updates, etc.
- **Enhanced developer experience**: Pinia devtools integration for debugging

## Changes Made

### 1. Created Pinia Store (`app/stores/sessions.ts`)

**Location**: `app/stores/sessions.ts`

**Key Features**:
- **State**: Reactive state for sessions, currentSession, isLoading, and error
- **Getters**: Computed properties for derived state
  - `getSessionById(id)`: Find a session by ID
  - `hasSessions`: Boolean indicating if any sessions exist
  - `sessionsCount`: Count of sessions
- **Actions**: All async operations and state mutations
  - `fetchSessions()`: Fetch all sessions
  - `createSession(request)`: Create a new session
  - `fetchSession(id)`: Fetch a single session with messages
  - `deleteSession(id)`: Delete a session
  - `uploadPdf(sessionId, file)`: Upload a PDF to a session
  - `clearError()`: Clear error state
  - `clearCurrentSession()`: Clear current session
  - `$reset()`: Reset store to initial state

### 2. Refactored Composable (`app/modules/sessions/composables/useSessions.ts`)

The composable is now a thin convenience wrapper around the Pinia store:

```typescript
export const useSessions = () => {
  const store = useSessionsStore();

  return {
    // State (computed from store)
    sessions: computed(() => store.sessions),
    currentSession: computed(() => store.currentSession),
    isLoading: computed(() => store.isLoading),
    error: computed(() => store.error),

    // Getters
    getSessionById: (id: string) => store.getSessionById(id),
    hasSessions: computed(() => store.hasSessions),
    sessionsCount: computed(() => store.sessionsCount),

    // Actions
    fetchSessions: store.fetchSessions,
    createSession: store.createSession,
    fetchSession: store.fetchSession,
    deleteSession: store.deleteSession,
    uploadPdf: store.uploadPdf,
    clearError: store.clearError,
    clearCurrentSession: store.clearCurrentSession,
  };
};
```

**Why keep the composable?**:
- Provides a familiar API for existing/future components
- Can add component-specific logic if needed (e.g., auto-fetch on mount)
- Allows gradual migration if we had existing components using the old API

### 3. Updated Tests

#### Store Tests (`app/stores/__tests__/sessions.test.ts`)
- **27 comprehensive tests** covering:
  - Initial state
  - All getters
  - All actions (success and error cases)
  - Loading state management
  - Utility methods
  - Store reset functionality

#### Composable Tests (`app/modules/sessions/composables/__tests__/useSessions.test.ts`)
- **19 tests** covering:
  - Exposure of store state as computed properties
  - Exposure of store getters
  - All API operations
  - Error handling
  - State updates

### 4. Configuration Updates

#### Vitest Config (`vitest.config.ts`)
Added path alias resolution for the `~` alias to properly resolve imports in tests:

```typescript
resolve: {
  alias: {
    "~": path.resolve(__dirname, "."),
    "~~": path.resolve(__dirname, "."),
    "@": path.resolve(__dirname, "."),
    "@@": path.resolve(__dirname, "."),
  },
},
```

## Usage Examples

### In a Component (Options API)

```vue
<script>
export default {
  setup() {
    const { sessions, fetchSessions, createSession } = useSessions();
    return { sessions, fetchSessions, createSession };
  },
  async mounted() {
    await this.fetchSessions();
  },
}
</script>
```

### In a Component (Composition API)

```vue
<script setup>
const { 
  sessions, 
  isLoading, 
  error,
  fetchSessions, 
  createSession 
} = useSessions();

onMounted(async () => {
  await fetchSessions();
});

const handleCreateSession = async () => {
  try {
    await createSession({ title: 'New Session' });
  } catch (err) {
    console.error('Failed to create session:', err);
  }
};
</script>
```

### Direct Store Access (Advanced)

For cases where you need direct store access (e.g., in server middleware, plugins):

```typescript
import { useSessionsStore } from '~/app/stores/sessions';

const store = useSessionsStore();
await store.fetchSessions();
```

## Benefits Realized

1. **Shared State**: All components now see the same session data
2. **Performance**: No duplicate API calls when multiple components mount
3. **Consistency**: Single source of truth prevents state sync issues
4. **Developer Experience**: 
   - Pinia devtools for debugging
   - Clear separation of concerns
   - TypeScript support throughout
5. **Testability**: Both store and composable are easily testable in isolation
6. **Maintainability**: Centralized business logic makes updates easier

## Test Results

All tests pass successfully:

```
✓ app/stores/__tests__/sessions.test.ts (27 tests)
✓ app/modules/sessions/composables/__tests__/useSessions.test.ts (19 tests)
```

Total: **118 tests passed** across the entire project.

## Migration Notes

### For Future Components

- Use `useSessions()` composable for easy access
- Or use `useSessionsStore()` directly for advanced scenarios
- All state is now reactive and shared globally

### Backward Compatibility

The composable API remains identical to the original implementation, ensuring any future components using the old API will work without changes.

## Next Steps

With global state management in place, the project is ready for:
1. Building UI components (SessionList, SessionItem, etc.)
2. Adding real-time updates (WebSocket/SSE integration)
3. Implementing optimistic UI updates
4. Adding state persistence (localStorage, etc.)
5. Expanding to other feature stores (messages, settings, etc.)

## Related Files

- Store: `app/stores/sessions.ts`
- Store Tests: `app/stores/__tests__/sessions.test.ts`
- Composable: `app/modules/sessions/composables/useSessions.ts`
- Composable Tests: `app/modules/sessions/composables/__tests__/useSessions.test.ts`
- Types: `app/modules/sessions/types.ts`
- Vitest Config: `vitest.config.ts`
