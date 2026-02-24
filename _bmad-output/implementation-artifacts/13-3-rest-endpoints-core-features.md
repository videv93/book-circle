# Story 13.3: REST Endpoints for Core Features

Status: ready-for-dev

## Story

As a mobile app user,
I want REST API endpoints for books, sessions, streaks, kudos, social, and presence,
so that the React Native app can access all core features.

## Acceptance Criteria

1. **Books module:** `GET /books/search?q=`, `GET /books/:id`, `POST /books/library`, `PATCH /books/library/:id`, `DELETE /books/library/:id`, `GET /books/library`
2. **Sessions module:** `POST /sessions`, `PATCH /sessions/:id/end`, `GET /sessions?bookId=`, `GET /sessions/stats`
3. **Streaks module:** `GET /streaks/current`, `PATCH /streaks/goal`, `POST /streaks/freeze`, `GET /streaks/history`
4. **Kudos module:** `POST /kudos`, `DELETE /kudos/:id`, `GET /kudos/received`, `GET /kudos/given`
5. **Social module:** `POST /social/follow/:userId`, `DELETE /social/follow/:userId`, `GET /social/followers`, `GET /social/following`, `GET /social/feed`
6. **Users module:** `GET /users/me`, `PATCH /users/me`, `GET /users/:id`
7. **Presence module:** `POST /presence/join/:bookId`, `POST /presence/leave/:bookId`, `GET /presence/room/:bookId`
8. All endpoints require JWT auth (except book search which is optional)
9. Request validation using class-validator DTOs
10. Response format matches web app patterns: `{ success: true, data }` / `{ success: false, error }`
11. Pagination on list endpoints: `?page=1&limit=20` returning `{ data, meta: { page, limit, total } }`

## Tasks / Subtasks

