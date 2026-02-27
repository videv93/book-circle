---
title: 'Email/Password Authentication'
slug: 'email-password-auth'
created: '2026-02-17'
status: 'implementation-complete'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['better-auth', 'prisma', 'next.js-app-router', 'react-hook-form', 'zod', 'radix-ui', 'tailwind-css']
files_to_modify: ['src/lib/auth.ts', 'src/lib/auth-client.ts', 'src/app/(auth)/login/page.tsx', 'src/components/features/auth/EmailPasswordForm.tsx', 'src/components/features/auth/index.ts']
code_patterns: ['useForm+zodResolver+onBlur-validation', 'aria-invalid+aria-describedby-errors', 'client-component-with-use-client', '@/-import-alias', 'discriminated-union-results']
test_patterns: ['vitest+testing-library', 'vi.mock-auth-client', 'waitFor-async', 'aria-role-assertions']
---

# Tech-Spec: Email/Password Authentication

**Created:** 2026-02-17

## Overview

### Problem Statement

The login page only supports OAuth (Google/Apple). Users who don't want to use social login have no way to sign up or log in to the application.

### Solution

Add Better Auth's built-in `emailAndPassword` option to enable email + password signup and login alongside existing OAuth providers. A new form component will be added above the existing OAuth buttons with a divider.

### Scope

**In Scope:**
- Enable `emailAndPassword` in Better Auth server config (`auth.ts`)
- Client gets `signIn.email()` and `signUp.email()` methods automatically
- New `EmailPasswordForm` component with email + password fields, 8+ char validation
- Form sits above OAuth buttons with an "— or —" divider
- Toggle between Sign In / Sign Up mode within the form
- Zod validation on client side
- Error handling (duplicate email, wrong password, etc.)

**Out of Scope:**
- Email verification
- Forgot password / password reset
- Username-based login (using email)
- Any changes to middleware or route protection (session handling stays the same)

## Context for Development

### Codebase Patterns

