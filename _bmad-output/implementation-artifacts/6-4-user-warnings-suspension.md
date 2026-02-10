# Story 6.4: User Warnings & Suspension

Status: done

## Story

As an **admin**,
I want **to warn or suspend user accounts**,
so that **I can enforce community guidelines proportionally**.

## Acceptance Criteria

### Warning Flow

1. From moderation item review or user admin profile, admin clicks "Warn User"
2. Admin selects warning type: `FIRST_WARNING` or `FINAL_WARNING`
3. Admin adds custom message explaining the violation
4. Warning is created as `UserWarning` record linked to user and optionally to `ModerationItem`
5. User is notified via Pusher (`moderation:user-warned` on `private-user-{userId}`)
6. On next login/page load, user sees a prominent warning banner that MUST be acknowledged (click "I understand") before accessing any features
7. Warning acknowledgment is tracked (`acknowledgedAt` on `UserWarning`)
8. If warn action originated from moderation review, `ModerationItem.status` is updated to `WARNED`

### Suspension Flow

9. From moderation item review or user admin profile, admin clicks "Suspend Account"
10. Admin selects duration: `24_HOURS`, `7_DAYS`, `30_DAYS`, `PERMANENT`
11. Admin provides reason (required, max 1000 chars)
12. Confirmation dialog shows: user name, duration, reason before executing
13. On confirmation:
    - `User.suspendedUntil` set (or `9999-12-31` for permanent)
    - `User.suspensionReason` set
    - `UserSuspension` history record created
    - All active `Session` records for the user are deleted (force logout)
    - All active `RoomPresence` records (`leftAt: null`) are terminated (`leftAt` = now)
    - `ModerationItem.status` updated to `SUSPENDED` (if from moderation)
    - `AdminAction` logged
    - User notified via Pusher (`moderation:user-suspended` on `private-user-{userId}`)
14. When suspended user tries to access protected routes, they are redirected to `/suspended` page showing: "Your account is suspended until [date]. Reason: [reason]"
15. Suspended users cannot access any features; their content remains visible but they cannot interact
16. When suspension expires, user can log in normally and sees: "Your suspension has ended. Please review our community guidelines."

### Admin View

17. Admin user detail page (`/admin/users/[userId]`) shows: warnings issued, suspensions, content removals, flag count, full moderation history
18. Quick actions available from user detail: Warn, Suspend
19. Admin can lift a suspension early via "Lift Suspension" action

### Dashboard Integration

20. `getDashboardStats` returns real `userWarningCount` (active unacknowledged warnings) instead of hardcoded 0

## Tasks / Subtasks

- [x]**Task 1: Database Schema Updates** (AC: 4, 7, 13)
  - [x]1.1 Add `suspendedUntil`, `suspensionReason` fields to `User` model
  - [x]1.2 Create `UserWarning` model (id, userId, issuedById, warningType enum, message, reason, moderationItemId?, acknowledgedAt?, createdAt)
  - [x]1.3 Create `UserSuspension` model (id, userId, issuedById, reason, duration, suspendedUntil, liftedAt?, liftedById?, moderationItemId?, createdAt)
  - [x]1.4 Create `WarningType` enum: `FIRST_WARNING`, `FINAL_WARNING`
  - [x]1.5 Create `SuspensionDuration` enum: `HOURS_24`, `DAYS_7`, `DAYS_30`, `PERMANENT`
  - [x]1.6 Add relations on User: `warnings`, `suspensions`, `warningsIssued`, `suspensionsIssued`, `suspensionsLifted`
  - [x]1.7 Add optional relation from `UserWarning`/`UserSuspension` to `ModerationItem`
  - [x]1.8 Run `npx prisma generate` and `npx prisma db push`

