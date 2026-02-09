# Story 3.6: Streak Credit & Reset Logic

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **my streak to increment when I meet my daily reading goal and reset when I miss it**,
so that **I am rewarded for consistent reading and understand my streak status clearly**.

## Acceptance Criteria

1. **Goal Met — Streak Increment:** Given I have not met today's goal, When I log a session that brings my daily total to or above my daily goal, Then today is marked as "goal_met" in my streak record, And if yesterday was also met (or frozen), my streak count increments by 1, And the StreakRing updates in real-time via `router.refresh()`.

2. **Consecutive Day Streak:** Given I have a streak and met yesterday's goal, When I meet today's goal, Then my `currentStreak` increases by 1, And `longestStreak` is updated if `currentStreak > longestStreak`, And `lastGoalMetDate` is set to today (user's timezone), And the streak is updated server-side atomically for data integrity.

3. **Streak Reset on Miss:** Given I missed yesterday's goal without a freeze, When I log any session today, Then my streak resets to 1 (today becomes Day 1 of a new streak), And I see a compassionate message: "Fresh start! Day 1 of your new streak.", And no guilt language is used anywhere.

4. **Day Change Evaluation:** Given it's a new day (based on user's timezone), When the home page loads or a session is saved, Then the system evaluates if yesterday's goal was met, And streak is updated accordingly (met = continue, missed = reset unless frozen).

