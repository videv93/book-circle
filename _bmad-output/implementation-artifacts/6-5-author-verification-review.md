# Story 6.5: Author Verification Review

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **admin**,
I want **to review and approve/reject author verification requests with detailed reasoning**,
so that **only legitimate authors receive author badges, and rejected claimants understand why and can improve their submissions**.

## Acceptance Criteria

### AC1: Enhanced Claim Detail View
- Given I am an admin on the `/admin/claims` page
- When I click on a pending claim
- Then I navigate to `/admin/claims/[claimId]` detail page
- And I see the claimant's profile (name, email, avatar, join date, role)
- And I see the claimed book (title, author, cover image)
- And I see the verification method and evidence (URL clickable in new tab, or text)
- And I see the submission date
- And I see the claimant's previous claim history (past approved/rejected claims)

### AC2: Approve Valid Claims
- Given I am reviewing a valid author claim on the detail page
- When I click "Approve"
- Then a confirmation dialog appears
- And on confirmation, the AuthorClaim status is set to `APPROVED`
- And `AuthorClaim.reviewedById` is set to my user ID
- And `AuthorClaim.reviewedAt` is set to current timestamp
- And the user receives a Pusher notification: `author:claim-approved` with `{ bookTitle }`
- And an `AdminAction` is logged with `actionType: "AUTHOR_CLAIM_APPROVED"`
- And I am redirected back to the claims list

### AC3: Reject with Reason and Notes
- Given I am reviewing an invalid author claim on the detail page
- When I click "Reject"
- Then a rejection dialog appears with:
  - Rejection reason dropdown: `INSUFFICIENT_EVIDENCE`, `NOT_THE_AUTHOR`, `DUPLICATE_CLAIM`, `OTHER`
  - Optional admin notes textarea (max 500 chars)
- When I select a reason and confirm
- Then the AuthorClaim status is set to `REJECTED`
- And `AuthorClaim.rejectionReason` is stored
- And `AuthorClaim.adminNotes` is stored (if provided)
- And `AuthorClaim.reviewedById` and `reviewedAt` are set
- And the user receives a Pusher notification: `author:claim-rejected` with `{ bookTitle, rejectionReason }`
- And an `AdminAction` is logged with `actionType: "AUTHOR_CLAIM_REJECTED"`, details including reason
- And I am redirected back to the claims list

### AC4: 7-Day Resubmission Cooldown
- Given a user's claim was rejected
- When they attempt to submit a new claim for the same book within 7 days
- Then they see an error: "You can resubmit a claim after [date]. Please gather stronger evidence."
- And the submission is blocked
- After 7 days, they can submit a new claim normally

### AC5: Claims List Enhancements
- Given I am on the `/admin/claims` page
- When the page loads
- Then I see all pending claims sorted by oldest first (existing behavior)
- And I see the count of pending claims in a badge/header
- And each claim card is clickable to navigate to the detail page
- And claims that have been reviewed are no longer shown (only PENDING status)

### AC6: Post-Review User Experience
- Given my claim was approved
- When I next visit the platform
- Then I see a notification about my verified author status
- And my author badge appears on my profile and in reading rooms

- Given my claim was rejected
- When I next visit the platform
- Then I see a notification with the rejection reason
- And I see guidance on what was missing
- And I see when I can resubmit (7-day countdown)

## Tasks / Subtasks