- [x]**Task 2: Validation Schemas** (AC: 2, 3, 10, 11)
  - [x]2.1 Add `warningTypeEnum` to `src/lib/validation/admin.ts`: `z.enum(['FIRST_WARNING', 'FINAL_WARNING'])`
  - [x]2.2 Add `suspensionDurationEnum`: `z.enum(['HOURS_24', 'DAYS_7', 'DAYS_30', 'PERMANENT'])`
  - [x]2.3 Add `warnUserSchema`: `{ userId, warningType, message (min 10, max 1000), moderationItemId? }`
  - [x]2.4 Add `suspendUserSchema`: `{ userId, duration, reason (min 10, max 1000), moderationItemId? }`
  - [x]2.5 Add `liftSuspensionSchema`: `{ userId, reason? (max 1000) }`
  - [x]2.6 Add `acknowledgeWarningSchema`: `{ warningId }`

- [x]**Task 3: Server Actions - Warning** (AC: 1-8)
  - [x]3.1 Create `src/actions/admin/warnUser.ts` + test
    - Validate input with `warnUserSchema`
    - Auth + admin check (standard pattern)
    - In `$transaction`: create `UserWarning`, log `AdminAction` (actionType: `WARN_USER`), optionally update `ModerationItem` status to `WARNED`
    - Trigger Pusher `moderation:user-warned` on `private-user-{userId}` with `{ warningType, message }`
  - [x]3.2 Create `src/actions/admin/getUserModerationHistory.ts` + test
    - Fetch user's warnings, suspensions, content removals, flag count
    - Return combined moderation history for admin user detail view
  - [x]3.3 Create `src/actions/user/acknowledgeWarning.ts` + test
    - Non-admin action (user action) in `src/actions/user/`
    - Set `acknowledgedAt` on `UserWarning`
    - Does NOT require admin role, just authenticated user matching `warning.userId`

- [x]**Task 4: Server Actions - Suspension** (AC: 9-16, 19)
  - [x]4.1 Create `src/actions/admin/suspendUser.ts` + test
    - Validate with `suspendUserSchema`
    - Calculate `suspendedUntil` from duration enum (24h/7d/30d/permanent=9999-12-31)
    - In `$transaction`: update `User` (suspendedUntil, suspensionReason), create `UserSuspension`, delete all `Session` records for user, update all `RoomPresence` where leftAt is null, log `AdminAction` (actionType: `SUSPEND_USER`), optionally update `ModerationItem` status to `SUSPENDED`
    - Trigger Pusher `moderation:user-suspended` on `private-user-{userId}` with `{ reason, suspendedUntil, duration }`
  - [x]4.2 Create `src/actions/admin/liftSuspension.ts` + test
    - Clear `User.suspendedUntil` and `User.suspensionReason`
    - Update latest `UserSuspension` record: set `liftedAt`, `liftedById`
    - Log `AdminAction` (actionType: `LIFT_SUSPENSION`)
    - Trigger Pusher `moderation:suspension-lifted` on `private-user-{userId}`

- [x]**Task 5: Suspension Enforcement** (AC: 14, 15, 16)
  - [x]5.1 Create `/src/app/(auth)/suspended/page.tsx` - static page showing suspension message
    - Reads `suspendedUntil` and `suspensionReason` from user record
    - If suspension has expired, redirect to `/home` and clear suspension fields
    - Shows: "Your account is suspended until [date]. Reason: [reason]"
    - No navigation shell, just centered card with info and logout button
  - [x]5.2 Create `src/lib/checkSuspension.ts` utility
    - `checkSuspension(userId: string): Promise<{ suspended: boolean; suspendedUntil?: Date; reason?: string }>`
    - Check if `User.suspendedUntil > now()` - if yes, user is suspended
    - If `suspendedUntil` is in the past, auto-clear fields and return not suspended
  - [x]5.3 Add suspension check to admin layout and main layout
    - In `src/app/(main)/layout.tsx`: after session check, call `checkSuspension`; if suspended, redirect to `/suspended`
    - This prevents suspended users from accessing ANY protected feature
  - [x]5.4 Add post-suspension message handling
    - When suspension expires and user accesses the app, show toast: "Your suspension has ended. Please review our community guidelines."
    - Track via a flag or timestamp comparison

