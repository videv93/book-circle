# Story 13.1: NestJS Project Setup with Prisma Integration

Status: ready-for-dev

## Story

As a developer,
I want a NestJS API project configured with the shared Prisma schema and PostgreSQL connection,
so that mobile clients have a backend foundation to build REST endpoints on.

## Acceptance Criteria

1. NestJS project initialized in a `mobile-api/` directory at the repository root
2. Prisma client configured to use the **same** `prisma/schema.prisma` from the web app root
3. NestJS connects to the same PostgreSQL database as the web app
4. Health check endpoint `GET /health` returns `{ status: "ok" }`
5. Environment configuration loads from `mobile-api/.env` with `DATABASE_URL`
6. Project builds and starts without errors (`npm run build && npm run start`)
7. Basic test infrastructure works (`npm test` passes)

## Tasks / Subtasks

- [ ] Task 1: Initialize NestJS project (AC: #1)
  - [ ] Run `npx @nestjs/cli new mobile-api --strict --skip-git --package-manager npm` in repo root
  - [ ] Configure TypeScript strict mode matching web app settings
  - [ ] Add `.env` and `.env.example` files
  - [ ] Update root `.gitignore` if needed for `mobile-api/node_modules`

- [ ] Task 2: Configure Prisma shared schema (AC: #2, #3)
  - [ ] Install `prisma` and `@prisma/client` in `mobile-api/`
  - [ ] Configure `prisma` in `mobile-api/package.json` to point to `../prisma/schema.prisma`:
    ```json
    "prisma": { "schema": "../prisma/schema.prisma" }
    ```
  - [ ] Add `npx prisma generate` to `postinstall` script
  - [ ] Create `mobile-api/src/prisma/prisma.module.ts` (global module)
  - [ ] Create `mobile-api/src/prisma/prisma.service.ts` extending PrismaClient with `onModuleInit`/`onModuleDestroy`

- [ ] Task 3: Health check endpoint (AC: #4)
  - [ ] Create `GET /health` in AppController returning `{ status: "ok", timestamp: ISO string }`

- [ ] Task 4: Environment and config (AC: #5)
  - [ ] Install `@nestjs/config`
  - [ ] Create `mobile-api/src/config/configuration.ts` with typed config
  - [ ] Load `DATABASE_URL`, `PORT`, `NODE_ENV` from environment
  - [ ] Register ConfigModule as global in AppModule

- [ ] Task 5: Verify build and tests (AC: #6, #7)
  - [ ] Run `npm run build` — no errors
  - [ ] Run `npm test` — default tests pass
  - [ ] Verify Prisma client generates correctly from shared schema

## Dev Notes

### Architecture Context

This is a **new NestJS project** living alongside the existing Next.js web app. Both share:
- **Same PostgreSQL database** (same `DATABASE_URL`)
- **Same Prisma schema** (`prisma/schema.prisma` at repo root)
- **Same data models** — no schema drift allowed

The NestJS API serves mobile clients (React Native) with JWT-based auth, while the web app continues using Better Auth with cookies.

### Project Structure

```
book-circle/                  # Repository root
├── prisma/schema.prisma      # SHARED — single source of truth
├── src/                      # Next.js web app (unchanged)
├── mobile-api/               # NEW — NestJS API for mobile
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── app.controller.ts
│   │   ├── main.ts
│   │   ├── config/
│   │   │   └── configuration.ts
│   │   └── prisma/
│   │       ├── prisma.module.ts
│   │       └── prisma.service.ts
│   ├── test/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   └── .env.example
└── package.json              # Web app package.json (unchanged)
```

### Critical Constraints

- **DO NOT** copy or duplicate `schema.prisma` — reference the root one
- **DO NOT** modify the existing web app code
- **DO NOT** add NestJS dependencies to the root `package.json`
- Use `@prisma/client` version matching the web app (`^7.3.0`)
- Use Node.js compatible with both Next.js 16 and NestJS

### Prisma Service Pattern

```typescript
// mobile-api/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Mobile Platform Strategy]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- [Source: prisma/schema.prisma — full shared schema]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
