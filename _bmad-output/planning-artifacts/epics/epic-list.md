# Epic List

## Epic 1: Project Foundation & User Authentication
Users can sign up, log in, and manage their profile. Includes project initialization with starter template.

**FRs covered:** FR1, FR2
**Additional:** ARCH1-10 (project setup), UX1-2 (design system)
**NFRs:** NFR7-9 (Auth/Security), NFR21-27 (Accessibility foundation)

## Epic 2: Book Library & Discovery
Users can search for books, add them to their library, and manage their reading list.

**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12
**Note:** Display presence counts on books (social proof) even before rooms joinable

## Epic 3: Reading Sessions & Habit Tracking
Users can log reading sessions, set daily goals, and build reading streaks.

**FRs covered:** FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR22
**Additional:** ARCH5-6 (Zustand stores, IndexedDB persistence), UX components (StreakRing, SessionTimer)
**NFRs:** NFR30 (Streak data integrity)
**Note:** May split into 3A (Sessions) + 3B (Streaks) during story creation

## Epic 4: Social Connections & Activity Feed
Users can follow other readers, see their activity, and give kudos for encouragement.

**FRs covered:** FR3, FR4, FR5, FR23, FR24, FR25, FR26, FR27
**Additional:** ARCH4 (Pusher for notifications), UX components (KudosButton, ActivityFeedItem)
**Note:** Kudos interaction must feel delightful from day one

## Epic 5: Reading Rooms & Author Presence
Users can join reading rooms to feel ambient presence of other readers, and experience the magic of author presence.

**FRs covered:** FR6, FR28, FR29, FR30, FR31, FR32, FR33
**Additional:** ARCH4 (Pusher presence), UX components (PresenceAvatarStack, ReadingRoomPanel, AuthorShimmerBadge)
**NFRs:** NFR3-4 (Presence timing), NFR33-34 (Graceful degradation)
**Note:** Include spike story to validate Pusher presence early

## Epic 6: Administration & Platform Health
Admins can moderate content, manage users, verify authors, and monitor platform health.

**FRs covered:** FR34, FR35, FR36, FR37, FR38, FR39
**Note:** Can run in parallel with Epics 3-5 if bandwidth allows

---

## Post-MVP: Mobile Platform

## Epic 13: NestJS API Backend
Build a REST API backend using NestJS that exposes the same business logic as the web app's Server Actions, authenticated via JWT tokens.

**Covers:** All existing FRs (FR1-FR39) as REST endpoints
**Dependencies:** Shared Prisma schema, same PostgreSQL database
**Key stories:**
- NestJS project setup with Prisma integration
- JWT authentication (register, login, refresh, logout) against existing User table
- REST endpoints for books, sessions, streaks, kudos, social, presence
- Pusher integration for real-time events
- API documentation (OpenAPI/Swagger)

## Epic 14: React Native Mobile App
Build native iOS and Android app using React Native, consuming the NestJS API.

**Covers:** FR1-FR33 (reader + author features, no admin)
**Dependencies:** Epic 13 (NestJS API)
**Key stories:**
- React Native project setup (Expo or bare workflow)
- Navigation structure (tab-based, matching web app)
- Auth screens (Google/Apple native OAuth → JWT)
- Book library and search screens
- Session timer with native background support
- Streak system UI
- Activity feed and kudos
- Reading room presence (Pusher native SDK)
- Native push notifications (APNs + FCM)
- App Store and Play Store submission

## Epic 15: Mobile-Web Feature Parity & Polish
Ensure consistent experience across platforms and handle platform-specific concerns.

**Covers:** Cross-platform testing, platform-specific UX polish
**Key stories:**
- Cross-platform data consistency validation
- Platform-specific UX adjustments (iOS vs Android conventions)
- Performance optimization for mobile
- Offline support for mobile (native storage)
- Deep linking between web and mobile

---
