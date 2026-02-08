# Story 1.6: Public Landing Page

Status: ready-for-dev

## Story

As a **visitor who hasn't signed up yet**,
I want **to see a compelling landing page that explains what the app does**,
So that **I understand the value and feel motivated to sign up**.

## Acceptance Criteria

1. **Hero Section:** Given I visit the root URL (`/`), When the page loads, Then I see a hero section with the app name, a tagline that communicates the core value proposition (social reading / reading together), And a prominent "Get Started" CTA button that links to `/login`.

2. **Value Propositions:** Given I am on the landing page, When I scroll past the hero, Then I see 3 value proposition cards that explain the key features: (a) Track your reading — streaks, goals, habits; (b) Read with friends — kudos, activity, reading rooms; (c) Meet your authors — ambient author presence. Each card has an icon and brief description.

3. **Final CTA:** Given I have scrolled through the value props, When I reach the bottom section, Then I see a repeated "Get Started" CTA button with an encouraging message.

4. **Warm Hearth Design:** Given I am on the landing page, When I view the design, Then the page uses the existing Warm Hearth color palette (warm-amber, warm-cream, warm-text), And uses the existing `Button` component from `@/components/ui/button`, And uses the existing `Card` component from `@/components/ui/card`, And feels visually consistent with the authenticated app experience.

5. **Mobile-First Responsive:** Given I view the landing page on a mobile device (<768px), When the page renders, Then the layout is single-column and fully usable, And all touch targets meet the 44px minimum, And the hero and CTAs are visible without scrolling on common phone viewports. Given I view on desktop (>=1024px), Then the value prop cards display in a 3-column row.

6. **SEO Metadata:** Given a search engine crawls the landing page, When it reads the page metadata, Then the page has a proper `title`, `description`, and Open Graph tags (`og:title`, `og:description`, `og:type`).

7. **Server Component:** Given the landing page is built, When it renders, Then it is a React Server Component (no `'use client'` directive), And it loads with zero client-side JavaScript for optimal Core Web Vitals.

8. **Dark Mode:** Given the user has `prefers-color-scheme: dark`, When the landing page renders, Then it displays correctly using the existing dark mode Warm Hearth tokens.

9. **Authenticated Redirect:** Given I am already logged in (have a valid session), When I visit `/`, Then I see the landing page (no redirect), And the "Get Started" button text changes to "Go to Home" and links to `/home`.

## Tasks / Subtasks

- [ ] Task 1: Update page metadata for SEO (AC: #6)
  - [ ] 1.1 In `src/app/page.tsx`, export a `metadata` object with `title`: "Flappy Bird — Read Together. Never Alone.", `description`: concise app description, and `openGraph` fields (`title`, `description`, `type: 'website'`)

- [ ] Task 2: Build landing page layout in `src/app/page.tsx` (AC: #1, #2, #3, #4, #5, #7, #8)
  - [ ] 2.1 Replace the current Next.js placeholder content entirely
  - [ ] 2.2 Create hero section: app name as `<h1>` (Display size, `text-warm-text`), tagline as `<p>` (`text-warm-text-muted`), and a primary `<Button>` CTA linking to `/login` using `@/components/ui/button`
  - [ ] 2.3 Create value propositions section: 3 `<Card>` components from `@/components/ui/card`, each with a Lucide icon (`BookOpen`, `Users`, `Sparkles`), heading, and short description text
  - [ ] 2.4 Use responsive grid: `grid-cols-1 md:grid-cols-3` for the value prop cards
  - [ ] 2.5 Create bottom CTA section: encouraging text + repeated "Get Started" `<Button>`
  - [ ] 2.6 Use Warm Hearth color tokens throughout: `bg-warm-cream`, `text-warm-text`, `text-warm-text-muted`, `bg-warm-amber` (via primary Button variant)
  - [ ] 2.7 Ensure the page is a Server Component — no `'use client'` directive
  - [ ] 2.8 Ensure all sections use semantic HTML (`<main>`, `<section>`, `<h1>`, `<h2>`)
  - [ ] 2.9 Ensure 44px minimum touch targets on all interactive elements
  - [ ] 2.10 Verify dark mode renders correctly with existing `.dark` CSS tokens

- [ ] Task 3: Handle authenticated state for CTA (AC: #9)
  - [ ] 3.1 Use `auth.api.getSession({ headers: await headers() })` server-side to check if user is logged in
  - [ ] 3.2 If authenticated: render CTA button as "Go to Home" linking to `/home`
  - [ ] 3.3 If not authenticated: render CTA button as "Get Started" linking to `/login`

- [ ] Task 4: Write tests (AC: #1, #2, #3, #5, #9)
  - [ ] 4.1 Create `src/app/landing.test.tsx` (or co-located `page.test.tsx`)
  - [ ] 4.2 Test: renders hero section with app name, tagline, and CTA button
  - [ ] 4.3 Test: renders 3 value proposition cards with correct content
  - [ ] 4.4 Test: renders bottom CTA section
  - [ ] 4.5 Test: CTA links to `/login` when unauthenticated
  - [ ] 4.6 Test: CTA links to `/home` and shows "Go to Home" when authenticated
  - [ ] 4.7 Test: page exports correct metadata

## Dev Notes

- This is a pure Server Component page — no client-side state or interactivity needed beyond links
- Reuse existing `Button` and `Card` from `@/components/ui/` — do NOT create new components
- Use Lucide icons (already in the project via shadcn) for value prop cards
- The `/` route is already public in `src/middleware.ts` — no auth changes needed
- Keep copy concise: tagline should be ~10 words, card descriptions ~20 words each
- The Warm Hearth palette and dark mode tokens are already defined in `globals.css`
- Reference the UX spec's typography scale: Display 36px/700 for hero heading, H2 24px/600 for card headings, Body 16px/400 for descriptions