- [x]**Task 6: Warning Acknowledgment UI** (AC: 6, 7)
  - [x]6.1 Create `src/components/features/admin/WarningBanner.tsx` + test
    - Full-screen overlay or prominent banner at top of page
    - Shows warning type, message, date issued
    - "I understand" button calls `acknowledgeWarning` action
    - Cannot be dismissed without acknowledgment
  - [x]6.2 Create `src/hooks/useUnacknowledgedWarnings.ts`
    - Fetch unacknowledged warnings for current user
    - Used by layout to conditionally render `WarningBanner`
  - [x]6.3 Integrate `WarningBanner` in `src/app/(main)/layout.tsx`
    - If user has unacknowledged warnings, show banner overlay before content
  - [x]6.4 Create `src/actions/user/getUnacknowledgedWarnings.ts` + test
    - Return `UserWarning[]` where `userId` = current user AND `acknowledgedAt` is null

- [x]**Task 7: Admin UI - Warn & Suspend Dialogs** (AC: 1-3, 9-12)
  - [x]7.1 Create `src/components/features/admin/WarnUserDialog.tsx` + test
    - AlertDialog following `RemoveContentDialog` pattern
    - Warning type selector (First Warning / Final Warning)
    - Custom message textarea (required, max 1000)
    - Calls `warnUser` action on submit
    - Shows loading state, error handling via toast
  - [x]7.2 Create `src/components/features/admin/SuspendUserDialog.tsx` + test
    - AlertDialog with duration selector (24h, 7d, 30d, Permanent)
    - Reason textarea (required, max 1000)
    - Confirmation showing: user name, selected duration, reason
    - Calls `suspendUser` action on submit
    - Shows loading state, error handling via toast
  - [x]7.3 Update `ModerationItemCard.tsx` "Warn" button to open `WarnUserDialog`
  - [x]7.4 Update `ModerationItemCard.tsx` "Suspend" button to open `SuspendUserDialog`

- [x]**Task 8: Admin User Detail Page** (AC: 17, 18, 19)
  - [x]8.1 Create `src/app/(admin)/admin/users/[userId]/page.tsx`
    - Server component, fetch user + moderation history via `getUserModerationHistory`
    - Display sections: Account Info, Warnings, Suspensions, Content Removals, Flag History
    - Quick action buttons: Warn User, Suspend Account, Lift Suspension (if currently suspended)
  - [x]8.2 Create `src/components/features/admin/UserModerationHistory.tsx` + test
    - Tabbed or sectioned view: Warnings | Suspensions | Removals | Flags
    - Each entry shows: date, admin who issued, reason, status
    - Warnings show: type, message, acknowledged status
    - Suspensions show: duration, dates, lifted status
  - [x]8.3 Add user detail link from moderation queue items (link reported user name to `/admin/users/[userId]`)

- [x]**Task 9: Dashboard & Notification Integration** (AC: 20, 5, 13)
  - [x]9.1 Update `getDashboardStats.ts` to query real `userWarningCount`
    - Count `UserWarning` where `acknowledgedAt` is null
  - [x]9.2 Update `NotificationProvider.tsx` to handle new events:
    - `moderation:user-warned`: show toast with warning message
    - `moderation:user-suspended`: show toast then redirect to `/suspended`
    - `moderation:suspension-lifted`: show toast "Your suspension has been lifted"

- [x]**Task 10: Tests & Validation** (all AC)
  - [x]10.1 Ensure all server actions have co-located `.test.ts` files
  - [x]10.2 Ensure all components have co-located `.test.tsx` files
  - [x]10.3 Run `npm run typecheck` - zero errors
  - [x]10.4 Run `npm run lint` - zero errors
  - [x]10.5 Run `npm run test:run` - all new tests pass

## Dev Notes

### Established Admin Action Pattern (MUST follow)

