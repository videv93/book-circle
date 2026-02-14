# Story 9.3: Create Discussion Posts & Threaded Replies

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a reader,
I want to post in a book's discussion and reply to other posts,
so that I can share my thoughts and engage in conversation about the book.

## Acceptance Criteria

1. **Given** an authenticated user (free or premium) viewing a book discussion **When** they type in the message composer and submit **Then** a new discussion post is created in the Stream channel **And** the post appears immediately in the thread **And** the post displays the user's name, avatar, and timestamp (FR45)

2. **Given** an authenticated user viewing an existing discussion post **When** they click "Reply" **Then** a threaded reply interface opens (Stream's built-in threading) **And** they can type and submit a reply to that specific post (FR42) **And** the reply count is shown on the parent message

3. **Given** an unauthenticated user viewing a discussion **When** they attempt to post or reply **Then** they are prompted to log in

4. **Given** a user submits a post **When** the message is processed **Then** Stream's built-in content sanitization is applied (NFR10)

## Tasks / Subtasks

- [x] Task 1: Add `<MessageInput>` to `BookDiscussion` for authenticated users (AC: #1, #3)
  - [x] Import `MessageInput` from `stream-chat-react`
  - [x] Conditionally render `<MessageInput />` inside `<Window>` below `<MessageList />` when user is authenticated (`client` is not null)
  - [x] When unauthenticated, render a login prompt CTA below the message list (link to `/login?callbackUrl=<current-path>`)
  - [x] Ensure message input is mobile-friendly (min 44px touch target)

- [x] Task 2: Add `<Thread>` component for threaded replies (AC: #2)
  - [x] Import `Thread` from `stream-chat-react`
  - [x] Add `<Thread />` as sibling to `<Window>` inside the `<Channel>` wrapper
  - [x] Stream's `<MessageList>` already renders reply counts and "Reply" buttons by default — verify this works with the existing `DiscussionMessage` custom component
  - [x] Ensure `<Thread />` renders correctly on mobile (may need height/overflow styling)

- [x] Task 3: Style message input and thread to match app design (AC: #1, #2)
  - [x] Ensure Stream CSS v2 (already imported in BookDiscussion) styles the input and thread
  - [x] Add Tailwind overrides if needed to match warm hearth color palette
  - [x] Verify reply button, thread panel, and input are accessible (keyboard nav, ARIA)

- [x] Task 4: Write tests (AC: #1, #2, #3)
  - [x] Test `BookDiscussion` renders `MessageInput` when authenticated
  - [x] Test `BookDiscussion` renders login prompt when unauthenticated
  - [x] Test `Thread` component is rendered inside `Channel`
  - [x] Co-locate tests in `src/components/features/discussions/BookDiscussion.test.tsx` (extend existing)

## Dev Notes

### Architecture Patterns & Constraints

- **Stream Chat React handles everything**: `<MessageInput>` handles message creation, sending, and real-time updates. `<Thread>` handles threaded replies. No custom server actions needed for posting.
- **No new server actions**: Stream SDK client-side handles message send via the connected channel — no server action needed for creating posts or replies.
- **No new Prisma models**: Stream handles all discussion data storage.
- **Discussions are open to ALL users** (free + premium): No premium gating (FR43).
- **Import alias**: Always use `@/` for cross-boundary imports.

### Stream Chat React Components — Key API for This Story

**Message Input:**
```typescript
import { Channel, MessageList, MessageInput, Thread, Window } from 'stream-chat-react';

// Inside <Channel channel={channel}>:
<Window>
  <MessageList />
  <MessageInput />  // ← NEW: add this for posting
</Window>
<Thread />          // ← NEW: add this for threaded replies
```

- `<MessageInput />` — renders a composer with send button, handles message creation automatically
- `<Thread />` — renders threaded reply panel when user clicks "Reply" on a message; Stream handles opening/closing thread view
- Both components get channel context from the parent `<Channel>` component
- Content sanitization (NFR10) is handled server-side by Stream — no client config needed

**Threading behavior:**
- `<MessageList />` automatically shows reply counts on messages with threads
- Clicking a message's reply button opens `<Thread />` panel
- `<Thread />` includes its own `MessageList` and `MessageInput` for the thread
- No custom reply logic needed — Stream handles it all

### Unauthenticated User Handling

From Story 9.2: when user is unauthenticated, `StreamChatProvider` renders children WITHOUT `<Chat>` wrapper → `useChatClient()` returns null. The current `BookDiscussion` already handles this with an error/unavailable state.

**For this story**: Modify the unauthenticated flow to show a login prompt instead of hiding everything:
- When `client` is null, still show the discussion heading
- Display a "Log in to join the discussion" CTA with link to `/login`
- The `<MessageList>` requires a connected client, so messages won't render for unauthenticated users (this is acceptable — they can see the section exists but need to log in)

### Previous Story (9.2) Intelligence

Key implementation details from Story 9.2:
- **Package**: `stream-chat-react` (NOT `@stream-io/stream-chat-react`)
- **BookDiscussion component**: `src/components/features/discussions/BookDiscussion.tsx` — currently renders `<Channel>` with `<Window>` containing `<MessageList />` only
- **DiscussionMessage**: Custom message component with author badge — uses `createDiscussionMessage(authorUserId)` factory, passed as `Message` prop to `<Channel>`
- **useChatClient hook**: `src/components/features/discussions/useChatClient.ts` — returns `StreamChat | null`
- **Stream CSS v2**: Already imported in `BookDiscussion.tsx`
- **Channel init**: `getBookChannel` server action ensures channel exists, then client watches `client.channel('messaging', channelId)`
- **Test mocks**: `BookDetail.test.tsx` mocks `@/components/features/discussions` — existing mock may need updating if exports change
- **Debug finding**: `name` property not valid on Stream's `ChannelData` type — don't add custom metadata to channels
- **authorUserId**: Added to `BookDetailData` interface in Story 9.2, populated from `AuthorClaim`

### File Changes Summary

Files to modify:
```
src/components/features/discussions/BookDiscussion.tsx    # Add MessageInput + Thread + login prompt
src/components/features/discussions/BookDiscussion.test.tsx  # Extend with new test cases
```

No new files needed — this story extends existing components.

### Key Gotchas & Warnings

1. **DO NOT create custom message sending logic** — `<MessageInput>` handles everything
2. **DO NOT create custom threading logic** — `<Thread>` handles everything
3. **DO NOT implement sorting** — That is Story 9.4
4. **DO NOT add server actions for posting** — Stream client handles sends
5. **Verify `DiscussionMessage` (custom Message component) works with Thread** — Thread uses the same Message component by default, so author badge should appear in threads too
6. **Thread panel sizing on mobile** — May need `max-h-[50vh] overflow-y-auto` or similar to prevent thread from pushing content off-screen
7. **Login prompt link** — Use `usePathname()` from `next/navigation` to get current URL for `callbackUrl`

### References

- [Source: _bmad-output/planning-artifacts/epics-book-discussions-author-chat.md#Story 9.3]
- [Source: _bmad-output/implementation-artifacts/9-2-book-discussion-thread-display.md — Previous story full reference]
- [Source: src/components/features/discussions/BookDiscussion.tsx — Primary file to modify]
- [Source: src/components/features/discussions/DiscussionMessage.tsx — Custom message component (verify thread compat)]
- [Source: src/components/features/discussions/useChatClient.ts — Chat client hook]
- [Source: Stream Chat React Docs — MessageInput: https://getstream.io/chat/docs/sdk/react/components/core-components/message_input/]
- [Source: Stream Chat React Docs — Thread: https://getstream.io/chat/docs/sdk/react/components/core-components/thread/]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- No issues encountered — Stream Chat React components (`MessageInput`, `Thread`) integrated cleanly with existing `Channel` wrapper

### Completion Notes List

- Added `<MessageInput />` inside `<Window>` below `<MessageList />` for authenticated users to create discussion posts (AC #1)
- Added `<Thread />` as sibling to `<Window>` inside `<Channel>` for threaded replies (AC #2) — Stream handles reply counts, thread opening/closing, and nested message input automatically
- Replaced unauthenticated error state with a login prompt CTA linking to `/login?callbackUrl=<current-path>` using `usePathname()` (AC #3)
- Login prompt button has `min-h-[44px]` for mobile touch target accessibility
- Content sanitization handled by Stream server-side (AC #4) — no client config needed
- Stream CSS v2 already imported from Story 9.2 — styles MessageInput and Thread automatically
- Updated 2 existing tests, added assertions for `message-input`, `stream-thread`, and login prompt with correct callbackUrl
- 5 tests passing, 194/195 test files passing (1 pre-existing failure in admin/getSessionHistory unrelated to this story)

### File List

- `src/components/features/discussions/BookDiscussion.tsx` (modified) — Added MessageInput, Thread, login prompt, useMemo for CustomMessage, aria-label
- `src/components/features/discussions/BookDiscussion.test.tsx` (modified) — Updated mocks and assertions for new components, added negative assertion for unauthenticated
- `src/components/features/discussions/DiscussionMessage.tsx` (modified) — Removed unused DiscussionMessageProps interface

### Change Log

- 2026-02-13: Implemented Story 9.3 — Added discussion post creation via `<MessageInput>`, threaded replies via `<Thread>`, and unauthenticated login prompt CTA
- 2026-02-13: Code review fixes — Memoized CustomMessage factory (H1), added negative test assertion for unauthenticated (M1), removed dead interface (M2), added aria-label (M3)

## Senior Developer Review (AI)

### Review Date: 2026-02-13

### Review Outcome: Approve (after fixes)

### Action Items

- [x] [H1] Memoize `createDiscussionMessage` with `useMemo` to prevent re-creation on every render (BookDiscussion.tsx:23)
- [x] [M1] Add assertion that `message-input` is NOT rendered when unauthenticated (BookDiscussion.test.tsx)
- [x] [M2] Remove unused `DiscussionMessageProps` interface (DiscussionMessage.tsx:5-7)
- [x] [M3] Add `aria-label` to login prompt link for accessibility (BookDiscussion.tsx:101)
- [ ] [L1] Thread component rendered unconditionally — cosmetic, no functional impact
- [ ] [L2] Unused `mockChannel` variable in tests — cosmetic
