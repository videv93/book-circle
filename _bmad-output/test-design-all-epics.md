# Test Design: All Epics - flappy-bird-1

**Date:** 2026-02-11
**Author:** vitr
**Status:** Draft

---

## Executive Summary

**Scope:** Full system test design across all 8 epics (39 original FRs + 12 premium monetization FRs)

**Existing Coverage:** 116 test files (Vitest + React Testing Library), co-located with source. Primarily unit and component tests. No E2E tests exist yet.

**Risk Summary:**

- Total risks identified: 18
- High-priority risks (score >=6): 6
- Critical categories: SEC, PERF, DATA, BUS, TECH

**Coverage Summary:**

- P0 scenarios: 28
- P1 scenarios: 35
- P2/P3 scenarios: 22
- **Total**: 85 test scenarios

---

## Risk Assessment

### High-Priority Risks (Score >=6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|-------------|--------|-------|------------|-------|
| R-001 | SEC | OAuth token handling - session hijacking if tokens leaked or cookies misconfigured | 2 | 3 | 6 | Validate cookie flags (httpOnly, secure, sameSite), test token expiry flows | Dev |
| R-002 | SEC | Webhook signature verification bypass - unauthorized premium upgrades via forged Polar webhooks | 2 | 3 | 6 | Verify HMAC signature validation, test with invalid/missing signatures | Dev |
| R-003 | DATA | Streak calculation edge cases - timezone boundaries, midnight crossings, DST transitions cause incorrect streak resets | 3 | 2 | 6 | Comprehensive unit tests with mocked dates across timezone boundaries | Dev |
| R-004 | PERF | Reading room presence polling - 30s interval with 50 concurrent users per room could overload database | 2 | 3 | 6 | Load test presence endpoints, add caching layer, test graceful degradation | Dev |
| R-005 | BUS | Payment flow failure - user pays but premium status not activated due to webhook race condition | 2 | 3 | 6 | Idempotent webhook handler, test concurrent webhook delivery, verify retry logic | Dev |
| R-006 | SEC | Admin role escalation - insufficient authorization checks on admin routes allow unauthorized access | 2 | 3 | 6 | Test all admin endpoints with non-admin users, verify middleware enforcement | Dev |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|-------------|--------|-------|------------|-------|
| R-007 | TECH | Pusher connection failure - reading rooms degrade without real-time updates | 2 | 2 | 4 | Test graceful fallback to polling-only mode | Dev |
| R-008 | DATA | Book library limit enforcement race condition - concurrent requests bypass 3-book limit | 2 | 2 | 4 | Server-side atomic check-and-add, test concurrent requests | Dev |
| R-009 | BUS | Activity feed ordering - incorrect chronological ordering confuses users | 2 | 2 | 4 | Test feed ordering with various event types and timestamps | Dev |
| R-010 | TECH | Offline session sync - sessions logged offline may conflict with server state on reconnect | 2 | 2 | 4 | Test offline queue sync, conflict resolution strategy | Dev |
| R-011 | DATA | Author claim verification - false claims could damage platform trust | 1 | 3 | 3 | Test verification workflow, admin review queue | Dev |
| R-012 | BUS | Kudos notification delivery - missed notifications reduce social engagement | 2 | 2 | 4 | Test Pusher event delivery, notification display | Dev |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
|---------|----------|-------------|-------------|--------|-------|--------|
| R-013 | OPS | Vercel deployment cold starts on API routes | 1 | 2 | 2 | Monitor |
| R-014 | BUS | Book metadata from OpenLibrary/Google Books incomplete | 1 | 1 | 1 | Monitor |
| R-015 | OPS | Database connection pool exhaustion under load | 1 | 2 | 2 | Monitor |
| R-016 | TECH | Framer Motion animation conflicts with reduced-motion preference | 1 | 1 | 1 | Monitor |
| R-017 | BUS | Streak freeze UI confusion - users don't understand freeze mechanics | 1 | 1 | 1 | Monitor |
| R-018 | OPS | Mixpanel analytics event loss during high traffic | 1 | 1 | 1 | Monitor |

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors, revenue)
- **OPS**: Operations (deployment, config, monitoring)