- [ ] Task 1: Shared infrastructure (AC: #8, #9, #10, #11)
  - [ ] Create base response interceptor for `{ success, data/error }` format
  - [ ] Create pagination DTO and helper
  - [ ] Create validation pipe config (class-validator + class-transformer)
  - [ ] Create common exception filters

- [ ] Task 2: Books module (AC: #1)
  - [ ] `BooksModule`, `BooksController`, `BooksService`
  - [ ] `GET /books/search?q=&page=&limit=` — proxy to OpenLibrary/Google Books (same logic as web `src/services/books/`)
  - [ ] `GET /books/:id` — book details with author claim status
  - [ ] `POST /books/library` — add book to user library (body: `{ bookId, status }`)
  - [ ] `PATCH /books/library/:id` — update reading status
  - [ ] `DELETE /books/library/:id` — soft delete (set `deletedAt`)
  - [ ] `GET /books/library` — user's library with status filter

- [ ] Task 3: Sessions module (AC: #2)
  - [ ] `SessionsModule`, `SessionsController`, `SessionsService`
  - [ ] `POST /sessions` — start/log session (body: `{ bookId, duration, startedAt, endedAt }`)
  - [ ] `PATCH /sessions/:id/end` — end active session
  - [ ] `GET /sessions?bookId=` — session history for a book
  - [ ] `GET /sessions/stats` — total reading time, session count

- [ ] Task 4: Streaks module (AC: #3)
  - [ ] `StreaksModule`, `StreaksController`, `StreaksService`
  - [ ] `GET /streaks/current` — current streak, daily progress, goal
  - [ ] `PATCH /streaks/goal` — set daily goal (body: `{ dailyGoalMinutes }`)
  - [ ] `POST /streaks/freeze` — use streak freeze
  - [ ] `GET /streaks/history` — daily progress history with pagination
  - [ ] Reuse streak calculation logic from web (same timezone handling)

- [ ] Task 5: Kudos module (AC: #4)
  - [ ] `KudosModule`, `KudosController`, `KudosService`
  - [ ] `POST /kudos` — give kudos (body: `{ sessionId }`)
  - [ ] `DELETE /kudos/:id` — remove kudos
  - [ ] `GET /kudos/received` — kudos received with pagination
  - [ ] `GET /kudos/given` — kudos given with pagination

- [ ] Task 6: Social module (AC: #5)
  - [ ] `SocialModule`, `SocialController`, `SocialService`
  - [ ] `POST /social/follow/:userId` — follow user
  - [ ] `DELETE /social/follow/:userId` — unfollow user
  - [ ] `GET /social/followers?page=&limit=` — follower list
  - [ ] `GET /social/following?page=&limit=` — following list
  - [ ] `GET /social/feed?page=&limit=` — activity feed (sessions, finished books, milestones)

- [ ] Task 7: Users module (AC: #6)
  - [ ] `UsersModule`, `UsersController`, `UsersService`
  - [ ] `GET /users/me` — current user profile
  - [ ] `PATCH /users/me` — update profile (body: `{ name, bio, favoriteGenres, showReadingActivity, dailyGoalMinutes }`)
  - [ ] `GET /users/:id` — public profile (respects `showReadingActivity`)

- [ ] Task 8: Presence module (AC: #7)
  - [ ] `PresenceModule`, `PresenceController`, `PresenceService`
  - [ ] `POST /presence/join/:bookId` — join reading room
  - [ ] `POST /presence/leave/:bookId` — leave reading room
  - [ ] `GET /presence/room/:bookId` — current room occupants with author flag

- [ ] Task 9: Tests (AC: all)
  - [ ] Unit tests for each service
  - [ ] E2E tests for critical flows: add book → start session → give kudos

## Dev Notes

### Business Logic Replication

The web app implements business logic in Server Actions (`src/actions/`). The NestJS services must replicate this logic exactly. Key files to reference:

| Web Action | NestJS Service | Critical Logic |
|-----------|---------------|----------------|
| `src/actions/books/` | `BooksService` | Library CRUD, soft delete with `deletedAt` |
| `src/actions/sessions/` | `SessionsService` | Duration validation, streak trigger |
| `src/actions/streaks/` | `StreaksService` | Timezone-aware daily reset, freeze mechanics |
| `src/actions/kudos/` | `KudosService` | One kudos per user per session constraint |
| `src/actions/social/` | `SocialService` | Follow/unfollow, self-follow prevention |
| `src/actions/profile/` | `UsersService` | Profile update validation |

### Database Constraints to Honor

- `UserBook`: `@@unique([userId, bookId])` — no duplicate library entries
- `Kudos`: `@@unique([giverId, sessionId])` — one kudos per session per user
- `Follow`: `@@unique([followerId, followingId])` — no duplicate follows
- `RoomPresence`: application-level uniqueness check for active presences (leftAt IS NULL)
- `UserBook.deletedAt` — soft delete pattern, filter `WHERE deletedAt IS NULL`

### Module Structure

```
mobile-api/src/
├── auth/          # Story 13.2
├── books/
│   ├── books.module.ts
│   ├── books.controller.ts
│   ├── books.service.ts
│   └── dto/
│       ├── search-books.dto.ts
│       ├── add-to-library.dto.ts
│       └── update-library.dto.ts
├── sessions/
├── streaks/
├── kudos/
├── social/
├── users/
├── presence/
├── common/
│   ├── interceptors/response.interceptor.ts
│   ├── filters/http-exception.filter.ts
│   ├── dto/pagination.dto.ts
│   └── guards/jwt-auth.guard.ts
├── prisma/        # Story 13.1
└── config/        # Story 13.1
```

### Activity Feed Query

The activity feed (`GET /social/feed`) aggregates from followed users:
- Reading sessions (with book info)
- Finished books (UserBook status change to FINISHED)
- Streak milestones (7, 30, 100 day streaks)

Order by `createdAt DESC` with cursor-based or offset pagination.

### References

- [Source: src/actions/ — all Server Action files for business logic]
- [Source: prisma/schema.prisma — all models and constraints]
- [Source: _bmad-output/planning-artifacts/prd.md#Functional Requirements — FR1-FR33]
- [Source: _bmad-output/planning-artifacts/architecture.md#API Patterns]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
