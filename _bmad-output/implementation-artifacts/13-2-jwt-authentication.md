# Story 13.2: JWT Authentication

Status: ready-for-dev

## Story

As a mobile app user,
I want to register, login, refresh tokens, and logout via JWT-based auth,
so that I can securely access the API from iOS and Android apps.

## Acceptance Criteria

1. `POST /auth/register` creates a new user with email+password, returns access + refresh tokens
2. `POST /auth/login` authenticates with email+password, returns access + refresh tokens
3. `POST /auth/refresh` accepts a refresh token and returns new access + refresh tokens
4. `POST /auth/logout` invalidates the refresh token
5. `POST /auth/google` accepts Google OAuth token and returns JWT tokens (social login)
6. `POST /auth/apple` accepts Apple identity token and returns JWT tokens (social login)
7. Access tokens expire in 15 minutes, refresh tokens expire in 7 days
8. Protected endpoints return 401 when token is missing or expired
9. Auth operates against the **existing** `users`, `accounts`, and `sessions` tables
10. New mobile users appear in the same `users` table as web users — same user can log in from both

## Tasks / Subtasks

- [ ] Task 1: Auth module setup (AC: #8, #9)
  - [ ] Install `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`
  - [ ] Install `@types/passport-jwt`, `@types/bcrypt` as dev deps
  - [ ] Create `mobile-api/src/auth/auth.module.ts`
  - [ ] Create `mobile-api/src/auth/auth.service.ts`
  - [ ] Create `mobile-api/src/auth/auth.controller.ts`
  - [ ] Create JWT strategy (`mobile-api/src/auth/strategies/jwt.strategy.ts`)
  - [ ] Create `JwtAuthGuard` (`mobile-api/src/auth/guards/jwt-auth.guard.ts`)

- [ ] Task 2: Registration endpoint (AC: #1, #9, #10)
  - [ ] `POST /auth/register` with body: `{ email, password, name? }`
  - [ ] Validate with class-validator: email format, password min 8 chars
  - [ ] Hash password with bcrypt (12 rounds)
  - [ ] Create `User` record in existing `users` table
  - [ ] Create `Account` record with `providerId: "credential"`, store hashed password
  - [ ] Return `{ accessToken, refreshToken, user: { id, email, name } }`
  - [ ] Return 409 if email already exists

- [ ] Task 3: Login endpoint (AC: #2)
  - [ ] `POST /auth/login` with body: `{ email, password }`
  - [ ] Find user by email, verify password against `Account` with `providerId: "credential"`
  - [ ] Return 401 with generic message on failure ("Invalid credentials")
  - [ ] Return tokens and user on success

- [ ] Task 4: Token refresh (AC: #3, #7)
  - [ ] `POST /auth/refresh` with body: `{ refreshToken }`
  - [ ] Validate refresh token, check not expired (7 day TTL)
  - [ ] Issue new access token (15 min) + new refresh token (rotation)
  - [ ] Invalidate old refresh token
  - [ ] Store refresh tokens in `sessions` table (reuse existing model)

- [ ] Task 5: Logout (AC: #4)
  - [ ] `POST /auth/logout` — requires valid access token
  - [ ] Delete the session/refresh token from database

- [ ] Task 6: Google OAuth mobile flow (AC: #5)
  - [ ] `POST /auth/google` with body: `{ idToken }`
  - [ ] Verify Google ID token using Google API
  - [ ] Find or create user+account (`providerId: "google"`)
  - [ ] Return JWT tokens

- [ ] Task 7: Apple OAuth mobile flow (AC: #6)
  - [ ] `POST /auth/apple` with body: `{ identityToken, authorizationCode? }`
  - [ ] Verify Apple identity token
  - [ ] Find or create user+account (`providerId: "apple"`)
  - [ ] Return JWT tokens

- [ ] Task 8: Tests (AC: all)
  - [ ] Unit tests for AuthService (register, login, token generation/validation)
  - [ ] E2E tests for auth endpoints (register → login → refresh → logout flow)

## Dev Notes

### Coexistence with Better Auth (Web)

The web app uses **Better Auth** with cookie-based sessions. This NestJS auth is separate but shares the same database tables:

- `users` — shared user records. A user who signs up on mobile appears on web and vice versa
- `accounts` — Better Auth stores OAuth accounts here. NestJS adds `providerId: "credential"` for email/password
- `sessions` — Better Auth uses this for web sessions. NestJS can store refresh tokens here OR use a separate mechanism

**Critical:** The `Account` model has a `password` field already (`password String?`). Better Auth uses this for email/password auth on web (Story 8126e58 added email/password to web). Reuse the same field and bcrypt format.

### Existing Account Schema

```prisma
model Account {
  id                    String    @id @default(cuid())
  accountId             String    @map("account_id")
  providerId            String    @map("provider_id")
  userId                String    @map("user_id")
  accessToken           String?   @map("access_token")
  refreshToken          String?   @map("refresh_token")
  password              String?   // ← Use this for credential auth
  ...
}
```

### Token Strategy

- **Access token:** JWT signed with `JWT_SECRET`, 15 min expiry, payload: `{ sub: userId, email, role }`
- **Refresh token:** Opaque token stored in `sessions` table, 7 day expiry, rotated on use
- **Environment vars needed:** `JWT_SECRET`, `JWT_EXPIRY=15m`, `REFRESH_EXPIRY=7d`, `GOOGLE_CLIENT_ID`, `APPLE_CLIENT_ID`

### Response Format

Follow the web app's pattern:
```typescript
// Success
{ success: true, data: { accessToken, refreshToken, user } }

// Error
{ success: false, error: { code: "UNAUTHORIZED", message: "Invalid credentials" } }
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Mobile Platform Strategy — Auth Strategy]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- [Source: prisma/schema.prisma — User, Account, Session models]
- [Source: src/lib/auth.ts — Better Auth config for compatibility reference]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