---

## Test Coverage Plan

### P0 (Critical) - Run on every commit

**Criteria**: Blocks core journey + High risk (>=6) + No workaround

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|-----------|-----------|------------|-------|-------|
| **Epic 1: Auth & Profile** | | | | | |
| OAuth login (Google/Apple) - FR1 | Unit + Component | R-001 | 3 | Dev | Session creation, token handling, cookie flags |
| Route protection middleware | Unit | R-006 | 2 | Dev | Protected routes redirect unauthenticated users |
| **Epic 2: Book Library** | | | | | |
| Add book to library - FR8 | Unit | R-008 | 2 | Dev | Happy path + limit enforcement |
| Book limit enforcement (free tier) - FR2 (premium) | Unit | R-008 | 3 | Dev | Exactly at limit, over limit, premium bypass |
| **Epic 3: Sessions & Streaks** | | | | | |
| Streak credit/reset logic - FR19/FR21 | Unit | R-003 | 4 | Dev | Timezone boundaries, midnight, DST, freeze interaction |
| Save reading session - FR13 | Unit | - | 2 | Dev | Valid session, validation errors |
| **Epic 5: Reading Rooms** | | | | | |
| Presence polling endpoint | Unit + API | R-004 | 2 | Dev | Response format, concurrent users |
| Pusher graceful degradation | Unit | R-007 | 2 | Dev | Fallback to polling when Pusher unavailable |
| **Epic 7-8: Premium & Payment** | | | | | |
| Webhook signature verification | Unit | R-002 | 3 | Dev | Valid sig, invalid sig, missing sig |
| Payment→premium activation flow | Unit | R-005 | 3 | Dev | Happy path, duplicate webhook, race condition |
| isPremium() utility | Unit | - | 2 | Dev | FREE user, PREMIUM user |

**Total P0**: 28 tests

### P1 (High) - Run on PR to main

**Criteria**: Important features + Medium risk (3-4) + Common workflows

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|-----------|-----------|------------|-------|-------|
| **Epic 1: Auth & Profile** | | | | | |
| Profile update - FR2 | Unit + Component | - | 3 | Dev | Valid update, validation errors, optimistic UI |
| Follow/unfollow - FR3/FR4 | Unit + Component | - | 3 | Dev | Follow, unfollow, optimistic count update |
| **Epic 2: Book Library** | | | | | |
| Book search - FR7 | Unit + Component | - | 3 | Dev | Search results, no results, API error |
| Update reading status - FR9 | Unit | - | 2 | Dev | Status transitions |
| Remove book from library - FR10 | Unit | - | 2 | Dev | Successful removal, error handling |
| **Epic 3: Sessions & Streaks** | | | | | |
| Session history - FR14 | Component | - | 2 | Dev | Renders history, empty state |
| Daily reading goal - FR17 | Unit + Component | - | 2 | Dev | Set goal, update goal |
| Streak freeze - FR20 | Unit | - | 2 | Dev | Use freeze, no freezes available |
| Streak history - FR22 | Component | - | 2 | Dev | Renders history, milestone display |
| **Epic 4: Social** | | | | | |
| Activity feed - FR23 | Component | R-009 | 3 | Dev | Feed ordering, event types, empty state |
| Give kudos - FR24 | Unit + Component | - | 2 | Dev | Send kudos, optimistic UI |
| Kudos notifications - FR25 | Component | R-012 | 2 | Dev | Notification display, mark as read |
| **Epic 5: Reading Rooms** | | | | | |
| Join/leave room - FR28/FR32 | Unit | - | 2 | Dev | Join, leave, user count update |
| See room occupants - FR29 | Component | - | 2 | Dev | Occupant list, author badge |
| Author presence indicator - FR30 | Component | - | 2 | Dev | "Author was here X ago" display |
| **Epic 6: Admin** | | | | | |
| Moderation queue - FR34 | Component | - | 2 | Dev | Queue display, action buttons |
| Content removal - FR35 | Unit | - | 2 | Dev | Remove content, audit log |

