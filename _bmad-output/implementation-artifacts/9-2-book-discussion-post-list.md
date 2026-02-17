# Story 9.2: Book Discussion Post List

Status: done

## Story

As a reader browsing a book,
I want to see a list of discussion posts on the book's detail page,
so that I can browse topics other readers are discussing about this book.

## Acceptance Criteria

1. **Given** a user navigates to a book detail page (`/book/[id]`) **When** the page renders **Then** a "Discussions" section is displayed below book details **And** the section shows a list of discussion posts for this book **And** each post displays: title, author name, author avatar, timestamp, and comment count

2. **Given** a book has discussion posts **When** the discussion section loads **Then** posts are sorted by most recent by default **And** posts are paginated via cursor-based pagination (20 per page)

3. **Given** a book has no discussion posts **When** the section loads **Then** an empty state is shown: "No discussions yet — start one!" **And** a "New Post" CTA button is displayed

4. **Given** a post was created by a verified book author **When** it is displayed in the post list **Then** the author's name has a golden author badge styling (FR46)

5. **Given** the discussion section is loading **When** posts are being fetched **Then** skeleton post cards are shown **And** content loads within 2 seconds on 4G (NFR6)

## Tasks / Subtasks

- [x] Task 1: Add Prisma models and migrate (AC: #1, #2)
  - [x] Add `DiscussionPost` model to `prisma/schema.prisma` with fields: `id` (cuid), `bookId`, `authorId`, `title` (String), `body` (String), `createdAt`, `updatedAt`
  - [x] Add relations: `book Book`, `author User`, `comments DiscussionComment[]`
  - [x] Add `@@index([bookId, createdAt])` and `@@map("discussion_posts")`
  - [x] Add `DiscussionComment` model with fields: `id` (cuid), `postId`, `authorId`, `parentId` (optional, self-relation), `body` (String), `createdAt`, `updatedAt`
  - [x] Add relations: `post DiscussionPost` (onDelete: Cascade), `author User`, `parent DiscussionComment?`, `replies DiscussionComment[]`
  - [x] Add `@@index([postId, createdAt])`, `@@index([parentId])`, `@@map("discussion_comments")`
  - [x] Add reverse relations on `User` model: `discussionPosts DiscussionPost[]`, `discussionComments DiscussionComment[]`
  - [x] Add reverse relation on `Book` model: `discussionPosts DiscussionPost[]`
  - [x] Run `npx prisma generate` and `npx prisma db push`

- [x] Task 2: Create `listPosts` server action (AC: #1, #2)
  - [x] Create `src/actions/discussions/listPosts.ts`
  - [x] Input: `{ bookId: string, cursor?: string, limit?: number }` validated with Zod
  - [x] Query `prisma.discussionPost.findMany()` with: `where: { bookId }`, `orderBy: { createdAt: 'desc' }`, `take: limit + 1` (for cursor detection), `cursor` if provided
  - [x] Include `author: { select: { id, name, image } }` and `_count: { select: { comments: true } }`
  - [x] Return `ActionResult<{ posts: PostSummary[], nextCursor: string | null }>`
  - [x] `PostSummary` type: `{ id, title, body, createdAt, author: { id, name, image }, commentCount: number }`
  - [x] No auth required for reading (public), but action still follows ActionResult pattern
  - [x] Create `src/actions/discussions/index.ts` re-export

- [x] Task 3: Create `PostCard` component (AC: #1, #4)
  - [x] Create `src/components/features/discussions/PostCard.tsx` as client component
  - [x] Props: `post: PostSummary`, `authorUserId?: string` (verified book author's user ID)
  - [x] Display: title (semibold), body preview (truncated to 2 lines with `line-clamp-2`), author avatar + name, timestamp (`formatDistanceToNow`), comment count icon + number
  - [x] If `post.author.id === authorUserId`, show golden author badge next to name (reuse amber/gold pattern from existing `AuthorShimmerBadge`)
  - [x] Card styling: use shadcn `Card` with warm palette, `rounded-xl`, hover elevation
  - [x] Clickable — link to post detail (future story, for now just render as card)
  - [x] 44px min touch target

- [x] Task 4: Create `PostList` component (AC: #1, #2, #3, #5)
  - [x] Create `src/components/features/discussions/PostList.tsx` as client component
  - [x] Props: `bookId: string`, `authorUserId?: string`
  - [x] Call `listPosts` server action on mount with `bookId`
  - [x] Render list of `PostCard` components
  - [x] Loading state: render 3 skeleton `PostCard` placeholders (use shadcn `Skeleton`)
  - [x] Empty state: "No discussions yet — start one!" with "New Post" button (button disabled for now, Story 9.3 enables it)
  - [x] Error state: "Discussions unavailable" message, rest of page unaffected
  - [x] Pagination: "Load more" button at bottom when `nextCursor` exists. On click, fetch next page and append to list
  - [x] Use `useState` for posts array, loading, error, cursor

- [x] Task 5: Replace Stream discussion with PostList in BookDetail (AC: #1)
  - [x] In `src/components/features/books/BookDetail.tsx`, replace `<BookDiscussion bookId={book.id} authorUserId={authorUserId} />` with `<PostList bookId={book.id} authorUserId={authorUserId} />`
  - [x] Update import from `@/components/features/discussions`
  - [x] Remove old `BookDiscussion` import
  - [x] Keep the same section placement (after sessions, before actions)

- [x] Task 6: Remove old Stream discussion files (AC: N/A — cleanup)
  - [x] Delete `src/components/features/discussions/BookDiscussion.tsx`
  - [x] Delete `src/components/features/discussions/BookDiscussion.test.tsx`
  - [x] Verify `src/components/features/discussions/DiscussionMessage.tsx` — NOT deleted (still imported by AuthorChatPanel for Epic 10)
  - [x] Verify `src/components/features/discussions/useChatClient.ts` — NOT deleted (still imported by AuthorChatPanel for Epic 10)
  - [x] Delete `src/actions/stream/getBookChannel.ts`
  - [x] Delete `src/actions/stream/getBookChannel.test.ts`
  - [x] Update `src/actions/stream/index.ts` — remove `getBookChannel` export
  - [x] Update `src/components/features/discussions/index.ts` — export `PostList` instead of `BookDiscussion`
  - [x] Verify no other files import the deleted modules (search for `BookDiscussion`, `getBookChannel`, `DiscussionMessage`, `useChatClient`)

- [x] Task 7: Write tests (AC: #1, #2, #3, #4, #5)
  - [x] Test `listPosts` server action: returns posts with comment counts, handles empty book, paginates correctly, returns cursor
  - [x] Test `PostCard`: renders title/body/author/timestamp/comments, shows author badge when authorUserId matches
  - [x] Test `PostList`: shows loading skeleton, renders posts, shows empty state, shows error state, pagination loads more
  - [x] Update `BookDetail.test.tsx`: mock `@/components/features/discussions` to export `PostList` instead of `BookDiscussion`
  - [x] Co-locate all tests with source files

## Dev Notes

### Architecture Patterns & Constraints

- **Server Action pattern**: Follow `ActionResult<T>` from `src/actions/stream/generateStreamToken.ts` — `auth.api.getSession({ headers: await headers() })` for auth, try/catch with error return. For `listPosts`, auth is optional (public read).
- **Prisma patterns**: Follow existing model conventions — `@id @default(cuid())`, `@map("snake_case")`, `@@map("table_name")`, `@default(now())` for timestamps. See `ReadingSession`, `Kudos`, `RoomPresence` as examples.
- **Import alias**: Always `@/` for cross-boundary imports.
- **Component patterns**: Client components marked `'use client'`. Use shadcn/ui primitives (`Card`, `Skeleton`, `Avatar`, `Badge`). Follow `BookCard` component structure for card layout patterns.
- **Zod validation**: Validate server action inputs with Zod schemas. See `src/lib/validation/` for existing schemas.
- **Date formatting**: Use `date-fns` `formatDistanceToNow()` for timestamps.

### Prisma Schema Addition — Exact Models

```prisma
model DiscussionPost {
  id        String   @id @default(cuid())
  bookId    String   @map("book_id")
  authorId  String   @map("author_id")
  title     String
  body      String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  book     Book              @relation(fields: [bookId], references: [id])
  author   User              @relation("UserDiscussionPosts", fields: [authorId], references: [id])
  comments DiscussionComment[]

  @@index([bookId, createdAt])
  @@map("discussion_posts")
}

model DiscussionComment {
  id        String   @id @default(cuid())
  postId    String   @map("post_id")
  authorId  String   @map("author_id")
  parentId  String?  @map("parent_id")
  body      String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  post     DiscussionPost     @relation(fields: [postId], references: [id], onDelete: Cascade)
  author   User               @relation("UserDiscussionComments", fields: [authorId], references: [id])
  parent   DiscussionComment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies  DiscussionComment[] @relation("CommentReplies")

  @@index([postId, createdAt])
  @@index([parentId])
  @@map("discussion_comments")
}
```

Add to `User` model:
```prisma
discussionPosts    DiscussionPost[]    @relation("UserDiscussionPosts")
discussionComments DiscussionComment[] @relation("UserDiscussionComments")
```

Add to `Book` model:
```prisma
discussionPosts DiscussionPost[]
```

### Cursor-Based Pagination Pattern

```typescript
// Take limit + 1 to detect if more exist
const posts = await prisma.discussionPost.findMany({
  where: { bookId },
  orderBy: { createdAt: 'desc' },
  take: limit + 1,
  ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  include: {
    author: { select: { id: true, name: true, image: true } },
    _count: { select: { comments: true } },
  },
});

const hasMore = posts.length > limit;
const resultPosts = hasMore ? posts.slice(0, limit) : posts;
const nextCursor = hasMore ? resultPosts[resultPosts.length - 1].id : null;
```

### What NOT To Implement (Scope Boundaries)

1. **DO NOT create post form or comment input** — That is Story 9.3
2. **DO NOT implement sort tabs (Recent/Active/Top)** — That is Story 9.4
3. **DO NOT implement post detail view with comments** — That is Story 9.3
4. **DO NOT remove Stream SDK setup** (lib/stream.ts, StreamChatProvider, generateStreamToken) — Still needed for Epic 10 (Author Chat)
5. **DO NOT remove Stream packages** from package.json — Still needed for Epic 10

### Previous Story (9.1) Intelligence

- `stream-chat` and `stream-chat-react` packages remain installed (Epic 10 needs them)
- `StreamChatProvider` remains in `(main)` layout (Epic 10 needs it)
- `generateStreamToken` action remains (Epic 10 needs it)
- `src/lib/stream.ts` server client remains (Epic 10 needs it)

### Current BookDetail Integration Point

In `src/components/features/books/BookDetail.tsx` (line ~144):
```typescript
<BookDiscussion
  bookId={book.id}
  authorUserId={authorUserId}
/>
```
Replace with:
```typescript
<PostList
  bookId={book.id}
  authorUserId={authorUserId}
/>
```

The `authorUserId` prop is already available from `BookDetailData` (populated from `AuthorClaim` in `getBookById.ts`).

### Project Structure Notes

New files to create:
```
prisma/
└── schema.prisma                              # Add DiscussionPost, DiscussionComment models
src/
├── actions/
│   └── discussions/
│       ├── listPosts.ts                       # Server action: list posts for a book
│       ├── listPosts.test.ts                  # Server action tests
│       └── index.ts                           # Barrel exports
└── components/
    └── features/
        └── discussions/
            ├── PostCard.tsx                    # Single post preview card
            ├── PostCard.test.tsx               # PostCard tests
            ├── PostList.tsx                    # Post list with pagination
            ├── PostList.test.tsx               # PostList tests
            └── index.ts                       # Update: export PostList
```

Files to delete:
```
src/components/features/discussions/BookDiscussion.tsx
src/components/features/discussions/BookDiscussion.test.tsx
src/components/features/discussions/DiscussionMessage.tsx
src/components/features/discussions/useChatClient.ts
src/actions/stream/getBookChannel.ts
src/actions/stream/getBookChannel.test.ts
```

Files to modify:
```
prisma/schema.prisma                           # Add new models + User/Book relations
src/components/features/books/BookDetail.tsx    # Replace BookDiscussion with PostList
src/components/features/books/BookDetail.test.tsx # Update discussion mock
src/actions/stream/index.ts                    # Remove getBookChannel export
src/components/features/discussions/index.ts   # Export PostList instead of BookDiscussion
```

### References

- [Source: _bmad-output/planning-artifacts/epics-book-discussions-author-chat.md#Story 9.2]
- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-02-17.md#Story 9.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Server Action Return Pattern]
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns]
- [Source: _bmad-output/implementation-artifacts/9-1-stream-sdk-setup-user-token-generation.md — Stream setup reference]
- [Source: _bmad-output/implementation-artifacts/9-2-book-discussion-thread-display.md — Previous implementation to replace]
- [Source: src/components/features/books/BookDetail.tsx — Integration target]
- [Source: src/actions/books/getBookById.ts — BookDetailData type with authorUserId]
- [Source: prisma/schema.prisma — Existing schema conventions]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- `date-fns` was not installed; added as dependency
- `DiscussionMessage.tsx` and `useChatClient.ts` were NOT deleted because `AuthorChatPanel` (Epic 10) still imports them
- `npx prisma db push` failed due to missing local DB credentials — schema validated via `prisma generate`
- Fixed ESLint `set-state-in-effect` error in PostList by using `useRef` guard + promise-based fetch in useEffect
- Pre-existing test failures in `BookDetailActions.test.tsx` and `HomeContent.test.tsx` (19 tests) confirmed unrelated

### Completion Notes List
- Added `DiscussionPost` and `DiscussionComment` Prisma models with all indexes and relations
- Created `listPosts` server action with Zod validation, cursor-based pagination (20/page), and `ActionResult` pattern
- Created `PostCard` component with title, body preview (line-clamp-2), avatar, timestamp (date-fns), comment count, and golden author badge
- Created `PostList` component with loading skeletons, empty state, error state, and "Load more" pagination
- Replaced `BookDiscussion` with `PostList` in `BookDetail.tsx`
- Removed old Stream discussion files (`BookDiscussion`, `getBookChannel`) and updated barrel exports
- 40 tests pass across 4 test files (15 new tests added)

### Change Log
- 2026-02-17: Implemented Story 9.2 — Book Discussion Post List with Prisma models, server action, PostCard/PostList components, and full test coverage
- 2026-02-17: Code review fixes — Zod validation moved to safeParse before try/catch, PostList keyed on bookId for proper re-fetch, load-more error feedback added, task 6 subtask descriptions amended, added validation and orderBy tests

### File List
- prisma/schema.prisma (modified — added DiscussionPost, DiscussionComment models + User/Book relations)
- package.json (modified — added date-fns dependency)
- package-lock.json (modified — lockfile update)
- src/actions/discussions/listPosts.ts (new)
- src/actions/discussions/listPosts.test.ts (new)
- src/actions/discussions/index.ts (new)
- src/components/features/discussions/PostCard.tsx (new)
- src/components/features/discussions/PostCard.test.tsx (new)
- src/components/features/discussions/PostList.tsx (new)
- src/components/features/discussions/PostList.test.tsx (new)
- src/components/features/discussions/index.ts (modified — exports PostList/PostCard instead of BookDiscussion)
- src/components/features/books/BookDetail.tsx (modified — replaced BookDiscussion with PostList)
- src/components/features/books/BookDetail.test.tsx (modified — updated mock from BookDiscussion to PostList)
- src/components/features/discussions/BookDiscussion.tsx (deleted)
- src/components/features/discussions/BookDiscussion.test.tsx (deleted)
- src/actions/stream/getBookChannel.ts (deleted)
- src/actions/stream/getBookChannel.test.ts (deleted)
- src/actions/stream/index.ts (modified — removed getBookChannel export)
