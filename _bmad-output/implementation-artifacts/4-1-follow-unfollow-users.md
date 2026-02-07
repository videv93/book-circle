# Story 4.1: Follow & Unfollow Users

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to follow other readers**,
so that **I can see their reading activity in my feed**.

## Acceptance Criteria

1. **Follow Button on Profile:** Given I am viewing another user's profile and I am not following them, When the profile loads, Then I see a "Follow" button.

2. **Follow Action with Optimistic UI:** Given I tap "Follow", When the follow is processed, Then the button immediately changes to "Following" (optimistic UI), And a Follow record is created (followerId, followingId, createdAt), And my following count increases by 1, And their follower count increases by 1.

3. **Following State Display:** Given I am following a user, When I view their profile, Then I see a "Following" button (checkmark icon), And tapping it shows an "Unfollow" option.

4. **Unfollow Confirmation:** Given I tap "Unfollow", When the confirmation dialog appears, Then I see "Unfollow [username]?", And I can confirm or cancel.

5. **Unfollow Action:** Given I confirm unfollow, When the unfollow is processed, Then the button changes back to "Follow" (optimistic UI), And the Follow record is deleted, And counts are decremented.

6. **Follow from Search:** Given I search for users, When I view search results, Then each user card shows a Follow/Following button, And I can follow directly from search results.

## Tasks / Subtasks