**Total P1**: 38 tests

### P2 (Medium) - Run nightly/weekly

**Criteria**: Secondary features + Low risk (1-2) + Edge cases

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|-----------|-----------|------------|-------|-------|
| View other user profiles - FR5 | Component | - | 2 | Dev | Public profile, private elements hidden |
| Author claim verification - FR6 | Unit | R-011 | 2 | Dev | Claim flow, admin review |
| Book detail page - FR11 | Component | - | 2 | Dev | Metadata display, author claimed indicator |
| User warning/suspension - FR36 | Unit | - | 2 | Dev | Issue warning, suspend account |
| Platform health metrics - FR38 | Component | - | 2 | Dev | Dashboard renders, data loading |
| User/session lookup - FR39 | Unit | - | 2 | Dev | Search by email, search by ID |
| Upgrade prompt UI - FR9 (premium) | Component | - | 2 | Dev | Celebratory tone, dismiss behavior |
| Polar checkout session - FR4 (premium) | Unit | - | 2 | Dev | Create session, already premium guard |
| Post-payment success page - FR10 (premium) | Component | - | 2 | Dev | Success display, cancel flow |

**Total P2**: 18 tests

### P3 (Low) - Run on-demand

**Criteria**: Nice-to-have + Exploratory + Edge cases

| Requirement | Test Level | Test Count | Owner | Notes |
|-------------|-----------|------------|-------|-------|
| Animation reduced-motion respect | Component | 1 | Dev | Framer Motion disabled |
| Bottom nav responsive behavior | Component | 1 | Dev | Desktop vs mobile layout |
| Public landing page | Component | 1 | Dev | Renders correctly |
| Book cover alt text accessibility | Component | 1 | Dev | WCAG compliance |

**Total P3**: 4 tests

---

## Execution Order

### Smoke Tests (<5 min)

**Purpose**: Fast feedback, catch build-breaking issues

- [ ] OAuth login creates session (Unit)
- [ ] Add book to library succeeds (Unit)
- [ ] Log reading session succeeds (Unit)
- [ ] Streak credit awarded for met goal (Unit)
- [ ] Presence endpoint returns room data (Unit)

**Total**: 5 scenarios

### P0 Tests (<10 min)

**Purpose**: Critical path validation

- [ ] All 28 P0 scenarios listed above

### P1 Tests (<30 min)

**Purpose**: Important feature coverage

- [ ] All 38 P1 scenarios listed above

### P2/P3 Tests (<60 min)

**Purpose**: Full regression coverage

- [ ] All 22 P2/P3 scenarios listed above

---

## Existing Test Coverage Analysis

The project already has **116 test files** using Vitest + React Testing Library. Key observations:

**Well-covered areas:**
- Component rendering and user interactions (46+ component test files)
- Server actions with auth/prisma mocking (17+ action test files)
- Zustand stores (timer, notifications, presence)
- Custom hooks (debounce, library, idle timeout)

**Gaps identified (new tests needed):**
- No E2E tests (no Playwright setup yet)
- Webhook signature verification (R-002)
- Streak timezone edge cases (R-003)
- Presence endpoint load handling (R-004)
- Payment webhook idempotency (R-005)
- Admin authorization enforcement (R-006)
- Book limit race condition (R-008)
- Offline sync conflict resolution (R-010)

**Recommendation:** Focus new test effort on the 8 gap areas above. Existing unit/component tests provide solid coverage for happy paths.

---

## Test Levels Strategy

Based on the architecture (Next.js monolith, Server Actions, Prisma, Pusher):

| Level | Percentage | Rationale |
|-------|-----------|-----------|
| Unit | 60% | Server Actions, Zustand stores, utility functions, streak logic |
| Component | 25% | React components with Testing Library (already strong) |
| Integration | 10% | API routes (webhooks, Pusher auth, book proxy) |
| E2E | 5% | Critical user journeys only (login→add book→log session→streak) |

