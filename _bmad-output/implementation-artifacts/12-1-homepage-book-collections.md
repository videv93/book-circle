# Story 12.1: Homepage Book Collections

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to see organized book collections on the homepage — my currently reading books with quick-resume, books with active readers, and books to discover**,
so that **I can quickly continue reading or find my next book without navigating away from the home screen**.

## Acceptance Criteria

### AC1: Continue Reading Section

1. **Given** I have books with status "CURRENTLY_READING"
   **When** I view the homepage
   **Then** I see a "Continue Reading" section below the streak ring/daily goal area
   **And** each book shows: cover image, title, author, time since last session (e.g., "Read 2h ago")
   **And** each book card links to the book detail page (`/book/{identifier}`)
   **And** books are sorted by most recent reading session first
   **And** maximum 4 books are shown

2. **Given** I have more than 4 "Currently Reading" books
   **When** I view the "Continue Reading" section
   **Then** I see a "See all in Library" link that navigates to `/library`

3. **Given** I have no "Currently Reading" books
   **When** I view the homepage
   **Then** I see an empty state: "Find your next book" with a CTA button linking to `/search`

### AC2: Reading Now (Active Readers) Section

4. **Given** there are books with active readers on the platform (RoomPresence with leftAt=NULL and lastActiveAt within 30 minutes)
   **When** I view the homepage
   **Then** I see a "Reading Now" section with horizontally scrollable book cards
   **And** each card shows: cover image, title, PresenceAvatarStack, and reader count text ("X reading now")
   **And** cards are sorted by most active readers first
   **And** tapping a card navigates to `/book/{identifier}`

5. **Given** an author (isAuthor=true in RoomPresence) is present in a book's reading room
   **When** I view that book's card in "Reading Now"
   **Then** the card has a golden border glow (matching AuthorShimmerBadge treatment)
   **And** I see an "Author is here" indicator

6. **Given** no books have active readers currently
   **When** I view the homepage
   **Then** the "Reading Now" section is hidden entirely (not shown as empty)

### AC3: Discover Section

7. **Given** I am on the homepage
   **When** the page loads
   **Then** I see a "Discover" section with popular/trending books
   **And** popularity is based on: total UserBook count + recent ReadingSession activity (last 7 days)
   **And** I see up to 6 books in a horizontal scroll
   **And** books already in my library show a subtle checkmark overlay
   **And** tapping a card navigates to `/book/{identifier}`

8. **Given** there are fewer than 3 books on the platform
   **When** the Discover section would render
   **Then** the section is hidden (not enough content to be useful)

### AC4: General / Layout

9. **Given** I am on the homepage
   **When** the page loads
   **Then** the existing streak ring / daily goal section remains at the top (unchanged)
   **And** sections are stacked vertically: Streak → Continue Reading → Reading Now → Discover → Sign Out
   **And** the page is scrollable

10. **Given** any homepage section is loading data
    **When** the page renders
    **Then** I see skeleton loading states that match the card layout for each section
    **And** skeletons show after 200ms delay (per UX spec)

11. **Given** accessibility requirements
    **When** I interact with the homepage
    **Then** all book cards have proper aria-labels with book title and author
    **And** horizontal scroll sections are keyboard-navigable
    **And** touch targets are minimum 44px

## Tasks / Subtasks

- [x] Task 1: Create server-side data fetching functions (AC: 1, 4, 7)
  - [x] 1.1 Create `getUserCurrentlyReading()` action — fetch user's CURRENTLY_READING books with last session time, sorted by most recent session, limit 4
  - [x] 1.2 Create `getActiveBooksWithReaders()` action — fetch books with active RoomPresence (leftAt=NULL, lastActiveAt within 30 min), include reader count and author presence flag, sorted by reader count desc
  - [x] 1.3 Create `getPopularBooks()` action — fetch books by (UserBook count + recent ReadingSession count), limit 6, exclude user's own library books from checkmark logic at component level
- [x] Task 2: Create homepage section components (AC: 1-8)
  - [x] 2.1 Create `ContinueReadingSection` component — renders user's currently reading books as cards with cover, title, author, last session time, link to book detail
  - [x] 2.2 Create `ContinueReadingCard` component — compact book card variant with last session timestamp
  - [x] 2.3 Create `ReadingNowSection` component — horizontally scrollable cards with PresenceAvatarStack and reader count, golden glow when author present
  - [x] 2.4 Create `ReadingNowCard` component — book card with presence indicators and optional author glow
  - [x] 2.5 Create `DiscoverSection` component — horizontally scrollable popular book cards with library checkmark overlay
  - [x] 2.6 Create `DiscoverBookCard` component — compact book card with optional checkmark for "already in library"
  - [x] 2.7 Create skeleton components for each section: `ContinueReadingSkeleton`, `ReadingNowSkeleton`, `DiscoverSkeleton`
