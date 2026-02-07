# Story 4.2: View Other User Profiles

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to view another user's public profile**,
so that **I can learn about their reading habits and decide to follow them**.

## Acceptance Criteria

1. **Tap User to View Profile:** Given I tap on a user's name or avatar anywhere in the app (search results, activity feed, etc.), When their profile page loads, Then I see their display name and avatar, And I see their bio (if set), And I see their follower and following counts, And I see their current streak count, And I see a Follow/Following button.

2. **Public Reading Activity:** Given I am viewing a user's profile, When they have public reading activity enabled (`showReadingActivity: true`), Then I see their "Currently Reading" books (up to 3), And I see their recent reading sessions (last 5 sessions with book title, duration, date), And I see their recently finished books (up to 5).

3. **Privacy Restriction:** Given the user has privacy enabled (`showReadingActivity: false`), When I view their profile, Then I see limited info: name, avatar, bio, streak count, follower/following counts, And I see "Reading activity is private", And I can still follow them.

4. **Own Profile Redirect:** Given I am viewing my own profile via `/user/[myUserId]`, When the page loads, Then I am redirected to `/profile` where I see the "Edit Profile" button and all my data.

5. **Recent Sessions Display:** Given I am viewing a user's profile with public activity, When they have reading sessions, Then I see the last 5 sessions showing: book cover, book title, duration formatted (e.g. "32 min"), and relative timestamp (e.g. "2 days ago").

6. **Finished Books Display:** Given I am viewing a user's profile with public activity, When they have finished books, Then I see up to 5 recently finished books with: cover, title, author, and completion date.

## Tasks / Subtasks

