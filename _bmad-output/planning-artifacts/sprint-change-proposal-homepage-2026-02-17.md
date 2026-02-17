# Sprint Change Proposal — Homepage Enhancement

**Date:** 2026-02-17
**Author:** vitr
**Change Scope:** Minor
**Affected Epic:** New Epic 12

---

## Section 1: Issue Summary

The homepage (`HomeContent.tsx`) currently shows only a welcome message, streak ring, daily goal progress, and sign-out button. Despite having rich features built across Epics 2-11 (book library, reading rooms, presence, author chat, social feed), none are surfaced on the main landing screen.

This undermines:
- The UX spec's "Home → reading in 2 taps maximum" goal
- The PRD's core engagement loop: "Log session → See streak → Receive kudos → Feel validated"
- The UX spec's explicit home screen design: "Card-based Currently Reading with presence indicators"

**Discovery context:** Identified during implementation review after Epics 1-11 were substantially complete.

---

## Section 2: Impact Analysis

### Epic Impact

| Epic | Impact | Details |
|------|--------|---------|
| Epics 1-11 | None | All remain valid and unchanged |
| New Epic 12 | **New** | "Homepage Enhancement" — 2 stories |

### Story Impact

No existing stories need modification. Two new stories:

| Story | Description |
|-------|-------------|
| 12.1 Homepage Book Collections | Continue Reading + Reading Now + Discover sections |
| 12.2 Live Author Chat Indicator | Surface active author chats on homepage |

### Artifact Conflicts

- **PRD:** No changes needed — features already defined
- **Architecture:** No changes needed — all data models and APIs exist
- **UX Spec:** Minor addition needed — "Live Chat Happening" indicator (author chat added in Epic 10, not in original UX spec)
- **Database:** No schema changes

### Technical Impact

- Frontend-only changes to `HomeContent.tsx` and new sub-components
- New Prisma queries for homepage data aggregation
- Reuses existing components: BookCard, PresenceAvatarStack, AuthorShimmerBadge

---

## Section 3: Recommended Approach

**Selected Path:** Direct Adjustment — Add new Epic 12 with 2 stories

**Rationale:**
1. All underlying features are already built and working
2. Purely frontend composition — querying existing data, rendering on homepage
3. No new infrastructure, schema changes, or external integrations
4. Low risk, high user value — homepage is the daily landing screen

**Effort:** Low-Medium
**Risk:** Low
**Timeline Impact:** Minimal — can start immediately, prioritize above Epic 9.3/9.4 backlog

---

## Section 4: Detailed Change Proposals

### 4.1 New Epic

**Epic 12: Homepage Enhancement**

Goal: Transform the homepage into an engaging dashboard that surfaces book collections, active reading community, and live author chat events — enabling the "Home → reading in 2 taps" UX goal.

Dependencies: Epics 2, 3, 5, 10 (all done)

### 4.2 Story 12.1: Homepage Book Collections

As a **user**, I want to see organized book collections on the homepage, so that I can quickly continue reading or find my next book.

**Section 1: Continue Reading**
- User's "Currently Reading" books with cover, title, author, last session time
- Prominent "Read" button for quick resume to book detail page
- Sorted by most recent session first, max 4 books
- Empty state: "Find your next book" CTA linking to Search

**Section 2: Reading Now (Active Readers)**
- Horizontally scrollable book cards with active readers
- Each card: cover, title, PresenceAvatarStack, reader count ("X reading now")
- Golden border glow when author is present in reading room
- Sorted by most active readers first

**Section 3: Discover**
- Popular/trending books based on total readers + recent session activity
- Up to 6 books in horizontal scroll
- Checkmark on books already in user's library
- Tapping navigates to book detail page

**General:**
- Skeleton loading states for all sections
- Existing streak ring / daily goal section preserved at top
- All sections stacked vertically, scrollable

**Technical Notes:**
- Reuse BookCard (compact variant), PresenceAvatarStack components
- Server Component data fetching via Prisma
- New queries: getUserCurrentlyReading(), getActiveBooks(), getPopularBooks()

### 4.3 Story 12.2: Live Author Chat Indicator

As a **user**, I want to see when author live chats are happening on the homepage, so that I don't miss these special events.

- "Live Now" banner/section above book collections when active chats exist
- Each live chat: book cover, title, author name, participant count, golden shimmer
- Tap navigates to book's reading room with chat open
- Sorted by participant count, max 3 shown
- Hidden entirely when no chats are active
- Existing premium chat gating applies (Story 10.2)
- Accessibility: screen reader announces "X author live chats happening now"
- Pulse animation respects prefers-reduced-motion

**Technical Notes:**
- Query existing Epic 10 chat/presence data
- Server Component with short revalidation (30-60s) or client polling
- Reuse AuthorShimmerBadge styling
- No new database tables

---

## Section 5: Implementation Handoff

**Change Scope Classification:** Minor — Direct implementation by dev team

### Handoff Plan

| Role | Responsibility |
|------|----------------|
| Dev team | Implement Stories 12.1 and 12.2 |
| SM | Create story files, update sprint status |

### Recommended Story Order
1. **Story 12.1** (Book Collections) — highest impact, core homepage content
2. **Story 12.2** (Live Chat Indicator) — enhancement layer on top

### Success Criteria
- Homepage shows Continue Reading, Reading Now, and Discover sections
- Active author chats surfaced with "Live Now" golden treatment
- "Home → reading in 2 taps" UX goal achieved
- Existing streak ring / daily goal preserved at top
- Skeleton loading states for all sections
- Accessibility: screen reader support, reduced motion respected