All admin server actions in `src/actions/admin/` follow this exact pattern:

```typescript
'use server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';
import type { ActionResult } from '@/actions/books/types';

export async function actionName(input: unknown): Promise<ActionResult<T>> {
  try {
    const validated = schema.parse(input);
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });
    if (!adminUser || !isAdmin(adminUser)) return { success: false, error: 'Forbidden' };

    const [result] = await prisma.$transaction([
      // Main operation
      // AdminAction log
    ]);

    // Pusher notification (try/catch, non-blocking)
    try {
      const pusher = getPusher();
      await pusher?.trigger(`private-user-${userId}`, 'event', payload);
    } catch (e) { console.error('Pusher failed:', e); }

    return { success: true, data: result };
  } catch (error) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return { success: false, error: 'Invalid input' };
    }
    console.error('action error:', error);
    return { success: false, error: 'Failed to perform action' };
  }
}
```

### Suspension Duration Calculation

```typescript
function calculateSuspendedUntil(duration: SuspensionDuration): Date {
  const now = new Date();
  switch (duration) {
    case 'HOURS_24': return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'DAYS_7': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'DAYS_30': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case 'PERMANENT': return new Date('9999-12-31T23:59:59.999Z');
  }
}
```

### Session Invalidation on Suspension

Delete all Better Auth sessions from DB to force logout:

```typescript
await prisma.session.deleteMany({ where: { userId: targetUserId } });
```

### Reading Room Presence Termination on Suspension

```typescript
await prisma.roomPresence.updateMany({
  where: { userId: targetUserId, leftAt: null },
  data: { leftAt: new Date() },
});
```

### Suspension Check - NOT in Middleware

**Important:** Do NOT add DB calls to `proxy.ts` (middleware). Middleware runs on every request and cannot use Prisma (Edge runtime). Instead, check suspension in the `(main)/layout.tsx` server component which already has access to auth session and Prisma.

### Pusher Notification Events (new)

| Event | Channel | Payload |
|---|---|---|
| `moderation:user-warned` | `private-user-{userId}` | `{ warningType, message }` |
| `moderation:user-suspended` | `private-user-{userId}` | `{ reason, suspendedUntil, duration }` |
| `moderation:suspension-lifted` | `private-user-{userId}` | `{}` |

### Existing Notification Events (reference)

| Event | Channel |
|---|---|
| `moderation:content-removed` | `private-user-{userId}` |
| `moderation:content-restored` | `private-user-{userId}` |
| `kudos:received` | `private-user-{userId}` |
| `author:claim-approved` | `private-user-{userId}` |
| `author:claim-rejected` | `private-user-{userId}` |

### Test Mocking Pattern

```typescript
vi.mock('next/headers', () => ({ headers: vi.fn().mockResolvedValue(new Headers()) }));
vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    userWarning: { create: vi.fn() },
    userSuspension: { create: vi.fn() },
    session: { deleteMany: vi.fn() },
    roomPresence: { updateMany: vi.fn() },
    moderationItem: { update: vi.fn() },
    adminAction: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock('@/lib/admin', () => ({ isAdmin: vi.fn((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') }));
vi.mock('@/lib/pusher-server', () => ({ getPusher: vi.fn(() => ({ trigger: vi.fn().mockResolvedValue(undefined) })) }));
```

### Known Pre-existing Test Failures

Two tests fail before this story (NOT regressions, ignore them):
- `middleware.test.ts` - uses old middleware path
- `AppShell.test.tsx` - mock configuration issue

### Prisma Json Field Casting

When passing `details` to `AdminAction.create`, cast to `object`:

```typescript
details: { action: 'WARN_USER', warningType, message } as object,
```

### Component Dialog Pattern (follow RemoveContentDialog)

