# Story 6.1: Admin Role & Access Control

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **admin**,
I want **secure access to admin features**,
so that **only authorized users can perform moderation and management tasks**.

## Acceptance Criteria

1. **Given** I am a regular user, **When** I try to access `/admin` routes, **Then** I am redirected to `/home` with a toast message: "Access denied", **And** the attempt is logged for security review (console.warn + future AdminAction log).

2. **Given** I am an admin user (role = "admin" or "super-admin"), **When** I log in, **Then** I see an "Admin" option in my profile menu, **And** I can access the `/admin` dashboard.

3. **Given** I am on the admin dashboard (`/admin`), **When** the page loads, **Then** I see navigation to: Moderation, Users, Authors, Metrics, **And** I see a summary of pending items (pending author claims count, placeholder counts for moderation/users), **And** I see a recent admin activity log (from AdminAction table).

4. **Given** I perform any admin action (approve/reject claim, or future moderation actions), **When** the action completes, **Then** an `AdminAction` log record is created with: `adminId`, `actionType`, `targetId`, `targetType`, `timestamp`, `details` (JSON).

5. **Given** I am a super-admin, **When** I navigate to admin user management, **Then** I can promote a user to admin role, **And** the change is logged in AdminAction, **And** the action requires confirmation dialog.

## Tasks / Subtasks

