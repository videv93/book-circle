---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/epic-affiliate-monetization-implementation.md
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
---

# flappy-bird-1 - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for flappy-bird-1 Affiliate Monetization, decomposing the requirements from the affiliate monetization implementation document into implementable stories. This feature enables sustainable revenue generation through book affiliate programs (Amazon, Bookshop.org) while maintaining user trust by always presenting free alternatives first.

## Requirements Inventory

### Functional Requirements

FR56: Users see purchase options alongside free reading options on book detail pages
FR57: Purchase buttons include subtle affiliate disclosure
FR58: Click events are tracked for analytics
FR59: Users receive personalized book recommendations after finishing a book
FR60: Recommendations include purchase and free options
FR61: Social proof shown on recommendations (friends who read it)
FR62: One-click purchase from buddy read invitations
FR63: Same edition/version shown as reading partner
FR64: Option to find at local library
FR65: Internal analytics dashboard tracks clicks, conversions, revenue by placement
FR66: A/B testing framework for link positioning
FR67: Regional performance breakdown
FR68: Affiliate links generated server-side (never expose IDs in client)
FR69: Privacy-safe redirect API with geo-routing

### NonFunctional Requirements

NFR11: Affiliate link generation < 200ms
NFR12: GDPR-compliant tracking consent
NFR13: Cache affiliate links with 15-minute TTL
NFR14: Lazy load purchase options to avoid impacting page load
NFR15: All affiliate URLs generated server-side for security

### Additional Requirements

- Amazon Associates and Bookshop.org affiliate accounts required
- Environment variables: `AMAZON_AFFILIATE_ID`, `BOOKSHOP_AFFILIATE_ID`
- New Prisma models: `AffiliateLink`, `AffiliateClick`
- Key files: `src/lib/affiliate/affiliate-manager.ts`, `src/app/api/affiliate/route.ts`, `src/hooks/useAffiliateLink.ts`, `src/components/features/books/BookPurchaseButton.tsx`
- Depends on existing Book model (Epic 2), auth system (Epic 1), premium status (Epic 7)
- Free option (OpenLibrary) always displayed first to build trust

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR56 | Epic 11 | Purchase options on book detail page |
| FR57 | Epic 11 | Affiliate disclosure UI |
| FR58 | Epic 11 | Click event tracking |
| FR59 | Epic 11 | Post-reading recommendations |
| FR60 | Epic 11 | Purchase + free options on recommendations |
| FR61 | Epic 11 | Social proof on recommendations |
| FR62 | Epic 11 | Buddy read purchase flow |
| FR63 | Epic 11 | Same edition matching |
| FR64 | Epic 11 | Library finder option |
| FR65 | Epic 11 | Analytics dashboard |
| FR66 | Epic 11 | A/B testing framework |
| FR67 | Epic 11 | Regional performance tracking |
| FR68 | Epic 11 | Server-side link generation |
| FR69 | Epic 11 | Privacy-safe redirect API |

## Epic List

### Epic 11: Affiliate Monetization
Enable sustainable revenue through book affiliate programs (Amazon, Bookshop.org) integrated into the reading experience. Free alternatives always shown first. Server-side link generation ensures security. Analytics track performance for optimization.
**FRs covered:** FR56-FR69
**NFRs covered:** NFR11-NFR15

## Epic 11: Affiliate Monetization

Enable sustainable revenue through book affiliate programs integrated into the social reading experience. Users see purchase options alongside free alternatives on book pages, in recommendations, and in buddy read flows. All affiliate logic is server-side for security, with analytics tracking for optimization.

### Story 11.1: Book Detail Page Affiliate Integration

As a user viewing a book detail page,
I want to see purchase options alongside free reading options,
So that I can choose how to access the book while supporting the platform.

**Acceptance Criteria:**

**Given** a user navigates to a book detail page (`/book/[id]`)
**When** the page renders
**Then** an OpenLibrary link is displayed when available (free option first)
**And** a purchase button shows with the affiliate provider name (Amazon or Bookshop.org)
**And** a subtle disclosure indicates affiliate support ("supports app")
**And** purchase options lazy-load to avoid impacting page load time (NFR14)

**Given** a user clicks a purchase button
**When** the click is processed
**Then** the click event is tracked in the `AffiliateClick` model (FR58)
**And** the user is redirected via the privacy-safe redirect API (`/api/affiliate`)
**And** the affiliate link is generated server-side (never exposed in client code) (FR68)

**Given** the `AffiliateManager` service
**When** it generates a link
**Then** it uses environment variables for tracking IDs (`AMAZON_AFFILIATE_ID`, `BOOKSHOP_AFFILIATE_ID`)
**And** links are cached with 15-minute TTL (NFR13)
**And** generation completes within 200ms (NFR11)

**Given** a user has not consented to tracking
**When** they click a purchase link
**Then** the redirect works but no personalized tracking data is stored (NFR12)

### Story 11.2: Post-Reading Recommendations

As a user who just finished a book,
I want to receive personalized book recommendations,
So that I can discover my next read.

**Acceptance Criteria:**

**Given** a user marks a book as "finished"
**When** the completion flow renders
**Then** 3-5 contextual recommendations are displayed based on the finished book
**And** each recommendation includes both purchase and free options (FR60)
**And** social proof is shown ("X friends read this") when available (FR61)

**Given** a recommendation is displayed
**When** the user clicks a purchase option
**Then** the same affiliate tracking and redirect flow from Story 11.1 applies
**And** the recommendation source is tracked for conversion analysis

**Given** the recommendation engine
**When** it generates recommendations
**Then** it uses the user's reading history and the current book's metadata
**And** recommendations are relevant to the genre and themes of the finished book

### Story 11.3: Buddy Read Purchase Flow

As a user starting a buddy read,
I want to easily purchase the selected book,
So that I can join the reading experience.

**Acceptance Criteria:**

**Given** a user receives a buddy read invitation
**When** they view the invitation
**Then** a one-click purchase option is displayed for the buddy read book (FR62)
**And** the same edition/version as the reading partner is shown (FR63)
**And** an option to find the book at a local library is available (FR64)

**Given** a user clicks the purchase option from a buddy read
**When** the purchase flow executes
**Then** buddy read conversion rates are tracked separately from general affiliate clicks
**And** the affiliate redirect uses the same server-side flow

**Given** the buddy read book is available on OpenLibrary
**When** the invitation renders
**Then** the free option is shown alongside purchase options

### Story 11.4: Affiliate Analytics Dashboard (Internal)

As a product manager,
I want to track affiliate performance metrics,
So that I can optimize placement and partnerships.

**Acceptance Criteria:**

**Given** an admin user navigates to the analytics dashboard
**When** the affiliate section loads
**Then** clicks, conversions, and revenue are displayed grouped by placement (detail page, recommendations, buddy read)
**And** data can be filtered by date range
**And** regional performance breakdown is available (FR67)

**Given** the A/B testing framework
**When** configured for a link positioning test
**Then** variants are tracked separately (FR66)
**And** statistical significance is calculated for conversion differences

**Given** the analytics data
**When** queried via the dashboard
**Then** user segment analysis is available (free vs premium, active vs casual)
**And** provider comparison (Amazon vs Bookshop.org) is shown
**And** all data respects GDPR constraints (aggregate only, no PII) (NFR12)
