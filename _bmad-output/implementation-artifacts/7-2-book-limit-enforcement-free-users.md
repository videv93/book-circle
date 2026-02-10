# Story 7.2: Book Limit Enforcement for Free Users

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a free tier user,
I want to be able to track up to 3 books,
So that I can experience the app's value before deciding to upgrade.

## Acceptance Criteria

1. **Given** a free tier user with fewer than 3 books **When** they add a new book **Then** the book is added successfully
2. **Given** a free tier user with exactly 3 books **When** they attempt to add a 4th book **Then** the server action returns an error indicating the book limit is reached **And** the error includes the user's current premium status **And** enforcement happens at the server action level, not client-side only (NFR2)
3. **Given** a premium user **When** they add any number of books **Then** the book is added successfully with no limit enforced

## Tasks / Subtasks

- [x] Task 1: Add FREE_TIER_BOOK_LIMIT constant (AC: 1, 2)
  - [x] 1.1: Add `FREE_TIER_BOOK_LIMIT = 3` to `src/lib/config/constants.ts`

- [x] Task 2: Add book limit error type for structured error response (AC: 2)
  - [x] 2.1: Add `BookLimitError` type to `src/actions/books/types.ts` with fields: `code: 'BOOK_LIMIT_REACHED'`, `premiumStatus`, `currentBookCount`, `maxBooks`
  - [x] 2.2: Add `AddToLibraryResult` type alias that extends `ActionResult<UserBookWithBook>` to include the `BookLimitError` branch

- [x] Task 3: Implement book limit enforcement in addToLibrary server action (AC: 1, 2, 3)
  - [x] 3.1: Import `isPremium` from `@/lib/premium` and `FREE_TIER_BOOK_LIMIT` from `@/lib/config/constants`
  - [x] 3.2: After auth check and existing book lookup, if user already has this book (not deleted) return "already in library" (unchanged behavior)
  - [x] 3.3: For non-premium users only: count user's active books (`deletedAt === null` via `prisma.userBook.count`) and if `count >= FREE_TIER_BOOK_LIMIT`, return `BookLimitError` with `premiumStatus: 'FREE'`, `currentBookCount`, and `maxBooks`
  - [x] 3.4: Premium users bypass the limit check entirely (isPremium returns true → skip count query)
  - [x] 3.5: Update function return type to `Promise<AddToLibraryResult>`

- [x] Task 4: Write comprehensive unit tests for book limit enforcement (AC: 1, 2, 3)
  - [x] 4.1: Test free user with < 3 active books can add a book successfully
  - [x] 4.2: Test free user with exactly 3 active books receives `BOOK_LIMIT_REACHED` error with correct metadata (premiumStatus, currentBookCount, maxBooks)
  - [x] 4.3: Test premium user can add books with no limit enforced (isPremium returns true)
  - [x] 4.4: Test soft-deleted books are excluded from the active book count
  - [x] 4.5: Test restoring a soft-deleted book is blocked when at limit (restore would increase active count)
  - [x] 4.6: Test "already in library" error still works for non-deleted duplicates regardless of limit

## Dev Notes

### Architecture Requirements

- **Server Action Pattern:** `addToLibrary` uses the `ActionResult<T>` discriminated union pattern. The book limit error MUST be an extension of this pattern — not a thrown error. Consumers check `success === false` and can optionally check `code === 'BOOK_LIMIT_REACHED'` for the specific case.
- **Enforcement Location:** The limit check MUST happen inside the server action (NFR2: "Server action validation as primary enforcement — no client-side-only gating"). There is NO client-side pre-check in this story.
- **isPremium() Utility:** Use the existing `isPremium(userId)` from `@/lib/premium.ts`. This was created in Story 7.1. It returns `Promise<boolean>` and handles non-existent users and DB errors safely (returns false).
- **Import Convention:** ALWAYS use `@/` alias for cross-boundary imports.
- **Constant Definition:** Add `FREE_TIER_BOOK_LIMIT` to the existing constants file at `src/lib/config/constants.ts`. This is the single source of truth for the limit value.
- **Soft-Delete Awareness:** `UserBook.deletedAt` is used for soft-deletion. Active books are those with `deletedAt === null`. The count query MUST filter on this.

