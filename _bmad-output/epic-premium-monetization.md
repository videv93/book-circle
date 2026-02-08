# Epic: Premium Monetization with Author Engagement

**Status:** Ready for Planning
**Priority:** High
**Created:** 2026-02-06

## Overview

Implement a freemium business model with feature tiering: free users can track up to 3 books with read-only social features, while premium users ($9.99 one-time payment) unlock unlimited book tracking, commenting capabilities, and future author interaction features.

## Business Value

- **Revenue Generation:** One-time $9.99 payment per premium user
- **User Acquisition:** Free tier lowers barrier to entry (track 3 books)
- **Engagement:** Social features and author interaction drive retention
- **Market Differentiation:** Lowest paid entry point vs competitors (StoryGraph: $50/year)
- **Two-Sided Marketplace:** Author engagement creates network effects

## Competitive Context

| Platform | Free Tier | Paid Tier | Price |
|----------|-----------|-----------|-------|
| Goodreads | Unlimited books | N/A | Free (ads) |
| StoryGraph | 10 books | Unlimited + insights | $50/year |
| **Flappy Bird** | **3 books** | **Unlimited + author interaction** | **$9.99 one-time** |

## Strategic Approach

### Phase 1: Core Monetization (MVP)
- Implement 3-book limit for free tier
- Build Stripe payment integration
- Premium unlock functionality
- Book limit enforcement

### Phase 2: Social Engagement
- Comment system on books
- Premium-only commenting
- Read-only social feed for free users
- Community building features

### Phase 3: Author Platform
- Author account types
- Author reply capabilities
- Author verification system
- Author discovery/profiles

## Success Metrics

- **Conversion Rate:** Target 5-15% of users hitting 3-book limit convert to premium
- **Free User Activation:** 80% track first book, 40% reach 3-book limit
- **Premium User Engagement:** 50%+ of premium users utilize commenting feature
- **Author Participation:** Attract 100+ verified authors within 6 months of Phase 3

## Technical Architecture Overview

### Data Models Required
- `PremiumStatus` enum (FREE, PREMIUM)
- `Book` model with user relationship
- `ReadingSession` tracking
- `BookComment` model (Phase 2)
- `User.isAuthor` flag (Phase 3)

### Payment Infrastructure
- Stripe Checkout for one-time payments
- Webhook handling for payment confirmation
- Premium status management
- Payment transaction records

### Gating Logic
- Middleware-level book creation checks
- Server action validation for premium features
- Comment permission system

## Stories

1. **Story 1.1:** Implement Free Tier Book Limit (3 books max)
2. **Story 1.2:** Add Stripe Payment Integration
3. **Story 1.3:** Build Premium Unlock Flow
4. **Story 1.4:** Premium Status Management & Gates
5. **Story 2.1:** Build Comment System Infrastructure
6. **Story 2.2:** Premium-Only Commenting Feature
7. **Story 2.3:** Read-Only Social Feed for Free Users
8. **Story 3.1:** Author Account System
9. **Story 3.2:** Author Reply Functionality
10. **Story 3.3:** Author Verification & Discovery

## Dependencies

- Existing Better Auth authentication system
- Prisma ORM with PostgreSQL
- Current User/Session models
- Stripe account setup

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| 3-book limit too restrictive | Low conversion | A/B test 3 vs 5 books limit |
| Low author participation | Reduced value prop | Phase 3 launched after user base established |
| Payment processing complexity | Dev delays | Use Stripe's hosted checkout (simplest path) |
| Users perceive as expensive | Low conversion | Emphasize one-time vs subscription savings |

## Open Questions

- [ ] A/B test: 3 books vs 5 books free tier limit?
- [ ] Author verification process (manual review vs automated)?
- [ ] Free users can READ comments but not post? (FOMO driver)
- [ ] Author analytics dashboard needed?
- [ ] Mobile app considerations for IAP?

## Notes from Party Mode Discussion (2026-02-06)

**Team Consensus:**
- ✅ Feature tiering preferred over session-based limits (doesn't punish engagement)
- ✅ One-time payment reduces user anxiety vs subscriptions
- ✅ Author interaction creates unique market position
- ✅ Read-only social for free tier drives FOMO conversion
- ✅ Stripe recommended for payment processing (web-first approach)

**Key Insights:**
- **PM (John):** Clear conversion moment = "I want to track my 4th book"
- **Analyst (Mary):** 20% of users expected to hit 3-book limit (conversion opportunity)
- **Architect (Winston):** Clean extension of existing Prisma models
- **UX (Sally):** Celebratory paywall tone ("You're a power reader!") vs punishing
- **Dev (Amelia):** Middleware-level gating for security

---

**Next Steps:** Create detailed user stories for Phase 1 implementation.