- [x] Task 1: Add `role` field to User model in Prisma schema (AC: #1, #2, #5)
  - [x] 1.1 Add `UserRole` enum to `prisma/schema.prisma`: `USER`, `AUTHOR`, `ADMIN`, `SUPER_ADMIN`
  - [x] 1.2 Add `role` field to `User` model: `role UserRole @default(USER)`
  - [x] 1.3 Run `npx prisma generate && npx prisma db push`

- [x] Task 2: Create `AdminAction` log model (AC: #4)
  - [x] 2.1 Add `AdminAction` model to `prisma/schema.prisma` with fields: `id` (cuid), `adminId` (relation to User), `actionType` (String - e.g., "PROMOTE_USER", "REVIEW_CLAIM"), `targetId` (String), `targetType` (String - e.g., "User", "AuthorClaim"), `details` (Json?), `createdAt`
  - [x] 2.2 Add `adminActions` relation on `User` model
  - [x] 2.3 Run `npx prisma generate && npx prisma db push`

- [x] Task 3: Migrate admin check from env-based to role-based (AC: #1, #2)
  - [x] 3.1 Update `src/lib/admin.ts`: keep `getAdminIds()` as fallback seeding mechanism, add `isAdminRole(role: string): boolean` that checks `role === 'ADMIN' || role === 'SUPER_ADMIN'`, update `isAdmin()` to accept a User object and check both role field AND env fallback
  - [x] 3.2 Create Zod schemas in `src/lib/validation/admin.ts`: `promoteUserSchema` (userId, newRole), `adminActionSchema` (actionType, targetId, targetType, details?)
  - [x] 3.3 Update `src/actions/authors/reviewClaim.ts` to use new `isAdmin()` signature and log an AdminAction on approve/reject
  - [x] 3.4 Update `src/actions/authors/getPendingClaims.ts` to use new `isAdmin()` signature
  - [x] 3.5 Write tests for `src/lib/admin.ts` covering role-based and env-based fallback

- [x] Task 4: Create admin layout with role-based access guard (AC: #1, #2)
  - [x] 4.1 Create `src/app/(admin)/admin/layout.tsx` - server component that checks session + admin role, redirects non-admins to `/home`, wraps children in admin shell layout with sidebar nav
  - [x] 4.2 Move existing `src/app/(admin)/admin/claims/layout.tsx` to remove redundant auth check (parent layout handles it)
  - [x] 4.3 Create `src/components/layout/AdminShell.tsx` - client component with sidebar navigation (links: Dashboard, Moderation, Users, Authors, Metrics) and responsive layout (sidebar on desktop, bottom sheet nav on mobile)
  - [x] 4.4 Write tests for `AdminShell.tsx` verifying nav links render and active state

- [x] Task 5: Create admin dashboard page (AC: #3)
  - [x] 5.1 Create `src/actions/admin/getDashboardStats.ts` - server action returning: pending claims count (from AuthorClaim where status=PENDING), placeholder moderation count (0), placeholder user warning count (0), recent AdminAction entries (last 10)
  - [x] 5.2 Create `src/app/(admin)/admin/page.tsx` - server component rendering dashboard with stat cards and activity log
  - [x] 5.3 Create `src/components/features/admin/DashboardStatCard.tsx` - reusable card showing label, count, icon, optional link
  - [x] 5.4 Create `src/components/features/admin/AdminActivityLog.tsx` - table/list of recent AdminAction entries with timestamp, action type, admin name, target info
  - [x] 5.5 Write tests for dashboard components

- [x] Task 6: Create admin action logging server action (AC: #4)
  - [x] 6.1 Create `src/actions/admin/logAdminAction.ts` - utility server action that creates AdminAction record (called internally by other admin actions, not exposed as API)
  - [x] 6.2 Create `src/actions/admin/index.ts` barrel export
  - [x] 6.3 Write tests for `logAdminAction`

- [x] Task 7: Create user promotion flow (AC: #5)
  - [x] 7.1 Create `src/actions/admin/promoteUser.ts` - server action: validates input with Zod, checks caller is SUPER_ADMIN, updates target user role, logs AdminAction
  - [x] 7.2 Create `src/components/features/admin/PromoteUserDialog.tsx` - confirmation dialog with user info display, role selector (USER/AUTHOR/ADMIN), confirm/cancel buttons
  - [x] 7.3 Wire promotion into admin user lookup (placeholder page at `/admin/users` with search input - full implementation in Story 6.7)
  - [x] 7.4 Write tests for `promoteUser.ts` and `PromoteUserDialog.tsx`

- [x] Task 8: Add admin link to profile menu (AC: #2)
  - [x] 8.1 Identify the profile menu/dropdown component (likely in `src/components/layout/` or profile feature area)
  - [x] 8.2 Add conditional "Admin" menu item that only renders when user has admin/super-admin role
  - [x] 8.3 Link to `/admin` dashboard
  - [x] 8.4 Write test verifying admin link visibility based on role

## Dev Notes

### Existing Admin Infrastructure (CRITICAL - DO NOT REINVENT)

The project already has admin patterns established in Story 5.5:

- **`src/lib/admin.ts`** - Current env-based admin check using `ADMIN_USER_IDS` env var. This must be EXTENDED (not replaced) to support role-based checks while maintaining backward compatibility with env var seeding.
- **`src/app/(admin)/admin/claims/layout.tsx`** - Existing admin layout with auth guard pattern. Use this as reference for the parent admin layout.
- **`src/app/(admin)/admin/claims/page.tsx`** - Existing admin claims page. This continues to work under the new parent layout.
- **`src/actions/authors/reviewClaim.ts`** - Existing admin action using `isAdmin()`. Must be updated to new signature and add AdminAction logging.
- **`src/actions/authors/getPendingClaims.ts`** - Existing admin action using `isAdmin()`. Must be updated.
- **`/admin` route is already in `protectedRoutes`** in `src/proxy.ts` - authentication is already enforced at proxy level. The admin layout adds authorization (role check) on top.

### Architecture Compliance

- **Server Actions pattern**: All mutations follow `ActionResult<T>` discriminated union pattern from `src/actions/books/types.ts`
- **Auth check pattern**: Use `const headersList = await headers(); const session = await auth.api.getSession({ headers: headersList });` for server-side auth
- **Component structure**: Admin components go in `src/components/features/admin/`, admin pages in `src/app/(admin)/admin/`
- **Validation**: Zod schemas at boundaries, reuse between client/server
- **Database**: Use `@map("snake_case")` and `@@map("table_name")` conventions matching existing schema

### Role Migration Strategy

The current admin system uses `ADMIN_USER_IDS` env var (comma-separated user IDs). The migration approach:

1. Add `role` field with `@default(USER)` - all existing users get USER role
2. Update `isAdmin()` to check BOTH `user.role` (ADMIN/SUPER_ADMIN) AND `ADMIN_USER_IDS` env var
3. This means existing admins configured via env var continue to work immediately
4. Admin promotion (Task 7) allows granting roles via database going forward
5. Future: env var can be deprecated once all admins have database roles

### Database Schema Additions

```prisma
enum UserRole {
  USER
  AUTHOR
  ADMIN
  SUPER_ADMIN
}

// Add to User model:
role UserRole @default(USER)

model AdminAction {
  id         String   @id @default(cuid())
  adminId    String   @map("admin_id")
  actionType String   @map("action_type")
  targetId   String   @map("target_id")
  targetType String   @map("target_type")
  details    Json?
  createdAt  DateTime @default(now()) @map("created_at")

  admin User @relation("admin_actions", fields: [adminId], references: [id])

  @@index([adminId])
  @@index([createdAt])
  @@map("admin_actions")
}
```

### UI/UX Requirements

- **Color system**: Warm amber primary (`#d97706`), use destructive red for deny/suspend actions
- **Touch targets**: Minimum 44x44px on all interactive elements
- **Loading states**: Use Skeleton components (not spinners) per project convention
- **Empty states**: "No pending items" with contextual guidance
- **Toasts**: Use existing toast system for success/error feedback (auto-dismiss 4s)
- **Dialogs**: Use shadcn Dialog component for confirmations (e.g., role promotion)
- **Dashboard cards**: Use shadcn Card component with Lucide icons
- **Navigation**: Sidebar on desktop (lg+), collapsible on mobile
- **Admin badge**: Consider subtle visual indicator (e.g., Shield icon from Lucide) next to admin name

### Testing Requirements

- **Unit tests**: All server actions (admin check, promotion, logging)
- **Component tests**: AdminShell navigation, DashboardStatCard, AdminActivityLog, PromoteUserDialog
- **Mock patterns**: Mock `@/lib/prisma`, `@/lib/auth` per project convention
- **Auth mocking**: Mock `auth.api.getSession()` returning `{ user: { id, role } }`
- **Test file location**: Co-locate `.test.tsx` / `.test.ts` with source files

### Project Structure Notes

```
src/
  actions/
    admin/
      getDashboardStats.ts          # NEW
      getDashboardStats.test.ts     # NEW
      logAdminAction.ts             # NEW
      logAdminAction.test.ts        # NEW
      promoteUser.ts                # NEW
      promoteUser.test.ts           # NEW
      index.ts                      # NEW barrel
  app/
    (admin)/
      admin/
        layout.tsx                  # NEW parent admin layout (replaces per-page guards)
        page.tsx                    # NEW dashboard page
        claims/
          layout.tsx                # UPDATE - remove redundant auth check
          page.tsx                  # EXISTS - no change
        users/
          page.tsx                  # NEW placeholder for story 6.7
  components/
    features/
      admin/
        DashboardStatCard.tsx       # NEW
        DashboardStatCard.test.tsx  # NEW
        AdminActivityLog.tsx        # NEW
        AdminActivityLog.test.tsx   # NEW
        PromoteUserDialog.tsx       # NEW
        PromoteUserDialog.test.tsx  # NEW
        index.ts                    # NEW barrel
    layout/
      AdminShell.tsx                # NEW
      AdminShell.test.tsx           # NEW
  lib/
    admin.ts                        # UPDATE - add role-based checks
    admin.test.ts                   # NEW
    validation/
      admin.ts                      # NEW Zod schemas
```

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-6-administration-platform-health.md#Story 6.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- [Source: _bmad-output/planning-artifacts/architecture.md#API Pattern Decision Tree]
- [Source: _bmad-output/planning-artifacts/prd.md#Permission Model]
- [Source: _bmad-output/planning-artifacts/prd.md#Journey 3: Alex - Platform Guardian]
- [Source: src/lib/admin.ts - existing env-based admin check]
- [Source: src/app/(admin)/admin/claims/layout.tsx - existing admin guard pattern]
- [Source: src/actions/authors/reviewClaim.ts - existing admin action pattern]
- [Source: prisma/schema.prisma - current database schema]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Prisma db push failed due to no database connection in dev environment (schema validated via prisma generate)
- 2 pre-existing test failures: middleware.test.ts (middleware.ts renamed to proxy.ts), AppShell.test.tsx (missing DATABASE_URL env)

### Completion Notes List

- Added UserRole enum (USER, AUTHOR, ADMIN, SUPER_ADMIN) and role field to User model with @default(USER)
- Created AdminAction model for audit logging with indexes on adminId and createdAt
- Migrated admin check from env-var-only to hybrid role-based + env-var fallback for backward compatibility
- Updated reviewClaim to use $transaction for atomic claim update + admin action log
- Updated getPendingClaims to fetch user role from DB for admin verification
- Created AdminShell with responsive sidebar (desktop) / bottom nav (mobile) using amber accent color
- Created admin layout with server-side role check + console.warn on access denial
- Simplified claims layout by removing redundant auth check (parent layout handles it)
- Created admin dashboard with stat cards (pending claims, moderation, warnings, metrics) and activity log
- Created logAdminAction utility for internal admin action recording
- Created promoteUser action with SUPER_ADMIN-only guard, self-promotion prevention, and super-admin protection
- Created PromoteUserDialog with AlertDialog, radio role selector, and optimistic toast feedback
- Created placeholder /admin/users page for Story 6.7
- Added "Admin" button with Shield icon to ProfileView, visible only when user.role is ADMIN or SUPER_ADMIN
- All 80 new/modified tests pass; full test suite: 1349 pass, 0 regressions (2 pre-existing failures unrelated to story)

### Change Log

- 2026-02-09: Story 6.1 implementation complete - Admin Role & Access Control

### File List

- prisma/schema.prisma (MODIFIED - added UserRole enum, role field, AdminAction model)
- src/lib/admin.ts (MODIFIED - role-based admin checks with env-var fallback)
- src/lib/admin.test.ts (NEW - 21 tests)
- src/lib/validation/admin.ts (NEW - Zod schemas for promoteUser, adminAction)
- src/actions/admin/logAdminAction.ts (NEW)
- src/actions/admin/logAdminAction.test.ts (NEW - 2 tests)
- src/actions/admin/getDashboardStats.ts (NEW)
- src/actions/admin/promoteUser.ts (NEW)
- src/actions/admin/promoteUser.test.ts (NEW - 7 tests)
- src/actions/admin/index.ts (NEW - barrel export)
- src/actions/authors/reviewClaim.ts (MODIFIED - role-based admin check, AdminAction logging via $transaction)
- src/actions/authors/reviewClaim.test.ts (MODIFIED - updated mocks for new isAdmin signature and $transaction)
- src/actions/authors/getPendingClaims.ts (MODIFIED - role-based admin check)
- src/actions/authors/getPendingClaims.test.ts (MODIFIED - updated mocks for new isAdmin signature)
- src/app/(admin)/admin/layout.tsx (NEW - parent admin layout with role-based access guard)
- src/app/(admin)/admin/page.tsx (NEW - dashboard page)
- src/app/(admin)/admin/claims/layout.tsx (MODIFIED - removed redundant auth check)
- src/app/(admin)/admin/users/page.tsx (NEW - placeholder page)
- src/components/layout/AdminShell.tsx (NEW - responsive admin navigation)
- src/components/layout/AdminShell.test.tsx (NEW - 7 tests)
- src/components/layout/index.ts (MODIFIED - added AdminShell export)
- src/components/features/admin/DashboardStatCard.tsx (NEW)
- src/components/features/admin/DashboardStatCard.test.tsx (NEW - 4 tests)
- src/components/features/admin/AdminActivityLog.tsx (NEW)
- src/components/features/admin/AdminActivityLog.test.tsx (NEW - 4 tests)
- src/components/features/admin/PromoteUserDialog.tsx (NEW)
- src/components/features/admin/PromoteUserDialog.test.tsx (NEW - 5 tests)
- src/components/features/admin/index.ts (NEW - barrel export)
- src/components/features/profile/ProfileView.tsx (MODIFIED - added admin link for admin/super-admin roles)
- src/components/features/profile/ProfileView.test.tsx (MODIFIED - added role field to mock, 3 admin link tests)