### Technical Specifications

- **Prisma Count Query:** Use `prisma.userBook.count({ where: { userId, deletedAt: null } })` to count active books efficiently (database-level count, not fetching records).
- **Testing Framework:** Vitest with `vi.mock` for Prisma — follow the pattern in `src/lib/premium.test.ts`.
- **Mock Pattern:** Mock `@/lib/prisma` AND `@/lib/premium` (for isPremium). Mock `next/headers` for auth in server action tests.
- **Error Response Structure:** The `BookLimitError` type must include: `{ success: false; error: string; code: 'BOOK_LIMIT_REACHED'; premiumStatus: string; currentBookCount: number; maxBooks: number }`. This allows Story 7.3 (Upgrade Prompt UI) to display "X/3 books" and trigger the upgrade prompt based on the error code.

### Critical Implementation Details

1. **Limit check placement in flow:** The limit check MUST happen AFTER the "already in library" check for non-deleted books, but BEFORE creating a new UserBook or restoring a soft-deleted one. This prevents false limit errors when a user tries to add a book they already have (active).
2. **Restore behavior:** If a user is at the 3-book limit and tries to restore a soft-deleted book, this SHOULD be blocked — restoring would increase active count to 4. The limit applies to the end state, not just "new" additions.
3. **Premium check optimization:** Call `isPremium(userId)` once, before the count query. If premium, skip the count query entirely (saves a DB call).
4. **No Prisma schema changes:** Story 7.1 already added all required schema changes. This story only modifies server action logic and adds a constant.
5. **No UI changes in this story:** The upgrade prompt and "X/3 books" UI hints are Story 7.3. This story is purely server-side enforcement.
6. **ActionResult compatibility:** The `BookLimitError` type is a superset of `{ success: false; error: string }`. Existing consumers that only check `success` and `error` will continue to work. The `code`, `premiumStatus`, `currentBookCount`, and `maxBooks` fields are additional.

### Existing Code to NOT Modify

- `prisma/schema.prisma` — No schema changes needed
- `src/lib/premium.ts` — Already complete from Story 7.1
- `src/lib/billing/types.ts` — Payment provider interface unchanged
- Any UI/component files — No UI work in this story

### Testing Strategy

- **Unit tests for addToLibrary limit enforcement:** Mock Prisma client (userBook.count, userBook.create, etc.), mock isPremium, mock auth headers
- **Test cases:** Free user under limit (success), free user at limit (BOOK_LIMIT_REACHED error), premium user unlimited (success), soft-deleted excluded from count, restore blocked at limit, duplicate detection unchanged
- **Test file location:** `src/actions/books/addToLibrary.test.ts` (co-located with source)
- **No integration tests needed:** This is a server action test with mocked dependencies
- **No E2E tests needed:** No user-facing UI changes in this story

### File Structure Plan

```
src/
├── lib/
│   └── config/
│       └── constants.ts          # MODIFIED: Add FREE_TIER_BOOK_LIMIT = 3
├── actions/
│   └── books/
│       ├── types.ts              # MODIFIED: Add BookLimitError type, AddToLibraryResult alias
│       ├── addToLibrary.ts       # MODIFIED: Add isPremium check + book count enforcement
│       └── addToLibrary.test.ts  # NEW: Comprehensive unit tests for limit enforcement
```

### Previous Story Intelligence (Story 7.1)