```typescript
'use client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, ... } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export function WarnUserDialog({ userId, userName, open, onOpenChange, onComplete }: Props) {
  const [loading, setLoading] = useState(false);
  // form state...

  async function handleSubmit() {
    setLoading(true);
    try {
      const result = await warnUser({ userId, warningType, message });
      if (result.success) { toast.success('Warning issued'); onComplete?.(); }
      else { toast.error(result.error); }
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  }

  return <AlertDialog open={open} onOpenChange={onOpenChange}>...</AlertDialog>;
}
```

### Project Structure Notes

All new files follow co-located test pattern:

```
src/actions/admin/
  warnUser.ts
  warnUser.test.ts
  suspendUser.ts
  suspendUser.test.ts
  liftSuspension.ts
  liftSuspension.test.ts
  getUserModerationHistory.ts
  getUserModerationHistory.test.ts

src/actions/user/
  acknowledgeWarning.ts
  acknowledgeWarning.test.ts
  getUnacknowledgedWarnings.ts
  getUnacknowledgedWarnings.test.ts

src/components/features/admin/
  WarnUserDialog.tsx
  WarnUserDialog.test.tsx
  SuspendUserDialog.tsx
  SuspendUserDialog.test.tsx
  UserModerationHistory.tsx
  UserModerationHistory.test.tsx
  WarningBanner.tsx
  WarningBanner.test.tsx

src/app/(admin)/admin/users/[userId]/
  page.tsx

src/app/(auth)/suspended/
  page.tsx

src/lib/
  checkSuspension.ts

src/hooks/
  useUnacknowledgedWarnings.ts
```

### References

- [Source: _bmad-output/planning-artifacts/epics/ - Epic 6, Story 6.4]
- [Source: prisma/schema.prisma - User, ModerationItem, AdminAction, ContentRemoval, RoomPresence, Session models]
- [Source: src/actions/admin/removeContent.ts - Pusher notification pattern]
- [Source: src/actions/admin/reviewModerationItem.ts - Moderation review action pattern]
- [Source: src/components/features/admin/RemoveContentDialog.tsx - Dialog component pattern]
- [Source: src/components/features/admin/ModerationItemCard.tsx - Action button integration]
- [Source: src/components/providers/NotificationProvider.tsx - Client notification handling]
- [Source: src/lib/admin.ts - isAdmin, isSuperAdmin utilities]
- [Source: src/lib/validation/admin.ts - Zod schema patterns]
- [Source: src/lib/pusher-server.ts - getPusher singleton]
- [Source: src/proxy.ts - Route protection middleware]
- [Source: src/app/(admin)/admin/layout.tsx - Admin guard pattern]
- [Source: src/actions/presence/leaveRoom.ts - Presence termination pattern]
- [Source: _bmad-output/implementation-artifacts/6-3-content-removal.md - Previous story learnings]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Fixed ProfileView.test.tsx mock - added `suspendedUntil: null, suspensionReason: null` after schema changes
- Fixed SuspendUserDialog.test.tsx - `getByText('Suspend Account')` matched both title and button, changed to `getByRole('heading')`
- Fixed SuspendUserDialog.test.tsx - `/7 Days/` regex matched both button and confirmation text, changed to `getAllByText`
- Fixed getDashboardStats.test.ts - added `userWarning: { count: vi.fn() }` to prisma mock and `mockWarningCount` calls
- Fixed useUnacknowledgedWarnings.ts - inlined fetch in useEffect to avoid lint warning about calling setState from callback ref

### Completion Notes List
- All 10 tasks complete with all subtasks
- Typecheck: 0 new errors (all errors are pre-existing in other files)
- Lint: 0 new errors/warnings (all 51 issues are pre-existing)
- Tests: 154 passed files, 1491 tests pass. 4 failed files are all pre-existing (middleware.test.ts, AppShell.test.tsx, and 2 env-related)
- Suspension enforcement uses layout-level SuspensionGuard (not middleware) due to Edge runtime limitations
- Combined SuspensionGuard handles both suspension redirect and warning banner display
- UserModerationDetail component named instead of UserModerationHistory (as referenced in story) for clarity

