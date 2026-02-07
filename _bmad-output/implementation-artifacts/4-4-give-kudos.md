# Story 4.4: Give Kudos

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to give kudos to someone's reading session**,
so that **I can encourage them and show I noticed their effort**.

## Acceptance Criteria

1. **View Kudos Button in Activity Feed:** Given I see a reading session in the activity feed, When I view the session card, Then I see a heart icon (KudosButton) with current kudos count displayed.

2. **Give Kudos with Optimistic UI:** Given I have not given kudos to this session, When I tap the heart icon (or double-tap the card), Then the heart fills with coral color immediately (optimistic UI), And a scale animation plays (1.2x → 1.0x, 150ms), And small heart particles float upward (optional, respect reduced-motion), And haptic feedback triggers on mobile, And the kudos count increments by 1, And a Kudos record is created (giverId, receiverId, sessionId, createdAt).

3. **Remove Kudos (Toggle Off):** Given I have already given kudos to this session, When I tap the heart icon again, Then the heart unfills (outline only), And the kudos count decrements by 1, And the Kudos record is deleted from the database.

4. **Offline Kudos Queue:** Given I give kudos while offline, When the kudos is queued, Then I see the optimistic UI immediately (filled heart, incremented count), And the kudos syncs when back online, And if sync fails, the UI reverts and shows error toast.

5. **Accessibility Requirements:** Given accessibility requirements, When the KudosButton is focused, Then aria-label reads "Give kudos" or "You gave kudos, X total" based on state, And aria-pressed indicates the toggle state (true/false), And the button has minimum 44px touch target height.

6. **Database Constraints:** Given the Kudos table has unique constraint on (giverId, receiverId, sessionId), When I attempt to create duplicate kudos, Then the server action handles P2002 error gracefully and returns success with existing record (idempotent behavior).

## Tasks / Subtasks