- [ ] Task 1: Add Follow model to Prisma schema (AC: #1-#5)
  - [ ] 1.1: Add `Follow` model with `id`, `followerId`, `followingId`, `createdAt` to `prisma/schema.prisma`
  - [ ] 1.2: Add `@@unique([followerId, followingId])` constraint to prevent duplicate follows
  - [ ] 1.3: Add `@@index([followerId])` and `@@index([followingId])` for query performance
  - [ ] 1.4: Add `@@map("follows")` for snake_case table name
  - [ ] 1.5: Add `followers` and `following` relations to User model
  - [ ] 1.6: Run `npx prisma generate` and `npx prisma db push`

- [ ] Task 2: Create `followUser` server action (AC: #2)
  - [ ] 2.1: Create `src/actions/social/followUser.ts` following `ActionResult<T>` pattern
  - [ ] 2.2: Accept input `{ targetUserId: string }` validated with Zod
  - [ ] 2.3: Authenticate via `auth.api.getSession({ headers: await headers() })`
  - [ ] 2.4: Validate: cannot follow yourself, target user must exist
  - [ ] 2.5: Create Follow record using `prisma.follow.create()` with upsert-like behavior (handle unique constraint gracefully)
  - [ ] 2.6: Return `ActionResult<{ followId: string }>` on success

- [ ] Task 3: Create `unfollowUser` server action (AC: #5)
  - [ ] 3.1: Create `src/actions/social/unfollowUser.ts` following `ActionResult<T>` pattern
  - [ ] 3.2: Accept input `{ targetUserId: string }` validated with Zod
  - [ ] 3.3: Authenticate via `auth.api.getSession({ headers: await headers() })`
  - [ ] 3.4: Delete Follow record using `prisma.follow.delete()` where followerId + followingId match
  - [ ] 3.5: Handle "not following" case gracefully (return success, not error)
  - [ ] 3.6: Return `ActionResult<{ success: true }>`

- [ ] Task 4: Create `getFollowStatus` server action (AC: #1, #3)
  - [ ] 4.1: Create `src/actions/social/getFollowStatus.ts` following `ActionResult<T>` pattern
  - [ ] 4.2: Accept input `{ targetUserId: string }` validated with Zod
  - [ ] 4.3: Query Follow record existence for current user -> target user
  - [ ] 4.4: Return `ActionResult<{ isFollowing: boolean; followerCount: number; followingCount: number }>`

- [ ] Task 5: Create `searchUsers` server action (AC: #6)
  - [ ] 5.1: Create `src/actions/social/searchUsers.ts` following `ActionResult<T>` pattern
  - [ ] 5.2: Accept input `{ query: string, limit?: number, offset?: number }` validated with Zod
  - [ ] 5.3: Search users by name (case-insensitive `contains`) excluding the current user
  - [ ] 5.4: Include follow status for each result: `isFollowing: boolean`
  - [ ] 5.5: Include follower/following counts for each user
  - [ ] 5.6: Return `ActionResult<{ users: UserSearchResult[]; total: number }>`

- [ ] Task 6: Create `FollowButton` component (AC: #1, #2, #3, #5)
  - [ ] 6.1: Create `src/components/features/social/FollowButton.tsx`
  - [ ] 6.2: Accept props: `{ targetUserId: string; targetUserName: string; initialIsFollowing: boolean; onFollowChange?: (isFollowing: boolean) => void }`
  - [ ] 6.3: Implement optimistic UI: toggle state immediately on tap, revert on error
  - [ ] 6.4: "Follow" state: outline button with "Follow" text and UserPlus icon
  - [ ] 6.5: "Following" state: filled button with "Following" text and UserCheck icon
  - [ ] 6.6: On tap when following: show AlertDialog confirmation "Unfollow [username]?"
  - [ ] 6.7: Loading state: show spinner in button during server action
  - [ ] 6.8: Error recovery: revert to previous state, show toast error
  - [ ] 6.9: Accessibility: `aria-label` "Follow [name]" / "Following [name], tap to unfollow", `aria-pressed` for toggle state
  - [ ] 6.10: Minimum 44px touch target

- [ ] Task 7: Create `UserCard` component (AC: #6)
  - [ ] 7.1: Create `src/components/features/social/UserCard.tsx`
  - [ ] 7.2: Display: avatar, name, bio (truncated), follower count, FollowButton
  - [ ] 7.3: Avatar using shadcn Avatar component with fallback initials
  - [ ] 7.4: Tappable card that navigates to `/user/[userId]` profile page
  - [ ] 7.5: FollowButton positioned on the right side, does not trigger card navigation
  - [ ] 7.6: Accessibility: card has `role="article"`, semantic heading for user name

- [ ] Task 8: Create public user profile page (AC: #1, #3)
  - [ ] 8.1: Create `src/app/(main)/user/[userId]/page.tsx` as server component
  - [ ] 8.2: Fetch target user data, follow status, follower/following counts
  - [ ] 8.3: If viewing own profile, redirect to `/profile`
  - [ ] 8.4: Display: avatar, name, bio, follower count, following count, FollowButton
  - [ ] 8.5: If user has `showReadingActivity: true`, show their currently reading books (up to 3)
  - [ ] 8.6: If user has `showReadingActivity: false`, show "Reading activity is private"
  - [ ] 8.7: Show current streak count (from UserStreak)
  - [ ] 8.8: Add `/user/:path*` to protected routes in middleware

- [ ] Task 9: Add user search to search page (AC: #6)
  - [ ] 9.1: Create `src/components/features/social/UserSearchResults.tsx` client component
  - [ ] 9.2: Debounced search input (300ms) calling `searchUsers` action
  - [ ] 9.3: Display results as list of UserCard components
  - [ ] 9.4: Empty state: "No users found for '[query]'"
  - [ ] 9.5: Loading state: skeleton cards
  - [ ] 9.6: Update `src/app/(main)/search/page.tsx` to add Tabs: "Books" | "Users"
  - [ ] 9.7: "Books" tab shows existing BookSearch component
  - [ ] 9.8: "Users" tab shows UserSearchResults component

- [ ] Task 10: Create barrel exports and types (AC: all)
  - [ ] 10.1: Create `src/actions/social/index.ts` exporting all social actions and their types
  - [ ] 10.2: Create `src/components/features/social/index.ts` exporting FollowButton, UserCard, UserSearchResults
  - [ ] 10.3: Update `src/types/database.ts` to re-export `Follow` from `@prisma/client`

- [ ] Task 11: Write comprehensive tests (AC: all)
  - [ ] 11.1: Create `src/actions/social/followUser.test.ts`:
    - Test: Successfully creates follow record
    - Test: Returns error when following yourself
    - Test: Returns error when target user doesn't exist
    - Test: Handles duplicate follow gracefully (idempotent)
    - Test: Returns error when unauthenticated
  - [ ] 11.2: Create `src/actions/social/unfollowUser.test.ts`:
    - Test: Successfully deletes follow record
    - Test: Handles "not following" gracefully
    - Test: Returns error when unauthenticated
  - [ ] 11.3: Create `src/actions/social/getFollowStatus.test.ts`:
    - Test: Returns isFollowing: true when following
    - Test: Returns isFollowing: false when not following
    - Test: Returns correct follower/following counts
    - Test: Returns error when unauthenticated
  - [ ] 11.4: Create `src/actions/social/searchUsers.test.ts`:
    - Test: Returns matching users by name
    - Test: Excludes current user from results
    - Test: Includes follow status for each result
    - Test: Returns empty array for no matches
    - Test: Respects limit and offset
    - Test: Returns error when unauthenticated
  - [ ] 11.5: Create `src/components/features/social/FollowButton.test.tsx`:
    - Test: Renders "Follow" when not following
    - Test: Renders "Following" when following
    - Test: Optimistic UI: toggles immediately on click
    - Test: Shows confirmation dialog on unfollow
    - Test: Reverts state on server error
    - Test: Calls onFollowChange callback
    - Test: Accessibility: correct aria-label and aria-pressed
  - [ ] 11.6: Create `src/components/features/social/UserCard.test.tsx`:
    - Test: Renders user avatar, name, bio
    - Test: Shows follower count
    - Test: FollowButton renders with correct state
    - Test: Card is tappable (link to user profile)
  - [ ] 11.7: Verify 0 regressions across the full test suite

## Dev Notes

### Critical Architecture Patterns

- **Server Actions** use `ActionResult<T>` discriminated union — import from `@/actions/books/types.ts`
- **Auth pattern**: `const headersList = await headers(); const session = await auth.api.getSession({ headers: headersList });`
- **Import convention**: ALWAYS use `@/` alias for cross-boundary imports
- **Component naming**: PascalCase files, named exports (not default)
- **Test co-location**: `Component.test.tsx` next to `Component.tsx`
- **Barrel exports**: Every feature folder needs `index.ts`
- **Toast**: Use `import { toast } from 'sonner'`
- **Optimistic UI pattern**: Toggle state immediately, call server action, revert on error with toast
- **Follow/Unfollow strategy from architecture**: Optimistic UI, revert count on error

### Prisma Schema Changes (CRITICAL)

**Add Follow model:**
```prisma
model Follow {
  id          String   @id @default(cuid())
  followerId  String   @map("follower_id")
  followingId String   @map("following_id")
  createdAt   DateTime @default(now()) @map("created_at")

  follower  User @relation("UserFollowers", fields: [followerId], references: [id], onDelete: Cascade)
  following User @relation("UserFollowing", fields: [followingId], references: [id], onDelete: Cascade)

  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
  @@map("follows")
}
```

**Add to User model:**
```prisma
model User {
  // ... existing fields ...
  followers Follow[] @relation("UserFollowers")
  following Follow[] @relation("UserFollowing")
}
```

**Note on counts:** Do NOT add `followerCount`/`followingCount` fields to User model. Compute counts dynamically with `prisma.follow.count()`. This avoids race conditions and count drift. The counts are inexpensive at our scale (100 concurrent users).

### Server Action Pattern (FOLLOW EXACTLY)

```typescript
'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ActionResult } from '@/actions/books/types';

const followUserSchema = z.object({
  targetUserId: z.string().min(1),
});

export async function followUser(
  input: z.input<typeof followUserSchema>
): Promise<ActionResult<{ followId: string }>> {
  try {
    const { targetUserId } = followUserSchema.parse(input);

    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    if (session.user.id === targetUserId) {
      return { success: false, error: 'Cannot follow yourself' };
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });
    if (!targetUser) {
      return { success: false, error: 'User not found' };
    }

    // Upsert-like: try create, handle unique constraint
    const follow = await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followingId: targetUserId,
      },
    });

    return { success: true, data: { followId: follow.id } };
  } catch (error) {
    // Handle Prisma unique constraint violation (P2002) = already following
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
      return { success: true, data: { followId: 'existing' } };
    }
    return { success: false, error: 'Failed to follow user' };
  }
}
```

### FollowButton Component Pattern (CRITICAL)

```typescript
'use client';

import { useState, useTransition } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { followUser } from '@/actions/social/followUser';
import { unfollowUser } from '@/actions/social/unfollowUser';

// Optimistic toggle + AlertDialog for unfollow confirmation
// Button variants: outline (not following) -> default (following)
// Icons: UserPlus (follow) -> UserCheck (following)
```

### User Profile Page Pattern

```typescript
// src/app/(main)/user/[userId]/page.tsx - Server Component
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getFollowStatus } from '@/actions/social/getFollowStatus';

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) redirect('/login');
  if (session.user.id === userId) redirect('/profile');

  // Fetch user data + follow status in parallel
  const [user, followStatus] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, image: true, bio: true,
        avatarUrl: true, showReadingActivity: true,
        // Include currently reading books if public
        userBooks: {
          where: { status: 'READING' },
          take: 3,
          include: { book: true },
        },
      },
    }),
    getFollowStatus({ targetUserId: userId }),
  ]);

  if (!user) return notFound();

  // Render profile with FollowButton
}
```

### Search Page Update Pattern

Update `src/app/(main)/search/page.tsx` to add tabs:
```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookSearch } from '@/components/features/books';
import { UserSearchResults } from '@/components/features/social';

// Add Tabs component wrapping existing BookSearch + new UserSearchResults
```

### Middleware Update

Add `/user/:path*` to protected routes in `src/middleware.ts`:
```typescript
const protectedRoutes = ['/home', '/library', '/profile', '/activity', '/search', '/user'];
```

### Existing Code to Reuse (DO NOT REINVENT)

| What | Where | How to Use |
|------|-------|-----------|
| `ActionResult<T>` | `@/actions/books/types.ts` | Import for return types |
| `Button` | `@/components/ui/button` | For Follow/Following button |
| `AlertDialog` | `@/components/ui/alert-dialog` | For unfollow confirmation |
| `Avatar` | `@/components/ui/avatar` | For user cards and profile |
| `Tabs` | `@/components/ui/tabs` | For Books/Users search tabs |
| `Skeleton` | `@/components/ui/skeleton` | For loading states |
| Prisma client | `@/lib/prisma` | Singleton instance |
| Auth | `@/lib/auth` | `auth.api.getSession({ headers })` |
| Toast | `sonner` | `toast.success()` / `toast.error()` |
| `BookSearch` | `@/components/features/books` | Existing search — keep in "Books" tab |
| Profile page | `src/app/(main)/profile/page.tsx` | Pattern reference for server component data fetching |
| Middleware | `src/middleware.ts` | Add `/user` to protected routes |

### UX Design Requirements (from UX spec)

- **Follow/Unfollow is optimistic UI** — instant feedback, revert on error
- **Unfollow requires confirmation** — destructive action pattern: modal with "Unfollow [username]?"
- **One-tap follow** — no confirmation needed for follow action
- **Warm amber primary** color for Follow button
- **44px minimum touch targets** for all interactive elements
- **Empty state for user search**: "No users found for '[query]'" — helpful, not bare
- **User cards** should show: avatar, name, bio snippet, follower count, Follow/Following button
- **Presence principle**: social features should feel warm and inviting, not surveillance-like

### Scope Boundaries

**Story 4.1 DOES:**
- Create Follow model in Prisma schema
- Create followUser, unfollowUser, getFollowStatus, searchUsers server actions
- Create FollowButton component with optimistic UI and unfollow confirmation
- Create UserCard component for search results
- Create public user profile page at `/user/[userId]`
- Add user search with tabs to existing search page
- Add all tests with 0 regressions

**Story 4.1 does NOT:**
- Implement activity feed (Story 4.3)
- Implement kudos (Story 4.4)
- Implement notifications (Story 4.5)
- Add follower/following list views (future enhancement)
- Add suggested users or "people you may know" (future)
- Modify the home page or activity tab content

### Previous Story Intelligence (Story 3.8)

**Key patterns to follow:**
- 784 tests passing across 75 test files — must maintain 0 regressions
- `ActionResult<T>` imported from `@/actions/books/types.ts` — consistent across all actions
- Auth: `const headersList = await headers(); const session = await auth.api.getSession({ headers: headersList });`
- Server action naming: avoid `use` prefix (triggers ESLint hooks rule) — use action verbs: `followUser`, `unfollowUser`, `getFollowStatus`, `searchUsers`
- Test mock patterns: `vi.mock('@/lib/auth')`, `vi.mock('@/lib/prisma')`
- Barrel exports in `index.ts` for every feature folder
- Zod v4: `error.issues` not `error.errors` for ZodError handling
- `router.refresh()` for refetching server data after mutations

**Code review learnings from Epic 3:**
- `useSyncExternalStore` callbacks need `useCallback` for stable refs
- Parallel queries with `Promise.all()` for better latency
- Always handle Prisma unique constraint errors (P2002) gracefully
- Use `select` in Prisma queries to minimize data transfer

### Git Intelligence

Recent commits:
- `b80ac7a` feat: Implement streak history heatmap with review fixes (Story 3.8)
- `0607f41` feat: Implement streak freeze mechanics with review fixes (Story 3.7)
- `67445ca` fix: remove border top book detail
- `d437bf2` feat: Implement streak credit and reset logic (Story 3.6)
- `64aced6` feat: Implement daily reading goal and streak ring display (Stories 3.4, 3.5)

**Commit pattern:** `feat: [Description] (Story N.N)` — all files + tests in single commit.

### Architecture Compliance

- **Social & Activity maps to FR23-FR27** per architecture doc, plus **FR3 (follow)** and **FR4 (unfollow)** from User Management
- **Primary locations:** `features/social/`, `actions/social/` — per architecture structure mapping
- **Server Actions for follow/unfollow** — mutations use server actions per API pattern decision tree
- **Optimistic UI for follow/unfollow** — per architecture optimistic update rules
- **No Zustand needed** — follow state is per-page, not global
- **Component location:** `src/components/features/social/` for all new social components
- **New route:** `src/app/(main)/user/[userId]/page.tsx` for public user profiles
- **Lucide icons:** Use `UserPlus`, `UserCheck`, `Search`, `Users` from `lucide-react`

### Testing Standards

- **Framework:** Vitest + React Testing Library (NOT Jest)
- **Mock auth:** `vi.mock('@/lib/auth')`
- **Mock prisma:** `vi.mock('@/lib/prisma')`
- **Mock server actions:** `vi.mock('@/actions/social/followUser')` for component tests
- **Test co-location:** Test files next to source files
- **Accessibility:** aria attributes, keyboard navigation, 44px touch targets
- **Run full suite** after implementation to verify 0 regressions
- **Mock patterns:**
  ```typescript
  vi.mock('@/lib/auth', () => ({
    auth: { api: { getSession: vi.fn() } }
  }));
  vi.mock('@/lib/prisma', () => ({
    prisma: {
      follow: { create: vi.fn(), delete: vi.fn(), findUnique: vi.fn(), count: vi.fn() },
      user: { findUnique: vi.fn(), findMany: vi.fn() },
    }
  }));
  ```

### Project Structure Notes

**New files:**
- `prisma/schema.prisma` (modified — add Follow model + User relations)
- `src/actions/social/followUser.ts`
- `src/actions/social/followUser.test.ts`
- `src/actions/social/unfollowUser.ts`
- `src/actions/social/unfollowUser.test.ts`
- `src/actions/social/getFollowStatus.ts`
- `src/actions/social/getFollowStatus.test.ts`
- `src/actions/social/searchUsers.ts`
- `src/actions/social/searchUsers.test.ts`
- `src/actions/social/index.ts`
- `src/components/features/social/FollowButton.tsx`
- `src/components/features/social/FollowButton.test.tsx`
- `src/components/features/social/UserCard.tsx`
- `src/components/features/social/UserCard.test.tsx`
- `src/components/features/social/UserSearchResults.tsx`
- `src/components/features/social/index.ts`
- `src/app/(main)/user/[userId]/page.tsx`

**Modified files:**
- `prisma/schema.prisma` — add Follow model, add followers/following relations to User
- `src/app/(main)/search/page.tsx` — add Tabs with Books/Users
- `src/middleware.ts` — add `/user` to protected routes
- `src/types/database.ts` — re-export `Follow` type

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-4-social-connections-activity-feed.md#Story 4.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions - Server Actions for mutations]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns - Optimistic Update Rules - Follow/unfollow]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns - Naming Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns - Structure Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries - Social FR23-FR27]
- [Source: _bmad-output/planning-artifacts/prd.md#FR3 - Users can follow other users]
- [Source: _bmad-output/planning-artifacts/prd.md#FR4 - Users can unfollow users]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Effortless Interactions - One tap]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Consistency Rules - Optimistic UI for social actions]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Modal & Overlay Patterns - Confirmations]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Empty State Patterns]
- [Source: _bmad-output/implementation-artifacts/3-8-streak-history.md#Dev Notes - all patterns]
- [Source: _bmad-output/implementation-artifacts/3-8-streak-history.md#Completion Notes - 784 tests]
- [Source: src/actions/books/types.ts#ActionResult type definition]
- [Source: src/lib/auth.ts#Better Auth configuration]
- [Source: src/lib/prisma.ts#Prisma client singleton]
- [Source: src/middleware.ts#Route protection patterns]
- [Source: prisma/schema.prisma#User model - existing relations]
- [Source: src/app/(main)/profile/page.tsx#Profile server component pattern]
- [Source: src/app/(main)/search/page.tsx#Current search page - books only]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
