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
FR41: Users can create a new discussion post on a book
FR42: Users can reply to a specific discussion post (threaded replies)
FR43: All users (free and premium) can read and post in discussions
FR44: Discussions can be sorted by recency or activity
FR45: Discussion posts display author name, timestamp, and user avatar
FR46: Authors are visually distinguished when posting in book discussions
FR47: A group chat panel activates in a reading room when an author enters
FR48: Only premium users can see and participate in author chat
FR49: Chat uses real-time messaging via Stream Chat SDK
FR50: Authors are visually distinguished in the chat interface
FR51: Chat panel closes and channel messages are purged when the author leaves the room
FR52: Free users see a premium upgrade prompt when author chat is active
FR53: Chat messages are ephemeral — channel deleted after author leaves
FR54: Server generates Stream user tokens for authenticated users
FR55: Stream Chat React components are used for both discussion and chat UI

### NonFunctional Requirements

NFR6: Discussion posts must load within 2 seconds on 4G
NFR7: Author chat messages must deliver within 1 second (Stream real-time)
NFR8: Discussion threads use Stream's built-in pagination
NFR9: Chat must gracefully degrade if Stream is unavailable
NFR10: Discussion and chat content sanitized via Stream's built-in moderation

### Additional Requirements

- Install `stream-chat` and `@stream-io/stream-chat-react` packages
- Environment variables: `STREAM_API_KEY`, `STREAM_API_SECRET`
- Server-side Stream client in `src/lib/stream.ts` for token generation and admin operations
- Stream token generation endpoint or server action for authenticated users
- No new Prisma models for discussions or chat — Stream handles all storage
- One Stream channel per book for discussions (type: `messaging` or `team`)
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
Users can discuss books with other readers through persistent threaded discussions on every book page, driving book discovery and social engagement. Stream Chat SDK provides the infrastructure for both this epic and future author chat.
**FRs covered:** FR40, FR41, FR42, FR43, FR44, FR45, FR46, FR54, FR55
**NFRs covered:** NFR6, NFR8, NFR10

### Epic 10: Author Chat in Reading Rooms
Premium users can chat with authors in real-time when an author enters a reading room. Free users see a premium upgrade prompt, driving conversions. Chat is ephemeral and organic — tied to the author's natural presence.
**FRs covered:** FR47, FR48, FR49, FR50, FR51, FR52, FR53
**NFRs covered:** NFR7, NFR9

## Epic 9: Stream Integration & Book Discussions

Users can discuss books with other readers through persistent threaded discussions on every book page, driving book discovery and social engagement. Stream Chat SDK provides the infrastructure for both this epic and future author chat.

### Story 9.1: Stream SDK Setup & User Token Generation

As a registered user,
I want the app to connect me to Stream Chat securely,
So that I can use discussion and chat features with my authenticated identity.

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
**And** discussions are visible in read-only mode (no posting)

### Story 9.2: Book Discussion Thread Display

As a reader browsing a book,
I want to see a discussion section on the book's detail page,
So that I can read what other readers are saying about this book.

**Acceptance Criteria:**

**Given** a user navigates to a book detail page (`/book/[id]`)
**When** the page renders
**Then** a "Discussion" section is displayed below book details
**And** the section loads the Stream channel for this book (channel ID: `book-{bookId}`)
**And** if no channel exists yet, it is created automatically (type: `messaging`)

**Given** a book discussion channel has messages
**When** the discussion section loads
**Then** messages are displayed with author name, avatar, and timestamp
**And** messages are sorted by most recent by default
**And** Stream's built-in pagination loads older messages on scroll (NFR8)

**Given** a message was posted by a verified book author
**When** it is displayed in the discussion
**Then** the author's name has a visual distinction (author badge/highlight) (FR46)

**Given** the discussion section is loading
**When** Stream is fetching messages
**Then** a skeleton/loading state is shown
**And** content loads within 2 seconds on 4G (NFR6)

### Story 9.3: Create Discussion Posts & Threaded Replies

As a reader,
I want to post in a book's discussion and reply to other posts,
So that I can share my thoughts and engage in conversation about the book.

**Acceptance Criteria:**

**Given** an authenticated user (free or premium) viewing a book discussion
**When** they type in the message composer and submit
**Then** a new discussion post is created in the Stream channel
**And** the post appears immediately in the thread
**And** the post displays the user's name, avatar, and timestamp (FR45)

**Given** an authenticated user viewing an existing discussion post
**When** they click "Reply"
**Then** a threaded reply interface opens (Stream's built-in threading)
**And** they can type and submit a reply to that specific post (FR42)
**And** the reply count is shown on the parent message

**Given** an unauthenticated user viewing a discussion
**When** they attempt to post or reply
**Then** they are prompted to log in

**Given** a user submits a post
**When** the message is processed
**Then** Stream's built-in content sanitization is applied (NFR10)

### Story 9.4: Discussion Sorting & Discovery

As a reader,
I want to sort discussions by recency or activity,
So that I can find the most relevant conversations.

**Acceptance Criteria:**

**Given** a user viewing a book discussion
**When** they select "Recent" sort option
**Then** messages are sorted by creation time, newest first

**Given** a user viewing a book discussion
**When** they select "Active" sort option
**Then** messages are sorted by most recent reply activity (threads with recent replies surface first)

**Given** a book discussion with many messages
**When** the user scrolls
**Then** pagination loads additional messages seamlessly (NFR8)

**Given** the Stream service is unavailable
**When** the discussion section attempts to load
**Then** a graceful "Discussions unavailable" message is shown (NFR9)
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
