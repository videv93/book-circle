# Sprint Change Proposal — Native Mobile Platform Support

**Date:** 2026-02-24
**Author:** vitr
**Status:** Pending Approval

---

## Section 1: Issue Summary

**Problem Statement:** The current product is architected as a web-only Next.js application. A strategic decision has been made to expand platform support to native iOS and Android mobile apps to reach mobile users with native push notifications, app store presence, and platform-native UX.

**Context:** This is a strategic direction exploration, not triggered by a specific implementation blocker or failed approach. The web MVP remains unchanged and on track.

**Approach:** Build a separate NestJS REST API backend (JWT-based auth) and React Native app alongside the existing Next.js web app, rather than modifying the current web architecture.

---

## Section 2: Impact Analysis

### Epic Impact

| Epic | Impact Level | Detail |
|------|-------------|--------|
| Epic 1 (Foundation & Auth) | LOW | Web auth unchanged. Mobile uses separate JWT auth against same User table |
| Epic 2 (Book Library) | LOW | Web unchanged. Mobile gets equivalent via NestJS API |
| Epic 3 (Sessions & Streaks) | LOW | Web unchanged. Mobile needs native timer/storage strategy |
| Epic 4 (Social & Feed) | LOW | Web unchanged. Mobile uses Pusher native SDK + FCM/APNs |
| Epic 5 (Reading Rooms) | LOW | Web unchanged. Mobile uses Pusher native SDK |
| Epic 6 (Admin) | NONE | Stays web-only |

**Key finding:** Because mobile is post-MVP with a separate backend, current epics are minimally impacted. No existing stories need modification.

### Artifact Conflicts

| Artifact | Impact | Changes Needed |
|----------|--------|----------------|
| PRD | MEDIUM | Update roadmap, technical stack, resource requirements, project type |
| Architecture | MEDIUM | Add mobile strategy section, update risk table |
| Epic List | MEDIUM | Add 3 new post-MVP epics (7, 8, 9) |
| UX Design | LOW (deferred) | Native mobile UX spec needed when Phase 2 begins |

### Technical Impact

- **Shared database:** Two backends (Next.js + NestJS) sharing PostgreSQL requires connection pooling awareness and migration ownership rules
- **Dual auth:** Better Auth (web cookies) + JWT (mobile) against same user table
- **Real-time:** Pusher channels shared across web and native clients
- **No code changes needed now** — all impacts are documentation and planning

---

## Section 3: Recommended Approach

**Selected Path:** Direct Adjustment — Add mobile as post-MVP phase

**Rationale:**
- Mobile is post-MVP, so zero disruption to current sprint
- Web MVP ships first on existing timeline (6-8 weeks)
- Document the direction now so architectural decisions are mobile-aware
- Separate NestJS API avoids retrofitting Server Actions
- React Native provides true native experience for iOS + Android

**Effort:** Low (documentation now), High (implementation in Phase 2: 8-12 weeks)
**Risk:** Low for current sprint, Medium for Phase 2 (new stack, dual backends, app store process)
**Timeline Impact:** None on MVP. Phase 2 adds 8-12 weeks for mobile.

---

## Section 4: Detailed Change Proposals

### 4.1 PRD Changes

**4.1.1 — Project-Type Overview**

Update architecture description:
- OLD: `Architecture: Next.js monolith with managed services`
- NEW: `Architecture: Next.js monolith (web) + NestJS API + React Native (mobile, post-MVP)`

**4.1.2 — Technical Stack Table**

Expand to include post-MVP mobile components:
- React Native (mobile framework)
- NestJS (mobile API)
- Railway/Fly.io (mobile API hosting)
- Labels clearly indicate post-MVP items

**4.1.3 — Post-MVP Roadmap**

Restructure Phase 2 as "Native Mobile & Growth":
- NestJS API backend with JWT auth
- React Native app for iOS and Android
- Native push notifications (APNs + FCM)
- Replace "Mobile PWA optimization" with native strategy

**4.1.4 — Resource Requirements**

Add Phase 2 resource estimates:
- 1 backend developer (NestJS/Node.js)
- 1-2 React Native developers
- 1 designer (mobile UX patterns)
- Estimated 8-12 weeks after MVP

### 4.2 Architecture Changes

**4.2.1 — Mobile Platform Strategy Section (new)**

New section documenting:
- Technology choices (React Native, NestJS, JWT)
- Shared database strategy (single PostgreSQL, Prisma schema ownership)
- Auth strategy (Better Auth for web, JWT for mobile, shared User table)
- Design principle: build web MVP clean, replicate as REST endpoints later

**4.2.2 — Risk Table Update**

Add two new post-MVP risks:
- Shared database: connection pool limits, migration ownership, schema drift
- Dual auth systems: session consistency, token invalidation

### 4.3 Epic List Changes

**4.3.1 — Three New Post-MVP Epics**

- **Epic 7: NestJS API Backend** — REST API exposing all FRs as endpoints, JWT auth, Prisma, Pusher integration, Swagger docs
- **Epic 8: React Native Mobile App** — iOS + Android app consuming NestJS API, native navigation, auth, all reader/author features, push notifications, app store submission
- **Epic 9: Mobile-Web Feature Parity & Polish** — Cross-platform consistency, platform-specific UX, performance, offline support, deep linking

Dependency chain: Epic 7 → Epic 8 → Epic 9

---

## Section 5: Implementation Handoff

### Change Scope: Minor

This is a **documentation-only change** for now. No code changes, no sprint disruption, no backlog reorganization needed.

### Handoff Plan

| Recipient | Responsibility | When |
|-----------|---------------|------|
| **Dev team (now)** | Continue current MVP sprint unchanged. Be aware that Server Action business logic will eventually be replicated as REST endpoints — keep logic clean and extractable | Immediate |
| **PM/Architect (now)** | Apply approved document changes to PRD, Architecture, and Epic List | This sprint |
| **PM (Phase 2 planning)** | Create detailed stories for Epics 7-9 when approaching Phase 2 | Post-MVP |
| **UX Designer (Phase 2)** | Create native mobile UX specification | Post-MVP |

### Success Criteria

- [ ] PRD updated with mobile strategy, revised roadmap, and resource estimates
- [ ] Architecture doc includes mobile strategy section and updated risk table
- [ ] Epic list includes Epics 7, 8, 9
- [ ] Current MVP sprint continues uninterrupted
- [ ] Dev team aware of "keep business logic extractable" principle