- [x] Task 1: Database Schema Updates (AC: #3, #4)
  - [x] 1.1 Add `RejectionReason` enum: `INSUFFICIENT_EVIDENCE`, `NOT_THE_AUTHOR`, `DUPLICATE_CLAIM`, `OTHER`
  - [x] 1.2 Add `rejectionReason RejectionReason?` field to `AuthorClaim` model
  - [x] 1.3 Add `adminNotes String?` field to `AuthorClaim` model (max 500 chars)
  - [x] 1.4 Run `npx prisma generate` to regenerate client

- [x] Task 2: Validation Schema Updates (AC: #3)
  - [x] 2.1 Add `rejectionReasonEnum` to `src/lib/validation/author.ts`
  - [x] 2.2 Update `reviewClaimSchema` to include optional `rejectionReason` and `adminNotes` fields
  - [x] 2.3 Add `.refine()` rule: rejectionReason is REQUIRED when decision is `reject`

- [x] Task 3: Update `reviewClaim` Server Action (AC: #2, #3)
  - [x] 3.1 Update `src/actions/authors/reviewClaim.ts` to accept and store `rejectionReason` and `adminNotes`
  - [x] 3.2 Include `rejectionReason` in the `author:claim-rejected` Pusher event payload
  - [x] 3.3 Update `AdminAction` details to include rejection reason and notes
  - [x] 3.4 Update tests in `reviewClaim.test.ts`

- [x] Task 4: Enforce 7-Day Resubmission Cooldown (AC: #4)
  - [x] 4.1 Update `src/actions/authors/submitClaim.ts` to check for rejected claims within 7 days
  - [x] 4.2 If rejected claim exists and `reviewedAt` is within 7 days, return error with resubmit date
  - [x] 4.3 Update tests in `submitClaim.test.ts`

- [x] Task 5: Claim Detail Page (AC: #1)
  - [x] 5.1 Create `src/actions/authors/getClaimDetail.ts` - fetches single claim with full user profile, book data, and claim history
  - [x] 5.2 Create `src/app/(admin)/admin/claims/[claimId]/page.tsx` - server component rendering detail view
  - [x] 5.3 Create `src/components/features/admin/ClaimDetailView.tsx` - client component with evidence display, user info, claim history
  - [x] 5.4 Add tests for `getClaimDetail.test.ts` and `ClaimDetailView.test.tsx`

- [x] Task 6: Rejection Dialog Component (AC: #3)
  - [x] 6.1 Create `src/components/features/admin/RejectClaimDialog.tsx` - AlertDialog with reason dropdown and notes textarea
  - [x] 6.2 Wire up to `reviewClaim` action with rejection reason
  - [x] 6.3 Add confirmation step before executing rejection
  - [x] 6.4 Add tests for `RejectClaimDialog.test.tsx`

- [x] Task 7: Update Claims List UI (AC: #5)
  - [x] 7.1 Update `AdminClaimReview.tsx` to make claim cards clickable (navigate to detail page)
  - [x] 7.2 Add pending count badge in page header
  - [x] 7.3 Approval confirmation dialog moved to detail page (ClaimDetailView)
  - [x] 7.4 Update tests for `AdminClaimReview.test.tsx`

- [x] Task 8: Notification Handling for Claim Decisions (AC: #6)
  - [x] 8.1 Update `NotificationProvider.tsx` to handle `author:claim-rejected` events with rejection reason display
  - [x] 8.2 Ensure `author:claim-approved` event shows book title in notification (already existed from Story 5.5)
  - [x] 8.3 Notification tests covered by existing NotificationProvider patterns; no separate test file needed

- [x] Task 9: Tests & Validation (AC: all)
  - [x] 9.1 Run `npm run typecheck` - zero new errors (all errors pre-existing in streak/social test mocks)
  - [x] 9.2 Run `npm run lint` - zero new errors (1 pre-existing warning in NotificationProvider)
  - [x] 9.3 Run `npm run test:run` - all 49 new/modified tests pass, 1520 total pass
  - [x] 9.4 Verified pre-existing failures unchanged (middleware.test.ts, AppShell.test.tsx, ModerationItemCard.test.tsx, ModerationQueue.test.tsx)

## Dev Notes

### What Already Exists (Story 5.5 - DO NOT RECREATE)

The following are already implemented and working - **extend, don't replace**:

| Component | Location | What it does |
|-----------|----------|-------------|
| `AuthorClaim` model | `prisma/schema.prisma:326-347` | Full claim model with status, verification fields |
| `reviewClaim` action | `src/actions/authors/reviewClaim.ts` | Approve/reject with AdminAction logging + Pusher |
| `getPendingClaims` action | `src/actions/authors/getPendingClaims.ts` | Returns pending claims with user + book data |
| `submitClaim` action | `src/actions/authors/submitClaim.ts` | Handles submission with duplicate prevention |
| `getClaimStatus` action | `src/actions/authors/getClaimStatus.ts` | Returns claim status for a user/book |
| `AdminClaimReview` component | `src/components/features/authors/AdminClaimReview.tsx` | Inline list with approve/reject buttons |
| `/admin/claims` page | `src/app/(admin)/admin/claims/page.tsx` | Server component rendering claims queue |
| `reviewClaimSchema` | `src/lib/validation/author.ts` | Validates claimId + decision |
| `ClaimStatus` enum | `prisma/schema.prisma` | `PENDING`, `APPROVED`, `REJECTED` |
| `VerificationMethod` enum | `prisma/schema.prisma` | `AMAZON`, `WEBSITE`, `MANUAL` |

### Critical: Prisma Schema Changes

Add to `AuthorClaim` model:
```prisma
enum RejectionReason {
  INSUFFICIENT_EVIDENCE
  NOT_THE_AUTHOR
  DUPLICATE_CLAIM
  OTHER
}

// Add to AuthorClaim model:
rejectionReason  RejectionReason? @map("rejection_reason")
adminNotes       String?          @map("admin_notes")
```

After schema change: `npx prisma generate` then `npx prisma db push` (dev only).

### Established Admin Action Pattern

All server actions in this story MUST follow this exact pattern:

```typescript
'use server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';
import type { ActionResult } from '@/actions/books/types';

export async function actionName(input: unknown): Promise<ActionResult<T>> {
  const validated = schema.parse(input);
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (!adminUser || !isAdmin(adminUser)) return { success: false, error: 'Forbidden' };

  // ... operation with prisma.$transaction if multi-step ...

  // Non-blocking Pusher notification
  try {
    const pusher = getPusher();
    await pusher?.trigger(`private-user-${userId}`, 'event', payload);
  } catch (e) { console.error('Pusher failed:', e); }

  return { success: true, data: result };
}
```

### 7-Day Cooldown Implementation

In `submitClaim.ts`, before the existing duplicate check, add:

```typescript
const recentRejection = await prisma.authorClaim.findFirst({
  where: {
    userId: session.user.id,
    bookId: validated.bookId,
    status: 'REJECTED',
    reviewedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  },
});
if (recentRejection) {
  const resubmitDate = new Date(recentRejection.reviewedAt!.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { success: false, error: `You can resubmit after ${resubmitDate.toLocaleDateString()}` };
}
```

### Pusher Events for This Story

| Event | Channel | Payload | Story |
|-------|---------|---------|-------|
| `author:claim-approved` | `private-user-{userId}` | `{ bookTitle }` | Existing (5.5) |
| `author:claim-rejected` | `private-user-{userId}` | `{ bookTitle, rejectionReason }` | **UPDATE** payload |

### Test Mocking Pattern (Follow Exactly)

```typescript
vi.mock('next/headers', () => ({ headers: vi.fn().mockResolvedValue(new Headers()) }));
vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    authorClaim: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn(), count: vi.fn() },
    user: { findUnique: vi.fn() },
    adminAction: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock('@/lib/admin', () => ({ isAdmin: vi.fn((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') }));
vi.mock('@/lib/pusher-server', () => ({ getPusher: vi.fn(() => ({ trigger: vi.fn().mockResolvedValue(undefined) })) }));
```

### UI Component Patterns

- **Confirmation dialogs**: Use `AlertDialog` from shadcn/ui (same as `WarnUserDialog`, `SuspendUserDialog`)
- **Rejection reason dropdown**: Use `Select` from shadcn/ui
- **Admin notes**: Use `Textarea` from shadcn/ui, max 500 chars
- **Status badges**: Follow `ClaimStatusBadge.tsx` pattern (amber=pending, green=approved, grey=rejected)
- **Touch targets**: All buttons minimum 44x44px (`min-h-[44px]`)
- **Toast feedback**: Use existing toast system, auto-dismiss 4 seconds
- **Loading states**: Use Skeleton components, not spinners
- **Admin chrome**: Amber primary (#d97706) for admin interface elements

### File Structure for New Files

```
src/
├── actions/authors/
│   ├── getClaimDetail.ts          # NEW
│   └── getClaimDetail.test.ts     # NEW
├── app/(admin)/admin/claims/
│   ├── page.tsx                   # EXISTS (update)
│   └── [claimId]/
│       └── page.tsx               # NEW
├── components/features/admin/
│   ├── ClaimDetailView.tsx        # NEW
│   ├── ClaimDetailView.test.tsx   # NEW
│   ├── RejectClaimDialog.tsx      # NEW
│   └── RejectClaimDialog.test.tsx # NEW
├── components/features/authors/
│   ├── AdminClaimReview.tsx       # EXISTS (update - make clickable)
│   └── AdminClaimReview.test.tsx  # EXISTS (update)
└── lib/validation/
    └── author.ts                  # EXISTS (update schema)
```

### Import Convention

**ALWAYS use `@/` alias** for cross-boundary imports:
```typescript
import { Button } from '@/components/ui/button';
import { reviewClaim } from '@/actions/authors/reviewClaim';
import { isAdmin } from '@/lib/admin';
```

### Naming Conventions

- Models: `PascalCase` (e.g., `AuthorClaim`)
- Tables: `snake_case` with `@@map()` (e.g., `author_claims`)
- Columns: `snake_case` with `@map()` (e.g., `rejection_reason`)
- Components: `PascalCase` file + export (e.g., `ClaimDetailView.tsx`)
- Actions: `camelCase` (e.g., `getClaimDetail.ts`)
- Tests: `{name}.test.ts(x)` co-located with source

### Project Structure Notes

- All admin actions go in `src/actions/authors/` (NOT `src/actions/admin/`) since they are author-domain actions
- Admin-specific UI components go in `src/components/features/admin/`
- Author-domain components (used by both users and admins) stay in `src/components/features/authors/`
- Admin pages under `src/app/(admin)/admin/claims/`

### References

- [Source: prisma/schema.prisma - AuthorClaim model, lines 326-347]
- [Source: src/actions/authors/reviewClaim.ts - Existing review action]
- [Source: src/actions/authors/getPendingClaims.ts - Existing pending claims query]
- [Source: src/actions/authors/submitClaim.ts - Existing submission with duplicate check]
- [Source: src/components/features/authors/AdminClaimReview.tsx - Existing admin UI]
- [Source: src/lib/validation/author.ts - Existing validation schemas]
- [Source: src/components/features/admin/WarnUserDialog.tsx - Reference pattern for AlertDialog]
- [Source: src/components/features/admin/RemoveContentDialog.tsx - Reference pattern for reason selection]
- [Source: _bmad-output/planning-artifacts/epics/epic-6-administration-platform-health.md - Story 6.5 requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md - Technical stack and patterns]
- [Source: _bmad-output/planning-artifacts/prd.md - Journey 3: Alex Platform Guardian]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Full test suite: 157 files passed, 4 failed (all pre-existing), 1520 tests passed
- TypeScript typecheck: 0 new errors
- ESLint: 0 new errors/warnings

### Completion Notes List

- Task 1: Added `RejectionReason` enum and `rejectionReason`/`adminNotes` fields to AuthorClaim model in Prisma schema. Ran `npx prisma generate` successfully.
- Task 2: Added `rejectionReasonEnum` to validation schema, updated `reviewClaimSchema` with conditional `.refine()` requiring rejection reason on reject decisions.
- Task 3: Updated `reviewClaim` server action to store rejection reason and admin notes, include rejection reason in Pusher event payload, and log detailed admin actions. 10 tests pass.
- Task 4: Added 7-day cooldown enforcement in `submitClaim.ts` - checks `reviewedAt` timestamp on rejected claims before allowing resubmission. 9 tests pass (3 new cooldown tests).
- Task 5: Created `getClaimDetail` server action (with 6 tests), claim detail page at `/admin/claims/[claimId]`, and `ClaimDetailView` component (with 10 tests) showing claimant profile, book, evidence, and claim history.
- Task 6: Created `RejectClaimDialog` component using AlertDialog with 4 rejection reason buttons (following RemoveContentDialog pattern) and admin notes textarea. 8 tests pass.
- Task 7: Refactored `AdminClaimReview` to use clickable cards navigating to detail page, added pending count badge, removed inline action buttons (now on detail page). 6 tests pass.
- Task 8: Enhanced `NotificationProvider` to display human-readable rejection reasons and 7-day resubmit guidance in rejection notifications.
- Task 9: Full validation - 0 new typecheck errors, 0 new lint errors, all 49 new/modified tests pass, 4 pre-existing failures unchanged.

### Change Log

- 2026-02-10: Story 6.5 implementation complete - author verification review with rejection reasons, admin notes, 7-day cooldown, detail page, and enhanced notifications
- 2026-02-10: Code review fixes - 6 issues fixed (3 HIGH, 3 MEDIUM):
  - H1: Wrapped getClaimDetail queries in $transaction for consistent reads
  - H2: Removed @@unique([userId, bookId]) on AuthorClaim (replaced with @@index), eliminated hard-delete of rejected claims to preserve audit trail, updated submitClaim/getClaimStatus to use findFirst
  - H3: Added router.refresh() in ClaimDetailView before router.push() to invalidate Router Cache
  - M1: Made verification URL in AdminClaimReview an actual <a> tag with stopPropagation
  - M2: Moved setShowApproveDialog(false) into explicit success/failure branches
  - M3: Added transaction argument assertions in reviewClaim tests (verify update data + AdminAction creation)
  - L2: Removed unused useState in AdminClaimReview

### File List

**New Files:**
- src/actions/authors/getClaimDetail.ts
- src/actions/authors/getClaimDetail.test.ts
- src/app/(admin)/admin/claims/[claimId]/page.tsx
- src/components/features/admin/ClaimDetailView.tsx
- src/components/features/admin/ClaimDetailView.test.tsx
- src/components/features/admin/RejectClaimDialog.tsx
- src/components/features/admin/RejectClaimDialog.test.tsx

**Modified Files:**
- prisma/schema.prisma (added RejectionReason enum, rejectionReason/adminNotes fields; review: replaced @@unique with @@index on AuthorClaim)
- src/lib/validation/author.ts (added rejectionReasonEnum, updated reviewClaimSchema)
- src/actions/authors/reviewClaim.ts (store rejection data, updated Pusher payload)
- src/actions/authors/reviewClaim.test.ts (3 new tests for rejection scenarios; review: added transaction argument assertions)
- src/actions/authors/submitClaim.ts (7-day cooldown enforcement; review: replaced findUnique+delete with findFirst, preserves rejected claims)
- src/actions/authors/submitClaim.test.ts (3 new cooldown tests; review: updated for findFirst pattern)
- src/actions/authors/getClaimStatus.ts (review: replaced findUnique with findFirst for non-unique query)
- src/actions/authors/getClaimStatus.test.ts (review: updated for findFirst pattern)
- src/components/features/authors/AdminClaimReview.tsx (clickable cards, pending badge, removed inline actions; review: URL now clickable <a>, removed unused useState)
- src/components/features/authors/AdminClaimReview.test.tsx (updated for navigation tests)
- src/components/features/admin/ClaimDetailView.tsx (review: added router.refresh(), explicit dialog close in branches)
- src/components/providers/NotificationProvider.tsx (enhanced rejection notification with reason labels)
