---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-flappy-bird-1-2026-02-11.md
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# flappy-bird-1 - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for flappy-bird-1 Book Discussions & Author Chat, decomposing the requirements from the product brief into implementable stories. These features add book-level discussions and real-time author chat to deepen social engagement and drive premium conversions, using Stream Chat as the messaging/discussion provider.

## Requirements Inventory

### Functional Requirements

FR40: Users can view a discussion section on any book's detail page
FR41: Users can create a new discussion post with title and body on a book
FR42: Users can reply with nested comments on discussion posts (Reddit-style threading)
FR43: All users (free and premium) can read and post in discussions
FR44: Discussion posts can be sorted by Recent, Active, or Top
FR45: Discussion posts and comments display author name, timestamp, and user avatar
FR46: Authors are visually distinguished when posting in book discussions
FR47: A group chat panel activates in a reading room when an author enters
FR48: Only premium users can see and participate in author chat
FR49: Chat uses real-time messaging via Stream Chat SDK
FR50: Authors are visually distinguished in the chat interface
FR51: Chat panel closes and channel messages are purged when the author leaves the room
FR52: Free users see a premium upgrade prompt when author chat is active
FR53: Chat messages are ephemeral — channel deleted after author leaves
FR54: Server generates Stream user tokens for authenticated users
FR55: Stream Chat React components are used for author chat UI; custom components for book discussions

### NonFunctional Requirements

NFR6: Discussion posts must load within 2 seconds on 4G
NFR7: Author chat messages must deliver within 1 second (Stream real-time)
NFR8: Discussion posts use cursor-based pagination (20 per page)
NFR9: Chat must gracefully degrade if Stream is unavailable
NFR10: Discussion content moderated via existing admin moderation queue; chat content sanitized via Stream

### Additional Requirements

- Install `stream-chat` and `@stream-io/stream-chat-react` packages
- Environment variables: `STREAM_API_KEY`, `STREAM_API_SECRET`
- Server-side Stream client in `src/lib/stream.ts` for token generation and admin operations
- Stream token generation endpoint or server action for authenticated users
- New Prisma models: `DiscussionPost` and `DiscussionComment` for book discussions
- One ephemeral Stream channel per reading room for author chat (created on author join, deleted on leave)
- Premium gating uses existing `isPremium(userId)` utility
- Keep Pusher for reading room presence detection only
- New component folders: `features/discussions/`, `features/author-chat/`
- Follows existing patterns: `ActionResult<T>`, `@/` imports, co-located tests

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR40 | Epic 9 | Discussion section on book detail page |
| FR41 | Epic 9 | Create discussion posts |
| FR42 | Epic 9 | Threaded replies |
| FR43 | Epic 9 | Free + premium access to discussions |
| FR44 | Epic 9 | Sort by recency or activity |
| FR45 | Epic 9 | Post display (name, timestamp, avatar) |
| FR46 | Epic 9 | Author visual distinction in discussions |
| FR47 | Epic 10 | Chat panel activates on author join |
| FR48 | Epic 10 | Premium-only chat access |
| FR49 | Epic 10 | Stream real-time messaging for chat |
| FR50 | Epic 10 | Author visual distinction in chat |
| FR51 | Epic 10 | Chat closes + purges on author leave |
| FR52 | Epic 10 | Premium upgrade prompt for free users |
| FR53 | Epic 10 | Ephemeral chat — channel deleted after |
| FR54 | Epic 9 | Server-side Stream token generation |
| FR55 | Epic 9 | Stream Chat React components for UI |

## Epic List

### Epic 9: Stream Integration & Book Discussions
Users can discuss books with other readers through Reddit-style threaded discussions on every book page, where each book acts as a "subreddit" with titled posts and nested comments. Stream Chat SDK is set up for Epic 10 (Author Chat); discussions use custom Prisma models.
**FRs covered:** FR40, FR41, FR42, FR43, FR44, FR45, FR46, FR54, FR55
**NFRs covered:** NFR6, NFR8, NFR10

