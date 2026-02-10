---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/epic-premium-monetization.md
---

# flappy-bird-1 - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for flappy-bird-1 Premium Monetization (Phase 1), decomposing the requirements from the epic-premium-monetization document into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Free tier users can track a maximum of 3 books
FR2: System enforces book limit at server action level when adding books
FR3: Premium users ($9.99 one-time) get unlimited book tracking
FR4: Polar Checkout API integration for one-time $9.99 payment
FR5: Webhook handler at `/api/webhooks/polar` processes `checkout.completed` events
FR6: `User` model extended with `polarCustomerId` and `premiumStatus` (FREE/PREMIUM)
FR7: `Payment` model stores transaction records
FR8: `isPremium(userId)` utility provides single source of truth for premium status
FR9: Upgrade prompt shown to free users when they hit the 3-book limit (celebratory tone)
FR10: Premium unlock flow: user hits limit → sees upgrade prompt → Polar checkout → premium activated
FR11: Component-level UI hints distinguish free vs premium states
FR12: Premium status persisted and queryable after payment confirmation

### NonFunctional Requirements

NFR1: Payment processing must use Polar as Merchant of Record (tax compliance delegated)
NFR2: Server action validation as primary enforcement — no client-side-only gating
NFR3: Abstract payment logic behind interface to mitigate vendor lock-in
NFR4: Target 5-15% conversion rate of users hitting 3-book limit
NFR5: Webhook handler must securely verify Polar webhook signatures

### Additional Requirements

- `@polar-sh/sdk` npm package + Next.js adapter required
- Prisma schema changes: `PremiumStatus` enum, `polarCustomerId` on User, `Payment` model
- Key files: `src/lib/polar.ts`, `src/app/api/webhooks/polar/route.ts`, `src/actions/billing/createCheckout.ts`, `src/actions/billing/getPaymentStatus.ts`, `src/lib/premium.ts`
- Depends on existing Better Auth system, Prisma ORM, PostgreSQL
- Polar account must be set up on polar.sh before integration
- Scope is Phase 1 only (Stories 1.1–1.4) — commenting and author features are Phase 2/3

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | 3-book limit for free tier |
| FR2 | Epic 1 | Server action enforcement on book add |
| FR3 | Epic 2 | Unlimited tracking for premium users |
| FR4 | Epic 2 | Polar Checkout API integration |
| FR5 | Epic 2 | Webhook handler for `checkout.completed` |
| FR6 | Epic 1 | User model with `polarCustomerId` + `premiumStatus` |
| FR7 | Epic 2 | Payment model for transaction records |
| FR8 | Epic 1 | `isPremium(userId)` utility |
| FR9 | Epic 1 | Celebratory upgrade prompt at limit |
| FR10 | Epic 2 | Full unlock flow: limit → prompt → checkout → premium |
| FR11 | Epic 1 | Component UI hints for free vs premium |
| FR12 | Epic 2 | Premium status persisted after payment |

## Epic List

### Epic 1: Premium Schema & Book Limit Enforcement
Free users can track up to 3 books. When they try to add a 4th, they see a celebratory upgrade prompt ("You're a power reader!") informing them about premium. Establishes the premium/free data model and gating infrastructure.
**FRs covered:** FR1, FR2, FR6, FR8, FR9, FR11
**NFRs covered:** NFR2, NFR3

### Epic 2: Polar Payment & Premium Unlock
Users who hit the book limit can pay $9.99 via Polar checkout, get premium status activated, and immediately track unlimited books. Completes the full Phase 1 monetization loop.
**FRs covered:** FR3, FR4, FR5, FR7, FR10, FR12
**NFRs covered:** NFR1, NFR4, NFR5

## Epic 1: Premium Schema & Book Limit Enforcement

Free users can track up to 3 books. When they try to add a 4th, they see a celebratory upgrade prompt ("You're a power reader!") informing them about premium. Establishes the premium/free data model and gating infrastructure.

### Story 1.1: Premium Data Model & Status Utility

As a developer,
I want the User model extended with premium status and a reusable `isPremium()` utility,
So that all future premium gating has a single source of truth.

**Acceptance Criteria:**

**Given** the Prisma schema
**When** migrations are applied
**Then** User model has `premiumStatus` field with `PremiumStatus` enum (FREE, PREMIUM) defaulting to FREE
**And** User model has `polarCustomerId` field (optional String)
**And** a `Payment` model exists with fields: id, userId, polarCheckoutId, amount, currency, status, createdAt
**And** `src/lib/premium.ts` exports `isPremium(userId)` that queries User.premiumStatus
**And** all existing users default to FREE status
**And** payment logic is abstracted behind an interface (NFR3)