- [x] Task 3: Integrate sections into homepage (AC: 9)
  - [x] 3.1 Update `page.tsx` server component to fetch all new data in parallel
  - [x] 3.2 Update `HomeContent.tsx` to accept and render new sections below streak ring
  - [x] 3.3 Remove sign-out button from main content (move to profile page if not already there)
- [x] Task 4: Empty states and edge cases (AC: 3, 6, 8)
  - [x] 4.1 "Find your next book" empty state for Continue Reading
  - [x] 4.2 Hide Reading Now section when no active readers
  - [x] 4.3 Hide Discover section when fewer than 3 books exist
- [ ] Task 5: Tests (AC: all)
  - [ ] 5.1 Unit tests for each new server action
  - [ ] 5.2 Component tests for each section (rendering, empty states, skeleton states)
  - [ ] 5.3 Integration test for HomeContent with all sections

## Dev Notes

### Architecture Patterns to Follow

- **Server Actions pattern:** All new data fetching functions go in `src/actions/` following the `ActionResult<T>` discriminated union pattern. See `getUserLibrary.ts` for reference.
- **Auth pattern:** Every action must call `auth.api.getSession({ headers: await headers() })` and return `{ success: false, error: 'Unauthorized' }` if no session.
- **Component pattern:** Server Component data fetching in `page.tsx`, pass data to Client Component `HomeContent.tsx`. New section components can be Client Components if they need interactivity (horizontal scroll), or Server Components if purely presentational.

### Existing Components to Reuse

| Component | Location | Usage |
|-----------|----------|-------|
| `LibraryBookCard` | `@/components/features/books/LibraryBookCard` | Reference pattern for book card. Uses `UserBookWithBook` type with cover, title, author, progress, reader count. May be reusable directly for Continue Reading cards. |
| `PresenceAvatarStack` | `@/components/features/presence/PresenceAvatarStack` | Render active readers on Reading Now cards. Takes `Map<string, PresenceMember>` with maxVisible, size props. |
| `AuthorShimmerBadge` | `@/components/features/presence/AuthorShimmerBadge` | Golden shimmer treatment reference. Reuse styling for author-present border glow on Reading Now cards. |
| `BookReadersCount` | `@/components/features/books/BookReadersCount` | Shows "X readers" / "Y currently reading" text. |
| `LibraryBookCardSkeleton` | `@/components/features/books/LibraryBookCardSkeleton` | Reference for skeleton loading pattern. |
| `LibraryEmptyState` | `@/components/features/books/LibraryEmptyState` | Reference for empty state pattern with CTA button. |

### Existing Types to Use

| Type | Location | Purpose |
|------|----------|---------|
| `UserBookWithBook` | `@/actions/books/types` | Book with user relationship data |
| `ActionResult<T>` | `@/types` | Standard server action return type |
| `PresenceMember` | `@/stores/usePresenceStore` | Presence member data for avatar stack |
| `ReadingStatus` | `@prisma/client` | Enum: CURRENTLY_READING, FINISHED, WANT_TO_READ |

### Database Queries (No Schema Changes)

**getUserCurrentlyReading():**
```sql
-- UserBook WHERE userId=? AND status='CURRENTLY_READING' AND deletedAt IS NULL
-- LEFT JOIN on ReadingSession to get most recent session's endedAt
-- ORDER BY most recent session (or dateAdded if no session)
-- LIMIT 4
```

**getActiveBooksWithReaders():**
```sql
-- RoomPresence WHERE leftAt IS NULL AND lastActiveAt > NOW() - 30 minutes
-- GROUP BY bookId, COUNT readers, check if any isAuthor=true
-- JOIN Book for metadata
-- ORDER BY reader count DESC
```

**getPopularBooks():**
```sql
-- Books ranked by: COUNT(UserBook) + COUNT(ReadingSession WHERE createdAt > 7 days ago)
-- LIMIT 6
-- Also need user's bookIds to mark "already in library"
```

### File Locations for New Code