### Epic 10: Author Chat in Reading Rooms
Premium users can chat with authors in real-time when an author enters a reading room. Free users see a premium upgrade prompt, driving conversions. Chat is ephemeral and organic — tied to the author's natural presence.
**FRs covered:** FR47, FR48, FR49, FR50, FR51, FR52, FR53
**NFRs covered:** NFR7, NFR9

## Epic 9: Stream Integration & Book Discussions

Users can discuss books with other readers through Reddit-style threaded discussions on every book page, where each book acts as a "subreddit" with titled discussion posts and nested comment threads. Stream Chat SDK is set up in this epic for use by Epic 10 (Author Chat). Book discussions use custom Prisma models (DiscussionPost, DiscussionComment) for a natural forum-style experience.

**FRs covered:** FR40, FR41, FR42, FR43, FR44, FR45, FR46, FR54, FR55
**NFRs covered:** NFR6, NFR10

### Story 9.1: Stream SDK Setup & User Token Generation

As a registered user,
I want the app to connect me to Stream Chat securely,
So that I can use chat features with my authenticated identity.

**Acceptance Criteria:**

**Given** the application codebase
**When** dependencies are installed
**Then** `stream-chat` and `@stream-io/stream-chat-react` packages are added
**And** `STREAM_API_KEY` and `STREAM_API_SECRET` environment variables are configured
**And** `src/lib/stream.ts` exports a server-side Stream client instance

**Given** an authenticated user loads any page requiring Stream features
**When** the client initializes
**Then** a `generateStreamToken` server action creates a valid Stream user token using the user's ID
**And** the token is used to connect the Stream Chat client on the frontend
**And** the Stream user profile is synced with the app user's name and avatar

**Given** an unauthenticated user
**When** they access a page with Stream features
**Then** Stream client is not initialized

*Note: Stream SDK is used for Epic 10 (Author Chat) only. Book discussions use custom Prisma models.*

### Story 9.2: Book Discussion Post List

As a reader browsing a book,
I want to see a list of discussion posts on the book's detail page,
So that I can browse topics other readers are discussing about this book.

**Acceptance Criteria:**

**Given** a user navigates to a book detail page (`/book/[id]`)
**When** the page renders
**Then** a "Discussions" section is displayed below book details
**And** the section shows a list of discussion posts for this book
**And** each post displays: title, author name, author avatar, timestamp, and comment count

**Given** a book has discussion posts
**When** the discussion section loads
**Then** posts are sorted by most recent by default
**And** posts are paginated via cursor-based pagination (20 per page)

**Given** a book has no discussion posts
**When** the section loads
**Then** an empty state is shown: "No discussions yet — start one!"
**And** a "New Post" CTA button is displayed

**Given** a post was created by a verified book author
**When** it is displayed in the post list
**Then** the author's name has a golden author badge styling (FR46)

**Given** the discussion section is loading
**When** posts are being fetched
**Then** skeleton post cards are shown
**And** content loads within 2 seconds on 4G (NFR6)

*Creates: DiscussionPost model (id, bookId, authorId, title, body, createdAt, updatedAt), PostList component, PostCard component, listPosts server action*

### Story 9.3: Create Discussion Posts & Nested Comments

As a reader,
I want to create discussion posts and reply with nested comments,
So that I can start and participate in book conversations.

**Acceptance Criteria:**

**Given** an authenticated user (free or premium) viewing a book's discussions
**When** they tap "New Post"
**Then** a form appears with title (required) and body (required) fields
**And** submitting creates a DiscussionPost record linked to the book
**And** the post appears at the top of the post list
**And** the post displays the user's name, avatar, and timestamp (FR45)

**Given** an authenticated user viewing a discussion post detail
**When** they tap "Reply" on the post
**Then** a comment input appears
**And** submitting creates a DiscussionComment linked to the post (postId set, parentId null)
**And** the comment appears in the comment thread below the post

**Given** an authenticated user viewing an existing comment
**When** they tap "Reply" on that comment
**Then** a comment input appears
**And** submitting creates a DiscussionComment with parentId set to the parent comment
**And** the reply appears nested under the parent comment

**Given** an unauthenticated user viewing a discussion
**When** they attempt to create a post or comment
**Then** they are prompted to log in

**Given** a verified author creates a post or comment
**When** their content is displayed
**Then** their name shows the golden author badge (FR46)