5. **Midnight Session Edge Case:** Given a session spans midnight, When the session is saved, Then the session is attributed to the day it started (based on `startedAt`), And streak calculation handles timezone correctly (store UTC, calculate in user's TZ).

6. **Same-Day Idempotency:** Given I have already met today's goal, When I log additional sessions today, Then my streak count does NOT increment again (only increments once per day), And `lastGoalMetDate` remains unchanged (already today).

7. **First-Ever Goal Met:** Given I have no `UserStreak` record, When I meet my daily goal for the first time, Then a `UserStreak` record is created via `upsert`, And `currentStreak` is set to 1, And `longestStreak` is set to 1, And `lastGoalMetDate` is set to today.

8. **Frozen Day Continuity:** Given I used a streak freeze yesterday (freezeUsedToday was true for yesterday), When I meet today's goal, Then my streak continues (frozen day counts as "not a break"), And streak increments normally.

9. **Multi-Day Gap:** Given I missed more than 1 day without freezes, When I meet my goal today, Then my streak resets to 1, And the system does NOT try to retroactively apply freezes for missed days.

10. **Real-Time UI Update:** Given I save a session that triggers a streak change, When the save completes, Then the home page StreakRing shows the updated streak count and state, And a toast message is shown for the streak reset ("Fresh start! Day 1 of your new streak.") or no toast for normal increment (the StreakRing animation itself is the feedback).

## Tasks / Subtasks

- [x] Task 1: Create `DailyProgress` Prisma model (AC: #1, #2, #4, #5, #6)
  - [x] 1.1: Add `DailyProgress` model to `prisma/schema.prisma` with fields: `id` (cuid), `userId` (String, FK), `date` (DateTime — date-only, stores midnight UTC of the user's local date), `minutesRead` (Int, default 0), `goalMet` (Boolean, default false), `freezeUsed` (Boolean, default false)
  - [x] 1.2: Add composite unique constraint `@@unique([userId, date])` for idempotent upserts
  - [x] 1.3: Add indexes: `@@index([userId])`, `@@index([userId, date])`
  - [x] 1.4: Add relation to User model: `dailyProgress DailyProgress[]`
  - [x] 1.5: Run `npx prisma generate` (and `npx prisma db push` if DB available)

- [x] Task 2: Create `updateStreakOnGoalMet` server action (AC: #1, #2, #3, #6, #7, #8, #9)
  - [x] 2.1: Create `src/actions/streaks/updateStreakOnGoalMet.ts` following `ActionResult<T>` pattern
  - [x] 2.2: Accept input: `{ timezone: string }` (validated with Zod, defaults to 'UTC')
  - [x] 2.3: Authenticate via `auth.api.getSession({ headers: await headers() })`
  - [x] 2.4: Fetch user's `dailyGoalMinutes` from User model — if null, return error "No daily goal set"
  - [x] 2.5: Calculate today's bounds using the SAME `getTodayBounds()` logic from `getDailyProgress.ts` — EXTRACT to shared utility `src/lib/dates.ts` and import from both actions
  - [x] 2.6: Aggregate today's reading sessions (same as `getDailyProgress`)
  - [x] 2.7: If `minutesRead < goalMinutes`, return early: `{ streakUpdated: false, reason: 'goal_not_met' }`
  - [x] 2.8: Check idempotency: if `lastGoalMetDate` === today (user's TZ), return early: `{ streakUpdated: false, reason: 'already_credited_today' }`
  - [x] 2.9: Determine streak action by comparing `lastGoalMetDate` to yesterday (user's TZ):
    - If `lastGoalMetDate` === yesterday OR yesterday had a freeze → increment streak
    - If `lastGoalMetDate` === today → no change (idempotent)
    - If `lastGoalMetDate` < yesterday (or null) → reset streak to 1
  - [x] 2.10: Use `prisma.userStreak.upsert()` to atomically create or update the streak record
  - [x] 2.11: Use `prisma.dailyProgress.upsert()` to mark today as `goalMet: true` with `minutesRead`
  - [x] 2.12: Return `ActionResult<StreakUpdateResult>` with `{ streakUpdated: true, currentStreak, longestStreak, wasReset, message? }`
  - [x] 2.13: Wrap DB operations in `prisma.$transaction()` for atomicity

- [x] Task 3: Create `checkStreakStatus` server action (AC: #3, #4, #8, #9)
  - [x] 3.1: Create `src/actions/streaks/checkStreakStatus.ts` following `ActionResult<T>` pattern
  - [x] 3.2: Accept input: `{ timezone: string }` (validated with Zod, defaults to 'UTC')
  - [x] 3.3: This action evaluates streak health WITHOUT modifying it — used on page load
  - [x] 3.4: Calculate today and yesterday bounds using shared `getTodayBounds()`
  - [x] 3.5: Fetch `UserStreak` record
  - [x] 3.6: If `lastGoalMetDate` < yesterday and no freeze used yesterday → mark streak as "at risk" (will reset on next goal met)
  - [x] 3.7: Return `{ currentStreak, isAtRisk, missedDays, lastGoalMetDate, freezeUsedToday }`
  - [x] 3.8: The Home page can use this to show the compassionate "Fresh start" message proactively

- [x] Task 4: Extract `getTodayBounds` to shared utility (AC: #4, #5)
  - [x] 4.1: Create `src/lib/dates.ts` with exported `getTodayBounds(timezone: string): { start: Date; end: Date }` function
  - [x] 4.2: Add `getYesterdayBounds(timezone: string): { start: Date; end: Date }` helper
  - [x] 4.3: Add `getDateInTimezone(date: Date, timezone: string): string` helper (returns YYYY-MM-DD)
  - [x] 4.4: Add `isSameDay(date1: Date, date2: Date, timezone: string): boolean` helper
  - [x] 4.5: Refactor `getDailyProgress.ts` to import from `@/lib/dates` instead of inline `getTodayBounds`
  - [x] 4.6: Write `src/lib/dates.test.ts` — test timezone boundary calculations, DST edge cases, midnight boundaries

- [x] Task 5: Integrate streak update into session save flow (AC: #1, #10)
  - [x] 5.1: Modify `saveReadingSession.ts` — AFTER successful session save, call `updateStreakOnGoalMet` internally (NOT as a separate client call)
  - [x] 5.2: The streak update must NOT block the session save — if streak update fails, the session is still saved successfully
  - [x] 5.3: Return streak update result alongside session data: extend response type to include optional `streakUpdate` field
  - [x] 5.4: Client receives streak info in the save response — use to show toast and trigger `router.refresh()`

- [x] Task 6: Update Home page for streak status display (AC: #3, #4, #10)
  - [x] 6.1: In `src/app/(main)/home/page.tsx`, call `checkStreakStatus` alongside existing `getStreakData` and `getDailyProgress`
  - [x] 6.2: Pass `isAtRisk` and `wasReset` to `HomeContent` as new props
  - [x] 6.3: In `HomeContent.tsx`, show compassionate message when streak was recently reset: "Fresh start! Day 1 of your new streak." (use a Card with warm styling, not an error/warning)
  - [x] 6.4: Ensure `router.refresh()` after session save picks up the new streak data

- [x] Task 7: Update barrel exports (AC: all)
  - [x] 7.1: Update `src/actions/streaks/index.ts` to export `updateStreakOnGoalMet`, `checkStreakStatus` and their types
  - [x] 7.2: Update `src/lib/dates.ts` exports (if using barrel in lib/)

- [x] Task 8: Write comprehensive tests (AC: all)
  - [x] 8.1: Create `src/actions/streaks/updateStreakOnGoalMet.test.ts`:
    - Test: Goal not met → no streak update
    - Test: First-ever goal met → creates UserStreak with streak=1
    - Test: Consecutive day → increments streak
    - Test: Missed day → resets to 1
    - Test: Same-day idempotency → no double increment
    - Test: Frozen yesterday → streak continues
    - Test: Multi-day gap → resets to 1
    - Test: longestStreak updates when currentStreak exceeds it
    - Test: No daily goal set → error
    - Test: Unauthenticated → error
    - Test: DailyProgress record created/updated
    - Test: Transaction atomicity (both UserStreak and DailyProgress updated)
  - [x] 8.2: Create `src/actions/streaks/checkStreakStatus.test.ts`:
    - Test: Active streak (yesterday met) → not at risk
    - Test: Missed yesterday → at risk
    - Test: Frozen yesterday → not at risk
    - Test: No streak record → returns defaults
    - Test: Multi-day miss → at risk with correct missedDays count
  - [x] 8.3: Create `src/lib/dates.test.ts`:
    - Test: getTodayBounds for UTC
    - Test: getTodayBounds for US/Eastern (UTC-5)
    - Test: getTodayBounds for Asia/Tokyo (UTC+9)
    - Test: getYesterdayBounds correctness
    - Test: isSameDay across timezone boundaries
    - Test: getDateInTimezone returns correct YYYY-MM-DD
  - [x] 8.4: Update `src/actions/sessions/saveReadingSession.test.ts`:
    - Test: Session save triggers streak update when goal is met
    - Test: Session save succeeds even if streak update fails
    - Test: Streak update result included in response
  - [x] 8.5: Update `src/app/(main)/home/HomeContent.test.tsx`:
    - Test: "Fresh start" message shown when streak was reset
    - Test: No message when streak is healthy
  - [x] 8.6: Verify 0 regressions across the full test suite (663+ tests)

## Dev Notes

### Critical Architecture Patterns

- **Server Actions** use `ActionResult<T>` discriminated union — import from `src/actions/books/types.ts`
- **Auth pattern**: `const session = await auth.api.getSession({ headers: await headers() });`
- **Import convention**: ALWAYS use `@/` alias for cross-boundary imports
- **Component naming**: PascalCase files, named exports (not default)
- **Test co-location**: `Component.test.tsx` next to `Component.tsx`
- **Barrel exports**: Every feature folder needs `index.ts`
- **Date handling**: Store UTC in DB, calculate in user's timezone. Use `Intl.DateTimeFormat` for timezone-aware calculations.
- **Duration**: `ReadingSession.duration` is stored in **seconds**. Convert to minutes: `Math.floor(totalSeconds / 60)`.
- **Zod v4**: Use `error.issues` not `error.errors` for ZodError handling.
- **Toast**: Use `import { toast } from 'sonner'`.

### Streak Logic Algorithm (CRITICAL — follow exactly)

```
function determineStreakAction(lastGoalMetDate, yesterday, today, yesterdayFrozen):
  if lastGoalMetDate == today:
    return ALREADY_CREDITED  // idempotent — no change

  if lastGoalMetDate == yesterday OR yesterdayFrozen:
    return INCREMENT  // streak continues

  return RESET  // streak breaks, start at 1
```

**Timezone handling is the #1 risk.** All date comparisons must use the SAME timezone:
- "today" = midnight-to-midnight in user's local timezone, converted to UTC for DB queries
- "yesterday" = the day before "today" in user's local timezone
- `lastGoalMetDate` is stored as UTC DateTime — compare by extracting the date portion in user's TZ

### Existing `getTodayBounds` Implementation (in getDailyProgress.ts:24-85)

This function already correctly calculates timezone-aware day boundaries. **Extract it to `src/lib/dates.ts`** — do NOT rewrite or duplicate. The function:
1. Uses `Intl.DateTimeFormat('en-CA', { timeZone })` to get YYYY-MM-DD for "today"
2. Calculates UTC offset for the timezone
3. Returns `{ start: Date, end: Date }` as UTC timestamps bounding the user's local day

### DailyProgress Model Design Rationale

The epic specifies creating a `DailyProgress` table: `(userId, date, minutesRead, goalMet, freezeUsed)`. This table provides:
- **Audit trail**: Every day's reading progress is recorded
- **Streak history support** (Story 3.8): The heatmap needs per-day records
- **Freeze tracking** (Story 3.7): Per-day freeze usage
- **Idempotency**: `@@unique([userId, date])` prevents duplicate entries

However, for Story 3.6, the DailyProgress table is **optional but recommended**. The minimum viable implementation can work with just `UserStreak.lastGoalMetDate`. Creating DailyProgress now sets up Story 3.7 (Streak Freeze) and 3.8 (Streak History) correctly.

### Prisma Schema Addition

```prisma
model DailyProgress {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  date        DateTime // Midnight UTC representing the user's local date
  minutesRead Int      @default(0) @map("minutes_read")
  goalMet     Boolean  @default(false) @map("goal_met")
  freezeUsed  Boolean  @default(false) @map("freeze_used")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date])
  @@index([userId])
  @@index([userId, date])
  @@map("daily_progress")
}
```

Add to User model: `dailyProgress DailyProgress[]`

### Integration with saveReadingSession (CRITICAL)

The streak update MUST be called from within `saveReadingSession.ts`, NOT as a separate client-side call. This prevents:
- Race conditions (two sessions saved rapidly)
- Inconsistency (session saved but streak not updated)
- Extra network round-trips

**Pattern:**
```typescript
// In saveReadingSession.ts, after successful session create:
const readingSession = await prisma.readingSession.create({ ... });

// Attempt streak update (non-blocking for session save)
let streakUpdate = null;
try {
  streakUpdate = await updateStreakInternal(session.user.id, timezone);
} catch {
  // Streak update failure does NOT fail the session save
  console.error('Streak update failed, session saved successfully');
}

return { success: true, data: { ...readingSession, streakUpdate } };
```

Note: Since `updateStreakOnGoalMet` is also a server action with its own auth, create an **internal** version (`updateStreakInternal`) that accepts `userId` directly — avoids double auth overhead.

### Existing Code to Reuse (DO NOT REINVENT)

| What | Where | How to Use |
|------|-------|-----------|
| `ActionResult<T>` | `@/actions/books/types.ts` | Import for return types |
| `getTodayBounds()` | `@/actions/goals/getDailyProgress.ts:24-85` | EXTRACT to `@/lib/dates.ts`, import in both files |
| `getDailyProgress()` | `@/actions/goals/getDailyProgress.ts` | Reference for timezone-aware session aggregation |
| `getStreakData()` | `@/actions/streaks/getStreakData.ts` | Reference for UserStreak queries; will be extended |
| `saveReadingSession()` | `@/actions/sessions/saveReadingSession.ts` | Modify to call streak update after save |
| `StreakRing` | `@/components/features/streaks/StreakRing.tsx` | Already displays all states — NO changes needed to component |
| `HomeContent` | `@/app/(main)/home/HomeContent.tsx` | Add streak status message (compassionate reset notification) |
| Home page server fetch | `@/app/(main)/home/page.tsx` | Add `checkStreakStatus` call alongside existing fetches |
| Toast notifications | `sonner` | Already used project-wide |
| Prisma client | `@/lib/prisma` | Singleton Prisma instance |
| Auth | `@/lib/auth` | `auth.api.getSession({ headers: await headers() })` |

### Emotional Design Requirements (from UX spec)

**CRITICAL — Never use guilt language:**
- "You'll lose your streak!" — NEVER
- "You missed your goal!" — NEVER
- "Streak lost!" — NEVER

**Correct language:**
- "Fresh start! Day 1 of your new streak." — When streak resets
- "Your book is waiting" — For gentle nudges
- "Tomorrow is a new day" — For missed days

**Forgiveness-first messaging** is a core UX principle. The StreakRing already handles visual states (amber/green/blue). Story 3.6 only needs to add the "Fresh start" text message when a reset occurs.

### Scope Boundaries

**Story 3.6 DOES:**
- Create `DailyProgress` model for per-day tracking
- Create `updateStreakOnGoalMet` server action with full streak credit/reset logic
- Create `checkStreakStatus` server action for page-load evaluation
- Extract `getTodayBounds` to shared `src/lib/dates.ts`
- Integrate streak update into `saveReadingSession` flow
- Update Home page to show compassionate reset message
- Handle timezone-aware date comparisons correctly

**Story 3.6 does NOT:**
- Implement freeze earning logic (Story 3.7 — freeze earning is on 7/30 day milestones)
- Implement freeze usage/application (Story 3.7 — the "Use freeze?" prompt)
- Implement streak history heatmap (Story 3.8)
- Modify StreakRing component (already handles all visual states)
- Add any end-of-day cron/scheduled job (evaluation happens on page load and session save)

**Freeze handling in 3.6 is READ-ONLY:** The `updateStreakOnGoalMet` action READS `freezeUsedToday` to determine if yesterday was frozen (streak continues). It does NOT set freeze state — that's Story 3.7's responsibility. For now, `freezeUsedToday` will always be `false` and `freezesAvailable` will always be `0`.

### Previous Story Intelligence (Stories 3.4 + 3.5)

**Key patterns established:**
- Home page is a Server Component that fetches data and passes to `HomeContent` client wrapper
- `HomeContent` accepts props: `userName`, `userEmail`, `userImage`, `dailyGoalMinutes`, `minutesRead`, `currentStreak`, `freezeUsedToday`
- `router.refresh()` is called after state changes to refetch server data
- Server actions use `headers()` from `next/headers` for auth
- Duration stored in DB as seconds, converted to minutes in `getDailyProgress`
- Prisma DB push may be unavailable — validate via `prisma generate` at minimum

**Story 3.5 created:**
- `UserStreak` model in Prisma schema (already exists — do NOT recreate)
- `getStreakData` server action (returns current streak, freeze state)
- `StreakRing` component with all visual states
- Integration into Home page via `page.tsx` -> `HomeContent.tsx`

**Story 3.5 code review findings to remember:**
- `useSyncExternalStore` subscribe/getSnapshot need `useCallback` for stable refs
- Conditional server action calls: only fetch streak data if `dailyGoalMinutes` is set
- `goalMet` takes priority over `freezeUsedToday` for display (green > blue)

**Test count:** 663 tests passing across 64 files at end of Story 3.5

### Git Intelligence

Recent commits:
- `64aced6` feat: Implement daily reading goal and streak ring display (Stories 3.4, 3.5)
- `fd7503e` chore: fix merge conflicts
- `9c790f7` feat: add sign out button
- `2173829` feat: Implement session history with paginated list and reading stats (Story 3.3)
- `0aed173` fix: pass book.id instead of ISBN to SessionTimer

**Pattern:** Feature commits include all new files + tests + modifications together. Commit message: `feat: [Description] (Story N.N)`

### Architecture Compliance

- **Streak System maps to FR17-FR22** per architecture doc
- **Primary locations:** `features/streaks/`, `actions/streaks/` — per architecture structure mapping
- **Server Actions for mutations** (not API Routes) — per API Pattern Decision Tree
- **Prisma `$transaction`** for multi-table atomicity — standard pattern
- **Zustand NOT needed** for this story — streak data flows through server actions and page props
- **Date handling:** "Streak calculations → User's timezone via `Intl.DateTimeFormat`" per architecture doc
- **High-Risk Area:** Architecture doc identifies "Streak calculation — HIGH — Time-zone edge cases, midnight boundaries, freeze mechanics" — implement with extra care and thorough tests

### Testing Standards

- **Framework:** Vitest + React Testing Library (NOT Jest)
- **Mock auth:** `vi.mock('@/lib/auth')`
- **Mock prisma:** `vi.mock('@/lib/prisma')`
- **Mock server actions:** `vi.mock('@/actions/streaks')`
- **Test co-location:** Test files next to source files
- **Accessibility:** aria attributes, touch targets (44px minimum)
- **Run full suite** after implementation to verify 0 regressions (663+ tests expected)
- **Mock patterns:**
  ```typescript
  vi.mock('@/lib/auth', () => ({
    auth: { api: { getSession: vi.fn() } }
  }));
  vi.mock('@/lib/prisma', () => ({
    prisma: {
      userStreak: { findUnique: vi.fn(), upsert: vi.fn() },
      dailyProgress: { upsert: vi.fn() },
      readingSession: { aggregate: vi.fn() },
      user: { findUnique: vi.fn() },
      $transaction: vi.fn((fn) => fn({ userStreak: { ... }, dailyProgress: { ... } })),
    }
  }));
  ```

### Project Structure Notes

**New files:**
- `src/lib/dates.ts` (shared timezone utility — extracted from getDailyProgress.ts)
- `src/lib/dates.test.ts`
- `src/actions/streaks/updateStreakOnGoalMet.ts`
- `src/actions/streaks/updateStreakOnGoalMet.test.ts`
- `src/actions/streaks/checkStreakStatus.ts`
- `src/actions/streaks/checkStreakStatus.test.ts`

**Modified files:**
- `prisma/schema.prisma` (add DailyProgress model, add dailyProgress relation to User)
- `src/actions/goals/getDailyProgress.ts` (refactor to import getTodayBounds from `@/lib/dates`)
- `src/actions/sessions/saveReadingSession.ts` (add streak update call after session save)
- `src/actions/sessions/saveReadingSession.test.ts` (add streak update tests)
- `src/actions/streaks/index.ts` (add new exports)
- `src/app/(main)/home/page.tsx` (add checkStreakStatus call)
- `src/app/(main)/home/HomeContent.tsx` (add streak reset message display)
- `src/app/(main)/home/HomeContent.test.tsx` (add streak reset message tests)

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-3-reading-sessions-habit-tracking.md#Story 3.6]
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions - Data Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns - Naming Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns - Format Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- [Source: _bmad-output/planning-artifacts/architecture.md#High-Risk Technical Areas - Streak calculation HIGH]
- [Source: _bmad-output/planning-artifacts/prd.md#FR19 - Streak credit when goal met]
- [Source: _bmad-output/planning-artifacts/prd.md#FR21 - System resets streak on miss without freeze]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Emotional Design - Forgiveness over shame]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Journey 5 - Streak Freeze & Recovery]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Anti-Patterns - Guilt-trip copy]
- [Source: _bmad-output/implementation-artifacts/3-4-daily-reading-goal.md#Dev Notes]
- [Source: _bmad-output/implementation-artifacts/3-5-streak-ring-display.md#Dev Notes]
- [Source: src/actions/goals/getDailyProgress.ts#getTodayBounds implementation]
- [Source: src/actions/streaks/getStreakData.ts#StreakData type]
- [Source: src/actions/sessions/saveReadingSession.ts#session save pattern]
- [Source: src/actions/books/types.ts#ActionResult]
- [Source: src/app/(main)/home/HomeContent.tsx#StreakRing integration]
- [Source: prisma/schema.prisma#UserStreak model, ReadingSession model]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

### Completion Notes List

- All 8 tasks and all subtasks verified as fully implemented by prior dev session
- DailyProgress model exists in prisma/schema.prisma (lines 154-170) with all required fields, constraints, and indexes
- updateStreakOnGoalMet server action implements full streak credit/reset algorithm with timezone-aware date handling, idempotency, freeze checking, and atomic $transaction
- checkStreakStatus server action evaluates streak health on page load without modifying state
- dates.ts shared utility extracted with getTodayBounds, getYesterdayBounds, getDateInTimezone, isSameDay, getDayBounds
- saveReadingSession.ts integrates updateStreakInternal as non-blocking post-save call
- Home page calls checkStreakStatus and passes isStreakAtRisk to HomeContent
- HomeContent shows compassionate "at risk" messaging with StreakFreezePrompt when freezes available
- Barrel exports updated in src/actions/streaks/index.ts
- 68 tests across 5 Story 3.6 test files all pass (18 + 8 + 13 + 10 + 19)
- Full suite: 1194 tests pass, 2 pre-existing failures (middleware.test.ts import issue from proxy.ts rename, AppShell.test.tsx missing DATABASE_URL)
- TypeScript and ESLint pass for all Story 3.6 files (pre-existing issues in unrelated files only)

### File List

**New files:**
- src/lib/dates.ts
- src/lib/dates.test.ts
- src/actions/streaks/updateStreakOnGoalMet.ts
- src/actions/streaks/updateStreakOnGoalMet.test.ts
- src/actions/streaks/checkStreakStatus.ts
- src/actions/streaks/checkStreakStatus.test.ts

**Modified files:**
- prisma/schema.prisma (DailyProgress model, User.dailyProgress relation)
- src/actions/goals/getDailyProgress.ts (imports getTodayBounds from @/lib/dates)
- src/actions/sessions/saveReadingSession.ts (streak update integration)
- src/actions/sessions/saveReadingSession.test.ts (streak update tests)
- src/actions/streaks/index.ts (barrel exports)
- src/actions/streaks/getStreakData.ts (uses getTodayBounds from @/lib/dates)
- src/app/(main)/home/page.tsx (checkStreakStatus call)
- src/app/(main)/home/HomeContent.tsx (isStreakAtRisk prop, streak messaging)
- src/app/(main)/home/HomeContent.test.tsx (streak at-risk tests)