- Server config in `src/lib/auth.ts` using `betterAuth()` with Prisma adapter
- Client in `src/lib/auth-client.ts` using `createAuthClient()` — exports `signIn`, `signOut`, `useSession`
- Login page at `src/app/(auth)/login/page.tsx` — client component with Suspense wrapper
- OAuth buttons in `src/components/features/auth/OAuthButtons.tsx` — standalone component
- Components use Shadcn UI (`Button`, `Input`, `Label` from `@/components/ui/`)
- Forms use `useForm` with `zodResolver`, `mode: 'onBlur'`, error display via `aria-invalid` + `aria-describedby`
- `@/` import alias convention (maps to `./src/`)
- Tests use vitest + @testing-library/react, mock auth-client with `vi.mock()`

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/lib/auth.ts` | Better Auth server config — add emailAndPassword |
| `src/lib/auth-client.ts` | Auth client — signIn.email / signUp.email available automatically |
| `src/app/(auth)/login/page.tsx` | Login page — integrate new form above OAuth |
| `src/components/features/auth/OAuthButtons.tsx` | Existing OAuth buttons — unchanged |
| `src/components/features/auth/types.ts` | Auth types |
| `src/components/features/auth/index.ts` | Auth barrel export — add new component export |

### Technical Decisions

- Use Better Auth's built-in `emailAndPassword` config (not a separate plugin import)
- No email verification (`requireEmailVerification: false`)
- Password minimum 8 characters, validated with Zod on client
- Form toggles between sign-in and sign-up mode (single component, not separate pages)
- `signUp.email()` accepts `name` field — set to empty string (profile is edited separately)
- On successful auth, redirect using `callbackUrl` (same pattern as OAuth)

## Implementation Plan

### Tasks

- [ ] Task 1: Enable emailAndPassword in Better Auth server config
  - File: `src/lib/auth.ts`
  - Action: Add `emailAndPassword: { enabled: true, requireEmailVerification: false }` to the `betterAuth()` config object
  - Notes: This is a top-level config option in Better Auth, not a plugin. The client automatically gains `signIn.email()` and `signUp.email()` methods.

- [ ] Task 2: Run Prisma db push to sync any schema changes
  - Action: Run `npx prisma generate && npx prisma db push`
  - Notes: Better Auth may need to ensure the User model has a `password` field (hashed). Check if Better Auth handles this via its adapter or if schema needs an update.

- [ ] Task 3: Create EmailPasswordForm component
  - File: `src/components/features/auth/EmailPasswordForm.tsx` (new file)
  - Action: Create a client component with:
    - `'use client'` directive
    - `mode` state toggling between `'signin'` and `'signup'`
    - Zod schema: `email` (valid email) + `password` (min 8 chars) + `name` (required for signup only)
    - `useForm` with `zodResolver`, `mode: 'onBlur'`
    - On submit: call `signIn.email({ email, password, callbackURL })` or `signUp.email({ email, password, name, callbackURL })`
    - Loading spinner on submit button
    - Error display for server errors (duplicate email, invalid credentials) via `role="alert"`
    - Toggle link: "Don't have an account? Sign up" / "Already have an account? Sign in"
    - Min 44px touch targets on buttons
    - Use `Input`, `Label`, `Button` from `@/components/ui/`
  - Notes: Follow exact patterns from `ProfileForm.tsx` — `aria-invalid`, `aria-describedby` for field errors

- [ ] Task 4: Export EmailPasswordForm from barrel
  - File: `src/components/features/auth/index.ts`
  - Action: Add `export { EmailPasswordForm } from './EmailPasswordForm';`

- [ ] Task 5: Integrate form into login page
  - File: `src/app/(auth)/login/page.tsx`
  - Action: In `LoginContent`, add `<EmailPasswordForm callbackUrl={callbackUrl} />` above `<OAuthButtons>`, with a divider between them:
    ```tsx
    <EmailPasswordForm callbackUrl={callbackUrl} />

    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground">or</span>
      </div>
    </div>

    <OAuthButtons callbackUrl={callbackUrl} />
    ```

- [ ] Task 6: Create tests for EmailPasswordForm
  - File: `src/components/features/auth/EmailPasswordForm.test.tsx` (new file)
  - Action: Write tests covering:
    - Renders sign-in form by default (email + password fields, submit button)
    - Toggles to sign-up mode (shows name field)
    - Validates email format on blur
    - Validates password min length on blur
    - Calls `signIn.email()` on sign-in submit
    - Calls `signUp.email()` on sign-up submit
    - Shows loading state during submission
    - Displays server error messages
    - Submit button disabled while loading
  - Notes: Mock `@/lib/auth-client` with `vi.mock()`. Use `waitFor` for async assertions.

### Acceptance Criteria

- [ ] AC 1: Given a user on the login page, when the page loads, then an email/password form is displayed above the OAuth buttons with an "or" divider
- [ ] AC 2: Given a user in sign-in mode, when they enter a valid email and password (8+ chars) and submit, then `signIn.email()` is called and they are redirected to the callback URL
- [ ] AC 3: Given a user in sign-in mode, when they click "Don't have an account? Sign up", then the form switches to sign-up mode showing a name field
- [ ] AC 4: Given a user in sign-up mode, when they enter name, email, and password (8+ chars) and submit, then `signUp.email()` is called and they are redirected to the callback URL
- [ ] AC 5: Given a user submitting invalid data, when email is malformed or password is under 8 chars, then inline validation errors appear on blur without submitting
- [ ] AC 6: Given a duplicate email on sign-up, when the server returns an error, then an error message is displayed to the user
- [ ] AC 7: Given wrong credentials on sign-in, when the server returns an error, then an error message is displayed to the user
- [ ] AC 8: Given a form submission in progress, when the user waits, then a loading spinner is shown and the submit button is disabled

## Additional Context

### Dependencies

- No new packages needed — Better Auth's `emailAndPassword` is built-in
- Existing UI components: `Button`, `Input`, `Label` from `@/components/ui/`
- Existing packages: `react-hook-form`, `@hookform/resolvers`, `zod`

### Testing Strategy

- **Unit tests**: `EmailPasswordForm.test.tsx` — form rendering, mode toggling, validation, submit calls, error display
- **Manual testing**: Sign up with new email, sign in with credentials, verify session created, test with existing OAuth email (account linking)

### Notes

- Better Auth handles password hashing internally (bcrypt)
- Session management stays identical — emailAndPassword creates the same session/cookie as OAuth
- Account linking by email means if a user signs up with email then later uses Google with the same email, accounts link automatically
- The `name` field on sign-up is optional in Better Auth but good UX to collect — can be left blank since profile editing exists separately
