# Sprint Change Proposal — Reddit-Style Book Discussions

**Date:** 2026-02-17
**Author:** vitr
**Change Scope:** Moderate
**Affected Epic:** Epic 9 (Stream Integration & Book Discussions)

---

## Section 1: Issue Summary

Book discussions should follow a Reddit-style threaded model where each book acts as a "subreddit" with user-created discussion posts, each having its own nested comment thread. The current implementation uses Stream Chat SDK's messaging model — a flat chat channel per book — which doesn't support titled posts, post-level sorting, or nested commenting on individual topics.

**Discovery Context:** Post-implementation review identified a mismatch between the desired discussion UX (Reddit/forum-style) and the implemented model (chat/messaging-style).

---

## Section 2: Impact Analysis

### Epic Impact

| Epic | Impact | Details |
|------|--------|---------|
| Epic 9 | **Major rework** | Stories 9.2, 9.3, 9.4 need complete rewrite. Story 9.1 (Stream SDK setup) unaffected. |
| Epic 10 | None | Author chat is independent, still uses Stream for ephemeral chat. |
| Epic 11 | None | Affiliate monetization unaffected. |

### Story Impact

| Story | Current | Proposed |
|-------|---------|----------|
| 9.1 Stream SDK Setup | Keep as-is | No change — still needed for Epic 10 |
| 9.2 Book Discussion Thread Display | Stream channel message list | Reddit-style post list with titles, previews, comment counts |
| 9.3 Create Discussion Posts & Replies | Stream message + thread reply | Create titled posts + nested comment threads |
| 9.4 Discussion Sorting & Discovery | Stream message sorting | Post-level sorting (Recent / Active / Top) with custom pagination |

### Artifact Conflicts

**PRD Updates Needed:**

| FR | Current | Proposed |
|----|---------|----------|
| FR41 | "Create a new discussion post" | "Create a new discussion post with title and body" |
| FR42 | "Reply to a specific discussion post (threaded replies)" | "Reply with nested comments on discussion posts (Reddit-style threading)" |
| FR44 | "Sort by recency or activity" | "Sort posts by Recent, Active, or Top" |
| FR55 | "Stream Chat React components for both discussion and chat UI" | "Stream Chat React components for author chat UI; custom components for discussions" |

**Architecture Updates Needed:**

| Area | Current | Proposed |
|------|---------|----------|
| Data Model | "No new Prisma models for discussions — Stream handles all storage" | New models: `DiscussionPost`, `DiscussionComment` in Prisma schema |
| Server Actions | Stream channel operations | Custom CRUD actions: `createPost`, `createComment`, `listPosts`, `listComments` |
| Pagination | Stream's built-in pagination (NFR8) | Custom cursor-based pagination via Prisma |
| Moderation | Stream's built-in moderation (NFR10) | Custom moderation (integrate with existing admin moderation queue) |
| Stream scope | Discussions + Author Chat | Author Chat only |

**UX Updates Needed:**

| Component | Current | Proposed |
|-----------|---------|----------|
| Discussion section | Stream MessageList | PostList (title, preview, comment count, author, timestamp) |
| Post creation | Stream MessageInput | CreatePostForm (title field + body field) |
| Thread view | Stream Thread panel | PostDetail page with nested CommentThread |
| Reply UI | Stream reply input | Comment input with nesting (reply to post or reply to comment) |
| Sorting | Message-level sort toggle | Post-level sort tabs: Recent / Active / Top |

### Technical Impact

**New Prisma Models:**

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
  author   User              @relation(fields: [authorId], references: [id])
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
  author   User               @relation(fields: [authorId], references: [id])
  parent   DiscussionComment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies  DiscussionComment[] @relation("CommentReplies")

  @@index([postId, createdAt])
  @@index([parentId])
  @@map("discussion_comments")
}
```

**New Server Actions:**
- `actions/discussions/createPost.ts`
- `actions/discussions/listPosts.ts`
- `actions/discussions/createComment.ts`
- `actions/discussions/listComments.ts`

**New Components:**
- `components/features/discussions/PostList.tsx` — list of posts for a book
- `components/features/discussions/PostCard.tsx` — single post preview card
- `components/features/discussions/CreatePostForm.tsx` — title + body form
- `components/features/discussions/PostDetail.tsx` — full post with comments
- `components/features/discussions/CommentThread.tsx` — nested comment tree
- `components/features/discussions/CommentInput.tsx` — reply input

**Removed Components (Stream discussion-specific):**
- Stream `Channel`, `MessageList`, `MessageInput` usage for discussions
- Stream channel creation/management for book discussions

---

## Section 3: Recommended Approach

**Selected Path:** Direct Adjustment — Rewrite Stories 9.2, 9.3, 9.4

**Rationale:**
1. Custom Prisma models follow all established project patterns (ActionResult, server actions, Zod validation, co-located tests)
2. Simpler architecture — no longer fighting Stream's chat paradigm for forum-style discussions
3. Stream SDK remains for Epic 10 (author chat) where it's a natural fit
4. No MVP scope change — Reddit-style discussions are equally achievable
5. Better UX — titled posts with nested comments match user mental model of "book discussions"

**Effort:** Medium — ~3 stories to rewrite (data model + CRUD + UI)
**Risk:** Low — follows established patterns, no new external dependencies
**Timeline Impact:** Minimal — replacing existing implementation, not adding new scope

---

## Section 4: Detailed Change Proposals

### Story 9.2: Book Discussion Post List (REWRITE)

```
Story: 9.2 Book Discussion Post List
Section: Full rewrite

