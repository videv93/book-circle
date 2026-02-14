---
stepsCompleted: [1, 2, 3, 5]
inputDocuments:
  - "_bmad-output/analysis/brainstorming-session-2026-01-15.md"
  - "_bmad-output/planning-artifacts/research/market-competitive-ux-social-reading-apps-research-2026-01-15.md"
  - "_bmad-output/planning-artifacts/prd.md"
date: 2026-02-11
author: vitr
---

# Product Brief: flappy-bird-1

## Executive Summary

A feature expansion for Flappy Bird that adds book-level discussions and real-time author chat to deepen social engagement and drive premium conversions. All users discover and discuss books through open discussion threads, while premium users chat directly with authors when they enter reading rooms. This builds on the app's existing ambient author presence model — authors show up naturally, and meaningful conversation happens organically.

---

## Core Vision

### Problem Statement

Readers lack a way to learn about books from other readers before committing to read them, and have no direct line of communication with authors. Current solutions either offer no discussion (most trackers) or gate everything behind structured book clubs (Fable). There's no middle ground where casual discovery and spontaneous author interaction coexist.

### Problem Impact

- Readers add fewer books because they can't gauge interest through peer discussion
- Authors have no low-effort way to engage with their readership
- The app's social layer is limited to kudos and presence — there's no conversation
- No clear premium value proposition beyond basic features

### Why Existing Solutions Fall Short

- **Goodreads:** Reviews are post-read; no active discussion during reading, no author interaction
- **Fable:** Book clubs are structured and scheduled — not spontaneous
- **StoryGraph:** No social discussion layer at all
- **No competitor** combines ambient author presence with real-time reader-author chat

### Proposed Solution

Two interconnected features:

1. **Book Discussions** — persistent discussion threads attached to each book. All users can read and post. Drives book discovery, social engagement, and library additions.

2. **Author Chat (Premium)** — when an author enters a reading room, premium users can chat with them in real-time. Spontaneous and organic, not scheduled. The core premium differentiator.

**Future:** Scheduled AMAs as a structured engagement option for authors who want it (deferred from initial launch).

### Key Differentiators

1. **Organic over structured** — author chat happens when authors naturally show up, not via scheduled bookings
2. **Open discussions as growth engine** — free posting drives network effects and content density
3. **Clear premium gate** — author access is naturally exclusive and high-value
4. **Built on ambient presence** — extends existing reading room infrastructure rather than building separate chat system

---

## Target Users

### Primary Users

#### 1. The Browser — "Lina"

**Context:** Lina, 25, marketing coordinator. Reads 1-2 books/month. Spends more time *choosing* what to read than actually reading. Currently scrolls BookTok and Goodreads reviews but finds them either spoiler-heavy or unhelpful ("5 stars, loved it!").

**Problem Experience:** She adds books to wishlists impulsively then never reads them. She wants to hear real readers talk about *why* a book matters — not star ratings, but actual conversation. She lurks in online book communities but rarely posts.

**Success Vision:** Lina opens a book's discussion, reads a few threads, and thinks: "These people are actually INTO this book — I'm adding it." She discovers more books through discussions than through algorithms.

**Key Behavior:** Reads discussions → adds books to library → occasionally upgrades if she spots an author she loves chatting in a reading room.

---

#### 2. The Contributor — "Raj"

**Context:** Raj, 31, teacher. Reads 3-4 books/month. Loves talking about books more than reading them. Currently posts on Reddit r/books and Goodreads but finds both either toxic or dead.

**Problem Experience:** He finishes a chapter and wants to say "DID ANYONE ELSE CATCH THAT?" but has nowhere safe to do it without spoiling. Goodreads reviews are post-read only. Reddit threads are unorganized.

**Success Vision:** Raj posts his take in a book discussion, gets replies from other readers mid-read, and feels like he's part of a reading community. The discussion threads become his daily check-in alongside his streak.

**Key Behavior:** Posts in discussions → engages with replies → drives content density that attracts Browsers like Lina.

---

#### 3. The Superfan — "Nadia"

**Context:** Nadia, 29, UX designer. Reads 2-3 books/month, mostly indie sci-fi. Follows her favorite authors on social media but never gets real interaction — just broadcast posts.

**Problem Experience:** She DMs authors on Instagram and gets no reply. She leaves thoughtful Goodreads reviews hoping the author sees them. She craves a real, personal connection with the people whose worlds she inhabits for weeks.

**Success Vision:** Nadia is in a reading room for her favorite indie author's book. The author enters. A chat panel lights up. She types: "The ending of Chapter 9 broke me." The author responds. She upgrades to premium without hesitation.

**Key Behavior:** Active in discussions (free) → spots author presence in reading rooms → upgrades to premium → becomes the most engaged and retained user type.

### Secondary Users

N/A — moderation and admin are out of scope for this feature brief.

### User Journey

**Discovery → Conversion Funnel:**

| Stage | Lina (Browser) | Raj (Contributor) | Nadia (Superfan) |
|-------|---------------|-------------------|-------------------|
| Entry | Sees discussion | Posts in discussion | Posts + follows authors |
| Engagement | Adds book to library | Builds reputation | Sees author enter room |
| Deepening | Returns for more | Daily habit formed | Hits premium gate |
| Outcome | May upgrade eventually | May upgrade eventually | Upgrades immediately |

**Key Moments:**

| Moment | User | What Happens |
|--------|------|-------------|
| **Discovery** | Lina | Finds book discussion through browse/search, reads threads |
| **First Post** | Raj | Shares a thought, gets first reply — feels heard |
| **Author Sighting** | Nadia | Sees "Author is in reading room" — emotional trigger |
| **Premium Gate** | Nadia | Taps chat, sees premium prompt — converts |
| **Habit Loop** | All | Discussions become part of daily app routine alongside streaks |

---

## MVP Scope

### Core Features

**1. Book Discussion Threads**
- Discussion section on each book's page
- Threaded replies (reply to specific posts)
- All users can read and post
- Sorted by recency or activity

**2. Author Chat in Reading Rooms (Premium)**
- Group chat panel activates when an author enters a reading room
- Only premium users can see and participate in chat
- Real-time messaging via existing Pusher infrastructure
- Author visually distinguished in chat
- Chat disappears/closes when author leaves the room

### Out of Scope for MVP

- Scheduled AMAs (deferred)
- 1-on-1 DMs with authors
- Spoiler tagging system
- Discussion moderation tools
- Chat message history/persistence after session ends
- Author incentive/reward system

### Future Vision

- **Scheduled AMAs** — authors can schedule live Q&A events for premium users
- **Chapter-gated discussions** — spoiler-safe threads organized by reading progress
- **Author dashboard** — engagement metrics from discussions and chat sessions
- **Discussion reactions** — upvotes, emoji reactions on posts
- **Author incentives** — reader metrics, superfan identification to motivate author participation
