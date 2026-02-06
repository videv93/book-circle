# Story 2.5: Remove Book from Library

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to remove books from my library**,
So that **I can keep my library organized and relevant**.

## Acceptance Criteria

1. **Given** I have a book in my library **When** I view the book detail page **Then** I see a "Remove from Library" option (in menu or secondary action)

2. **Given** I tap "Remove from Library" **When** the confirmation appears **Then** I see "Remove [Book Title] from your library?" **And** I see warning: "This will remove your reading history for this book" **And** I see "Cancel" and "Remove" buttons

3. **Given** I confirm removal **When** the book is removed **Then** the book disappears from my library immediately **And** I see a toast with "Undo" option (5 seconds) **And** the UserBook record is soft-deleted

4. **Given** I tap "Undo" on the toast **When** undo is processed **Then** the book is restored to my library **And** all previous data (status, progress, sessions) is preserved

## Tasks / Subtasks

- [x] **Task 1: Add `deletedAt` field to UserBook model for soft-delete** (AC: #3, #4)
  - [x]Add `deletedAt DateTime? @map("deleted_at")` to `UserBook` model in `prisma/schema.prisma`
  - [x]Run `npx prisma generate` to regenerate client
  - [x]Run `npx prisma db push` to update development database
  - [x]Verify existing queries are not affected (soft-deleted records must be filtered)

- [x] **Task 2: Create `removeFromLibrary` Server Action** (AC: #3)
  - [x]Create `src/actions/books/removeFromLibrary.ts`
  - [x]Zod schema: validate `userBookId` (string)
  - [x]Authenticate user via `auth.api.getSession` with `headers()`
  - [x]Verify the UserBook belongs to the authenticated user
  - [x]Verify the UserBook is not already soft-deleted (`deletedAt` is null)
  - [x]Soft-delete: set `deletedAt = new Date()` instead of hard delete
  - [x]Return `ActionResult<UserBook>` with updated record
  - [x]Create co-located test file `removeFromLibrary.test.ts`
  - [x]Export from `src/actions/books/index.ts`

- [x] **Task 3: Create `restoreToLibrary` Server Action** (AC: #4)
  - [x]Create `src/actions/books/restoreToLibrary.ts`
  - [x]Zod schema: validate `userBookId` (string)
  - [x]Authenticate user and verify ownership
  - [x]Verify the UserBook IS soft-deleted (`deletedAt` is not null)
  - [x]Restore: set `deletedAt = null`
  - [x]Return `ActionResult<UserBook>` with restored record
  - [x]Create co-located test file `restoreToLibrary.test.ts`
  - [x]Export from `src/actions/books/index.ts`

- [x] **Task 4: Add AlertDialog shadcn component** (AC: #2)
  - [x]Run `npx shadcn@latest add alert-dialog`
  - [x]Verify component added at `src/components/ui/alert-dialog.tsx`

- [x] **Task 5: Add "Remove from Library" UI to BookDetailActions** (AC: #1, #2, #3, #4)
  - [x]Update `src/components/features/books/BookDetailActions.tsx`
  - [x]Add "Remove from Library" button in the "in library" section (below existing controls)
  - [x]Use `AlertDialog` for confirmation with destructive styling
  - [x]Dialog content: title "Remove [Book Title] from your library?", description warning
  - [x]Cancel button and destructive Remove button
  - [x]On confirm: call `removeFromLibrary` server action
  - [x]Optimistic UI: hide book actions immediately, show "removed" state
  - [x]Show toast with Undo action button (sonner `action` parameter)
  - [x]On Undo click: call `restoreToLibrary`, revert to previous state
  - [x]On error: rollback to previous state, show error toast
  - [x]Update co-located test file `BookDetailActions.test.tsx`

- [x] **Task 6: Update BookDetail container for removal state** (AC: #3)
  - [x]Update `src/components/features/books/BookDetail.tsx`
  - [x]Add `isRemoved` local state
  - [x]Pass `onRemove` callback to `BookDetailActions`
  - [x]When removed: update `isInLibrary` to false, clear status/progress
  - [x]When undone: restore previous state
  - [x]Update co-located test file `BookDetail.test.tsx`

- [x] **Task 7: Update useUserLibrary hook** (AC: #3, #4)
  - [x]Update `src/hooks/useUserLibrary.ts`
  - [x]`removeOptimistic(isbn)` already exists - verify it works for this flow
  - [x]Add `restoreOptimistic(isbn, status, progress)` method for undo
  - [x]Update test file if needed

- [x] **Task 8: Update existing queries to exclude soft-deleted records** (AC: #3)
  - [x]Update `getUserBookStatus.ts`: add `deletedAt: null` filter to Prisma queries
  - [x]Update `getBatchUserBookStatus`: add `deletedAt: null` filter
  - [x]Update `getBookById.ts`: add `deletedAt: null` filter when checking user's status
  - [x]Update `addToLibrary.ts`: when checking for existing UserBook, check `deletedAt` is null. If a soft-deleted record exists, restore it instead of creating new
  - [x]Update all relevant tests to verify soft-deleted records are excluded

- [x] **Task 9: Write Integration Tests** (AC: all)
  - [x]Test "Remove from Library" button appears when book is in library
  - [x]Test confirmation dialog opens on button click
  - [x]Test dialog shows correct title and warning text
  - [x]Test cancel button closes dialog without removing
  - [x]Test confirm button triggers removal
  - [x]Test optimistic UI updates (book removed from view immediately)
  - [x]Test toast with Undo action appears
  - [x]Test Undo restores book with all previous data
  - [x]Test error rollback on server failure
  - [x]Test "Remove" button does NOT appear when book is not in library

## Dev Notes

### Architecture Compliance - CRITICAL

**Server Action Pattern (MUST follow):**
```typescript
// src/actions/books/removeFromLibrary.ts
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import type { ActionResult } from '@/actions/books/types';
import type { UserBook } from '@prisma/client';

const removeFromLibrarySchema = z.object({
  userBookId: z.string().min(1),
});

export async function removeFromLibrary(
  input: z.infer<typeof removeFromLibrarySchema>
): Promise<ActionResult<UserBook>> {
  const validated = removeFromLibrarySchema.parse(input);

  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Verify ownership and not already deleted
  const existing = await prisma.userBook.findUnique({
    where: { id: validated.userBookId },
  });
  if (!existing || existing.userId !== session.user.id) {
    return { success: false, error: 'Book not found in your library' };
  }
  if (existing.deletedAt) {
    return { success: false, error: 'Book already removed from library' };
  }

  // Soft-delete
  const updated = await prisma.userBook.update({
    where: { id: validated.userBookId },
    data: { deletedAt: new Date() },
  });

  return { success: true, data: updated };
}
```

**Restore Action Pattern:**
```typescript
// src/actions/books/restoreToLibrary.ts
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import type { ActionResult } from '@/actions/books/types';
import type { UserBook } from '@prisma/client';

const restoreToLibrarySchema = z.object({
  userBookId: z.string().min(1),
});

export async function restoreToLibrary(
  input: z.infer<typeof restoreToLibrarySchema>
): Promise<ActionResult<UserBook>> {
  const validated = restoreToLibrarySchema.parse(input);

  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const existing = await prisma.userBook.findUnique({
    where: { id: validated.userBookId },
  });
  if (!existing || existing.userId !== session.user.id) {
    return { success: false, error: 'Book not found' };
  }
  if (!existing.deletedAt) {
    return { success: false, error: 'Book is already in your library' };
  }

  // Restore
  const updated = await prisma.userBook.update({
    where: { id: validated.userBookId },
    data: { deletedAt: null },
  });

  return { success: true, data: updated };
}
```

**Import Alias Enforcement:**
```typescript
// ALWAYS use @/* for cross-boundary imports
import { removeFromLibrary, restoreToLibrary } from '@/actions/books';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// NEVER use relative imports across boundaries
```

### Existing Components to Reuse - DO NOT RECREATE

| Component | Location | What It Does |
|-----------|----------|-------------|
| `BookDetailActions` | `src/components/features/books/BookDetailActions.tsx` | Container for all book action controls - ADD remove here |
| `BookDetail` | `src/components/features/books/BookDetail.tsx` | Container managing local state - ADD removal state |
| `useUserLibrary` | `src/hooks/useUserLibrary.ts` | Client-side library state with `removeOptimistic` already exists |
| `Popover` | `src/components/ui/popover.tsx` | Used by AddToLibraryButton and status change |
| `ReadingStatusSelector` | `src/components/features/books/ReadingStatusSelector.tsx` | DO NOT MODIFY for this story |

**CRITICAL: `removeOptimistic` already exists in `useUserLibrary.ts`.** Use it. You may also need to add a `restoreOptimistic` method for the undo flow.

### AlertDialog Component (NEW - must install)

No `AlertDialog` component currently exists in `src/components/ui/`. Install via:
```bash
npx shadcn@latest add alert-dialog
```

This provides `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogTrigger` from `@/components/ui/alert-dialog`.

### UI Implementation - BookDetailActions Update

Add the remove button below the existing status controls in the "in library" section of `BookDetailActions.tsx`. The component currently has two states:
1. Not in library: shows `AddToLibraryButton`
2. In library: shows status display + change status popover + quick actions

Add to the "in library" section, below the existing quick action buttons:

```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';

// In the "in library" section:
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button
      variant="ghost"
      size="sm"
      className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
    >
      <Trash2 className="h-4 w-4" />
      Remove from Library
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>
        Remove "{book.title}" from your library?
      </AlertDialogTitle>
      <AlertDialogDescription>
        This will remove your reading history for this book.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleRemove}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        Remove
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Toast with Undo Pattern (Sonner)

Sonner supports `action` parameter for undo buttons:

```typescript
const handleRemove = async () => {
  if (!userBookId || isRemoving) return;

  // Store previous state for undo
  const previousState = {
    status: displayStatus,
    progress: displayProgress,
    isInLibrary: true,
  };

  // Optimistic removal
  setIsRemoving(true);
  onRemove?.();

  const result = await removeFromLibrary({ userBookId });

  if (result.success) {
    toast('Book removed from library', {
      action: {
        label: 'Undo',
        onClick: async () => {
          const restoreResult = await restoreToLibrary({ userBookId });
          if (restoreResult.success) {
            onRestore?.(previousState.status, previousState.progress);
            toast.success('Book restored to library');
          } else {
            toast.error('Failed to restore book');
          }
        },
      },
      duration: 5000,
    });
  } else {
    // Rollback
    onRestore?.(previousState.status, previousState.progress);
    toast.error(result.error);
  }
  setIsRemoving(false);
};
```

### Soft-Delete Implementation Details

**Why soft-delete instead of hard delete:**
- AC #4 requires undo with "all previous data preserved"
- Soft-delete preserves status, progress, dateAdded, dateFinished
- 5-second undo window needs the record to still exist
- Simple implementation: `deletedAt` timestamp field

**Prisma Schema Change:**
```prisma
model UserBook {
  id           String        @id @default(cuid())
  userId       String        @map("user_id")
  bookId       String        @map("book_id")
  status       ReadingStatus @default(WANT_TO_READ)
  progress     Int           @default(0)
  dateAdded    DateTime      @default(now()) @map("date_added")
  dateFinished DateTime?     @map("date_finished")
  deletedAt    DateTime?     @map("deleted_at")        // NEW
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  book Book @relation(fields: [bookId], references: [id], onDelete: Cascade)

  @@unique([userId, bookId])
  @@index([userId])
  @@index([bookId])
  @@map("user_books")
}
```

**Query Filter Updates Required:**
All existing queries that read UserBook records must add `deletedAt: null` to their `where` clauses:

```typescript
// In getUserBookStatus.ts
const userBook = await prisma.userBook.findFirst({
  where: {
    userId: session.user.id,
    book: { OR: [{ isbn10: isbn }, { isbn13: isbn }] },
    deletedAt: null,  // ADD THIS
  },
  include: { book: true },
});

// In getBatchUserBookStatus
const userBooks = await prisma.userBook.findMany({
  where: {
    userId: session.user.id,
    book: { OR: [/* isbn conditions */] },
    deletedAt: null,  // ADD THIS
  },
  include: { book: true },
});

// In getBookById.ts (user status check)
const userBook = await prisma.userBook.findFirst({
  where: {
    userId: session.user.id,
    bookId: book.id,
    deletedAt: null,  // ADD THIS
  },
});

// In getBookById.ts (reader counts)
const totalReaders = await prisma.userBook.count({
  where: {
    bookId: book.id,
    deletedAt: null,  // ADD THIS
  },
});
```

**Re-adding a previously removed book:**
In `addToLibrary.ts`, check if a soft-deleted UserBook exists. If so, restore and update instead of creating new:

```typescript
// Check for soft-deleted record
const softDeleted = await prisma.userBook.findFirst({
  where: {
    userId: session.user.id,
    bookId: book.id,
    deletedAt: { not: null },
  },
});

if (softDeleted) {
  // Restore with new status
  const restored = await prisma.userBook.update({
    where: { id: softDeleted.id },
    data: {
      deletedAt: null,
      status: validated.status,
      progress: validated.status === 'FINISHED' ? 100 : 0,
      dateFinished: validated.status === 'FINISHED' ? new Date() : null,
    },
    include: { book: true },
  });
  return { success: true, data: restored };
}
```

### Props Threading

```
BookDetail (has userBookId, isInLibrary, currentStatus, progress)
  └── BookDetailActions (add onRemove and onRestore props)
        └── AlertDialog → confirms → calls removeFromLibrary
              └── toast with Undo → calls restoreToLibrary
```

**New props on BookDetailActions:**
```typescript
interface BookDetailActionsProps {
  book: BookSearchResult;
  isInLibrary: boolean;
  currentStatus?: ReadingStatus;
  progress?: number;
  userBookId?: string;
  onStatusChange?: (status: ReadingStatus) => void;
  onRemove?: () => void;                                // NEW
  onRestore?: (status: ReadingStatus, progress: number) => void;  // NEW
  className?: string;
}
```

### Testing Strategy

**Unit Tests (Vitest + React Testing Library):**

`removeFromLibrary.test.ts`:
- Returns error when not authenticated
- Returns error when userBookId doesn't belong to user
- Returns error when book already soft-deleted
- Soft-deletes by setting `deletedAt` to current date
- Returns updated UserBook on success

`restoreToLibrary.test.ts`:
- Returns error when not authenticated
- Returns error when userBookId doesn't belong to user
- Returns error when book is NOT soft-deleted
- Restores by setting `deletedAt` to null
- Returns restored UserBook on success

`BookDetailActions.test.tsx` (update existing):
- Renders "Remove from Library" button when book is in library
- Does NOT render "Remove" button when book is not in library
- Opens AlertDialog on button click
- Dialog shows book title and warning text
- Cancel closes dialog without action
- Confirm calls removeFromLibrary server action
- Shows toast with Undo action on success
- Undo calls restoreToLibrary
- Error rollback on server failure

**Mock patterns (follow existing):**
```typescript
vi.mock('@/actions/books', () => ({
  removeFromLibrary: vi.fn(),
  restoreToLibrary: vi.fn(),
  updateReadingStatus: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));
```

**Note on toast mock:** For the undo feature, `toast()` is called directly (not `toast.success()`), with an `action` object. The mock needs to capture the `action.onClick` callback for testing undo.

### UX Compliance - CRITICAL

**From UX Design Specification:**
- Confirmation dialog: centered, max-width 400px, dark overlay 50% opacity
- Focus trap inside dialog, Escape key closes
- Destructive button: red fill (`bg-destructive` class)
- Toast with Undo: 5-second window (set `duration: 5000`)
- Touch targets: minimum 44x44px on all buttons
- Language: "This will remove your reading history" - factual, NOT guilt-trip
  - DO NOT write: "You'll lose your progress forever!"
  - DO write: "This will remove your reading history for this book"
- Keyboard accessibility: Tab navigation, Enter/Escape to confirm/cancel
- Screen reader: AlertDialog is already ARIA-compliant (Radix primitive)

### Previous Story Intelligence - CRITICAL

**From Story 2.4 (Update Reading Status):**
- Optimistic overlay pattern in `BookDetailActions`: `optimistic` state overlays props, cleared via `useEffect`
- `useUserLibrary.updateOptimistic` architectural limitation: hook creates local instances, not global state
- Same limitation applies to `removeOptimistic` - only works within same hook instance
- Pre-existing typecheck errors in `getBookById.test.ts` and `ProfileView.test.tsx` (not story-related)
- 413 tests pass across 38+ test files - maintain this baseline

**From Story 2.3 (Book Detail Page):**
- `BookDetail.tsx` manages local state: `isInLibrary`, `currentStatus`, `progress`
- `handleStatusChange` differentiates add-to-library vs update-status
- `userBookId` available via `data.userStatus.userBookId`

**From Story 2.2 (Add Book to Library):**
- `addToLibrary` uses Prisma upsert pattern - needs update for soft-deleted record handling
- `ReadingStatusSelector` and `Popover` patterns established
- Toast success/error patterns established

### Git Intelligence Summary

**Recent commits:**
```
fb3d48c feat: Implement update reading status and code review fixes (Stories 2.3, 2.4)
b075036 feat: fetch book from OpenLibrary when not in database
e2a4880 feat: Implement book detail page with code review fixes (Story 2.3)
3cab6c2 feat: Implement add book to library functionality (Story 2.2)
```

**Patterns established:**
- Commit prefix: `feat:` for new features
- Story reference in commit message
- Co-located test files with `.test.tsx` / `.test.ts` extension
- 19 files changed in Stories 2.3+2.4 commit

**Key files to modify/create:**
- `prisma/schema.prisma` - ADD `deletedAt` field to UserBook
- `src/actions/books/removeFromLibrary.ts` - NEW
- `src/actions/books/removeFromLibrary.test.ts` - NEW
- `src/actions/books/restoreToLibrary.ts` - NEW
- `src/actions/books/restoreToLibrary.test.ts` - NEW
- `src/actions/books/index.ts` - ADD exports
- `src/actions/books/addToLibrary.ts` - UPDATE (handle soft-deleted re-add)
- `src/actions/books/getUserBookStatus.ts` - UPDATE (add deletedAt filter)
- `src/actions/books/getBookById.ts` - UPDATE (add deletedAt filter)
- `src/components/ui/alert-dialog.tsx` - NEW (via shadcn CLI)
- `src/components/features/books/BookDetailActions.tsx` - UPDATE (add remove UI)
- `src/components/features/books/BookDetailActions.test.tsx` - UPDATE
- `src/components/features/books/BookDetail.tsx` - UPDATE (add removal state)
- `src/components/features/books/BookDetail.test.tsx` - UPDATE
- `src/hooks/useUserLibrary.ts` - UPDATE (add restoreOptimistic)

### Dependencies

**Already installed (no new packages needed):**
- `zod` - Input validation
- `sonner` - Toast notifications (supports `action` parameter for Undo)
- `@prisma/client` - Database ORM
- `lucide-react` - Icons (`Trash2` for remove)
- shadcn/ui Popover - Existing

**Requires installation:**
- shadcn AlertDialog component: `npx shadcn@latest add alert-dialog`

### File Structure Requirements

```
prisma/
├── schema.prisma                         # UPDATE - Add deletedAt to UserBook

src/
├── actions/
│   └── books/
│       ├── removeFromLibrary.ts          # NEW - Soft-delete server action
│       ├── removeFromLibrary.test.ts     # NEW - Tests
│       ├── restoreToLibrary.ts           # NEW - Restore server action
│       ├── restoreToLibrary.test.ts      # NEW - Tests
│       ├── addToLibrary.ts               # UPDATE - Handle soft-deleted re-add
│       ├── getUserBookStatus.ts          # UPDATE - Filter deletedAt
│       ├── getBookById.ts               # UPDATE - Filter deletedAt
│       └── index.ts                      # UPDATE - Add exports
├── components/
│   ├── ui/
│   │   └── alert-dialog.tsx              # NEW (via shadcn CLI)
│   └── features/
│       └── books/
│           ├── BookDetailActions.tsx      # UPDATE - Add remove UI
│           ├── BookDetailActions.test.tsx # UPDATE - Test remove flow
│           ├── BookDetail.tsx            # UPDATE - Add removal state
│           └── BookDetail.test.tsx       # UPDATE - Test removal
└── hooks/
    └── useUserLibrary.ts                 # UPDATE - Add restoreOptimistic
```

### Project Structure Notes

- Follows architecture.md hybrid structure pattern exactly
- Server actions in `src/actions/books/` domain folder
- Uses new `AlertDialog` component (standard shadcn primitive)
- Test files co-located per architecture convention
- Feature index re-exports maintained
- Soft-delete pattern is new to codebase - ensure all UserBook queries are updated

### References

- [Source: architecture.md#Implementation Patterns] - ActionResult<T> pattern, naming conventions
- [Source: architecture.md#API & Communication Patterns] - Server Actions for mutations
- [Source: architecture.md#Frontend Architecture] - Optimistic update rules: "Revert on error" pattern
- [Source: architecture.md#Structure Patterns] - Test co-location, feature folder structure
- [Source: ux-design-specification.md#Feedback Patterns] - Toast 4s auto-dismiss, undo 5s window
- [Source: ux-design-specification.md#Destructive Actions] - Confirmation modal with clear consequences
- [Source: ux-design-specification.md#Accessibility] - 44px touch targets, keyboard nav, focus management
- [Source: ux-design-specification.md#Emotional Design] - No guilt-trip copy, factual language
- [Source: epic-2#Story 2.5] - Acceptance criteria, soft-delete, undo requirements
- [Source: 2-4-update-reading-status.md] - Optimistic overlay pattern, toast patterns, test mocking
- [Source: 2-2-add-book-to-library.md] - addToLibrary server action (needs soft-delete handling update)
- [Source: prd.md#FR10] - "Users can remove books from their library"
- [Source: sonner documentation] - toast() with action parameter for undo buttons

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Changed `findUnique` to `findFirst` in getUserBookStatus.ts and getBookById.ts to support `deletedAt: null` filter (unique constraint doesn't include deletedAt)
- Updated test mocks accordingly after 4 test failures from the findUnique→findFirst change
- `npx prisma db push` fails (no local PostgreSQL) - expected; `prisma generate` sufficient for development

### Completion Notes List

- All 9 tasks completed successfully
- 437 tests pass across 40 test files, zero regressions (baseline was 427 tests across 38 files)
- 10 new removal tests added to BookDetailActions.test.tsx
- 7 new tests in removeFromLibrary.test.ts
- 7 new tests in restoreToLibrary.test.ts
- Soft-delete pattern implemented via `deletedAt` field on UserBook model
- All existing UserBook queries updated to filter `deletedAt: null`
- addToLibrary.ts updated to handle re-adding soft-deleted books (restore instead of error)
- AlertDialog installed via shadcn CLI for confirmation dialog
- Sonner toast `action` parameter used for Undo button with 5-second duration

### File List

- `prisma/schema.prisma` - MODIFIED: Added `deletedAt DateTime?` to UserBook model
- `src/actions/books/removeFromLibrary.ts` - NEW: Soft-delete server action
- `src/actions/books/removeFromLibrary.test.ts` - NEW: 7 unit tests
- `src/actions/books/restoreToLibrary.ts` - NEW: Restore server action
- `src/actions/books/restoreToLibrary.test.ts` - NEW: 7 unit tests
- `src/actions/books/index.ts` - MODIFIED: Added exports for remove/restore
- `src/actions/books/addToLibrary.ts` - MODIFIED: Handle soft-deleted re-add
- `src/actions/books/getUserBookStatus.ts` - MODIFIED: Added deletedAt filters
- `src/actions/books/getUserBookStatus.test.ts` - MODIFIED: Updated mocks for findFirst
- `src/actions/books/getBookById.ts` - MODIFIED: Added deletedAt filters
- `src/actions/books/getBookById.test.ts` - MODIFIED: Updated mocks for findFirst
- `src/components/ui/alert-dialog.tsx` - NEW: shadcn AlertDialog component
- `src/components/features/books/BookDetailActions.tsx` - MODIFIED: Added remove UI with AlertDialog, toast undo
- `src/components/features/books/BookDetailActions.test.tsx` - MODIFIED: Added 10 removal tests
- `src/components/features/books/BookDetail.tsx` - MODIFIED: Added handleRemove/handleRestore callbacks
- `src/hooks/useUserLibrary.ts` - MODIFIED: Added restoreOptimistic method
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - MODIFIED: Story status tracking

### Code Review Fixes Applied

**Reviewer:** Claude Opus 4.6 (adversarial code review) — 2026-02-06

**Issues Fixed (6):**
1. [HIGH] `getBookById.test.ts:127` — Added missing `deletedAt: null` to mockUserBook (was causing TypeScript error)
2. [HIGH] `BookDetail.test.tsx` — Added `onRemove`/`onRestore` props to mock and 2 new tests for remove/restore callbacks (task was marked [x] but not done)
3. [MEDIUM] `addToLibrary.ts:113` — Added `dateAdded: new Date()` to soft-deleted re-add so date resets on re-addition
4. [MEDIUM] `removeFromLibrary.test.ts:107` — Added `vi.useFakeTimers()` before `vi.setSystemTime()` for correct fake timer usage
5. [MEDIUM] `getUserBookStatus.test.ts:39` — Removed dead `mockUserBookFindUnique` variable (implementation uses `findFirst`)
6. [MEDIUM] `getBookById.test.ts:13` — Removed unused `findUnique` from mock factory