*Creates: DiscussionComment model (id, postId, authorId, parentId, body, createdAt, updatedAt), CreatePostForm component, PostDetail component, CommentThread component, CommentInput component, createPost and createComment server actions*

### Story 9.4: Discussion Sorting & Pagination

As a reader,
I want to sort discussion posts by different criteria,
So that I can find the most relevant conversations.

**Acceptance Criteria:**

**Given** a user viewing a book's discussions
**When** they select "Recent" sort option
**Then** posts are sorted by creation time, newest first

**Given** a user viewing a book's discussions
**When** they select "Active" sort option
**Then** posts are sorted by most recent comment activity (posts with recent comments surface first)

**Given** a user viewing a book's discussions
**When** they select "Top" sort option
**Then** posts are sorted by comment count, most comments first

**Given** a discussion list with many posts
**When** the user scrolls to the bottom
**Then** the next page loads via cursor-based pagination (20 per page)

**Given** the database query fails
**When** the discussion section attempts to load
**Then** a graceful "Discussions unavailable" message is shown
**And** the rest of the book detail page functions normally

## Epic 10: Author Chat in Reading Rooms

Premium users can chat with authors in real-time when an author enters a reading room. Free users see a premium upgrade prompt, driving conversions. Chat is ephemeral and organic — tied to the author's natural presence.

### Story 10.1: Author Chat Panel Activation

As a user in a reading room,
I want a chat panel to appear when an author enters the room,
So that I know a live author interaction is happening.

**Acceptance Criteria:**

**Given** a user is in a reading room (`/book/[id]/room`)
**When** a verified author joins the room (detected via existing Pusher presence)
**Then** a chat panel slides into view in the reading room UI
**And** a server action creates an ephemeral Stream channel (ID: `author-chat-{bookId}-{sessionId}`)
**And** the author is visually distinguished in the chat panel (author badge, shimmer styling) (FR50)

**Given** no author is present in the reading room
**When** the user is in the room
**Then** no chat panel is displayed
**And** the reading room functions as before (presence only)

**Given** the Stream service is unavailable
**When** an author joins the room
**Then** a "Chat unavailable" message is shown in place of the chat panel (NFR9)
**And** reading room presence continues to work normally via Pusher

### Story 10.2: Premium Chat Access & Free User Upgrade Prompt

As a premium user,
I want to chat with the author in real-time,
So that I can interact directly with the person who wrote the book I'm reading.

**Acceptance Criteria:**

**Given** a premium user is in a reading room where an author is present
**When** the chat panel is active
**Then** the user can see all chat messages
**And** the user can type and send messages in real-time
**And** messages deliver within 1 second (NFR7)

**Given** a free user is in a reading room where an author is present
**When** the chat panel activates
**Then** the user sees a blurred/locked chat panel with a premium upgrade prompt (FR52)
**And** the prompt explains "Chat with the author — Premium feature"
**And** a CTA button links to the existing premium upgrade flow (Epic 7/8)
**And** the free user cannot see or send chat messages

**Given** a free user upgrades to premium during an active author chat session
**When** their premium status is confirmed
**Then** the chat panel unlocks and they can participate immediately

### Story 10.3: Ephemeral Chat Lifecycle & Cleanup

As a user in an author chat session,
I want the chat to end naturally when the author leaves,
So that the interaction feels organic and spontaneous.

**Acceptance Criteria:**

**Given** an author is in a reading room with an active chat
**When** the author leaves the room (detected via Pusher presence)
**Then** the chat panel displays "Author has left — chat ended"
**And** the chat input is disabled
**And** the panel auto-dismisses after a brief delay (5-10 seconds)

**Given** an author chat session has ended
**When** the cleanup runs (server-side)
**Then** the ephemeral Stream channel is deleted (FR53)
**And** all messages in the channel are purged
**And** no chat history persists after the session

**Given** an author leaves and re-enters the same reading room
**When** they rejoin
**Then** a new ephemeral chat channel is created
**And** previous chat messages are not available (fresh session)

**Given** all users leave a reading room while an author chat is active
**When** the room becomes empty
**Then** the ephemeral channel is cleaned up via server-side logic
