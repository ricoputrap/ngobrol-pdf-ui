# Store Architecture Decision

## Overview

This document explains the state management architecture used in the Ngobrol PDF UI application.

## Decision: Direct Pinia Store Access

After careful consideration, we decided to use **Pinia stores directly** without composable wrappers for state management.

## Architecture

### Store Location
```
app/stores/
└── sessions.ts        # Global Pinia store for session management
```

### Usage in Components
```vue
<script setup>
import { useSessionsStore } from '~/app/stores/sessions';

const sessionStore = useSessionsStore();

// Access state
const sessions = sessionStore.sessions;
const isLoading = sessionStore.isLoading;

// Access getters
const hasSessions = sessionStore.hasSessions;
const sessionCount = sessionStore.sessionsCount;

// Call actions
await sessionStore.fetchSessions();
await sessionStore.createSession({ title: 'New Session' });
await sessionStore.deleteSession('session-id');
</script>
```

## Why Direct Store Access?

### 1. **Simplicity**
- One less abstraction layer to maintain
- Clearer code path: Component → Store → API
- Easier to understand for new developers

### 2. **Standard Pattern**
- Follows official Pinia documentation recommendations
- Widely adopted pattern in Vue 3 ecosystem
- Better IDE support and autocomplete

### 3. **Direct Benefits**
- Full TypeScript support out of the box
- Pinia devtools integration works perfectly
- Access to all store features (getters, actions, state)
- No need to maintain wrapper APIs

### 4. **Global State by Default**
- All components automatically share the same state
- No risk of creating isolated state instances
- Single source of truth guaranteed

## What We Avoided: Composable Wrapper

Initially considered creating a composable wrapper like:
```typescript
// ❌ Not used - adds unnecessary complexity
export const useSessions = () => {
  const store = useSessionsStore();
  return {
    sessions: computed(() => store.sessions),
    fetchSessions: store.fetchSessions,
    // ... wrapping all store properties
  };
};
```

### Why We Didn't Use This Pattern

1. **Unnecessary Abstraction**: The store already provides a clean API
2. **Maintenance Overhead**: Two places to update when adding features
3. **No Additional Value**: Doesn't add functionality, just indirection
4. **Potential Confusion**: Developers might wonder which to use

## When to Use Composable Wrappers

Composable wrappers around stores **are useful** when you need:

1. **Component-specific lifecycle logic**:
   ```typescript
   export const useAutoFetchSessions = () => {
     const store = useSessionsStore();
     
     onMounted(() => {
       if (!store.hasSessions) {
         store.fetchSessions();
       }
     });
     
     return store;
   };
   ```

2. **Combining multiple stores**:
   ```typescript
   export const useChatData = () => {
     const sessions = useSessionsStore();
     const messages = useMessagesStore();
     
     const currentChat = computed(() => ({
       session: sessions.currentSession,
       messages: messages.list,
     }));
     
     return { currentChat };
   };
   ```

3. **Adding computed properties specific to component needs**:
   ```typescript
   export const useSessionFilters = () => {
     const store = useSessionsStore();
     
     const sessionsWithPdf = computed(() => 
       store.sessions.filter(s => s.pdf_file_name !== null)
     );
     
     return { sessionsWithPdf, ...store };
   };
   ```

For this project, none of these cases apply to basic session management, so we use the store directly.

## Store Structure

### State
- `sessions: Session[]` - Array of all sessions
- `currentSession: GetSessionResponse | null` - Currently active session with messages
- `isLoading: boolean` - Loading state for async operations
- `error: string | null` - Error message if any operation fails

### Getters
- `getSessionById(id: string): Session | undefined` - Find session by ID
- `hasSessions: boolean` - Check if any sessions exist
- `sessionsCount: number` - Count of sessions

### Actions
- `fetchSessions(): Promise<Session[]>` - Fetch all sessions from API
- `createSession(request?: CreateSessionRequest): Promise<Session>` - Create new session
- `fetchSession(id: string): Promise<GetSessionResponse>` - Fetch single session with messages
- `deleteSession(id: string): Promise<boolean>` - Delete a session
- `uploadPdf(sessionId: string, file: File): Promise<{success: boolean, file_name: string}>` - Upload PDF to session
- `clearError(): void` - Clear error state
- `clearCurrentSession(): void` - Clear current session
- `$reset(): void` - Reset store to initial state

## Benefits Realized

1. **Centralized Business Logic**: All session operations in one place
2. **Consistent State Management**: Loading, error handling standardized
3. **Global Shared State**: All components see the same data
4. **Easy Testing**: Store can be tested independently
5. **TypeScript Support**: Full type safety throughout
6. **Devtools Integration**: Debug state changes easily

## Testing

The store is thoroughly tested with 27 tests covering:
- Initial state
- All getters (sessionById, hasSessions, sessionsCount)
- All actions (success and error cases)
- Loading state management
- State updates (local array sync, current session updates)
- Utility methods

Test file: `app/stores/__tests__/sessions.test.ts`

## Migration Notes

If moving from composable-based local state:
1. Replace `const { sessions } = useSessions()` with `const sessionStore = useSessionsStore()`
2. Access properties directly: `sessionStore.sessions` instead of `sessions.value`
3. Call actions directly: `sessionStore.fetchSessions()` instead of `fetchSessions()`

## Conclusion

Direct Pinia store access provides a simpler, more maintainable architecture for this application. The pattern is straightforward, well-documented, and provides all the features we need without unnecessary abstraction layers.