- [x] Task 1: Create Kudos database model (AC: #2, #3, #6)
  - [x] 1.1: Add Kudos model to `prisma/schema.prisma` with fields: id, giverId, receiverId, sessionId, createdAt
  - [x] 1.2: Add relations: giver (User), receiver (User), session (ReadingSession)
  - [x] 1.3: Add unique constraint on `[giverId, sessionId]` to prevent duplicate kudos (one per user per session)
  - [x] 1.4: Add indexes on `giverId`, `receiverId`, and `sessionId` for query performance
  - [x] 1.5: Update User model to add `kudosGiven` and `kudosReceived` relations
  - [x] 1.6: Update ReadingSession model to add `kudos` relation
  - [x] 1.7: Run `npx prisma generate` to update Prisma client
  - [x] 1.8: Run `npx prisma db push` to apply schema changes to database

- [x] Task 2: Create `giveKudos` server action (AC: #2, #6)
  - [x] 2.1: Create `src/actions/social/giveKudos.ts` following ActionResult<T> pattern
  - [x] 2.2: Define Zod schema: `{ sessionId: string, targetUserId: string }`
  - [x] 2.3: Authenticate via `auth.api.getSession({ headers: await headers() })`
  - [x] 2.4: Validate user cannot give kudos to their own session
  - [x] 2.5: Verify target user and session exist in database
  - [x] 2.6: Create Kudos record with `giverId`, `receiverId`, `sessionId`
  - [x] 2.7: Handle P2002 unique constraint error (already gave kudos) → fetch existing → return success idempotently
  - [x] 2.8: Return `ActionResult<{ kudosId: string; totalKudos: number }>` with total kudos count for this session

- [x] Task 3: Create `removeKudos` server action (AC: #3)
  - [x] 3.1: Create `src/actions/social/removeKudos.ts` following ActionResult<T> pattern
  - [x] 3.2: Define Zod schema: `{ sessionId: string, targetUserId: string }`
  - [x] 3.3: Authenticate via `auth.api.getSession({ headers: await headers() })`
  - [x] 3.4: Validate session exists and belongs to target user (review fix: was missing)
  - [x] 3.5: Delete Kudos record where `giverId = currentUserId` AND `sessionId = sessionId`
  - [x] 3.6: Return total remaining kudos count for this session
  - [x] 3.7: Handle case where kudos doesn't exist (already removed) → return success with count (idempotent)
  - [x] 3.8: Return `ActionResult<{ totalKudos: number }>`

- [x] Task 4: Create `getKudosForSession` server action (AC: #1)
  - [x] 4.1: Create `src/actions/social/getKudosForSession.ts` for fetching kudos state
  - [x] 4.2: Accept input: `{ sessionId: string }`
  - [x] 4.3: Authenticate user
  - [x] 4.4: Query Kudos table: count total kudos, check if current user gave kudos (uses Promise.all)
  - [x] 4.5: Return `ActionResult<{ totalKudos: number; userGaveKudos: boolean }>`

- [x] Task 5: Create `KudosButton` component (AC: #1, #2, #3, #5)
  - [x] 5.1: Create `src/components/features/social/KudosButton.tsx` as client component
  - [x] 5.2: Accept props: `sessionId`, `receiverId`, `initialKudosCount`, `initialUserGaveKudos`, `onKudosChange?`
  - [x] 5.3: State: `kudosCount`, `userGaveKudos`, `isPending` (via useTransition), `animate`
  - [x] 5.4: Implement optimistic toggle with rollback on error and server reconciliation
  - [x] 5.5: Render heart icon from lucide-react: filled when userGaveKudos, outline otherwise
  - [x] 5.6: Apply coral color (#ff7f50) when active
  - [x] 5.7: Show kudos count next to heart (hidden if 0)
  - [x] 5.8: Add CSS scale animation on give (scale-125, 150ms transition)
  - [x] 5.9: Accessibility: `aria-label`, `aria-pressed`, `min-h-[44px]`, `min-w-[44px]`
  - [x] 5.10: Respect `prefers-reduced-motion` via `useReducedMotion` hook
  - [x] 5.11: Haptic feedback via `navigator.vibrate()` on mobile (review fix: was missing)

- [x] Task 6: CSS animation approach (AC: #2) — Framer Motion skipped, CSS transitions used instead
  - [x] 6.1: CSS transition-all + scale-125 for scale animation (150ms)
  - [x] 6.2: Conditionally disable animation if `useReducedMotion` returns true
  - [ ] 6.3: Optional: Floating heart particles effect (skipped for MVP)

- [x] Task 7: Integrate KudosButton into ActivityFeedItem (AC: #1, #2)
  - [x] 7.1: Update `src/components/features/social/ActivityFeedItem.tsx`
  - [x] 7.2: Kudos state passed as props from parent (via getActivityFeed)
  - [x] 7.3: For session activity type only: render KudosButton below timestamp
  - [x] 7.4: Pass sessionId, receiverId (activity.userId), initialKudosCount, initialUserGaveKudos
  - [x] 7.5: Position KudosButton below timestamp with mt-1
  - [x] 7.6: KudosButton does NOT render for finished book activities

- [x] Task 8: Update ActivityFeed to include kudos data (AC: #1)
  - [x] 8.1: Update `src/actions/social/getActivityFeed.ts` to include kudos info
  - [x] 8.2: Fetch kudos for all sessions in single query, map to each activity
  - [x] 8.3: Add `kudosCount: number`, `userGaveKudos: boolean` to SessionActivity type
  - [x] 8.4: Use `prisma.kudos.findMany` with `sessionId: { in: sessionIds }` for batch query
  - [x] 8.5: Check if current user gave kudos via `giverId === currentUserId`
  - [x] 8.6: Add query cap `take: limit + offset` to prevent excessive data loading (review fix)

- [x] Task 9: Update barrel exports (AC: all)
  - [x] 9.1: Update `src/actions/social/index.ts` to export `giveKudos`, `removeKudos`, `getKudosForSession` and their types
  - [x] 9.2: Update `src/components/features/social/index.ts` to export `KudosButton`
  - [x] 9.3: Add `Kudos` type to `src/types/database.ts` re-exports (review fix: was missing)

- [x] Task 10: Write comprehensive tests (AC: all)
  - [x] 10.1: `src/actions/social/giveKudos.test.ts` — 10 tests
  - [x] 10.2: `src/actions/social/removeKudos.test.ts` — 10 tests (includes session validation tests from review fix)
  - [x] 10.3: `src/actions/social/getKudosForSession.test.ts` — 6 tests
  - [x] 10.4: `src/components/features/social/KudosButton.test.tsx` — 18 tests (includes reduced motion + improved pending/callback tests from review)
  - [x] 10.5: `src/components/features/social/ActivityFeedItem.test.tsx` — 17 tests (includes KudosButton integration)
  - [x] 10.6: `src/actions/social/getActivityFeed.test.ts` — 16 tests (includes kudos data tests)
  - [x] 10.7: Verified 0 regressions: 955 tests passing across 247 suites

- [ ] Task 11: Add offline queue support (AC: #4) (Deferred — no `useOfflineStore` exists)
  - [ ] 11.1: No offline store infrastructure exists in architecture
  - [ ] 11.2–11.5: Deferred to future story

## Dev Notes

### Critical Architecture Patterns

- **Server Actions** use `ActionResult<T>` discriminated union — import from `@/actions/books/types.ts`
- **Auth pattern**: `const headersList = await headers(); const session = await auth.api.getSession({ headers: headersList });`
- **Import convention**: ALWAYS use `@/` alias for cross-boundary imports (NEVER relative imports)
- **Component naming**: PascalCase files, named exports (not default)
- **Test co-location**: `Component.test.tsx` next to `Component.tsx`
- **Barrel exports**: Every feature folder needs `index.ts` to re-export public APIs
- **Toast**: Use `import { toast } from 'sonner'` for error/success messages
- **Optimistic UI**: Save previous state → Update immediately → Call server → Rollback on error

### Database Schema Pattern

Following the Follow model pattern from Story 4.1, the Kudos model should:

```prisma
model Kudos {
  id        String   @id @default(cuid())
  giverId   String   @map("giver_id")
  receiverId String  @map("receiver_id")
  sessionId String   @map("session_id")
  createdAt DateTime @default(now()) @map("created_at")

  giver    User           @relation("KudosGiven", fields: [giverId], references: [id], onDelete: Cascade)
  receiver User           @relation("KudosReceived", fields: [receiverId], references: [id], onDelete: Cascade)
  session  ReadingSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@unique([giverId, sessionId])
  @@index([giverId])
  @@index([receiverId])
  @@index([sessionId])
  @@map("kudos")
}
```

**Key design decisions:**
- Unique constraint on `[giverId, sessionId]` prevents duplicate kudos (one kudos per user per session)
- `receiverId` is denormalized for query efficiency (can fetch kudos received by user without joining sessions)
- Cascade deletes: if user or session deleted, kudos are also deleted

**User model relations to add:**
```prisma
model User {
  // ... existing fields
  kudosGiven    Kudos[] @relation("KudosGiven")
  kudosReceived Kudos[] @relation("KudosReceived")
}
```

**ReadingSession model relation to add:**
```prisma
model ReadingSession {
  // ... existing fields
  kudos Kudos[]
}
```

### Server Action Pattern (from Story 4.1)

**3-step flow for all social actions:**

1. **Zod validation** → parse input
2. **Session authentication** → verify user
3. **Database operation** → create/delete with error handling

**Example from followUser.ts:**
```typescript
export async function giveKudos(
  input: GiveKudosInput
): Promise<ActionResult<{ kudosId: string; totalKudos: number }>> {
  try {
    const { sessionId, targetUserId } = giveKudosSchema.parse(input);

    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Prevent self-kudos
    if (session.user.id === targetUserId) {
      return { success: false, error: 'Cannot give kudos to yourself' };
    }

    // Verify session exists
    const readingSession = await prisma.readingSession.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true },
    });
    if (!readingSession) {
      return { success: false, error: 'Session not found' };
    }
    if (readingSession.userId !== targetUserId) {
      return { success: false, error: 'Session does not belong to target user' };
    }

    try {
      const kudos = await prisma.kudos.create({
        data: {
          giverId: session.user.id,
          receiverId: targetUserId,
          sessionId,
        },
      });

      // Count total kudos for this session
      const totalKudos = await prisma.kudos.count({
        where: { sessionId },
      });

      return { success: true, data: { kudosId: kudos.id, totalKudos } };
    } catch (createError) {
      // Handle P2002 unique constraint violation = already gave kudos
      if (
        createError instanceof Error &&
        'code' in createError &&
        (createError as unknown as { code: string }).code === 'P2002'
      ) {
        const existing = await prisma.kudos.findUnique({
          where: {
            giverId_sessionId: {
              giverId: session.user.id,
              sessionId,
            },
          },
          select: { id: true },
        });
        const totalKudos = await prisma.kudos.count({
          where: { sessionId },
        });
        return { success: true, data: { kudosId: existing?.id ?? 'existing', totalKudos } };
      }
      throw createError;
    }
  } catch {
    return { success: false, error: 'Failed to give kudos' };
  }
}
```

**Critical P2002 handling pattern:**
- Catch Prisma unique constraint error
- Fetch existing record to return its ID
- Return success (idempotent behavior)
- This prevents race conditions when user double-taps quickly

### Optimistic UI Pattern (from Story 4.1 FollowButton)

**State management strategy:**

```typescript
'use client';

import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { giveKudos, removeKudos } from '@/actions/social';

interface KudosButtonProps {
  sessionId: string;
  receiverId: string;
  initialKudosCount: number;
  initialUserGaveKudos: boolean;
  onKudosChange?: (count: number) => void;
}

export function KudosButton({
  sessionId,
  receiverId,
  initialKudosCount,
  initialUserGaveKudos,
  onKudosChange,
}: KudosButtonProps) {
  const [kudosCount, setKudosCount] = useState(initialKudosCount);
  const [userGaveKudos, setUserGaveKudos] = useState(initialUserGaveKudos);
  const [isPending, startTransition] = useTransition();

  const handleToggleKudos = () => {
    // 1. Save previous state for rollback
    const prevCount = kudosCount;
    const prevGaveKudos = userGaveKudos;

    // 2. Optimistic update (immediate UI feedback)
    const newGaveKudos = !userGaveKudos;
    const newCount = newGaveKudos ? kudosCount + 1 : kudosCount - 1;
    setUserGaveKudos(newGaveKudos);
    setKudosCount(newCount);
    onKudosChange?.(newCount);

    // 3. Server action (async)
    startTransition(async () => {
      const result = newGaveKudos
        ? await giveKudos({ sessionId, targetUserId: receiverId })
        : await removeKudos({ sessionId, targetUserId: receiverId });

      if (!result.success) {
        // 4. Rollback on error
        setUserGaveKudos(prevGaveKudos);
        setKudosCount(prevCount);
        onKudosChange?.(prevCount);
        toast.error(result.error);
      } else {
        // 5. Update with server count (may differ from optimistic)
        setKudosCount(result.data.totalKudos);
        onKudosChange?.(result.data.totalKudos);
      }
    });
  };

  return (
    <button
      onClick={handleToggleKudos}
      disabled={isPending}
      aria-label={userGaveKudos ? `You gave kudos, ${kudosCount} total` : 'Give kudos'}
      aria-pressed={userGaveKudos}
      className="flex items-center gap-1.5 min-h-[44px] min-w-[44px] transition-transform active:scale-110"
    >
      <Heart
        className={`h-5 w-5 transition-colors ${
          userGaveKudos ? 'fill-coral-500 text-coral-500' : 'text-muted-foreground'
        }`}
      />
      {kudosCount > 0 && (
        <span className="text-sm text-muted-foreground">{kudosCount}</span>
      )}
    </button>
  );
}
```

**Key optimistic UI principles:**
1. **Immediate feedback**: Update UI before server responds
2. **Rollback on error**: Restore previous state if server action fails
3. **Server reconciliation**: Use server count as source of truth (handles concurrent updates)
4. **Transition state**: Disable button while pending to prevent double-clicks
5. **User feedback**: Toast on error, no toast on success (kudos is self-evident)

### Animation Pattern (Framer Motion + Reduced Motion)

**Respect accessibility preferences:**

```typescript
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function KudosButton({ ... }) {
  const shouldReduceMotion = useReducedMotion();

  const heartVariants = {
    initial: { scale: 1 },
    tap: { scale: 1.2 },
  };

  return (
    <motion.button
      onClick={handleToggleKudos}
      whileTap={shouldReduceMotion ? undefined : 'tap'}
      variants={heartVariants}
      // ... other props
    >
      {/* ... */}
    </motion.button>
  );
}
```

**Animation specs from AC:**
- Scale: 1.0 → 1.2 → 1.0
- Duration: 150ms
- Easing: ease-out
- Particles: Optional (skip for MVP if time-constrained)

### Integration with ActivityFeedItem

**Current ActivityFeedItem structure:**

```typescript
export function ActivityFeedItem({ activity }: ActivityFeedItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
      {/* User Avatar */}
      <Avatar>...</Avatar>

      {/* Activity Content */}
      <div className="flex-1 min-w-0">
        {/* Activity description */}
        <p className="text-sm">...</p>

        {/* Timestamp */}
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          {/* Clock icon + relative time */}
        </div>

        {/* ADD KUDOS BUTTON HERE (session activities only) */}
        {activity.type === 'session' && (
          <div className="mt-2">
            <KudosButton
              sessionId={activity.id}
              receiverId={activity.userId}
              initialKudosCount={activity.kudosCount}
              initialUserGaveKudos={activity.userGaveKudos}
            />
          </div>
        )}
      </div>

      {/* Book Cover */}
      <Link href={`/book/${activity.bookId}`}>...</Link>
    </div>
  );
}
```

**Placement options:**
1. Below timestamp (preferred - keeps kudos near content)
2. Bottom-right corner (alternative - more compact)
3. Floating overlay on hover (advanced - skip for MVP)

### getActivityFeed Enhancement

**Add kudos data to each session:**

```typescript
// In getActivityFeed.ts
const [sessions, finishedBooks, sessionKudos] = await Promise.all([
  // ... existing session query
  // ... existing finished books query

  // NEW: Fetch kudos for all sessions
  prisma.kudos.findMany({
    where: {
      sessionId: { in: sessionIds },
    },
    select: {
      sessionId: true,
      giverId: true,
    },
  }),
]);

// Map kudos to sessions
const sessionActivities = sessions.map(s => {
  const kudosForSession = sessionKudos.filter(k => k.sessionId === s.id);
  const userGaveKudos = kudosForSession.some(k => k.giverId === currentUserId);

  return {
    type: 'session' as const,
    // ... existing fields
    kudosCount: kudosForSession.length,
    userGaveKudos,
  };
});
```

**Alternative approach (using Prisma aggregation):**

```typescript
const sessions = await prisma.readingSession.findMany({
  where: { /* ... */ },
  include: {
    _count: {
      select: { kudos: true },
    },
    kudos: {
      where: { giverId: currentUserId },
      select: { id: true },
    },
  },
});

// Map to ActivityItem
const sessionActivities = sessions.map(s => ({
  // ... existing fields
  kudosCount: s._count.kudos,
  userGaveKudos: s.kudos.length > 0,
}));
```

### Testing Pattern (from Story 4.1)

**Mock setup pattern:**

```typescript
// At top of test file
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    kudos: {
      create: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    readingSession: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// In tests
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>;
const mockKudosCreate = prisma.kudos.create as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
});
```

**Component test pattern:**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KudosButton } from './KudosButton';

vi.mock('@/actions/social', () => ({
  giveKudos: vi.fn(),
  removeKudos: vi.fn(),
}));

describe('KudosButton', () => {
  const defaultProps = {
    sessionId: 'session-1',
    receiverId: 'user-2',
    initialKudosCount: 5,
    initialUserGaveKudos: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heart icon and kudos count', () => {
    render(<KudosButton {...defaultProps} />);
    expect(screen.getByLabelText('Give kudos')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows filled heart when user gave kudos', () => {
    render(<KudosButton {...defaultProps} initialUserGaveKudos={true} />);
    const button = screen.getByLabelText(/You gave kudos/i);
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  // ... more tests
});
```

### Existing Code to Reuse (DO NOT REINVENT)

| Component/Action | Location | How to Use |
|---|---|---|
| `ActionResult<T>` | `@/actions/books/types.ts` | Return type for server actions |
| `followUser` pattern | `@/actions/social/followUser.ts` | Reference for P2002 handling, auth, validation |
| `FollowButton` pattern | `@/components/features/social/FollowButton.tsx` | Reference for optimistic UI, useTransition |
| `ActivityFeedItem` | `@/components/features/social/ActivityFeedItem.tsx` | Integrate KudosButton here |
| `getActivityFeed` | `@/actions/social/getActivityFeed.ts` | Update to include kudos data |
| `Heart` icon | `lucide-react` | Use for kudos button |
| `toast` | `sonner` | Error/success notifications |
| `useTransition` | `react` | Pending state for server actions |
| `motion` | `framer-motion` | Animation (optional) |
| `useReducedMotion` | `@/hooks/useReducedMotion` | Accessibility for animations |
| `prisma` | `@/lib/prisma` | Database client |
| `auth` | `@/lib/auth` | Authentication |

### Color Design Token

From architecture document and UX spec, kudos/encouragement should use warm colors:

```typescript
// Add to tailwind.config or use inline
const kudosColor = {
  coral: {
    500: '#ff7f50', // Coral for filled heart
    600: '#ff6347', // Darker for hover
  }
};
```

**Usage in component:**
```typescript
className={userGaveKudos ? 'fill-[#ff7f50] text-[#ff7f50]' : 'text-muted-foreground'}
```

### File Structure Requirements

**New files to create:**
```
prisma/
└── schema.prisma (modify - add Kudos model)

src/
├── actions/social/
│   ├── giveKudos.ts
│   ├── giveKudos.test.ts
│   ├── removeKudos.ts
│   ├── removeKudos.test.ts
│   ├── getKudosForSession.ts
│   ├── getKudosForSession.test.ts
│   └── index.ts (update exports)
├── components/features/social/
│   ├── KudosButton.tsx
│   ├── KudosButton.test.tsx
│   └── index.ts (update exports)
```

**Modified files:**
```
src/
├── actions/social/
│   ├── getActivityFeed.ts (add kudos data)
│   └── getActivityFeed.test.ts (update tests)
├── components/features/social/
│   ├── ActivityFeedItem.tsx (integrate KudosButton)
│   └── ActivityFeedItem.test.tsx (update tests)
└── types/database.ts (if needed for Kudos types)
```

### Testing Requirements

**Test files to create:**
1. `src/actions/social/giveKudos.test.ts` — 10+ tests
2. `src/actions/social/removeKudos.test.ts` — 8+ tests
3. `src/actions/social/getKudosForSession.test.ts` — 6+ tests
4. `src/components/features/social/KudosButton.test.tsx` — 15+ tests

**Update existing:**
5. `src/actions/social/getActivityFeed.test.ts` — add kudos data tests
6. `src/components/features/social/ActivityFeedItem.test.tsx` — add KudosButton integration tests

**Test scenarios (MUST cover):**
- Auth: unauthorized user receives error
- Self-kudos: user cannot give kudos to own session
- P2002 handling: duplicate kudos handled gracefully (idempotent)
- Optimistic UI: state updates immediately, rollback on error
- Toggle: give and remove kudos work correctly
- Count updates: kudos count reflects server state
- Accessibility: aria-label, aria-pressed, min touch target
- Callbacks: onKudosChange called with updated count
- Errors: Prisma errors handled gracefully with toast
- Session validation: non-existent session returns error

**After implementation, run:**
```bash
npx prisma generate   # Regenerate Prisma client
npx prisma db push    # Apply schema changes
npm test              # All tests must pass (906+ → 945+)
npm run typecheck     # 0 new errors
npm run lint          # 0 new warnings/errors
```

**Expected outcome:** 945+ tests passing (906 existing + ~39 new), 0 regressions

### Scope Boundaries

**Story 4.4 DOES:**
- Create Kudos database model with proper relations and constraints
- Implement giveKudos and removeKudos server actions with P2002 handling
- Create KudosButton component with optimistic UI and accessibility
- Integrate KudosButton into ActivityFeedItem for session activities
- Update getActivityFeed to include kudos count and user state
- Add comprehensive tests for all new code (0 regressions)
- Handle edge cases: self-kudos, duplicate kudos, offline (if time allows)

**Story 4.4 does NOT:**
- Implement kudos notifications (Story 4.5)
- Show kudos received list (Story 4.6)
- Add kudos to user profiles
- Implement kudos leaderboards or gamification
- Add kudos to other activity types (only reading sessions)
- Create kudos analytics or tracking

### Previous Story Intelligence (Stories 4.1, 4.2, 4.3)

**Key learnings from Story 4.1 (Follow/Unfollow):**
- `ActionResult<T>` pattern for all server actions
- P2002 unique constraint handling: catch error, fetch existing, return success
- Optimistic UI: save state → update immediately → call server → rollback on error
- `useTransition()` for pending state during server actions
- Toast for errors only (success is self-evident in UI)
- Self-action prevention: "Cannot follow yourself" → "Cannot kudos yourself"

**Key learnings from Story 4.2 (View User Profiles):**
- Server component fetches data, passes to client component for interactivity
- `Promise.all()` for parallel queries reduces latency
- Privacy filtering at database level
- Pagination with offset: `skip` and `take`
- Empty states with helpful CTAs

**Key learnings from Story 4.3 (Activity Feed):**
- Activity feed already exists at `/activity` route
- ActivityFeedItem renders session and finished book activities
- Session activities show user avatar, book, duration, timestamp
- KudosButton placeholder already reserved in design (AC #3 of Story 4.3)
- Feed uses offset pagination with "Load More" button
- 906 tests currently passing (must maintain 0 regressions)

**Code review learnings from Epic 3:**
- Parallel queries with `Promise.all()` for better latency
- Use `select` in Prisma queries to minimize data transfer
- Always handle nullable return values gracefully
- Add error logging in catch blocks (don't swallow errors silently)
- Prefer server actions over duplicating Prisma queries in page components

### Git Intelligence

Recent commits follow pattern: `feat: [Description] (Story N.N)` — all files + tests in single atomic commit.

**Most recent commit (Story 3.8):**
- Pattern: Story doc + all source files + all test files in single commit
- Message: `feat: Implement streak history heatmap with review fixes (Story 3.8)`
- Includes: action files, component files, tests, integration updates
- Co-Authored-By: Claude model attribution

**Story 4.4 should follow same pattern:**
1. Create story doc (this file) ✅
2. Implement all tasks (schema, actions, components, tests)
3. Run full test suite to verify 0 regressions (906 → 945+ tests)
4. Run type check and lint
5. Commit with message: `feat: Implement kudos system (Story 4.4)`
6. Include `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`

### Architecture Compliance

- **Social & Activity maps to FR23-FR27** per architecture doc — Story 4.4 specifically addresses FR24 (kudos system)
- **Server action pattern** for mutations (giveKudos, removeKudos)
- **Component location:** `src/components/features/social/` for KudosButton
- **Action location:** `src/actions/social/` for all kudos server actions
- **Database model:** Prisma schema with proper relations and constraints
- **Optimistic UI pattern:** Immediate feedback with server reconciliation
- **Error handling:** `ActionResult<T>` discriminated union, never throw
- **Accessibility:** ARIA attributes, min 44px touch targets, reduced-motion support

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-4-social-connections-activity-feed.md#Story 4.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions - Server Actions]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns - Optimistic UI, Error Handling]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries - Social FR23-FR27]
- [Source: _bmad-output/planning-artifacts/prd.md#FR24 - Kudos system]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Kudos Button Interaction]
- [Source: _bmad-output/implementation-artifacts/4-1-follow-unfollow-users.md#Server Action Pattern, P2002 Handling]
- [Source: _bmad-output/implementation-artifacts/4-3-activity-feed.md#ActivityFeedItem Integration Point]
- [Source: prisma/schema.prisma#Follow model (reference pattern)]
- [Source: src/actions/social/followUser.ts#Server action pattern]
- [Source: src/components/features/social/FollowButton.tsx#Optimistic UI pattern]
- [Source: src/components/features/social/ActivityFeedItem.tsx#Integration point]
- [Source: src/actions/social/getActivityFeed.ts#Data fetching pattern]
- [Source: CLAUDE.md#Import conventions, Server Actions pattern, Component patterns]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Implementation complete for Tasks 1–10; Task 11 (offline queue) deferred — no offline store infrastructure exists
- Code review (2026-02-07) found and fixed: removeKudos missing targetUserId validation, KudosButton missing haptic feedback, Kudos type missing from database.ts re-exports, getActivityFeed missing query caps, barrel import inconsistency, weak/missing test assertions
- CSS transitions used instead of Framer Motion for animation (lighter weight)
- 955 tests passing, 0 regressions

### Change Log

- 2026-02-07: Code review fixes applied (reviewer: Claude Opus 4.6)
  - H1: Added session ownership validation to removeKudos + 2 new tests
  - H2: Added `take: limit + offset` query caps to getActivityFeed
  - H4: Improved pending state test with real assertions
  - M1: Changed KudosButton imports to barrel exports
  - M2: Fixed onKudosChange test to verify server reconciliation (different values)
  - M3: Added reduced motion suppression test
  - M4: Added haptic feedback via navigator.vibrate()
  - M5: Added 10th test to giveKudos.test.ts
  - C2: Added Kudos to database.ts type re-exports

### File List

**New files:**
- `prisma/schema.prisma` — Added Kudos model with relations, unique constraint, indexes
- `src/actions/social/giveKudos.ts` — Give kudos server action with P2002 handling
- `src/actions/social/giveKudos.test.ts` — 10 tests
- `src/actions/social/removeKudos.ts` — Remove kudos server action with session validation
- `src/actions/social/removeKudos.test.ts` — 10 tests
- `src/actions/social/getKudosForSession.ts` — Query kudos state for a session
- `src/actions/social/getKudosForSession.test.ts` — 6 tests
- `src/components/features/social/KudosButton.tsx` — Optimistic toggle with animation + haptic
- `src/components/features/social/KudosButton.test.tsx` — 18 tests

**Modified files:**
- `src/actions/social/getActivityFeed.ts` — Added kudos data to session activities + query caps
- `src/actions/social/getActivityFeed.test.ts` — Added kudos integration tests (16 total)
- `src/actions/social/index.ts` — Added kudos action exports
- `src/components/features/social/ActivityFeedItem.tsx` — Integrated KudosButton for sessions
- `src/components/features/social/ActivityFeedItem.test.tsx` — Added KudosButton integration tests (17 total)
- `src/components/features/social/index.ts` — Added KudosButton export
- `src/types/database.ts` — Added Kudos type re-export