```
src/
├── actions/
│   └── home/                          # NEW folder
│       ├── getUserCurrentlyReading.ts  # AC1 data
│       ├── getActiveBooksWithReaders.ts # AC2 data
│       ├── getPopularBooks.ts          # AC3 data
│       └── index.ts                   # Re-exports
├── components/features/
│   └── home/                          # NEW folder
│       ├── ContinueReadingSection.tsx
│       ├── ContinueReadingCard.tsx
│       ├── ContinueReadingSkeleton.tsx
│       ├── ReadingNowSection.tsx
│       ├── ReadingNowCard.tsx
│       ├── ReadingNowSkeleton.tsx
│       ├── DiscoverSection.tsx
│       ├── DiscoverBookCard.tsx
│       ├── DiscoverSkeleton.tsx
│       └── index.ts                   # Re-exports
├── app/(main)/home/
│   ├── page.tsx                       # UPDATE - add parallel data fetching
│   └── HomeContent.tsx                # UPDATE - add section rendering
```

### Horizontal Scroll Pattern

Use a simple CSS overflow pattern for Reading Now and Discover sections:

```tsx
<div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
  <div className="flex gap-3 w-max">
    {cards.map(card => <Card key={card.id} />)}
  </div>
</div>
```

Ensure keyboard accessibility with `tabIndex={0}` and arrow key navigation on the scroll container.

### Golden Author Glow (Reading Now Cards)

Reference `AuthorShimmerBadge` styling. For the card border glow:

```tsx
<div className={cn(
  'rounded-xl border',
  hasAuthorPresence && 'border-[var(--author-shimmer,#eab308)] ring-2 ring-[var(--author-shimmer,#eab308)]/30'
)}>
```

### Project Structure Notes

- All new files follow the `@/` import alias convention
- Feature components in `src/components/features/home/` with `index.ts` re-exports
- Server actions in `src/actions/home/` with `index.ts` re-exports
- Co-locate tests: `*.test.tsx` alongside source files
- Naming: PascalCase components, camelCase actions

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision] — Home Screen uses "Cozy Minimal" direction with card-based currently reading + presence indicators
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#User Journey Flows] — Daily Reading Habit Loop: "Home → reading in 2 taps maximum"
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — Feature folder re-exports, component file structure
- [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns] — ActionResult<T> pattern for server actions
- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-homepage-2026-02-17.md] — Full change proposal with rationale
- [Source: src/actions/books/getUserLibrary.ts] — Reference implementation for book query + reader counts pattern
- [Source: src/components/features/books/LibraryBookCard.tsx] — Reference book card component with cover, progress, reader count
- [Source: src/components/features/presence/PresenceAvatarStack.tsx] — Presence avatar component with author shimmer ring

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References

### Completion Notes List
- Tasks 1-4 implemented, Task 5 (tests) partially done (existing test updated, new tests not yet written)
- Code review fixes applied: sort-before-slice in getUserCurrentlyReading, query limit in getPopularBooks, auth check in getActiveBooksWithReaders, PresenceAvatarStack added to ReadingNowCard, sign-out button removed from homepage
- Skeleton components created but not wired into Suspense boundaries (server-side fetch architecture means no client loading state)
- AC10 (skeleton loading with 200ms delay) deferred — requires architectural change to client-side fetching or Suspense boundaries

### File List
- src/actions/home/getUserCurrentlyReading.ts (NEW)
- src/actions/home/getActiveBooksWithReaders.ts (NEW)
- src/actions/home/getPopularBooks.ts (NEW)
- src/actions/home/index.ts (NEW)
- src/components/features/home/ContinueReadingCard.tsx (NEW)
- src/components/features/home/ContinueReadingSection.tsx (NEW)
- src/components/features/home/ContinueReadingSkeleton.tsx (NEW)
- src/components/features/home/ReadingNowCard.tsx (NEW)
- src/components/features/home/ReadingNowSection.tsx (NEW)
- src/components/features/home/ReadingNowSkeleton.tsx (NEW)
- src/components/features/home/DiscoverBookCard.tsx (NEW)
- src/components/features/home/DiscoverSection.tsx (NEW)
- src/components/features/home/DiscoverSkeleton.tsx (NEW)
- src/components/features/home/index.ts (NEW)
- src/app/(main)/home/page.tsx (MODIFIED)
- src/app/(main)/home/HomeContent.tsx (MODIFIED)
- src/app/(main)/home/HomeContent.test.tsx (MODIFIED)