- [x] Task 1: Create `getUserProfile` server action (AC: #1, #2, #3, #5, #6)
  - [x] 1.1: Create `src/actions/social/getUserProfile.ts` following `ActionResult<T>` pattern
  - [x] 1.2: Accept input `{ userId: string }` validated with Zod
  - [x] 1.3: Authenticate via `auth.api.getSession({ headers: await headers() })`
  - [x] 1.4: Fetch user with `select`: id, name, image, bio, avatarUrl, showReadingActivity
  - [x] 1.5: Fetch follow status via existing `getFollowStatus` action
  - [x] 1.6: Fetch UserStreak (currentStreak, longestStreak)
  - [x] 1.7: If `showReadingActivity: true`, also fetch:
    - Currently reading books (up to 3): UserBook where status CURRENTLY_READING, deletedAt null, with book relation
    - Recent reading sessions (last 5): ReadingSession ordered by startedAt desc, with book relation
    - Recently finished books (up to 5): UserBook where status FINISHED, deletedAt null, ordered by dateFinished desc, with book relation
  - [x] 1.8: Use `Promise.all()` for parallel data fetching
  - [x] 1.9: Return `ActionResult<UserProfileData>` with properly typed data

- [x] Task 2: Create `UserProfileData` types (AC: all)
  - [x] 2.1: Create types in `src/actions/social/getUserProfile.ts` or reuse from existing patterns
  - [x] 2.2: Define `UserProfileData` interface including:
    - User info: id, name, image, bio, avatarUrl, showReadingActivity
    - Social: isFollowing, followerCount, followingCount
    - Streak: currentStreak, longestStreak
    - Reading activity (nullable when private): currentlyReading, recentSessions, finishedBooks

- [x] Task 3: Enhance user profile page with reading activity sections (AC: #1, #2, #3, #5, #6)
  - [x] 3.1: Update `src/app/(main)/user/[userId]/page.tsx` server component
  - [x] 3.2: Add parallel fetch for recent reading sessions (last 5) when showReadingActivity is true
  - [x] 3.3: Add parallel fetch for recently finished books (up to 5) when showReadingActivity is true
  - [x] 3.4: Extract profile display into a `UserProfileContent` client component for interactivity
  - [x] 3.5: Render "Currently Reading" section (already exists, verify correctness)
  - [x] 3.6: Render "Recent Sessions" section with book cover, title, duration, relative timestamp
  - [x] 3.7: Render "Finished Books" section with cover, title, author, completion date
  - [x] 3.8: Show "Reading activity is private" message when privacy is enabled
  - [x] 3.9: Add streak display with longestStreak alongside currentStreak
  - [x] 3.10: Ensure accessible heading structure and semantic HTML

- [x] Task 4: Create `RecentSessionsList` component (AC: #5)
  - [x] 4.1: Create `src/components/features/social/RecentSessionsList.tsx`
  - [x] 4.2: Accept props: `sessions: RecentSession[]` (book cover, title, duration, startedAt)
  - [x] 4.3: Display each session as a card: book cover thumbnail (32x48), book title, formatted duration (e.g. "32 min", "1h 15min"), relative timestamp via `formatRelativeTime` utility
  - [x] 4.4: Empty state: "No recent sessions" (shown only when activity is public)
  - [x] 4.5: Each session card links to the book detail page `/book/[bookId]`

- [x] Task 5: Create `FinishedBooksList` component (AC: #6)
  - [x] 5.1: Create `src/components/features/social/FinishedBooksList.tsx`
  - [x] 5.2: Accept props: `books: FinishedBook[]` (cover, title, author, dateFinished)
  - [x] 5.3: Display each book as a card: book cover (32x48), title, author, formatted completion date
  - [x] 5.4: Empty state: "No finished books yet"
  - [x] 5.5: Each book card links to book detail page `/book/[bookId]`

- [x] Task 6: Update barrel exports (AC: all)
  - [x] 6.1: Update `src/actions/social/index.ts` to export `getUserProfile` and its types
  - [x] 6.2: Update `src/components/features/social/index.ts` to export `RecentSessionsList`, `FinishedBooksList`

- [x] Task 7: Add utility for formatting session duration (AC: #5)
  - [x] 7.1: Add `formatDuration(seconds: number): string` to `src/lib/utils.ts`
  - [x] 7.2: Format: <60s → "< 1 min", <3600 → "X min", ≥3600 → "Xh Ymin"
  - [x] 7.3: Add `formatRelativeTime(date: Date): string` to `src/lib/utils.ts` (avoids date-fns dependency)

- [x] Task 8: Write comprehensive tests (AC: all)
  - [x] 8.1: Create `src/actions/social/getUserProfile.test.ts` (9 tests):
    - Test: Returns full profile with reading activity when public
    - Test: Returns limited profile when activity is private
    - Test: Returns correct follower/following counts
    - Test: Returns correct streak data
    - Test: Returns error for non-existent user
    - Test: Returns error when unauthenticated
    - Test: Includes recent sessions when activity is public
    - Test: Includes finished books when activity is public
    - Test: Returns zero streaks when no streak record exists
  - [x] 8.2: Create `src/components/features/social/RecentSessionsList.test.tsx` (8 tests):
    - Test: Renders session list with book covers, titles, durations
    - Test: Formats durations correctly (minutes, hours)
    - Test: Shows relative timestamps
    - Test: Shows empty state when no sessions
    - Test: Session cards link to book detail pages
    - Test: Renders book covers when available
    - Test: Renders fallback when no cover url
  - [x] 8.3: Create `src/components/features/social/FinishedBooksList.test.tsx` (7 tests):
    - Test: Renders finished books with covers, titles, authors
    - Test: Shows completion dates formatted correctly
    - Test: Shows empty state when no books
    - Test: Book cards link to book detail pages
    - Test: Renders book covers when available
    - Test: Renders fallback when no cover url
    - Test: Handles null dateFinished gracefully
  - [x] 8.4: Create `src/lib/utils.test.ts` (12 tests):
    - Tests: formatDuration edge cases (< 60s, minutes, hours+minutes)
    - Tests: formatRelativeTime (just now, minutes, hours, days, months)
    - Tests: getInitials (null, single name, two names)
  - [x] 8.5: Verify 0 regressions across the full test suite — 862 tests pass across 86 files

## Dev Notes

### Critical Architecture Patterns

- **Server Actions** use `ActionResult<T>` discriminated union — import from `@/actions/books/types.ts`
- **Auth pattern**: `const headersList = await headers(); const session = await auth.api.getSession({ headers: headersList });`
- **Import convention**: ALWAYS use `@/` alias for cross-boundary imports
- **Component naming**: PascalCase files, named exports (not default)
- **Test co-location**: `Component.test.tsx` next to `Component.tsx`
- **Barrel exports**: Every feature folder needs `index.ts`
- **Toast**: Use `import { toast } from 'sonner'`
- **Date formatting**: Use `formatDistanceToNow` from `date-fns` for relative timestamps
- **Duration formatting**: Use utility function, display in human-readable format

### Data Fetching Pattern (CRITICAL)

The existing `/user/[userId]/page.tsx` already fetches user data, follow status, and streak. **Story 4.2 extends this page** to add reading sessions and finished books. Do NOT create a new page — enhance the existing one.

**Current data fetching (Story 4-1):**
```typescript
const [user, followStatus, streak] = await Promise.all([
  prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, image: true, bio: true,
      avatarUrl: true, showReadingActivity: true,
      userBooks: {
        where: { status: 'CURRENTLY_READING', deletedAt: null },
        take: 3,
        include: { book: true },
        orderBy: { updatedAt: 'desc' },
      },
    },
  }),
  getFollowStatus({ targetUserId: userId }),
  prisma.userStreak.findUnique({
    where: { userId },
    select: { currentStreak: true },
  }),
]);
```

**Required additions for Story 4.2:**
```typescript
const [user, followStatus, streak, recentSessions, finishedBooks] = await Promise.all([
  // ... existing user query (unchanged)
  getFollowStatus({ targetUserId: userId }),
  prisma.userStreak.findUnique({
    where: { userId },
    select: { currentStreak: true, longestStreak: true }, // ADD longestStreak
  }),
  // NEW: Recent reading sessions (only if needed, check showReadingActivity after)
  prisma.readingSession.findMany({
    where: { userId },
    orderBy: { startedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      duration: true,
      startedAt: true,
      book: {
        select: { id: true, title: true, coverUrl: true },
      },
    },
  }),
  // NEW: Finished books
  prisma.userBook.findMany({
    where: { userId, status: 'FINISHED', deletedAt: null },
    orderBy: { dateFinished: 'desc' },
    take: 5,
    select: {
      id: true,
      dateFinished: true,
      book: {
        select: { id: true, title: true, author: true, coverUrl: true },
      },
    },
  }),
]);
```

**IMPORTANT optimization note:** We fetch reading sessions and finished books unconditionally in the Promise.all for performance (parallel queries), but only render them if `user.showReadingActivity` is true. This avoids a waterfall (first fetch user → check flag → then fetch activity). The extra data is minimal at our scale.

### Prisma Schema — NO Changes Needed

Story 4.2 does not require any schema changes. All needed models and fields already exist:
- `User` — has all profile fields
- `Follow` — created in Story 4.1
- `UserStreak` — has `currentStreak`, `longestStreak`
- `ReadingSession` — has `userId`, `bookId`, `duration`, `startedAt`, relation to `Book`
- `UserBook` — has `userId`, `bookId`, `status`, `dateFinished`, relation to `Book`

### Existing Code to Reuse (DO NOT REINVENT)

| What | Where | How to Use |
|------|-------|-----------|
| `ActionResult<T>` | `@/actions/books/types.ts` | Import for return types |
| `getFollowStatus` | `@/actions/social/getFollowStatus` | Already used in profile page |
| `FollowButton` | `@/components/features/social/FollowButton` | Already used in profile page |
| `UserCard` | `@/components/features/social/UserCard` | For user list displays |
| `Avatar` | `@/components/ui/avatar` | Already used in profile page |
| `Button` | `@/components/ui/button` | For any action buttons |
| `getInitials` | `@/lib/utils` | Already used for avatar fallback |
| Prisma client | `@/lib/prisma` | Singleton instance |
| Auth | `@/lib/auth` | `auth.api.getSession({ headers })` |
| `formatDistanceToNow` | `date-fns` | For relative timestamps like "2 days ago" |
| Book detail page route | `/book/[id]` | Link sessions and finished books to book pages |

### UX Design Requirements (from UX spec)

- **Profile page displays**: name, avatar, bio, follower/following counts, streak count, Follow button — all already exist from Story 4-1
- **Public activity shows**: Currently Reading (up to 3), recent sessions (5), finished books (5) — this is new for Story 4-2
- **Privacy toggle** restricts activity visibility but keeps social features (follow) accessible
- **"Reading activity is private"** message shown for private profiles — already exists from 4-1
- **44px minimum touch targets** for all interactive elements
- **Warm, inviting tone** for empty states
- **Book cards** should show: cover thumbnail, title, author (where applicable)
- **Relative timestamps** for session times (e.g. "2 days ago")
- **Duration formatting** should be human-readable (e.g. "32 min", "1h 15min")

### Scope Boundaries

**Story 4.2 DOES:**
- Enhance the existing `/user/[userId]` profile page with reading activity sections
- Add recent reading sessions display (last 5)
- Add recently finished books display (up to 5)
- Create RecentSessionsList and FinishedBooksList components
- Add `getUserProfile` server action (optional consolidation of data fetching)
- Add duration formatting utility
- Add all tests with 0 regressions
- Add longestStreak to streak display

**Story 4.2 does NOT:**
- Create a new profile page (enhances existing from Story 4-1)
- Add activity feed (Story 4.3)
- Add kudos display on sessions (Story 4.4, 4.6)
- Add follower/following list views (future enhancement)
- Add "suggested users" or "people you may know"
- Modify own profile page (`/profile`) — only the public profile page `/user/[userId]`
- Add any new database models or schema changes

### Previous Story Intelligence (Story 4-1)

**Key learnings from Story 4-1 implementation:**
- The `/user/[userId]/page.tsx` server component pattern is established and working
- `Promise.all()` used for parallel data fetching — extend this pattern
- `getFollowStatus` returns `ActionResult<FollowStatusData>` — handle with `.success` check
- Avatar rendering: `user.avatarUrl || user.image || undefined` for src, `getInitials(user.name)` for fallback
- `UserBook.status` uses enum `CURRENTLY_READING` (not `READING`) — note the exact string
- `deletedAt: null` filter is required when querying UserBook (soft-delete pattern)
- Follow/unfollow is handled by FollowButton component with optimistic UI — no changes needed
- User model fields: `showReadingActivity` (boolean, default true) controls privacy
- Streak is fetched from `userStreak` table with `findUnique({ where: { userId } })`

**Code review learnings from Epic 3:**
- Parallel queries with `Promise.all()` for better latency
- Use `select` in Prisma queries to minimize data transfer
- `useSyncExternalStore` callbacks need `useCallback` for stable refs
- Always handle nullable return values gracefully

### Git Intelligence

Recent commits follow pattern: `feat: [Description] (Story N.N)` — all files + tests in single commit.

**Current uncommitted work (Story 4-1) modifies:**
- `prisma/schema.prisma` — Follow model added
- `src/app/(main)/search/page.tsx` — Tabs added (Books/Users)
- `src/middleware.ts` — `/user` added to protected routes
- `src/types/database.ts` — Follow type exported
- `src/lib/utils.ts` — `getInitials` added

**Story 4-2 builds directly on Story 4-1's uncommitted work.** The `/user/[userId]/page.tsx` from Story 4-1 is the starting point.

### Architecture Compliance

- **Social & Activity maps to FR23-FR27** per architecture doc — Story 4.2 specifically addresses FR26 (view user profiles)
- **Server component pattern** for profile page — data fetching at page level, pass down to client components
- **Component location:** `src/components/features/social/` for all new social components
- **No new Zustand store needed** — profile data is per-page, fetched server-side
- **Date handling:** Use `date-fns` for display formatting, per architecture spec
- **Prisma queries:** Use `select` for minimal data, `orderBy` for sorting, `take` for limits

### Testing Standards

- **Framework:** Vitest + React Testing Library (NOT Jest)
- **Mock auth:** `vi.mock('@/lib/auth')`
- **Mock prisma:** `vi.mock('@/lib/prisma')`
- **Mock server actions:** `vi.mock('@/actions/social/getFollowStatus')` for component tests
- **Test co-location:** Test files next to source files
- **Accessibility:** aria attributes, semantic headings, link text
- **Run full suite** after implementation to verify 0 regressions
- **Mock patterns:**
  ```typescript
  vi.mock('@/lib/auth', () => ({
    auth: { api: { getSession: vi.fn() } }
  }));
  vi.mock('@/lib/prisma', () => ({
    prisma: {
      user: { findUnique: vi.fn() },
      userStreak: { findUnique: vi.fn() },
      readingSession: { findMany: vi.fn() },
      userBook: { findMany: vi.fn() },
      follow: { findUnique: vi.fn(), count: vi.fn() },
    }
  }));
  ```

### Project Structure Notes

**New files:**
- `src/actions/social/getUserProfile.ts` (optional — can also inline data fetching in page)
- `src/actions/social/getUserProfile.test.ts`
- `src/components/features/social/RecentSessionsList.tsx`
- `src/components/features/social/RecentSessionsList.test.tsx`
- `src/components/features/social/FinishedBooksList.tsx`
- `src/components/features/social/FinishedBooksList.test.tsx`

**Modified files:**
- `src/app/(main)/user/[userId]/page.tsx` — add reading sessions + finished books sections
- `src/actions/social/index.ts` — export getUserProfile
- `src/components/features/social/index.ts` — export new components
- `src/lib/utils.ts` — add `formatDuration` utility (if not already present)

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-4-social-connections-activity-feed.md#Story 4.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions - Server Actions for mutations]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns - Structure Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries - Social FR23-FR27]
- [Source: _bmad-output/planning-artifacts/prd.md#FR26 - View other user profiles]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Profile Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Privacy Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Empty State Patterns]
- [Source: _bmad-output/implementation-artifacts/4-1-follow-unfollow-users.md#All patterns and learnings]
- [Source: src/app/(main)/user/[userId]/page.tsx#Existing profile page implementation]
- [Source: prisma/schema.prisma#ReadingSession model, UserBook model, UserStreak model]
- [Source: src/actions/social/getFollowStatus.ts#Follow status pattern]
- [Source: src/components/features/social/FollowButton.tsx#FollowButton component]
- [Source: src/lib/utils.ts#getInitials utility]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Initial test run: 2 failures due to `screen.getByAlt` (not a valid RTL method) — fixed to `screen.getByAltText`
- Full suite after implementation: 862 tests pass across 86 files, 0 regressions
- Code review fixes: 865 tests pass across 86 files (3 new tests added for null handling and edge cases)
- Type check: 0 new TS errors (pre-existing errors in streaks tests only)
- Lint: 0 errors in Story 4.2 files (3 warnings for `<img>` vs `<Image>`, consistent with existing codebase)

### Completion Notes List

- Created `getUserProfile` server action with full data fetching: user profile, follow status, streak data, reading sessions, finished books — all in parallel via `Promise.all()`
- Types defined in `getUserProfile.ts`: `UserProfileData`, `RecentSession`, `FinishedBook`, `CurrentlyReadingBook`
- Privacy-aware: returns `null` for reading activity when `showReadingActivity: false`
- Enhanced `/user/[userId]/page.tsx` with 3 new sections: Recent Sessions, Finished Books, and longestStreak display (Trophy icon)
- Currently Reading books now link to book detail pages (improved from Story 4-1)
- Added `aria-labelledby` sections for accessibility
- Created `RecentSessionsList` component: shows duration (Clock icon), relative timestamp, links to book pages
- Created `FinishedBooksList` component: shows author, completion date (BookCheck icon), links to book pages
- Added `formatDuration()` and `formatRelativeTime()` to `src/lib/utils.ts` — avoided adding `date-fns` dependency
- 36 new tests across 4 test files (9 + 8 + 7 + 12)
- Updated barrel exports in both actions and components index files

### Code Review Fixes (Claude Sonnet 4.5)

**Adversarial review found 12 issues (2 HIGH, 6 MEDIUM, 4 LOW) — all HIGH and MEDIUM issues fixed:**

**HIGH Issues Fixed:**
1. Added error logging to `getUserProfile` catch block (was swallowing all errors silently)
2. Refactored `page.tsx` to use `getUserProfile` action instead of duplicating Prisma queries (improved error handling, eliminated duplication)

**MEDIUM Issues Fixed:**
3. Made `RecentSessionsList` accept `null` sessions (type safety for privacy mode)
4. Made `FinishedBooksList` accept `null` books (type safety for privacy mode)
5. Eliminated DRY violation: `page.tsx` now uses `getUserProfile` action (single source of truth)
6. Fixed wasteful database queries: `getUserProfile` handles privacy-aware data fetching
7. Added future date handling in `formatRelativeTime` (handles clock skew gracefully)
8. Extracted `currentlyReading` to parallel Promise.all query for consistency (was nested in user query)
9. Added explanatory comment for `dateFinished` null check (documents defensive coding)

**Tests Updated:**
- Added 3 new tests: null sessions, null books, future dates
- Full suite: 865 tests pass across 86 files, 0 regressions (up from 862)

**LOW Issues Deferred:**
- Image optimization (`<img>` vs Next.js `<Image>`) — consistent with existing codebase pattern
- Edge case handling (0-second sessions, defensive code) — minor UX improvements for future iteration

### File List

**New files:**
- src/actions/social/getUserProfile.ts
- src/actions/social/getUserProfile.test.ts
- src/components/features/social/RecentSessionsList.tsx
- src/components/features/social/RecentSessionsList.test.tsx
- src/components/features/social/FinishedBooksList.tsx
- src/components/features/social/FinishedBooksList.test.tsx
- src/lib/utils.test.ts

**Modified files:**
- src/app/(main)/user/[userId]/page.tsx
- src/actions/social/index.ts
- src/components/features/social/index.ts
- src/lib/utils.ts
