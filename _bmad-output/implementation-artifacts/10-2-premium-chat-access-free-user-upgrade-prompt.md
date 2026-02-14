# Story 10.2: Premium Chat Access & Free User Upgrade Prompt

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a premium user,
I want to chat with the author in real-time,
So that I can interact directly with the person who wrote the book I'm reading.

As a free user,
I want to see a premium upgrade prompt when an author chat is active,
So that I understand the value of upgrading and can do so easily.

## Acceptance Criteria

1. **Given** a premium user is in a reading room where an author is present **When** the chat panel is active **Then** the user can see all chat messages and type and send messages in real-time with delivery within 1 second (NFR7)

2. **Given** a free user is in a reading room where an author is present **When** the chat panel activates **Then** the user sees a blurred/locked chat panel with a premium upgrade prompt explaining "Chat with the author — Premium feature" and a CTA button linking to the existing premium upgrade flow (Epic 7/8), and the free user cannot see or send chat messages (FR52)

3. **Given** a free user upgrades to premium during an active author chat session **When** their premium status is confirmed **Then** the chat panel unlocks and they can participate immediately

## Tasks / Subtasks

- [x] Task 1: Add premium status check to AuthorChatPanel (AC: #1, #2)
  - [x] 1.1 Create server action `getAuthorChatAccess()` that returns `{ isPremium: boolean }` — checks premium status server-side
  - [x] 1.2 Update `AuthorChatPanel` to fetch premium status internally via useEffect
  - [x] 1.3 Conditionally render full chat UI (premium) vs locked overlay (free)

- [x] Task 2: Build locked/blurred chat overlay for free users (AC: #2)
  - [x] 2.1 Create `AuthorChatLockedOverlay` component inside `src/components/features/author-chat/`
  - [x] 2.2 Implement blurred background effect with fake chat lines and backdrop-blur overlay
  - [x] 2.3 Add "Chat with the author — Premium feature" headline with golden accent styling
  - [x] 2.4 Add CTA button "Upgrade to Premium" linking to `/upgrade` with 44px min touch target
  - [x] 2.5 Ensure free users cannot access message content or input — no Stream channel connection for free users

- [x] Task 3: Handle mid-session premium upgrade (AC: #3)
  - [x] 3.1 Add polling (30s interval) + window focus event to detect premium status change
  - [x] 3.2 On upgrade detection, transition from locked overlay to full chat UI without page reload
  - [x] 3.3 Connect to Stream channel and load current messages upon unlock

- [x] Task 4: Pass premium status from ReadingRoomPanel to AuthorChatPanel (AC: #1, #2)
  - [x] 4.1 Premium status is fetched internally by AuthorChatPanel — no ReadingRoomPanel changes needed
  - [x] 4.2 AuthorChatPanel handles premium gating self-contained

- [x] Task 5: Write tests (AC: #1, #2, #3)
  - [x] 5.1 Unit tests for `AuthorChatLockedOverlay` — 7 tests (renders prompt, CTA links to /upgrade, accessibility)
  - [x] 5.2 Update `AuthorChatPanel` tests — 10 tests (premium/free paths, loading, errors)
  - [x] 5.3 Test mid-session upgrade transition (focus event triggers unlock)
  - [x] 5.4 ReadingRoomPanel tests verified — 38 tests pass with zero regressions
  - [x] 5.5 Accessibility tests — screen reader status, aria-hidden decorative elements, 44px touch targets

## Dev Notes

### Architecture Patterns & Constraints

- **Premium check:** Use `isPremium(userId)` from `src/lib/premium.ts` — single source of truth (server-side)
- **DO NOT** connect free users to Stream Chat channel — no `channel.watch()` or token generation for non-premium users in author chat context
- **Upgrade flow:** Link CTA to `/upgrade` page (Polar checkout, $9.99 one-time) — already implemented in Epic 7/8
- **Stream Chat:** Use existing `useChatClient()` hook from `src/components/features/discussions/useChatClient.ts`
- **Channel creation:** Reuse `createAuthorChatChannel` from `src/actions/stream/createAuthorChatChannel.ts`
- **Styling:** Follow amber/gold author theme established in story 10-1 (`text-amber-600`, `bg-amber-50`, `--author-shimmer`)

### Key Existing Files (DO NOT RECREATE)

| File | Purpose |
|------|---------|
| `src/lib/premium.ts` | `isPremium(userId)` server-side check |
| `src/lib/stream.ts` | Stream server client singleton |
| `src/actions/stream/createAuthorChatChannel.ts` | Ephemeral channel creation |
| `src/actions/stream/generateStreamToken.ts` | User token generation |
| `src/components/features/author-chat/AuthorChatPanel.tsx` | Main chat panel (MODIFY) |
| `src/components/features/author-chat/index.ts` | Barrel exports (UPDATE) |
| `src/components/features/presence/ReadingRoomPanel.tsx` | Integration point (MODIFY) |
| `src/components/features/stream/StreamChatProvider.tsx` | Chat client provider |
| `src/components/features/discussions/useChatClient.ts` | Safe chat client hook |
| `src/components/features/books/UpgradePromptDialog.tsx` | Reference for upgrade prompt pattern |

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/features/author-chat/AuthorChatLockedOverlay.tsx` | Blurred locked panel with upgrade CTA |
| `src/components/features/author-chat/AuthorChatLockedOverlay.test.tsx` | Tests for locked overlay |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/features/author-chat/AuthorChatPanel.tsx` | Add premium gating logic, render locked overlay for free users |
| `src/components/features/author-chat/AuthorChatPanel.test.tsx` | Add premium/free user test cases |
| `src/components/features/author-chat/index.ts` | Export new component |
| `src/components/features/presence/ReadingRoomPanel.tsx` | Pass premium status to AuthorChatPanel |
| `src/components/features/presence/ReadingRoomPanel.test.tsx` | Add premium/free test scenarios |

### Project Structure Notes

- All new components go in `src/components/features/author-chat/` — co-located with existing chat panel
- Follow existing pattern: component + co-located test file
- Use `@/` import alias for all cross-boundary imports
- Barrel export from `index.ts`

### UX Requirements (from UX Design Spec)

- **Locked state visual:** Blurred chat panel showing messages underneath (creates desire/FOMO)
- **Headline:** "Chat with the author — Premium feature"
- **CTA:** Golden accent border, shimmer effect, aspirational tone ("Unlock author access")
- **Color tokens:** `--author-shimmer: #eab308`, `--author-text: #92400e`
- **Reduced motion:** Disable shimmer animation, use static golden border
- **Accessibility:** `aria-live="polite"` for chat, clear explanation of limitation for screen readers, 44px min touch targets, keyboard navigation

### Previous Story Intelligence (10-1)

**Key learnings from story 10-1:**
- `AuthorChatPanel` currently receives: `bookId`, `authorPresent`, `authorUserId?`, `authorName?`
- Channel creation uses `createAuthorChatChannel(bookId, authorUserId)` — caches `channelIdRef` for reconnects
- Framer Motion animations with `prefers-reduced-motion` support already implemented
- Auth pattern: `auth.api.getSession({ headers: await headers() })` — both imports required
- Mock pattern for tests: `vi.hoisted()` for Stream client mocks
- 56 tests passing from 10-1 — do not break existing tests

### Git Intelligence

- Recent commit `e06fc2d`: Stream Chat SDK setup (story 9.1)
- Package names: `stream-chat` + `stream-chat-react` (NOT `@stream-io/stream-chat-react`)
- Server client: lazy init via `getStreamServerClient()`
- Client null-check pattern: `const chatClient = useChatClient(); if (!chatClient) return fallback;`

### Mid-Session Upgrade Strategy

**Recommended approach:** Simple polling mechanism
- When free user sees locked overlay, poll `isPremium` every 30 seconds via lightweight server action
- On premium detection, re-render AuthorChatPanel with premium access
- Alternative: Use `window.addEventListener('focus')` to check on tab refocus (user returns from `/upgrade` tab)
- Keep it simple — the upgrade page opens in same tab, so `useEffect` cleanup + re-mount on navigation back handles most cases
- Consider: After upgrade at `/upgrade/success`, user navigates back to book page → `ReadingRoomPanel` re-mounts → fresh premium check

### References

- [Source: epics-book-discussions-author-chat.md#Epic 10 - Story 10.2]
- [Source: architecture.md#Stream Chat Infrastructure]
- [Source: architecture.md#Premium Gating Architecture]
- [Source: ux-design-specification.md#AuthorChatPanel]
- [Source: ux-design-specification.md#Premium Upgrade Prompt]
- [Source: product-brief-flappy-bird-1-2026-02-11.md#Author Chat (Premium)]
- [Source: 10-1-author-chat-panel-activation.md#Dev Notes]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Implemented premium gating in AuthorChatPanel — premium users get full Stream Chat, free users see blurred locked overlay with upgrade CTA
- Created `getAuthorChatAccess` server action using existing `isPremium()` utility
- Created `AuthorChatLockedOverlay` component with blurred fake-chat lines, golden styling, and `/upgrade` link
- Mid-session upgrade detection via 30s polling + window focus event listener — free-to-premium transition is seamless
- Free users never connect to Stream channel (no `channel.watch()` or token usage)
- All 17 author-chat tests pass, 38 ReadingRoomPanel tests pass (zero regressions)
- TypeScript clean, no new dependencies added
- 2 pre-existing test failures in `getSessionHistory.test.ts` and `BookDetail.test.tsx` — not related to this story

### Change Log

- 2026-02-13: Implemented story 10.2 — premium chat access gating with locked overlay and mid-session upgrade support
- 2026-02-13: Code review fixes — H1: reset premiumStatus on author leave; M1: handle access check failure; M2: added server action tests; M3: added polling interval test; M4: stabilized initChat callback via clientRef; L1: combined duplicate imports

### File List

**New Files:**
- src/actions/stream/getAuthorChatAccess.ts
- src/actions/stream/getAuthorChatAccess.test.ts
- src/components/features/author-chat/AuthorChatLockedOverlay.tsx
- src/components/features/author-chat/AuthorChatLockedOverlay.test.tsx

**Modified Files:**
- src/actions/stream/index.ts
- src/components/features/author-chat/AuthorChatPanel.tsx
- src/components/features/author-chat/AuthorChatPanel.test.tsx
- src/components/features/author-chat/index.ts