**Recommended E2E scenarios (future, when Playwright added):**
1. Login → add book → log session → view streak
2. Hit book limit → see upgrade prompt → complete payment → add more books
3. Join reading room → see occupants → leave room
4. Admin: review moderation queue → remove content

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions)
- **P1 pass rate**: >=95% (waivers required for failures)
- **P2/P3 pass rate**: >=90% (informational)
- **High-risk mitigations**: 100% complete or approved waivers

### Coverage Targets

- **Critical paths** (auth, payment, streaks): >=80%
- **Security scenarios** (SEC category): 100%
- **Business logic** (streak calc, limits, feed): >=70%
- **Edge cases**: >=50%

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] No high-risk (>=6) items unmitigated
- [ ] Security tests (SEC category) pass 100%
- [ ] Webhook signature verification tests pass

---

## Mitigation Plans

### R-001: OAuth Session Security (Score: 6)

**Mitigation Strategy:** Add unit tests verifying cookie configuration (httpOnly, secure, sameSite=lax), test session expiry after 24 hours, test middleware rejects expired tokens
**Owner:** Dev
**Status:** Planned
**Verification:** Unit tests for auth middleware and cookie configuration

### R-002: Webhook Signature Bypass (Score: 6)

**Mitigation Strategy:** Add unit tests for webhook handler: valid signature → 200 + DB update, invalid signature → 401 + no DB change, missing header → 401
**Owner:** Dev
**Status:** Planned
**Verification:** Unit tests for `/api/webhooks/polar/route.ts`

### R-003: Streak Timezone Edge Cases (Score: 6)

**Mitigation Strategy:** Add unit tests with `vi.useFakeTimers()` covering: midnight boundary crossings, DST transition days, different user timezones, freeze + timezone interaction
**Owner:** Dev
**Status:** Planned
**Verification:** Unit tests for streak credit/reset logic

### R-004: Presence Polling Performance (Score: 6)

**Mitigation Strategy:** Add response time assertions to presence endpoint tests, verify caching headers, test with large occupant lists
**Owner:** Dev
**Status:** Planned
**Verification:** Unit + integration tests for presence API

### R-005: Payment→Premium Race Condition (Score: 6)

**Mitigation Strategy:** Test webhook handler idempotency (duplicate webhook → no duplicate Payment record), test concurrent webhook delivery, verify atomic DB transaction for premium status update
**Owner:** Dev
**Status:** Planned
**Verification:** Unit tests for webhook handler with concurrent scenarios

### R-006: Admin Authorization (Score: 6)

**Mitigation Strategy:** Test every admin endpoint with: admin user → 200, regular user → 403, unauthenticated → 401. Verify middleware applies to all admin routes.
**Owner:** Dev
**Status:** Planned
**Verification:** Unit tests for admin middleware and route handlers

---

## Assumptions and Dependencies

### Assumptions

1. Vitest + React Testing Library remain the primary test framework
2. E2E tests (Playwright) are future work - this design focuses on unit/component/integration
3. Existing 116 test files are maintained and passing
4. Server Actions continue to use the `ActionResult<T>` discriminated union pattern

### Dependencies

1. Prisma schema stable for test data factories
2. Better Auth test configuration available for auth-related tests
3. Pusher test credentials or mock available for presence tests

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests (separate workflow; not auto-run).
- Run `*automate` for broader coverage once implementation stabilizes.
- Run `*framework` to set up Playwright when ready for E2E tests.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: _______ Date: _______
- [ ] Tech Lead: _______ Date: _______
- [ ] QA Lead: _______ Date: _______

---

## Appendix

### Knowledge Base References

- `risk-governance.md` - Risk classification framework
- `probability-impact.md` - Risk scoring methodology
- `test-levels-framework.md` - Test level selection
- `test-priorities-matrix.md` - P0-P3 prioritization

### Related Documents

- PRD: `_bmad-output/planning-artifacts/prd.md`
- Epics: `_bmad-output/planning-artifacts/epics.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`

---

**Generated by**: BMad Master (TEA workflow) - Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
