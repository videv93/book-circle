# Story 11.2: Post-Reading Recommendations

Status: done

## Story

As a user who just finished a book,
I want to receive personalized book recommendations,
So that I can discover my next read.

## Acceptance Criteria

1. **Given** a user marks a book as "finished", **When** the completion flow renders, **Then** 3-5 contextual recommendations are displayed based on the finished book, **And** each recommendation includes both purchase and free options (FR60), **And** social proof is shown ("X friends read this") when available (FR61).

2. **Given** a recommendation is displayed, **When** the user clicks a purchase option, **Then** the same affiliate tracking and redirect flow from Story 11.1 applies, **And** the recommendation source is tracked for conversion analysis.

3. **Given** the recommendation engine, **When** it generates recommendations, **Then** it uses the user's reading history and the current book's metadata, **And** recommendations are relevant to the genre and themes of the finished book.

## Tasks / Subtasks

- [x] Task 1: Create recommendation server action (AC: #3)
  - [x] 1.1 Create `src/actions/books/getRecommendations.ts` with `getRecommendations(bookId: string)` server action
  - [x] 1.2 Query OpenLibrary "works" API (`https://openlibrary.org/search.json?author={author}&limit=10`) to find books by the same author
  - [x] 1.3 Query OpenLibrary subject search (`https://openlibrary.org/search.json?q={title}&limit=10`) for similar titles/subjects
  - [x] 1.4 Merge and deduplicate results using existing `deduplicateResults()` from `src/services/books/index.ts`
  - [x] 1.5 Filter out the finished book itself (by ISBN match) and books already in user's library
  - [x] 1.6 Limit to 5 results, prioritizing same-author books first
  - [x] 1.7 Return `ActionResult<RecommendedBook[]>` using existing pattern from `src/actions/books/types.ts`
  - [x] 1.8 Add social proof data: for each recommended book, count friends (followed users) who have it in their library
  - [x] 1.9 Write unit tests mocking OpenLibrary responses and prisma queries

- [x] Task 2: Create RecommendationCard component (AC: #1, #2)
  - [x] 2.1 Create `src/components/features/books/RecommendationCard.tsx` as client component
  - [x] 2.2 Display book cover (or placeholder), title, author
  - [x] 2.3 Show social proof badge: "N friends read this" when count > 0 (FR61)
  - [x] 2.4 Include OpenLibrary free link (reuse pattern from `BookPurchaseButton`)
  - [x] 2.5 Include affiliate purchase link via `/api/affiliate?isbn={isbn}&provider=amazon&bookId={bookId}&source=recommendation` (FR60)
  - [x] 2.6 Add `source=recommendation` query param to affiliate URL for conversion tracking (AC: #2)
  - [x] 2.7 44px minimum touch targets, proper ARIA labels per CLAUDE.md
  - [x] 2.8 Write component tests with Testing Library

- [x] Task 3: Create PostReadingRecommendations container component (AC: #1)
  - [x] 3.1 Create `src/components/features/books/PostReadingRecommendations.tsx` as client component
  - [x] 3.2 Accept `bookId` and `bookTitle` props
  - [x] 3.3 Fetch recommendations on mount via the server action (use `useEffect` + `useState` or `useTransition`)
  - [x] 3.4 Show loading skeleton while fetching
  - [x] 3.5 Show empty state if no recommendations found ("No recommendations available")
  - [x] 3.6 Render 3-5 `RecommendationCard` components in a horizontal scroll or grid
  - [x] 3.7 Section header: "What to read next" or "Readers also enjoyed"
  - [x] 3.8 Write component tests (loading, empty, populated states)

- [x] Task 4: Integrate into BookDetail page for finished books (AC: #1)
  - [x] 4.1 In `src/components/features/books/BookDetail.tsx`, import `PostReadingRecommendations` with `React.lazy` + `Suspense`
  - [x] 4.2 Conditionally render when `currentStatus === 'FINISHED'`
  - [x] 4.3 Place between the purchase button section and the sessions section
  - [x] 4.4 Pass `bookId={book.id}` and `bookTitle={book.title}`
  - [x] 4.5 Verify no regression on existing BookDetail tests (currently 20 tests)

- [x] Task 5: Update affiliate route for source tracking (AC: #2)
  - [x] 5.1 In `src/app/api/affiliate/route.ts`, accept optional `source` query param (e.g., "recommendation", "detail")
  - [x] 5.2 Include `source` field in `AffiliateClick` prisma create if provided
  - [x] 5.3 Add `source` field to `AffiliateClick` model in `prisma/schema.prisma` (nullable String)
  - [x] 5.4 Run `npx prisma generate`
  - [x] 5.5 Update existing route tests to cover the `source` param

## Dev Notes

### Architecture Compliance

- **Server Actions pattern**: `getRecommendations` follows the exact pattern in `src/actions/books/updateReadingStatus.ts` — Zod validation, auth check, prisma query, `ActionResult<T>` return.
- **`@/` import alias**: All cross-boundary imports MUST use `@/` prefix per CLAUDE.md.
- **Lazy loading**: Use `React.lazy` + `Suspense` for the recommendations component (same pattern as `BookPurchaseButton` in `BookDetail.tsx`).
- **ActionResult<T> pattern**: Use discriminated union from `src/actions/books/types.ts`.

### Existing Code to Integrate With

- **Book Detail Page**: `src/components/features/books/BookDetail.tsx` — client component that orchestrates child components. The `PostReadingRecommendations` should be added as a new lazy-loaded child.
- **BookDetailActions**: `src/components/features/books/BookDetailActions.tsx` — manages `currentStatus` state including `FINISHED`. The parent `BookDetail` already tracks `currentStatus` in local state (line 27-29).
- **updateReadingStatus**: `src/actions/books/updateReadingStatus.ts` — sets `dateFinished` and `progress=100` when marking FINISHED. No changes needed here.
- **Book Search Service**: `src/services/books/index.ts` — has `searchBooks()`, `deduplicateResults()`, `searchOpenLibrary()`. Reuse these for fetching recommendation candidates.
- **OpenLibrary API**: `src/services/books/openLibrary.ts` — already configured with User-Agent header and cover URL construction. Use the same API patterns.
- **BookPurchaseButton**: `src/components/features/books/BookPurchaseButton.tsx` — reuse the affiliate link pattern (`/api/affiliate?isbn=...&provider=...&bookId=...`).
- **AffiliateClick model**: `prisma/schema.prisma` — needs `source` field added for conversion tracking by placement.
- **Social graph**: `prisma/schema.prisma` has `Follow` model (userId, followingId). Use this to find friends who read recommended books.
- **UserBook model**: Has `userId`, `bookId`, `status` fields. Query to find which followed users have a book in their library.
- **Activity Feed**: `src/actions/social/getActivityFeed.ts` — shows finished books from followed users. Reference pattern for querying followed user data.

### Recommendation Strategy

Since there is **no genre/category data** on the Book model and no existing recommendation engine:
1. **Same-author search**: Use OpenLibrary search by author name — highest relevance signal
2. **Title/subject search**: Use OpenLibrary search with the book's title keywords — discovers thematically similar books
3. **Library filtering**: Exclude books the user already has (query `UserBook` where `userId` matches)
4. **Social proof**: For each candidate, count followed users who have it via `UserBook` + `Follow` join
5. **Prioritization**: Same-author first, then by friend count, then by relevance

### Key Data Patterns

```typescript
// RecommendedBook type (new)
interface RecommendedBook {
  id?: string;          // bookId if exists in our DB
  title: string;
  author: string;
  coverUrl?: string;
  isbn10?: string;
  isbn13?: string;
  friendCount: number;  // Number of followed users who have this book
  source: 'author' | 'similar';  // How this recommendation was found
}
```

### Security Requirements

- Server action validates auth before querying social proof data
- Affiliate links use same server-side generation (never expose IDs in client)
- OpenLibrary API calls happen server-side only

### Testing Standards

- **Vitest + Testing Library** for component tests
- **Co-locate tests** with source files
- **Mock external dependencies**: Mock OpenLibrary fetch calls, mock `prisma` for DB queries, mock `auth.api.getSession` for auth
- **Test states**: Loading, empty recommendations, populated recommendations, social proof display, affiliate link generation

### Project Structure Notes

- New files:
  - `src/actions/books/getRecommendations.ts` — server action (like `getBookById.ts`)
  - `src/actions/books/getRecommendations.test.ts` — server action tests
  - `src/components/features/books/RecommendationCard.tsx` — individual recommendation card
  - `src/components/features/books/RecommendationCard.test.tsx` — card tests
  - `src/components/features/books/PostReadingRecommendations.tsx` — container component
  - `src/components/features/books/PostReadingRecommendations.test.tsx` — container tests
- Modified files:
  - `src/components/features/books/BookDetail.tsx` — add lazy-loaded recommendations
  - `src/components/features/books/BookDetail.test.tsx` — add recommendation visibility tests
  - `src/app/api/affiliate/route.ts` — add `source` param support
  - `src/app/api/affiliate/route.test.ts` — test `source` param
  - `prisma/schema.prisma` — add `source` field to `AffiliateClick`

### Previous Story Learnings (from 11.1)

- Use `React.lazy` + `Suspense` for lazy loading (was caught in code review when using direct import)
- Always create integration/route tests (was caught when missing)
- Include both Amazon AND Bookshop.org purchase options (was caught when only Amazon was shown)
- ISBN validation should use `/^(\d{9}[\dX]|\d{13})$/` pattern
- Mock `BookPurchaseButton` (and similar child components) in parent tests using `vi.mock`
- `npx prisma db push` will fail without DB credentials — that's expected, `npx prisma generate` is sufficient

### References

- [Source: _bmad-output/planning-artifacts/epics-affiliate-monetization.md#Story 11.2]
- [Source: src/actions/books/updateReadingStatus.ts#FINISHED handling]
- [Source: src/services/books/index.ts#searchBooks, deduplicateResults]
- [Source: src/services/books/openLibrary.ts#OpenLibrary API]
- [Source: src/components/features/books/BookDetail.tsx#currentStatus state]
- [Source: src/components/features/books/BookPurchaseButton.tsx#affiliate link pattern]
- [Source: src/actions/social/getActivityFeed.ts#followed user queries]
- [Source: prisma/schema.prisma#UserBook, Follow, AffiliateClick models]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Pre-existing test failure: BookDetailActions.test.tsx (DATABASE_URL env var missing) — unrelated to this story
- Prisma db push skipped (no local DB credentials) — prisma generate succeeded

### Completion Notes List

- Task 5: Added `source` nullable field to AffiliateClick model, updated route to accept and store `source` query param, added route test. 12 route tests passing.
- Task 1: Created `getRecommendations` server action with dual OpenLibrary search (author + title), deduplication, library filtering, ISBN filtering, social proof via Follow+UserBook join. 7 unit tests passing.
- Task 2: Created `RecommendationCard` component with cover/placeholder, title, author, social proof badge, OpenLibrary free link, Amazon + Bookshop.org affiliate links with `source=recommendation`. 10 component tests passing.
- Task 3: Created `PostReadingRecommendations` container with useEffect fetch, loading skeleton, empty/error state (returns null), horizontal scroll layout, "What to read next" header. 5 component tests passing.
- Task 4: Integrated into BookDetail.tsx with React.lazy + Suspense, conditionally rendered when `currentStatus === 'FINISHED'`. 23 BookDetail tests passing (3 new: finished shows recs, reading hides recs, no-status hides recs).
- Code Review Fixes: Added `bookId` to affiliate URLs for click tracking (H1), added Zod validation to `getRecommendations` (H2), removed unused `bookTitle` prop (M1), fixed social proof ISBN mismatch double-counting (M2), added social proof + Zod validation tests (M3), fixed `let` → `const` (L1). 47 tests passing.

### File List

- prisma/schema.prisma (modified — added `source` field to AffiliateClick model)
- src/actions/books/getRecommendations.ts (new — recommendation server action with OpenLibrary search + social proof)
- src/actions/books/getRecommendations.test.ts (new — 9 unit tests)
- src/components/features/books/RecommendationCard.tsx (new — individual recommendation card with affiliate links)
- src/components/features/books/RecommendationCard.test.tsx (new — 10 component tests)
- src/components/features/books/PostReadingRecommendations.tsx (new — container component with loading/empty states)
- src/components/features/books/PostReadingRecommendations.test.tsx (new — 5 component tests)
- src/components/features/books/BookDetail.tsx (modified — added lazy-loaded PostReadingRecommendations for FINISHED books)
- src/components/features/books/BookDetail.test.tsx (modified — added 3 recommendation visibility tests)
- src/app/api/affiliate/route.ts (modified — added `source` query param support)
- src/app/api/affiliate/route.test.ts (modified — added source param test)
