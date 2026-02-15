# Story 5.6: Author Presence Display

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to see when an author has been in a reading room**,
so that **I experience the magic of shared space with creators**.

## Acceptance Criteria

1. **Given** I am viewing a book where the author is verified, **When** the author was in the reading room within the last 24 hours, **Then** I see an AuthorShimmerBadge on the book detail page showing "Author was here [X hours ago]" with a subtle golden shimmer animation.

2. **Given** I am in a reading room, **When** the author is currently present, **Then** the author's avatar has a golden ring/shimmer effect in the PresenceAvatarStack, **And** the ReadingRoomPanel has a golden border glow, **And** I see an "Author is here!" indicator.

3. **Given** I view the PresenceAvatarStack, **When** the author is among the readers, **Then** the author's avatar is visually distinct with a golden ring, **And** the author appears first in the stack, **And** tapping shows "Author - [Name]" in the OccupantDetailSheet.

4. **Given** I tap on the author's presence badge, **When** the detail appears, **Then** I see when they were last active, **And** I see their author profile (linked to their books).

5. **Given** the author has multiple books on the platform, **When** they are present in one room, **Then** only that specific book's room shows author presence, **And** other books show "Author verified" but not "here now".

## Tasks / Subtasks

- [x] Task 1: Create server action `getAuthorPresence` (AC: #1, #5)
  - [x] 1.1 Create `src/actions/authors/getAuthorPresence.ts` - query `RoomPresence` for the verified author of a given book, returning their latest presence record (active or within last 24h)
  - [x] 1.2 Returns: `{ isCurrentlyPresent: boolean; lastSeenAt: Date | null; authorName: string; authorId: string } | null`
  - [x] 1.3 Logic: find APPROVED `AuthorClaim` for `bookId`, then find latest `RoomPresence` where `isAuthor=true` and `bookId` matches
  - [x] 1.4 Add to `src/actions/authors/index.ts` barrel export

- [x] Task 2: Extend `PresenceMember` with `isAuthor` flag (AC: #2, #3)
  - [x] 2.1 Add `isAuthor?: boolean` to `PresenceMember` interface in `src/stores/usePresenceStore.ts`
  - [x] 2.2 Update `usePresenceChannel` hook to merge `isAuthor` data from `getRoomMembers()` into the member map
  - [x] 2.3 Ensure Pusher `member_added` events set `isAuthor` from the user info payload in the `pusher:subscription_succeeded` callback

- [x] Task 3: Create AuthorShimmerBadge component (AC: #1, #4)
  - [x] 3.1 Create `src/components/features/presence/AuthorShimmerBadge.tsx` with CSS shimmer animation
  - [x] 3.2 Props: `{ authorName: string; lastSeenAt: Date; isLive: boolean; authorId: string; className?: string }`
  - [x] 3.3 States: "Was Here" (static golden badge + timestamp), "Live" (animated shimmer pulse + "Author is here!")
  - [x] 3.4 CSS shimmer: gradient animation, 2s duration, ease-in-out, via Tailwind `motion-safe:animate-shimmer`
  - [x] 3.5 Tap/click opens link to author profile (`/profile/{authorId}`)
  - [x] 3.6 `aria-label="Author [name] was here [time]"` or `"Author [name] is here now"`
  - [x] 3.7 Respect `prefers-reduced-motion` - static gold border only when reduced
  - [x] 3.8 Add to `src/components/features/presence/index.ts` barrel export

- [x] Task 4: Update PresenceAvatarStack for author distinction (AC: #2, #3)
  - [x] 4.1 Sort members array to place author first (before rendering)
  - [x] 4.2 Add golden ring (`ring-2 ring-[var(--author-shimmer)]`) around author avatar
  - [x] 4.3 Add subtle pulse animation to author avatar ring (respect `prefers-reduced-motion`)
  - [x] 4.4 Update ARIA label: "X readers in this room including the author"

- [x] Task 5: Update OccupantDetailSheet for author display (AC: #3)
  - [x] 5.1 Add "Author" badge (golden pill) next to verified author in the member list
  - [x] 5.2 Sort author to top of the list
  - [x] 5.3 Use `AuthorVerifiedBadge` or a simpler inline badge matching existing golden styling

- [x] Task 6: Update ReadingRoomPanel for author presence (AC: #2)
  - [x] 6.1 Fetch author presence via `getAuthorPresence(bookId)` on mount
  - [x] 6.2 When author is currently present: add golden border glow to panel (`border-[var(--author-shimmer)] shadow-[0_0_12px_var(--author-shimmer)]`)
  - [x] 6.3 Show "Author is here!" text indicator above the avatar stack
  - [x] 6.4 When author was here <24h: show AuthorShimmerBadge in "Was Here" state below avatar stack

- [x] Task 7: Integrate AuthorShimmerBadge into book detail page (AC: #1, #5)
  - [x] 7.1 In `BookDetailHero.tsx`, fetch author presence data via `getAuthorPresence(bookId)` on mount
  - [x] 7.2 Show AuthorShimmerBadge when author was present within 24h (even if not currently in room)
  - [x] 7.3 Only show for the specific book where author has presence (not all claimed books)
  - [x] 7.4 Position below the existing author claim section in BookDetailHero

- [x] Task 8: Update Pusher auth to include `isAuthor` in member info (AC: #2)
  - [x] 8.1 In `/api/pusher/auth/route.ts`, when authorizing a presence channel, include `isAuthor: true/false` in the `user_info` payload by checking AuthorClaim status
  - [x] 8.2 This enables real-time author detection without extra API calls when users join

- [x] Task 9: Write tests (All ACs)
  - [x] 9.1 Unit tests for `getAuthorPresence` server action (7 tests: verified author present, was here <24h, >24h, no author, validation, fallback)
  - [x] 9.2 Component tests for `AuthorShimmerBadge` (8 tests: live state, was-here state, profile link, ARIA labels, shimmer class, timestamp, touch target)
  - [x] 9.3 Component tests for updated `PresenceAvatarStack` (5 new tests: author first, golden ring, no ring on non-author, ARIA with/without author)
  - [x] 9.4 Component tests for updated `OccupantDetailSheet` (5 new tests: author sorted first, author badge, author prefix, title with author, ARIA label)
  - [x] 9.5 Component tests for updated `ReadingRoomPanel` (6 new tests: author here indicator, golden border, shimmer badge, no indicators, fetch on mount, joined state author)

## Dev Notes

### Critical Architecture Patterns

**Server Actions Pattern (MUST FOLLOW):**
All server actions return `ActionResult<T>` discriminated union. Reference: `src/actions/books/types.ts`

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

**Auth Check Pattern:**
Every server action must verify auth first. Reference: `src/actions/presence/joinRoom.ts`

```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session?.user?.id) {
  return { success: false, error: 'Unauthorized' };
}
```

**Pusher Event Pattern (Fire-and-forget):**
Reference: `src/actions/social/giveKudos.ts`

```typescript
try {
  await pusherServer?.trigger(channel, event, payload);
} catch (e) {
  console.error('Pusher trigger failed:', e);
}
```

### Database Queries

**Get author's latest presence for a book:**
```typescript
// 1. Find verified author for this book
const claim = await prisma.authorClaim.findFirst({
  where: { bookId, status: 'APPROVED' },
  select: { userId: true, user: { select: { id: true, name: true, image: true } } },
});
if (!claim) return null;

// 2. Find their latest RoomPresence (active or within 24h)
const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
const presence = await prisma.roomPresence.findFirst({
  where: {
    userId: claim.userId,
    bookId,
    isAuthor: true,
    OR: [
      { leftAt: null }, // currently present
      { leftAt: { gte: twentyFourHoursAgo } }, // left within 24h
    ],
  },
  orderBy: { joinedAt: 'desc' },
});
```

### Existing Components to Modify

| File | Modification | Why |
|------|-------------|-----|
| `src/stores/usePresenceStore.ts` | Add `isAuthor?: boolean` to `PresenceMember` | Enable author detection in UI |
| `src/hooks/usePresenceChannel.ts` | Merge `isAuthor` from `getRoomMembers` and Pusher `user_info` | Propagate author flag to components |
| `src/components/features/presence/PresenceAvatarStack.tsx` | Sort author first, add golden ring, update ARIA | Visual author distinction |
| `src/components/features/presence/OccupantDetailSheet.tsx` | Add author badge, sort author first | Author badge in member list |
| `src/components/features/presence/ReadingRoomPanel.tsx` | Fetch author presence, golden border, "Author is here!" | Author presence awareness |
| `src/components/features/books/BookDetail.tsx` or `BookDetailActions.tsx` | Show AuthorShimmerBadge for recent author visits | "Author was here" on book page |
| `src/app/api/pusher/auth/route.ts` | Include `isAuthor` in presence channel `user_info` | Real-time author detection |
| `src/components/features/presence/index.ts` | Add AuthorShimmerBadge export | Barrel export |

### New Files to Create

```
src/
├── actions/authors/
│   └── getAuthorPresence.ts         # Server action: get author's presence for a book
│   └── getAuthorPresence.test.ts    # Tests
├── components/features/presence/
│   ├── AuthorShimmerBadge.tsx        # Golden shimmer badge component
│   └── AuthorShimmerBadge.test.tsx   # Tests
```

### Existing Component References

**AuthorVerifiedBadge** (`src/components/features/books/AuthorVerifiedBadge.tsx`):
- Already has golden shimmer animation via `motion-safe:animate-shimmer`
- Uses `bg-amber-100 text-amber-800` styling
- Reuse same shimmer animation keyframe for AuthorShimmerBadge

**PresenceAvatarStack** (`src/components/features/presence/PresenceAvatarStack.tsx`):
- Uses `Map<string, PresenceMember>` for member data
- Already has Framer Motion animations with stagger
- Pulse animation on avatars (respects `prefers-reduced-motion`)
- Max 5 visible with overflow indicator
- Clickable to open OccupantDetailSheet

**ReadingRoomPanel** (`src/components/features/presence/ReadingRoomPanel.tsx`):
- Main room component with join/leave, idle timeout, heartbeat
- Uses `usePresenceChannel` hook for real-time updates
- Already handles empty rooms, connection modes
- Golden border should wrap the existing panel Card

**OccupantDetailSheet** (`src/components/features/presence/OccupantDetailSheet.tsx`):
- Bottom sheet with member list
- Links to `/profile/{memberId}`
- Shows avatars with initials fallback
- 44px touch targets

**usePresenceChannel** (`src/hooks/usePresenceChannel.ts`):
- Returns `Map<string, PresenceMember>` (currently no `isAuthor` field)
- Subscribes to `presence-room-{bookId}` Pusher channel
- Falls back to polling via `getRoomMembers` every 30s
- Polling response already includes `isAuthor` - just needs to be mapped

**Pusher Auth Route** (`src/app/api/pusher/auth/route.ts`):
- Authorizes presence channels
- Sets `user_info` with `{ name, avatarUrl }`
- Need to add `isAuthor` to `user_info` by checking AuthorClaim

### Design System Colors

From `src/app/globals.css` CSS custom properties:
```css
--author-shimmer: #eab308;  /* Light: Rich Gold */
--author-text: #92400e;     /* Light: Dark Amber */
--presence: #fbbf24;        /* Light: Soft Amber */
```

Dark mode variants:
```css
--author-shimmer: #facc15;
--author-text: #fcd34d;
--presence: #fcd34d;
```

**CSS Shimmer Animation** (already defined in project):
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

Use via Tailwind: `motion-safe:animate-shimmer` (already configured)

### UX Guidelines

From UX Design Specification:

- **Author "Was Here" Indicator**: Golden shimmer effect, timestamp "Author was here X hours ago", live toast when author joins
- **Author presence is the PEAK emotional moment** - "Wonder" emotion, design as the emotional climax
- **Author in avatar stack**: Golden ring, appears first, "Author - [Name]" on tap
- **ReadingRoomPanel "Author Live" state**: Golden border, toast notification
- **AuthorShimmerBadge states**: "Was Here" (static golden), "Live" (animated shimmer pulse), "Claimed" (subtle golden)
- **Shimmer CSS**: gradient animation, 2s duration, ease-in-out
- **`prefers-reduced-motion`**: Static gold border only, no animation
- **Screen reader**: `aria-label` for author presence, `aria-live="polite"` for dynamic updates
- **Minimum 44px touch targets** on all interactive elements
- **WCAG 2.1 AA** compliance - 4.5:1 contrast ratio for text

### Formatting Timestamps

Use `date-fns` `formatDistanceToNow()` for relative timestamps:
```typescript
import { formatDistanceToNow } from 'date-fns';
// "Author was here 3 hours ago"
const timeAgo = formatDistanceToNow(lastSeenAt, { addSuffix: true });
```

### Previous Story Intelligence

**Story 5.5 (Author Claim & Verification)** established:
- `AuthorClaim` model with `PENDING/APPROVED/REJECTED` status
- `ClaimStatus` and `VerificationMethod` enums in Prisma schema
- `getClaimStatus` action for checking claim state per user+book
- `AuthorVerifiedBadge` component with golden shimmer animation
- `isAuthor` field already set on `joinRoom` by checking AuthorClaim status
- Admin claims review page at `/admin/claims`
- `NotificationProvider` handles `author:claim-approved` and `author:claim-rejected` events
- Admin role via `ADMIN_USER_IDS` env var and `src/lib/admin.ts` utility

**Story 5.4 (Leave Reading Room)** established:
- `RoomPresence.leftAt` timestamp tracks when user left
- Idle timeout (30 min) auto-leave with toast
- Heartbeat pattern (5 min interval)
- `leaveRoom` server action

**Story 5.3 (See Room Occupants)** established:
- `PresenceAvatarStack` with Framer Motion stagger animations
- `OccupantDetailSheet` for detailed member list
- Max 5 visible avatars with "+N" overflow
- Pulse animations respecting `prefers-reduced-motion`

**Story 5.2 (Join Reading Room)** established:
- `ReadingRoomPanel` component with join/leave flow
- `usePresenceChannel` hook for Pusher + polling
- `getRoomMembers` returns `RoomMember[]` with `isAuthor` boolean
- `presence-room-{bookId}` channel naming pattern

**Story 5.1 (Pusher Spike)** established:
- `/api/pusher/auth` endpoint for channel authorization
- `pusherServer` and `pusherClient` setup in `src/lib/`
- Graceful degradation to polling when Pusher unavailable

### Git Intelligence

Recent commits:
- `6dae837` - Code review fixes for Story 5.5 author claim verification
- `78960fe` - Story 5.5 implementation (author claim & verification)
- `a63cab1` - Story 5.4 (leave reading room with idle timeout)
- Project uses `proxy.ts` instead of `middleware.ts` for Next.js 16

Key patterns from recent work:
- All new components co-locate tests (`Component.test.tsx`)
- Barrel exports in `index.ts` for each feature folder
- `@/` import alias for all cross-boundary imports
- Server actions follow `ActionResult<T>` pattern consistently

### Project Structure Notes

- New `AuthorShimmerBadge` goes in `src/components/features/presence/` (not `books/` or `authors/`) because it is a presence display component
- New `getAuthorPresence` action goes in `src/actions/authors/` alongside existing author actions
- All imports must use `@/` alias for cross-boundary imports
- Tests co-located with source files

### Anti-Patterns to Avoid

- **DO NOT** create a separate Zustand store for author presence - use `isAuthor` flag on existing `PresenceMember` in `usePresenceStore`
- **DO NOT** poll for author presence separately - merge it into existing `getRoomMembers` polling in `usePresenceChannel`
- **DO NOT** duplicate the shimmer animation CSS - reuse the existing `animate-shimmer` Tailwind config
- **DO NOT** add chat or messaging - this is "ambient presence" only
- **DO NOT** show author presence badges on books where the author has NOT been in the room - only show verified badge (existing behavior)

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-5-reading-rooms-author-presence.md#Story 5.6]
- [Source: _bmad-output/planning-artifacts/architecture.md#Communication Patterns - Pusher Events]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture - usePresenceStore]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#AuthorShimmerBadge]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Author Presence Reveal microinteraction]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Journey 4: Author Claims Book & Engages]
- [Source: _bmad-output/planning-artifacts/prd.md#FR30 - Author last presence in room]
- [Source: _bmad-output/planning-artifacts/prd.md#FR33 - Authors visually distinguished in rooms]
- [Source: src/stores/usePresenceStore.ts - PresenceMember interface]
- [Source: src/hooks/usePresenceChannel.ts - presence channel hook]
- [Source: src/components/features/presence/PresenceAvatarStack.tsx - avatar stack]
- [Source: src/components/features/presence/ReadingRoomPanel.tsx - room panel]
- [Source: src/components/features/presence/OccupantDetailSheet.tsx - detail sheet]
- [Source: src/components/features/books/AuthorVerifiedBadge.tsx - shimmer animation reference]
- [Source: src/actions/presence/getRoomMembers.ts - RoomMember.isAuthor]
- [Source: src/actions/presence/joinRoom.ts - isAuthor from AuthorClaim]
- [Source: src/app/api/pusher/auth/route.ts - Pusher auth endpoint]
- [Source: prisma/schema.prisma - RoomPresence.isAuthor, AuthorClaim model]
- [Source: 5-5-author-claim-verification.md - previous story patterns]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Pre-existing test failures (not introduced by this story): `src/middleware.test.ts` (middleware renamed to proxy.ts), `src/components/layout/AppShell.test.tsx` (missing DATABASE_URL mock)

### Completion Notes List

- Used custom `formatTimeAgo` function in AuthorShimmerBadge instead of `date-fns` (not installed in project)
- `isAuthor` data flows through 3 paths: (1) server polling via `getRoomMembers`, (2) Pusher `user_info` via auth route, (3) `getAuthorPresence` server action for non-joined state
- `authorInRoom` in ReadingRoomPanel derives from both live member data AND server-fetched `getAuthorPresence` data for robustness
- Pusher auth route now does an async DB query for AuthorClaim — wrapped in try/catch to default to `false` on failure
- BookDetailHero fetches author presence alongside claim status in the same useEffect

### File List

**New files:**
- `src/actions/authors/getAuthorPresence.ts` — Server action to query author's latest presence for a book
- `src/actions/authors/getAuthorPresence.test.ts` — 7 unit tests
- `src/components/features/presence/AuthorShimmerBadge.tsx` — Golden shimmer badge component (Was Here / Live states)
- `src/components/features/presence/AuthorShimmerBadge.test.tsx` — 8 component tests

**Modified files:**
- `src/actions/authors/index.ts` — Added getAuthorPresence barrel export
- `src/stores/usePresenceStore.ts` — Added `isAuthor?: boolean` to PresenceMember
- `src/hooks/usePresenceChannel.ts` — Map isAuthor from polling and Pusher events
- `src/components/features/presence/PresenceAvatarStack.tsx` — Author sorted first, golden ring, updated ARIA
- `src/components/features/presence/PresenceAvatarStack.test.tsx` — 5 new author tests (26 total)
- `src/components/features/presence/OccupantDetailSheet.tsx` — Author sorted first, author badge, golden ring
- `src/components/features/presence/OccupantDetailSheet.test.tsx` — 5 new author tests (15 total)
- `src/components/features/presence/ReadingRoomPanel.tsx` — Author presence fetch, golden border, indicators
- `src/components/features/presence/ReadingRoomPanel.test.tsx` — 6 new author tests + mock fix (31 total)
- `src/components/features/presence/index.ts` — Added AuthorShimmerBadge export
- `src/components/features/books/BookDetailHero.tsx` — Author presence fetch, AuthorShimmerBadge integration
- `src/components/features/books/BookDetailHero.test.tsx` — Added getAuthorPresence mock + next/link mock
- `src/components/features/books/BookDetailActions.test.tsx` — Added getAuthorPresence mock
- `src/app/api/pusher/auth/route.ts` — Added isAuthor to presence channel user_info
- `src/app/api/pusher/auth/route.test.ts` — Added prisma mock, updated assertions, new isAuthor test

## Senior Developer Review (AI)

**Review Date:** 2026-02-15
**Review Outcome:** Approve (with fixes applied)
**Reviewer:** Claude Opus 4.6

### Findings Summary
- 0 High, 2 Medium, 1 Low issues found; 1 fixed automatically, 1 accepted, 1 deferred

### Action Items
- [x] [MED] Fixed stale author presence data — `getAuthorPresence` now refetches when `isJoined` changes, preventing stale "Author is here!" display after author has left
- [ ] [MED] `PresenceAvatarStack` uses `animate-pulse` (opacity-based) instead of ring-specific golden shimmer — acceptable visual distinction, matches "subtle pulse" spec intent
- [ ] [LOW] `formatTimeAgo` is custom instead of `date-fns` — correct decision since date-fns is not installed