- **Prisma mock pattern:** `vi.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique: vi.fn() } } }))` — extend for `userBook.count`, `userBook.create`, etc.
- **isPremium is simple:** Returns `Promise<boolean>`, handles errors with safe default (false). Can be mocked as `vi.fn().mockResolvedValue(true/false)`.
- **Schema confirmed:** `PremiumStatus` enum (FREE/PREMIUM), `premiumStatus` field on User with default FREE — all already in place.
- **Code review lesson:** Story 7.1 code review found redundant index and missing decimal precision. For this story, ensure no unnecessary DB queries (use count instead of findMany).

### Git Intelligence

Recent commits show:
- `bcb6090`: Story 7.1 added premium data model, isPremium utility — our foundation
- `225d150`: Story 6.7 admin panel — unrelated
- Pattern: Feature commits use `feat:` prefix with story reference

### Project Structure Notes

- `src/actions/books/addToLibrary.ts` follows the standard server action pattern (auth → validate → DB operation → return ActionResult)
- `src/actions/books/types.ts` defines `ActionResult<T>` locally for books domain (not a shared type)
- Constants in `src/lib/config/constants.ts` follow SCREAMING_SNAKE_CASE per architecture document
- Tests co-located with source files per architecture document

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2] — Acceptance criteria for book limit enforcement
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1] — Premium Schema & Book Limit Enforcement overview
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — Server action return pattern (ActionResult<T>)
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — SCREAMING_SNAKE_CASE for constants, @/ import alias
- [Source: src/actions/books/addToLibrary.ts] — Current addToLibrary implementation to modify
- [Source: src/actions/books/types.ts] — ActionResult type definition to extend
- [Source: src/lib/premium.ts] — isPremium utility from Story 7.1
- [Source: src/lib/premium.test.ts] — Mock pattern reference for Prisma/isPremium tests
- [Source: src/lib/config/constants.ts] — Existing constants file to extend
- [Source: prisma/schema.prisma] — Current schema with PremiumStatus enum and UserBook soft-delete
- [Source: _bmad-output/implementation-artifacts/7-1-premium-data-model-status-utility.md] — Previous story learnings and patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- All 1702 tests pass (181 test files), including 17 addToLibrary tests (9 new for book limit)
- Lint: 66 errors, 50 warnings — all pre-existing (none in modified files)
- Typecheck: 3 errors — all pre-existing (Capacitor, Vercel Analytics/Speed Insights module declarations)

### Completion Notes List

- Task 1: Added `FREE_TIER_BOOK_LIMIT = 3` constant to `src/lib/config/constants.ts`
- Task 2: Added `BookLimitError` type and `AddToLibraryResult` type alias to `src/actions/books/types.ts`. BookLimitError is a superset of the standard error branch, maintaining backward compatibility.
- Task 3: Modified `addToLibrary` server action to enforce 3-book limit for free users. Premium users bypass via `isPremium()`. Limit check placed after "already in library" detection but before restore/create. Both new additions and soft-delete restores are gated. Error response includes `code: 'BOOK_LIMIT_REACHED'`, `premiumStatus`, `currentBookCount`, and `maxBooks` for Story 7.3 UI consumption.
- Task 4: Updated existing test file with 9 new book limit enforcement tests covering: free user under limit, free user at limit, premium bypass, soft-delete exclusion, restore blocking at limit, restore under limit, duplicate detection unchanged, premium restore, and error metadata validation.

### Change Log

- 2026-02-10: Implementation complete — All 4 tasks implemented. Book limit enforcement active at server action level per NFR2.

### File List

- `src/lib/config/constants.ts` — MODIFIED: Added FREE_TIER_BOOK_LIMIT = 3
- `src/actions/books/types.ts` — MODIFIED: Added BookLimitError type, AddToLibraryResult type alias
- `src/actions/books/addToLibrary.ts` — MODIFIED: Added isPremium check + book count enforcement for free users
- `src/actions/books/addToLibrary.test.ts` — MODIFIED: Added 9 book limit enforcement tests, updated mocks for isPremium and userBook.count/update
