# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Flappy Bird is a social reading application built with Next.js 16 App Router, TypeScript, and Tailwind CSS. It enables users to track reading habits and connect with fellow readers through OAuth authentication (Google/Apple).

## Development Commands

```bash
# Install dependencies
npm install

# Generate Prisma client (required after schema changes)
npx prisma generate

# Push database schema to development DB
npx prisma db push

# Run development server with Turbopack
npm run dev

# Build for production
npm run build

# Run tests
npm test              # Watch mode
npm run test:run      # Single run
npm run test -- ProfileForm  # Test specific component

# Code quality
npm run lint          # ESLint
npm run typecheck     # TypeScript type checking
npm run format        # Format with Prettier
npm run format:check  # Check formatting
```

## Import Convention

**ALWAYS use the `@/` alias for cross-boundary imports:**

```typescript
// ✅ Correct - use alias for imports
import { Button } from '@/components/ui/button';
import { updateProfile } from '@/actions/profile/updateProfile';
import { useSession } from '@/hooks/useSession';

// ❌ Incorrect - avoid relative imports
import { Button } from '../../../components/ui/button';
```

The `@/` alias maps to `./src/` in tsconfig.json.

## High-Level Architecture

### Authentication Flow (Better Auth)

The app uses Better Auth with OAuth providers. Key files:
- `/src/lib/auth.ts` - Server configuration with Prisma adapter
- `/src/lib/auth-client.ts` - Client methods (signIn, signOut, useSession)
- `/src/middleware.ts` - Route protection via session token checking

Authentication flow:
1. User signs in via OAuth at `/login`
2. Better Auth creates User, Session, and Account records
3. Session token stored in `better-auth.session_token` cookie
4. Middleware validates token on protected routes (`/home`, `/profile`, etc.)
5. `useSession` hook provides auth state to components

### Database Layer (Prisma + PostgreSQL)

Database interaction happens through Prisma ORM with PostgreSQL. The app uses connection pooling via the pg package for better performance.

Key models in `/prisma/schema.prisma`:
- `User` - Profile data with OAuth accounts
- `Session` - Auth sessions with expiry
- `Account` - OAuth provider connections

When modifying the schema:
1. Update `schema.prisma`
2. Run `npx prisma generate` to regenerate client
3. Run `npx prisma db push` for development (or create migration for production)

### Server Actions Pattern

Server Actions in `/src/actions/` follow this pattern:

```typescript
'use server';

export async function actionName(input: Input): Promise<ActionResult<Output>> {
  // 1. Validate with Zod
  const validated = schema.parse(input);

  // 2. Check authentication
  const { user } = await auth.api.getSession();
  if (!user) return { success: false, error: 'Unauthorized' };

  // 3. Perform database operation
  const result = await prisma.model.update({...});

  // 4. Return discriminated union
  return { success: true, data: result };
}
```

### Component Architecture

The app uses a clear component hierarchy:

```
/components
  /ui         - Radix UI primitives with CVA styling
  /features   - Domain-specific components
    /auth     - OAuthButtons
    /profile  - ProfileView, ProfileForm, ProfileHeader
  /layout     - AppShell, SideNav, BottomNav, PageHeader
```

Key patterns:
- AppShell manages responsive navigation and page transitions
- Feature components handle their own loading/error states
- Forms use react-hook-form + Zod validation
- Optimistic UI updates with error recovery

### State Management

Currently uses:
- React Context for authentication state (`AuthProvider`)
- Local component state for UI (useState)
- Zustand installed but not yet implemented (ready for expansion)

### Testing Strategy

Tests use Vitest + Testing Library. Run with `npm test`.

Test patterns:
- Component tests verify rendering, user interactions, validation
- Integration tests check navigation flow and responsive behavior
- Mock external dependencies (auth, server actions)
- Accessibility testing (aria attributes, touch targets)

Example test file locations:
- `/src/components/features/profile/ProfileForm.test.tsx`
- `/src/components/layout/integration.test.tsx`

### Route Protection

Middleware in `/src/middleware.ts` handles:
- Public routes: `/`, `/login`, `/api/auth/*`
- Protected routes require `better-auth.session_token` cookie
- Redirects to `/login?callbackUrl=<original>` when unauthenticated

### Environment Variables

Required in `.env.local`:
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Min 32 chars (generate with `openssl rand -base64 32`)
- `BETTER_AUTH_URL` - App URL (http://localhost:3000 for dev)
- `NEXT_PUBLIC_BETTER_AUTH_URL` - Same as BETTER_AUTH_URL
- OAuth credentials for Google and Apple

## Code Style Guidelines

### TypeScript
- Strict mode enabled
- Use discriminated unions for error handling
- Extract types from Zod schemas when possible
- Prefer type inference over explicit typing

### Component Patterns
- Server Components by default, Client Components when needed
- Co-locate component files with their tests
- Use CVA for variant-based styling
- Implement loading and error states

### Validation
- Zod schemas define validation rules
- Reuse schemas between client and server
- Parse at boundaries (forms, server actions)

### Accessibility
- Minimum 44px touch targets
- Proper ARIA attributes
- Keyboard navigation support
- Respect prefers-reduced-motion

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/login       # OAuth login page
│   ├── (main)/            # Protected app routes
│   └── api/auth/          # Better Auth endpoints
├── actions/               # Server Actions
├── components/
│   ├── ui/               # Shadcn/Radix components
│   ├── features/         # Domain components
│   └── layout/           # Layout components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and config
│   ├── auth.ts          # Auth server config
│   ├── auth-client.ts   # Auth client
│   ├── prisma.ts        # Prisma client
│   └── utils.ts         # Helper functions
├── stores/              # Zustand stores (future)
└── types/               # TypeScript types
```