OLD:
- Stream channel per book (book-{bookId})
- MessageList component displays messages
- Stream pagination and skeleton loading

NEW:
As a reader browsing a book,
I want to see a list of discussion posts on the book's detail page,
So that I can browse topics other readers are discussing.

Acceptance Criteria:

Given a user navigates to a book detail page
When the page renders
Then a "Discussions" section shows a list of posts for this book
And each post shows: title, author name/avatar, timestamp, comment count
And posts are paginated (cursor-based, 20 per page)

Given a book has no discussion posts
When the section loads
Then an empty state shows "No discussions yet — start one!"

Given a post was created by a verified book author
When displayed in the list
Then the author's name has golden author badge styling

Given the discussion section is loading
When fetching posts
Then skeleton cards are shown
And content loads within 2 seconds on 4G

Rationale: Replaces Stream message list with Reddit-style post list using custom Prisma queries
```

### Story 9.3: Create Posts & Nested Comments (REWRITE)

```
Story: 9.3 Create Discussion Posts & Nested Comments
Section: Full rewrite

OLD:
- Stream MessageInput for posting
- Stream built-in threading for replies
- Stream content sanitization

NEW:
As a reader,
I want to create discussion posts and reply with nested comments,
So that I can start and participate in book conversations.

Acceptance Criteria:

Given an authenticated user viewing a book's discussions
When they tap "New Post"
Then a form appears with title (required) and body (required) fields
And submitting creates a DiscussionPost record
And the post appears at the top of the post list

Given an authenticated user viewing a discussion post
When they tap "Reply"
Then a comment input appears
And submitting creates a DiscussionComment linked to the post

Given an authenticated user viewing an existing comment
When they tap "Reply" on that comment
Then a comment input appears
And submitting creates a DiscussionComment with parentId set to the parent comment
And the reply appears nested under the parent comment

Given an unauthenticated user
When they attempt to post or comment
Then they are prompted to log in

Given a verified author posts or comments
When their content is displayed
Then their name shows the golden author badge (FR46)

Rationale: Reddit-style post creation with nested comment threading replaces Stream messaging
```

### Story 9.4: Discussion Sorting & Pagination (REWRITE)

```
Story: 9.4 Discussion Sorting & Pagination
Section: Full rewrite

OLD:
- Stream message sorting (recent/active)
- Stream built-in pagination
- Stream graceful degradation

NEW:
As a reader,
I want to sort discussion posts by different criteria,
So that I can find the most relevant conversations.

Acceptance Criteria:

Given a user viewing a book's discussions
When they select "Recent"
Then posts are sorted by creation time, newest first

Given a user viewing a book's discussions
When they select "Active"
Then posts are sorted by most recent comment activity

Given a user viewing a book's discussions
When they select "Top"
Then posts are sorted by comment count, most comments first

Given a discussion list with many posts
When the user scrolls to the bottom
Then the next page loads via cursor-based pagination (20 per page)

Given the database query fails
When the discussion section attempts to load
Then a "Discussions unavailable" message is shown
And the rest of the book detail page functions normally

Rationale: Custom sorting and pagination via Prisma replaces Stream's built-in features
```

### PRD Updates

```
Artifact: PRD
Section: Functional Requirements

OLD:
FR41: Users can create a new discussion post on a book
FR42: Users can reply to a specific discussion post (threaded replies)
FR44: Discussions can be sorted by recency or activity
FR55: Stream Chat React components are used for both discussion and chat UI

NEW:
FR41: Users can create a new discussion post with title and body on a book
FR42: Users can reply with nested comments on discussion posts (Reddit-style threading)
FR44: Discussion posts can be sorted by Recent, Active, or Top
FR55: Stream Chat React components are used for author chat UI; custom components for book discussions

Rationale: Align FRs with Reddit-style discussion model
```

### Architecture Updates

```
Artifact: Architecture
Section: Additional Requirements / Data Model

OLD:
- No new Prisma models for discussions or chat — Stream handles all storage
- One Stream channel per book for discussions (type: messaging or team)

NEW:
- New Prisma models: DiscussionPost, DiscussionComment for book discussions
- Stream used only for ephemeral author chat channels (Epic 10)
- Custom cursor-based pagination for discussion queries
- Discussion moderation integrates with existing admin moderation queue (Epic 6)

Rationale: Custom data model provides natural Reddit-style post+comment structure
```

---

## Section 5: Implementation Handoff

**Change Scope Classification:** Minor — Direct implementation by dev team

**Implementation Steps:**
1. Add `DiscussionPost` and `DiscussionComment` models to Prisma schema + migrate
2. Create server actions for post/comment CRUD with Zod validation
3. Build discussion UI components (PostList, PostCard, CreatePostForm, PostDetail, CommentThread)
4. Remove Stream-based discussion components from book detail page
5. Update tests for stories 9.2, 9.3, 9.4
6. Keep Stream SDK setup (9.1) intact for Epic 10

**Handoff:** Development team for direct implementation via `dev-story` workflow.

**Success Criteria:**
- Each book detail page shows Reddit-style discussion post list
- Users can create titled posts and nested comments
- Posts sortable by Recent / Active / Top
- Author badge displays on verified author posts/comments
- All existing Epic 10 (author chat) functionality unaffected