### Code Review Fixes Applied
- **checkSuspension.ts**: Auto-clear now also marks UserSuspension.liftedAt via $transaction
- **warnUser.ts, suspendUser.ts**: Added moderationItemId ownership validation (reportedUserId must match target userId)
- **warnUser.ts, suspendUser.ts**: Added self-moderation prevention (cannot warn/suspend yourself)
- **useUnacknowledgedWarnings.ts**: refresh() now sets loading=true before fetching
- **SuspendedContent.tsx**: Added min-h-[44px] to Sign Out button for touch target compliance
- **WarningBanner.tsx**: Added role="alertdialog", aria-labelledby, aria-describedby, and min-h-[44px] button
- **warnUser.test.ts**: Added tests for self-moderation, moderationItem mismatch, transaction operations
- **suspendUser.test.ts**: Added tests for self-moderation and transaction operations
- **UserModerationDetail.test.tsx**: Added interaction tests for Lift Suspension, Warn User, Suspend Account buttons

### File List
**New Files:**
- `src/actions/admin/warnUser.ts` - Admin action to issue warnings
- `src/actions/admin/warnUser.test.ts`
- `src/actions/admin/suspendUser.ts` - Admin action to suspend users
- `src/actions/admin/suspendUser.test.ts`
- `src/actions/admin/liftSuspension.ts` - Admin action to lift suspensions
- `src/actions/admin/liftSuspension.test.ts`
- `src/actions/admin/getUserModerationHistory.ts` - Fetch user moderation history
- `src/actions/admin/getUserModerationHistory.test.ts`
- `src/actions/user/acknowledgeWarning.ts` - User action to acknowledge warnings
- `src/actions/user/acknowledgeWarning.test.ts`
- `src/actions/user/getUnacknowledgedWarnings.ts` - Fetch unacknowledged warnings
- `src/actions/user/getUnacknowledgedWarnings.test.ts`
- `src/actions/user/checkSuspensionStatus.ts` - Server action for client suspension check
- `src/components/features/admin/WarnUserDialog.tsx` - Warn user dialog
- `src/components/features/admin/WarnUserDialog.test.tsx`
- `src/components/features/admin/SuspendUserDialog.tsx` - Suspend user dialog
- `src/components/features/admin/SuspendUserDialog.test.tsx`
- `src/components/features/admin/WarningBanner.tsx` - Warning acknowledgment overlay
- `src/components/features/admin/WarningBanner.test.tsx`
- `src/components/features/admin/UserModerationDetail.tsx` - Admin user detail component
- `src/components/features/admin/UserModerationDetail.test.tsx`
- `src/components/features/admin/SuspendedContent.tsx` - Suspended page client component
- `src/components/features/admin/SuspensionGuard.tsx` - Combined suspension/warning guard
- `src/app/(admin)/admin/users/[userId]/page.tsx` - Admin user detail page
- `src/app/(auth)/suspended/page.tsx` - Suspended user page
- `src/lib/checkSuspension.ts` - Suspension checking utility
- `src/hooks/useUnacknowledgedWarnings.ts` - Hook for unacknowledged warnings

**Modified Files:**
- `prisma/schema.prisma` - Added WarningType/SuspensionDuration enums, UserWarning/UserSuspension models, User fields
- `src/lib/validation/admin.ts` - Added warning/suspension validation schemas
- `src/actions/admin/getDashboardStats.ts` - Real userWarningCount query
- `src/actions/admin/getDashboardStats.test.ts` - Updated mock for userWarning.count
- `src/components/features/admin/ModerationItemCard.tsx` - Integrated warn/suspend dialogs, user detail link
- `src/components/providers/NotificationProvider.tsx` - Handle new moderation events
- `src/app/(main)/layout.tsx` - Wrapped content with SuspensionGuard
- `src/components/features/profile/ProfileView.test.tsx` - Added suspendedUntil/suspensionReason to mock
