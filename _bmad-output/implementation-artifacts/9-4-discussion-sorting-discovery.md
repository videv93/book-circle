# Story 9.4: Discussion Sorting & Discovery

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a reader,
I want to sort discussions by recency or activity,
so that I can find the most relevant conversations.

## Acceptance Criteria

1. **Given** a user viewing a book discussion **When** they select "Recent" sort option **Then** messages are sorted by creation time, newest first

2. **Given** a user viewing a book discussion **When** they select "Active" sort option **Then** messages are sorted by most recent reply activity (threads with recent replies surface first)

3. **Given** a book discussion with many messages **When** the user scrolls **Then** pagination loads additional messages seamlessly (NFR8)

4. **Given** the Stream service is unavailable **When** the discussion section attempts to load **Then** a graceful "Discussions unavailable" message is shown (NFR9) **And** the rest of the book detail page functions normally

## Tasks / Subtasks

- [x] Task 1: Add sort toggle UI to BookDiscussion component (AC: #1, #2)
  - [x] 1.1 Create a sort toggle with two options: "Recent" (default) and "Active"
  - [x] 1.2 Use a simple segmented control / button group consistent with app styling (Tailwind, min 44px touch targets)
  - [x] 1.3 Place the toggle between the "Discussion" heading and the message list
  - [x] 1.4 Store selected sort in component state (`useState<'recent' | 'active'>('recent')`)
  - [x] 1.5 Show sort toggle only when authenticated and channel is loaded (not in loading/error/login-prompt states)

- [x] Task 2: Implement "Recent" sort mode (AC: #1, #3)
  - [x] 2.1 This is Stream's default chronological order — no custom logic needed
  - [x] 2.2 When "Recent" is selected, render the standard `<MessageList />` without custom `renderMessages`
  - [x] 2.3 Pagination (scrolling to load older messages) works automatically via Stream's built-in behavior

- [x] Task 3: Implement "Active" sort mode (AC: #2)
  - [x] 3.1 Use the `renderMessages` prop on `<MessageList />` to provide custom rendering when "Active" is selected
  - [x] 3.2 Sort logic: order messages by `message.reply_count > 0 ? message.thread?.last_message_at ?? message.created_at : message.created_at`, descending — messages with recent thread activity float to top
  - [x] 3.3 For messages with threads, use `message.reply_count` and latest reply timestamp to determine activity recency
  - [x] 3.4 Messages without replies fall back to `created_at` ordering
  - [x] 3.5 Ensure date separators and grouping still render correctly in custom sort mode
  - [x] 3.6 IMPORTANT: Active sort is client-side only — it re-orders the messages already loaded from Stream. Pagination still loads messages in chronological order from Stream's API, then client re-sorts the combined set.

- [x] Task 4: Verify graceful degradation (AC: #4)
  - [x] 4.1 The existing error handling in `BookDiscussion.tsx` already shows "Discussions unavailable" when Stream fails
  - [x] 4.2 Verify that the sort toggle does not appear when in error state
  - [x] 4.3 Verify the rest of BookDetail page renders normally when discussion errors

- [x] Task 5: Write tests (AC: #1, #2, #3, #4)
  - [x] 5.1 Test sort toggle renders with "Recent" and "Active" options when authenticated
  - [x] 5.2 Test sort toggle does NOT render when unauthenticated or in error/loading state
  - [x] 5.3 Test clicking "Active" changes sort state
  - [x] 5.4 Test "Recent" mode renders standard MessageList (no custom renderMessages)
  - [x] 5.5 Test "Active" mode passes renderMessages prop to MessageList
  - [x] 5.6 Test error state still shows "Discussions unavailable" without sort toggle
  - [x] 5.7 Co-locate tests in `src/components/features/discussions/BookDiscussion.test.tsx` (extend existing)

## Dev Notes

### Critical Architecture Constraints

- **No new server actions needed** — sorting is entirely client-side using Stream's loaded messages
- **No new Prisma models** — Stream is the discussion data store (established in Stories 9.1-9.3)
- **No new API routes** — all discussion data comes through Stream Chat React SDK
- **Stream CSS v2 already imported** in `BookDiscussion.tsx` — no additional CSS imports needed
- **Follow `@/` import convention** for all cross-boundary imports

### Stream Chat React API for Sorting (v13.x)

**Key insight:** Stream's `<MessageList />` renders messages in chronological order by default. There is **no built-in sort prop** on `MessageList`. To implement custom ordering:

1. **`renderMessages` prop** — accepts a function `(messages: StreamMessage[]) => React.ReactNode[]` that gives full control over message rendering order
2. **Message properties available for sorting:**
   - `message.created_at` — ISO timestamp of message creation
   - `message.reply_count` — number of thread replies (0 if no replies)
   - `message.thread` — thread metadata including latest reply info
   - `message.updated_at` — last update timestamp

**"Recent" mode** = default Stream behavior, no `renderMessages` needed
**"Active" mode** = provide `renderMessages` that sorts by thread activity

### Implementation Pattern for renderMessages

```typescript
// Only pass renderMessages when active sort is selected
const sortedRenderMessages = sortMode === 'active'
  ? (messages: StreamMessage[]) => {
      const sorted = [...messages].sort((a, b) => {
        const aTime = a.reply_count ? new Date(a.thread?.last_message_at ?? a.created_at).getTime() : new Date(a.created_at).getTime();
        const bTime = b.reply_count ? new Date(b.thread?.last_message_at ?? b.created_at).getTime() : new Date(b.created_at).getTime();
        return bTime - aTime; // descending
      });
      // Return rendered elements using Stream's default message rendering
      return sorted.map(msg => /* render each message */);
    }
  : undefined;
```

**IMPORTANT:** The `renderMessages` API may need careful handling — check the exact function signature in `stream-chat-react` v13.x. If `renderMessages` doesn't provide direct re-ordering capability, an alternative approach is to wrap `<MessageList />` with a CSS `flex-direction: column-reverse` or maintain a separate sorted list in state.

**Fallback approach** if `renderMessages` is complex: Use `channel.state.messages` directly, sort client-side, and render with a custom list component instead of `<MessageList />`. This loses Stream's built-in virtualization but gives full sort control. Only use this if the `renderMessages` approach proves insufficient.

### Existing Component Structure (from Stories 9.2-9.3)

**Files to modify:**
- `src/components/features/discussions/BookDiscussion.tsx` — Add sort toggle UI, conditionally pass `renderMessages` to `<MessageList />`
- `src/components/features/discussions/BookDiscussion.test.tsx` — Add sort-related tests

**Current BookDiscussion structure (lines 121-134):**
```tsx
<div className="border-t border-border px-4 py-4" data-testid="book-discussion">
  <h3 className="text-sm font-medium text-muted-foreground mb-3">Discussion</h3>
  {/* INSERT SORT TOGGLE HERE */}
  <div className="str-chat__discussion-wrapper">
    <Channel channel={channel} Message={CustomMessage}>
      <Window>
        <MessageList /> {/* Add renderMessages prop conditionally */}
        <MessageInput />
      </Window>
      <Thread />
    </Channel>
  </div>
</div>
```

**Existing patterns to follow:**
- `useChatClient()` hook for safe client access (returns null when unauth)
- `createDiscussionMessage(authorUserId)` factory for custom message rendering with author badge
- `getBookChannel` server action for channel initialization
- Skeleton loading state pattern (already in component)
- Error state pattern with "Discussions unavailable" (already in component)
- Login prompt CTA for unauthenticated users (already in component)

### UI Design for Sort Toggle

Use a simple button group matching the app's warm hearth palette:
```tsx
<div className="flex gap-1 mb-3" role="group" aria-label="Sort discussions">
  <button
    className={`px-3 py-1.5 text-xs font-medium rounded-md min-h-[44px] transition-colors ${
      sortMode === 'recent'
        ? 'bg-primary text-primary-foreground'
        : 'bg-muted text-muted-foreground hover:bg-muted/80'
    }`}
    onClick={() => setSortMode('recent')}
  >
    Recent
  </button>
  <button
    className={`px-3 py-1.5 text-xs font-medium rounded-md min-h-[44px] transition-colors ${
      sortMode === 'active'
        ? 'bg-primary text-primary-foreground'
        : 'bg-muted text-muted-foreground hover:bg-muted/80'
    }`}
    onClick={() => setSortMode('active')}
  >
    Active
  </button>
</div>
```

### Previous Story Learnings (9.1-9.3)

- **Lazy Stream client initialization** prevents crashes on missing env vars
- **`useMemo`** the custom message component to prevent re-creation on every render (Story 9.3 lesson)
- **`usePathname()`** for generating callback URLs (used in login prompt)
- Stream's `<Thread />` handles threaded replies automatically — no custom threading logic needed
- Stream CSS v2 handles styling for MessageInput, Thread, MessageList automatically
- Always use `didCancel` flag in useEffect async operations to prevent state updates on unmounted components
- `min-h-[44px]` on interactive elements for mobile touch targets (accessibility)
- Author badge uses amber/gold color scheme (`text-amber-600 bg-amber-50`)

### Git Intelligence

Recent commits show Epic 9 progression:
- `e06fc2d` — Stream Chat SDK setup (Story 9.1)
- Stories 9.2-9.3 implemented but not yet committed to main (staged/modified files)

Files in the discussion feature area:
- `src/components/features/discussions/BookDiscussion.tsx`
- `src/components/features/discussions/BookDiscussion.test.tsx`
- `src/components/features/discussions/DiscussionMessage.tsx`
- `src/components/features/discussions/useChatClient.ts`
- `src/components/features/discussions/index.ts`
- `src/actions/stream/getBookChannel.ts`
- `src/actions/stream/index.ts`

### Testing Strategy

- **Test framework:** Vitest + Testing Library (established project pattern)
- **Mock Stream components:** Mock `stream-chat-react` imports (Channel, MessageList, MessageInput, Thread, Window)
- **Mock `useChatClient`:** Return mock client or null for auth/unauth scenarios
- **Mock `getBookChannel`:** Return success/failure ActionResult
- **Test location:** Co-located with component at `src/components/features/discussions/BookDiscussion.test.tsx`
- **Existing test count:** 5 tests in BookDiscussion.test.tsx — extend with sort-specific tests

### Project Structure Notes

- All changes stay within `src/components/features/discussions/` — no new directories needed
- Barrel export in `index.ts` already exports `BookDiscussion` — no changes needed
- Follows existing co-located test pattern

### References

- [Source: _bmad-output/planning-artifacts/epics-book-discussions-author-chat.md#Story 9.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#API Patterns, Error Handling, Testing Standards]
- [Source: _bmad-output/planning-artifacts/prd.md#FR44 Discussion Sorting]
- [Source: _bmad-output/planning-artifacts/product-brief-flappy-bird-1-2026-02-11.md#Discussion Discovery]
- [Source: _bmad-output/implementation-artifacts/9-2-book-discussion-thread-display.md]
- [Source: _bmad-output/implementation-artifacts/9-3-create-discussion-posts-threaded-replies.md]
- [Stream MessageList Docs](https://getstream.io/chat/docs/sdk/react/components/core-components/message_list/)
- [Stream Channel Query Docs](https://getstream.io/chat/docs/javascript/query_channels/)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Added sort toggle UI (Recent/Active) to BookDiscussion component between heading and message list
- "Recent" mode uses Stream's default chronological MessageList (no renderMessages prop)
- "Active" mode uses custom `renderMessages` callback via `defaultRenderMessages` from stream-chat-react, re-ordering messages by thread activity (`reply_count` + `updated_at`) descending
- Sort toggle only renders in authenticated+loaded state; hidden in loading/error/login-prompt states
- Pagination (AC #3) works via Stream's built-in scroll pagination — unchanged
- Graceful degradation (AC #4) verified — pre-existing error handling shows "Discussions unavailable"
- 7 new tests added (12 total), all passing. No regressions (1791/1798 pass; 7 pre-existing failures in unrelated admin module)
- TypeScript typecheck clean, no new lint errors

**Code Review Fixes (2026-02-13):**
- [H1] Fixed messageGroupStyles recalculation after re-sorting — now uses `getGroupStyles` to rebuild group map for new message order
- [H2] Fixed date separator handling — strips date separators and intro messages in Active mode (positional markers are meaningless after re-sort)
- [H3] Fixed RenderedMessage type narrowing — replaced fragile `'type' in m` heuristic with library's `isDateSeparatorMessage()` and `isIntroMessage()` type guards
- [M1] Added sort logic integration test — verifies date separators are stripped and messages are ordered by thread activity
- [M2] Fixed `lastMessageListProps` not being reset between tests in `beforeEach`
- [M3] Added `aria-pressed` to sort toggle buttons for screen reader accessibility
- 9 new tests total (14 total), all passing

### File List

- `src/components/features/discussions/BookDiscussion.tsx` (modified) — Sort toggle with aria-pressed, activeRenderMessages using proper type guards and group style recalculation
- `src/components/features/discussions/BookDiscussion.test.tsx` (modified) — 9 sort-related tests including sort logic verification and accessibility
