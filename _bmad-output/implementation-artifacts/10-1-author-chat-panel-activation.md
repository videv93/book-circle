# Story 10.1: Author Chat Panel Activation

Status: done

## Story

As a user in a reading room,
I want a chat panel to appear when an author enters the room,
So that I know a live author interaction is happening.

## Acceptance Criteria

1. **Given** a user is in a reading room (`/book/[id]/room` or the reading room panel on book detail)
   **When** a verified author joins the room (detected via existing Pusher presence)
   **Then** a chat panel slides into view in the reading room UI
   **And** a server action creates an ephemeral Stream channel (ID: `author-chat-{bookId}-{sessionId}`)
   **And** the author is visually distinguished in the chat panel (author badge, shimmer styling) (FR50)

2. **Given** no author is present in the reading room
   **When** the user is in the room
   **Then** no chat panel is displayed
   **And** the reading room functions as before (presence only)

3. **Given** the Stream service is unavailable
   **When** an author joins the room
   **Then** a "Chat unavailable" message is shown in place of the chat panel (NFR9)
   **And** reading room presence continues to work normally via Pusher

## Tasks / Subtasks

- [x] Task 1: Create `createAuthorChatChannel` server action (AC: #1)
  - [x] 1.1 Create `src/actions/stream/createAuthorChatChannel.ts`
  - [x] 1.2 Use existing `getStreamServerClient()` from `src/lib/stream.ts`
  - [x] 1.3 Create ephemeral Stream channel with ID format `author-chat-{bookId}-{sessionId}`
  - [x] 1.4 Channel type: `messaging`
  - [x] 1.5 Add author as channel member with admin role
  - [x] 1.6 Return `ActionResult<{ channelId: string }>` following existing pattern
  - [x] 1.7 Generate `sessionId` using `crypto.randomUUID()` or `cuid()` for uniqueness
  - [x] 1.8 Write unit tests for auth/unauth/error paths

- [x] Task 2: Create `AuthorChatPanel` component (AC: #1, #2, #3)
  - [x] 2.1 Create `src/components/features/author-chat/AuthorChatPanel.tsx`
  - [x] 2.2 Props: `bookId: string`, `authorPresent: boolean`, `authorUserId?: string`, `authorName?: string`
  - [x] 2.3 When `authorPresent` becomes true: call `createAuthorChatChannel`, initialize Stream channel, render chat UI
  - [x] 2.4 Use `useChatClient()` hook from `src/components/features/discussions/useChatClient.ts` to access Stream client
  - [x] 2.5 Render Stream `<Channel>`, `<Window>`, `<MessageList>`, `<MessageInput>` inside panel
  - [x] 2.6 Apply slide-in animation using Framer Motion (respect `prefers-reduced-motion`)
  - [x] 2.7 When `authorPresent` is false: render nothing (AC #2)
  - [x] 2.8 Author messages distinguished with amber badge/shimmer (reuse `DiscussionMessage` factory pattern from `src/components/features/discussions/DiscussionMessage.tsx`)
  - [x] 2.9 Write tests for all states: no author, author present, stream unavailable

- [x] Task 3: Handle Stream unavailability gracefully (AC: #3)
  - [x] 3.1 If `createAuthorChatChannel` fails or `useChatClient()` returns null, show "Chat unavailable" message
  - [x] 3.2 Ensure reading room presence continues to work normally (Pusher is independent)
  - [x] 3.3 Add error boundary or try/catch around Stream operations

- [x] Task 4: Integrate `AuthorChatPanel` into `ReadingRoomPanel` (AC: #1, #2)
  - [x] 4.1 Import and render `AuthorChatPanel` inside `ReadingRoomPanel` (joined state only)
  - [x] 4.2 Pass `authorInRoom` state (already computed in ReadingRoomPanel line 228) as trigger
  - [x] 4.3 Pass `authorPresence.authorId` and `authorPresence.authorName` for author identification
  - [x] 4.4 Only render when `isJoined && authorInRoom`
  - [x] 4.5 Update existing tests to verify chat panel appears/disappears with author presence

- [x] Task 5: Create barrel export (AC: all)
  - [x] 5.1 Create `src/components/features/author-chat/index.ts` with exports

## Dev Notes

### Architecture Patterns & Constraints

**Stream Chat Integration (MUST follow):**
- Server client: Use `getStreamServerClient()` from `src/lib/stream.ts` (lazy singleton)
- Client access: Use `useChatClient()` from `src/components/features/discussions/useChatClient.ts` (returns `StreamChat | null`)
- Token generation: Already handled by `StreamChatProvider` in `src/components/features/stream/StreamChatProvider.tsx`
- Channel type: `messaging` (same as book discussions)
- Channel ID: `author-chat-{bookId}-{sessionId}` — ephemeral, unique per author visit

**Pusher Presence (already implemented, DO NOT modify):**
- Author join detection: `onAuthorJoin` callback in `usePresenceChannel` hook → triggers `handleAuthorJoin` in `ReadingRoomPanel`
- Author leave detection: `onAuthorLeave` callback → triggers `handleAuthorLeave`
- Author state: `authorPresence` state in `ReadingRoomPanel` (line 33) already tracks `isCurrentlyPresent`, `authorName`, `authorId`
- `authorInRoom` derived state (line 228) already indicates when author is present

**Server Action Pattern (MUST follow):**
```typescript
'use server';
export async function createAuthorChatChannel(bookId: string): Promise<ActionResult<{ channelId: string }>> {
  const { user } = await auth.api.getSession({ headers: await headers() });
  if (!user) return { success: false, error: 'Unauthorized' };
  // ... create channel
  return { success: true, data: { channelId } };
}
```

**Author Badge Styling (reuse existing):**
- Amber/gold color scheme: `text-amber-600 bg-amber-50` (from `DiscussionMessage.tsx`)
- Author shimmer: CSS variable `--author-shimmer` already defined in reading room
- Use `createDiscussionMessage(authorUserId)` factory pattern for chat messages

### Previous Story Intelligence (Epic 9)

**Critical learnings from Story 9.1-9.4:**
1. **Package naming**: `stream-chat` + `stream-chat-react` (NOT `@stream-io/stream-chat-react`)
2. **Lazy init**: Server client uses lazy init to prevent crashes on missing env vars
3. **Safe context hook**: `useChatClient()` returns `null` when unauthenticated — always null-check
4. **CSS conflicts**: Stream CSS v2 may conflict with Tailwind — scope overrides carefully
5. **Memoization**: Memoize `createDiscussionMessage` with `useMemo` to prevent re-renders
6. **Testing mocks**: Use `vi.hoisted()` for mock variable declarations
7. **Auth access**: `auth.api.getSession({ headers: await headers() })` — both imports required

**Existing files to reuse (DO NOT recreate):**
- `src/lib/stream.ts` — Stream server client
- `src/actions/stream/generateStreamToken.ts` — Token generation
- `src/actions/stream/index.ts` — Action barrel exports
- `src/components/features/stream/StreamChatProvider.tsx` — Client provider
- `src/components/features/discussions/useChatClient.ts` — Safe context hook
- `src/components/features/discussions/DiscussionMessage.tsx` — Author badge message factory

### Project Structure Notes

**New files to create:**
```
src/
├── actions/stream/
│   └── createAuthorChatChannel.ts       # NEW: Create ephemeral channel
└── components/features/
    └── author-chat/                     # NEW: Author chat feature
        ├── AuthorChatPanel.tsx           # Main chat panel component
        ├── AuthorChatPanel.test.tsx      # Component tests
        └── index.ts                     # Barrel exports
```

**Files to modify:**
```
src/components/features/presence/ReadingRoomPanel.tsx  # Add AuthorChatPanel integration
src/actions/stream/index.ts                            # Add createAuthorChatChannel export
```

### Key Implementation Details

- **Session ID generation**: Use `crypto.randomUUID()` in the server action to create unique session IDs for each author visit. This ensures a fresh channel every time.
- **Channel lifecycle**: This story only handles creation/display. Cleanup (deletion when author leaves) is Story 10.3.
- **Premium gating**: NOT in this story. Story 10.2 adds the premium/free user distinction. For now, all joined users can see and use the chat.
- **Framer Motion**: Already used in `PresenceAvatarStack.tsx` — follow same `prefers-reduced-motion` pattern with `AnimatePresence` and `motion.div`.

### References

- [Source: _bmad-output/planning-artifacts/epics-book-discussions-author-chat.md#Epic 10 Story 10.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Stream Chat SDK, Author Chat Channel]
- [Source: src/components/features/presence/ReadingRoomPanel.tsx — Author presence integration point]
- [Source: src/lib/stream.ts — Server client singleton]
- [Source: src/components/features/discussions/DiscussionMessage.tsx — Author badge pattern]
- [Source: src/components/features/discussions/useChatClient.ts — Safe context hook]

### Git Intelligence

Recent commits show Stream Chat SDK was set up in the latest commit (`e06fc2d`). Epic 9 stories 9.2-9.4 are implemented but some are still in review status. The codebase is stable with all established patterns in place.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Task 1: Created `createAuthorChatChannel` server action with auth check, `crypto.randomUUID()` session ID, ephemeral `messaging` channel creation. 3 unit tests (unauth, success, stream error).
- Task 2: Created `AuthorChatPanel` component with Stream `Channel`/`MessageList`/`MessageInput`, Framer Motion slide-in animation (respects `prefers-reduced-motion`), `useChatClient()` null-check, author badge via `createDiscussionMessage` factory. 7 component tests.
- Task 3: Graceful Stream unavailability handled inline in `AuthorChatPanel` — shows "Chat unavailable" when `useChatClient()` returns null or channel creation fails. Pusher presence is independent and unaffected.
- Task 4: Integrated `AuthorChatPanel` into `ReadingRoomPanel` joined state, conditional on `authorInRoom`. Added mock to existing 38 ReadingRoomPanel tests — all pass.
- Task 5: Created barrel export `index.ts`.
- All 56 story-related tests pass. TypeScript typecheck clean. Pre-existing failures in 3 unrelated test files (admin, etc.) confirmed not caused by this story.

### Change Log

- 2026-02-13: Implemented Story 10.1 — Author Chat Panel Activation (all 5 tasks)
- 2026-02-13: Code review fixes — added author as channel member with admin role, channel deduplication on reconnect, bookId input validation, removed redundant outer guard, added chat panel integration test assertions, removed duplicate CSS import

### File List

New:
- src/actions/stream/createAuthorChatChannel.ts
- src/actions/stream/createAuthorChatChannel.test.ts
- src/components/features/author-chat/AuthorChatPanel.tsx
- src/components/features/author-chat/AuthorChatPanel.test.tsx
- src/components/features/author-chat/index.ts

Modified:
- src/actions/stream/index.ts
- src/components/features/presence/ReadingRoomPanel.tsx
- src/components/features/presence/ReadingRoomPanel.test.tsx