### Story 1.2: Book Limit Enforcement for Free Users

As a free tier user,
I want to be able to track up to 3 books,
So that I can experience the app's value before deciding to upgrade.

**Acceptance Criteria:**

**Given** a free tier user with fewer than 3 books
**When** they add a new book
**Then** the book is added successfully

**Given** a free tier user with exactly 3 books
**When** they attempt to add a 4th book
**Then** the server action returns an error indicating the book limit is reached
**And** the error includes the user's current premium status
**And** enforcement happens at the server action level, not client-side only (NFR2)

**Given** a premium user
**When** they add any number of books
**Then** the book is added successfully with no limit enforced

### Story 1.3: Upgrade Prompt & Premium UI Hints

As a free tier user who has hit the 3-book limit,
I want to see a celebratory upgrade prompt and visual cues about premium,
So that I feel encouraged (not punished) to upgrade.

**Acceptance Criteria:**

**Given** a free tier user attempts to add a 4th book
**When** the book limit error is returned
**Then** an upgrade prompt is displayed with celebratory tone ("You're a power reader!")
**And** the prompt explains premium benefits (unlimited books, $9.99 one-time)
**And** the prompt includes a CTA button for upgrade (can link to placeholder until Epic 2)

**Given** a free tier user on any page showing their book count
**When** the page renders
**Then** UI hints show book count as "X/3 books" for free users
**And** premium users see no limit indicator

**Given** a free tier user viewing the upgrade prompt
**When** they dismiss the prompt
**Then** they return to their current view without data loss

## Epic 2: Polar Payment & Premium Unlock

Users who hit the book limit can pay $9.99 via Polar checkout, get premium status activated, and immediately track unlimited books. Completes the full Phase 1 monetization loop.

### Story 2.1: Polar Client Setup & Checkout Session

As a free tier user who wants to upgrade,
I want to initiate a Polar checkout for the $9.99 premium payment,
So that I can securely pay and unlock premium features.

**Acceptance Criteria:**

**Given** `@polar-sh/sdk` is installed and configured
**When** the app initializes
**Then** `src/lib/polar.ts` exports a configured Polar client using environment variables
**And** `POLAR_ACCESS_TOKEN` and `POLAR_WEBHOOK_SECRET` env vars are required

**Given** a free tier user clicks the upgrade CTA
**When** the `createCheckout` server action is called
**Then** a Polar Checkout session is created for the $9.99 one-time product
**And** the user is redirected to Polar's hosted checkout page
**And** the checkout includes the user's ID as metadata for webhook matching

**Given** a premium user attempts to access checkout
**When** the `createCheckout` server action is called
**Then** the action returns an error indicating user is already premium

### Story 2.2: Webhook Handler & Payment Processing

As a user who has completed payment on Polar,
I want my premium status activated automatically,
So that I can immediately start tracking unlimited books.

**Acceptance Criteria:**

**Given** Polar sends a `checkout.completed` webhook to `/api/webhooks/polar`
**When** the webhook is received
**Then** the webhook signature is verified against `POLAR_WEBHOOK_SECRET` (NFR5)
**And** a `Payment` record is created with polarCheckoutId, amount, currency, status
**And** the User's `premiumStatus` is updated from FREE to PREMIUM
**And** the User's `polarCustomerId` is stored from the webhook payload

**Given** a webhook with an invalid signature
**When** it is received
**Then** the handler returns 401 Unauthorized
**And** no database changes are made

**Given** a duplicate webhook for an already-processed payment
**When** it is received
**Then** the handler is idempotent — no duplicate Payment records created
**And** returns 200 OK

### Story 2.3: Premium Unlock Flow & Post-Payment Experience

As a user who just paid for premium,
I want to be redirected back to the app with premium unlocked,
So that I can immediately add more books.

**Acceptance Criteria:**

**Given** a user completes Polar checkout
**When** they are redirected back to the app (success URL)
**Then** a success page confirms their premium activation
**And** the page shows "Welcome to Premium!" with a CTA to add books
**And** `getPaymentStatus` server action confirms premium status

**Given** a user's payment fails or is cancelled on Polar
**When** they are redirected back (cancel URL)
**Then** they see a friendly message with option to retry
**And** no premium status change occurs

**Given** a newly premium user returns to the book add flow
**When** they add a 4th+ book
**Then** the book is added successfully with no limit
**And** the "X/3 books" UI hint is no longer shown
