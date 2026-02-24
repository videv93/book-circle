# Story 13.4: Pusher Integration for Real-time Events

Status: ready-for-dev

## Story

As a mobile app user,
I want real-time notifications for kudos, author joins, and presence updates,
so that the mobile experience feels live and responsive.

## Acceptance Criteria

1. NestJS integrates with the **same** Pusher app as the web app (same credentials)
2. `POST /pusher/auth` endpoint authenticates mobile clients for private/presence channels
3. Server-side Pusher triggers work for: kudos received, author joined room, new notification
4. Mobile clients can subscribe to presence channels for reading rooms
5. Event names and payloads match the web app exactly (no protocol divergence)
6. Pusher auth validates JWT token (not cookies)

## Tasks / Subtasks

- [ ] Task 1: Pusher server module (AC: #1)
  - [ ] Install `pusher` (server SDK) in `mobile-api/`
  - [ ] Create `PusherModule` and `PusherService` wrapping the Pusher server client
  - [ ] Configure from env: `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`
  - [ ] Use same Pusher app credentials as web app

- [ ] Task 2: Pusher auth endpoint (AC: #2, #6)
  - [ ] `POST /pusher/auth` — authenticates channel subscriptions
  - [ ] Extract user from JWT (not cookie)
  - [ ] For private channels (`private-user-{userId}`): verify userId matches JWT
  - [ ] For presence channels (`presence-room-{bookId}`): return user_info `{ userId, displayName, avatarUrl, isAuthor }`
  - [ ] Return Pusher auth signature

- [ ] Task 3: Server-side event triggers (AC: #3, #5)
  - [ ] Inject PusherService into KudosService — trigger `kudos:received` on `private-user-{receiverId}`
  - [ ] Inject PusherService into PresenceService — trigger `room:author-joined` on `presence-room-{bookId}`
  - [ ] Inject PusherService into a NotificationService — trigger `notification:new` on `private-user-{userId}`

- [ ] Task 4: Event contract compliance (AC: #5)
  - [ ] Match exact event names from web app:
    - `room:user-joined` on `presence-room-{bookId}`
    - `room:user-left` on `presence-room-{bookId}`
    - `room:author-joined` on `presence-room-{bookId}`
    - `kudos:received` on `private-user-{userId}`
    - `notification:new` on `private-user-{userId}`
  - [ ] Match exact payload shapes (see Dev Notes)

- [ ] Task 5: Tests (AC: all)
  - [ ] Unit test PusherService trigger methods
  - [ ] Unit test auth endpoint with mocked JWT
  - [ ] Integration test: kudos creation triggers Pusher event

## Dev Notes

### Event Contracts (Must Match Web)

From architecture doc:

| Event | Channel | Payload |
|-------|---------|---------|
| `room:user-joined` | `presence-room-{bookId}` | `{ userId, displayName, avatarUrl }` |
| `room:user-left` | `presence-room-{bookId}` | `{ userId }` |
| `room:author-joined` | `presence-room-{bookId}` | `{ authorId, authorName }` |
| `kudos:received` | `private-user-{userId}` | `{ fromUser, sessionId, bookTitle }` |
| `notification:new` | `private-user-{userId}` | `{ type, message, data }` |

### Pusher Auth for Mobile vs Web

Web app authenticates Pusher via cookies (Better Auth session). Mobile needs JWT-based auth:

```typescript
// mobile-api/src/pusher/pusher.controller.ts
@Post('auth')
@UseGuards(JwtAuthGuard)
async authenticate(
  @Req() req,
  @Body('socket_id') socketId: string,
  @Body('channel_name') channelName: string,
) {
  // Validate user has access to this channel
  // For private-user-{id}: req.user.id must match {id}
  // For presence-room-{bookId}: any authenticated user
  return this.pusherService.authorizeChannel(socketId, channelName, req.user);
}
```

### Same Pusher App

Both web and mobile use the same Pusher app. Events triggered by either backend are received by all subscribed clients regardless of platform. This is correct — a web user giving kudos should notify the mobile user and vice versa.

### Environment Variables

```
PUSHER_APP_ID=     # Same as web app
PUSHER_KEY=        # Same as web app
PUSHER_SECRET=     # Same as web app
PUSHER_CLUSTER=    # Same as web app
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Communication Patterns — Pusher Event Naming]
- [Source: src/services/pusher/ — web Pusher client/server setup]
- [Source: src/app/api/pusher/ — web Pusher auth and webhook routes]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
