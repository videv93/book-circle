# Epic: Affiliate Monetization Implementation

## Epic Overview
**Epic ID:** MONETIZE-001
**Epic Title:** Implement Book Affiliate Program Integration
**Priority:** High
**Estimated Effort:** 3-5 sprints
**Status:** Planning
**Created:** 2026-02-06

## Business Value
Enable sustainable revenue generation through book affiliate programs while maintaining user trust and providing value through contextual recommendations in the social reading experience.

## Success Metrics
- Achieve 2-3% conversion rate on book recommendations
- Maintain 90%+ user trust score (via surveys)
- Generate $X revenue per 1000 active users
- 0% negative impact on user engagement metrics

## Technical Architecture

### System Components

#### 1. Affiliate Link Manager
Core service for generating and managing affiliate links across multiple providers.

```typescript
// src/lib/affiliate/affiliate-manager.ts
interface AffiliateConfig {
  amazon: {
    trackingId: string;
    baseUrl: string;
  };
  bookshop: {
    trackingId: string;
    baseUrl: string;
  };
}

class AffiliateManager {
  generateAffiliateLink(
    isbn: string,
    title: string,
    program: 'amazon' | 'bookshop',
    userId?: string
  ): string {
    const timestamp = Date.now();
    const trackingCode = `${userId}_${timestamp}`;

    switch(program) {
      case 'amazon':
        return `https://www.amazon.com/dp/${isbn}?tag=${process.env.AMAZON_AFFILIATE_ID}`;
      case 'bookshop':
        return `https://bookshop.org/a/${process.env.BOOKSHOP_AFFILIATE_ID}/${isbn}`;
      default:
        return '';
    }
  }
}
```

#### 2. Database Schema

```prisma
model AffiliateLink {
  id          String   @id @default(cuid())
  bookId      String
  isbn        String
  provider    String   // amazon, bookshop, etc
  clickCount  Int      @default(0)
  conversions Int      @default(0)
  revenue     Decimal  @default(0)
  lastClicked DateTime?

  book Book @relation(fields: [bookId], references: [id])
}

model AffiliateClick {
  id        String   @id @default(cuid())
  userId    String
  bookId    String
  provider  String
  timestamp DateTime @default(now())
  converted Boolean  @default(false)

  user User @relation(fields: [userId], references: [id])
}
```

#### 3. API Routes

##### Redirect Handler
```typescript
// src/app/api/affiliate/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isbn = searchParams.get('isbn');
  const provider = searchParams.get('provider');
  const userId = // get from session

  // Log the click for analytics
  await prisma.affiliateClick.create({
    data: { userId, isbn, provider, timestamp: new Date() }
  });

  // Generate the actual affiliate link
  const affiliateUrl = generateAffiliateLink(isbn, provider, userId);

  return NextResponse.redirect(affiliateUrl);
}
```

##### Privacy-Safe Purchase Route
```typescript
// app/api/books/[isbn]/purchase/route.ts
export async function GET(
  request: Request,
  { params }: { params: { isbn: string } }
) {
  const session = await auth.api.getSession();

  // Log intent (GDPR compliant)
  if (session?.user) {
    await logAffiliateIntent(session.user.id, params.isbn);
  }

  // Determine best provider based on region
  const provider = await selectOptimalProvider(
    request.headers.get('cf-ipcountry') || 'US'
  );

  // Generate actual affiliate URL server-side
  const affiliateUrl = generateSecureAffiliateLink(
    params.isbn,
    provider,
    session?.user?.id
  );

  return NextResponse.redirect(affiliateUrl);
}
```

#### 4. Server Actions

```typescript
// src/actions/books/getBookRecommendations.ts
'use server';

export async function getBookRecommendations(
  userId: string,
  currentBookId: string
): Promise<BookRecommendation[]> {
  const recommendations = await prisma.recommendation.findMany({
    where: { basedOnBookId: currentBookId },
    include: { book: true }
  });

  return recommendations.map(rec => ({
    ...rec.book,
    purchaseOptions: {
      amazon: generateAffiliateLink(rec.book.isbn, 'amazon', userId),
      bookshop: generateAffiliateLink(rec.book.isbn, 'bookshop', userId),
      openLibrary: `https://openlibrary.org/isbn/${rec.book.isbn}`
    },
    affiliateDisclosure: true
  }));
}
```

#### 5. React Components

##### Purchase Button Component
```tsx
// src/components/features/books/BookPurchaseButton.tsx
export function BookPurchaseButton({ book }: { book: Book }) {
  const { affiliateLink, provider } = useAffiliateLink(book);

  return (
    <div className="space-y-2">
      {/* Free option first - builds trust */}
      <Button variant="outline" asChild>
        <a href={`https://openlibrary.org/isbn/${book.isbn}`}
           target="_blank">
          Read Free on OpenLibrary
        </a>
      </Button>

      {/* Purchase option with disclosure */}
      <Button asChild>
        <a href={affiliateLink}
           target="_blank"
           onClick={() => trackAffiliateClick(book.id)}>
          Buy on {provider}
          <span className="text-xs ml-2">(supports app) ℹ️</span>
        </a>
      </Button>
    </div>
  );
}
```

##### Custom Hook
```typescript
// src/hooks/useAffiliateLink.ts
export function useAffiliateLink(book: Book) {
  const { user } = useSession();
  const [affiliateLink, setAffiliateLink] = useState<string>('');

  useEffect(() => {
    const getLink = async () => {
      const userRegion = await getUserRegion();
      const provider = userRegion === 'US' ? 'amazon' : 'bookshop';

      const link = await fetch(`/api/affiliate?isbn=${book.isbn}&provider=${provider}`)
        .then(res => res.json());

      setAffiliateLink(link.url);
    };

    getLink();
  }, [book.isbn]);

  return { affiliateLink, provider };
}
```

## User Stories

### Story 1: Book Detail Page Integration
**As a** user viewing a book detail page
**I want to** see purchase options alongside free reading options
**So that** I can choose how to access the book while supporting the platform

**Acceptance Criteria:**
- Display OpenLibrary link when available (free option first)
- Show purchase button with provider name
- Include subtle disclosure about affiliate support
- Track click events for analytics

### Story 2: Post-Reading Recommendations
**As a** user who just finished a book
**I want to** receive personalized book recommendations
**So that** I can discover my next read

**Acceptance Criteria:**
- Show 3-5 contextual recommendations
- Include purchase and free options for each
- Track which recommendations convert best
- Display social proof (friends who read it)

### Story 3: Buddy Read Purchase Flow
**As a** user starting a buddy read
**I want to** easily purchase the selected book
**So that** I can join the reading experience

**Acceptance Criteria:**
- One-click purchase from buddy read invitation
- Show same edition/version as reading partner
- Track buddy read conversion rates
- Option to find at local library

### Story 4: Analytics Dashboard (Internal)
**As a** product manager
**I want to** track affiliate performance metrics
**So that** I can optimize placement and partnerships

**Acceptance Criteria:**
- Track clicks, conversions, revenue by placement
- A/B testing framework for link positioning
- Regional performance breakdown
- User segment analysis

## Implementation Phases

### Phase 1: Foundation (Sprint 1)
- [ ] Set up affiliate accounts (Amazon, Bookshop.org)
- [ ] Implement database schema
- [ ] Create AffiliateManager service
- [ ] Build privacy-safe redirect API
- [ ] Add environment variables

### Phase 2: Core Integration (Sprint 2)
- [ ] Integrate with book detail pages
- [ ] Create BookPurchaseButton component
- [ ] Implement click tracking
- [ ] Add affiliate disclosure UI
- [ ] Set up analytics events

### Phase 3: Recommendation Engine (Sprint 3)
- [ ] Build recommendation algorithm
- [ ] Create post-reading flow
- [ ] Implement buddy read purchase
- [ ] Add regional provider selection
- [ ] Create A/B testing framework

### Phase 4: Optimization (Sprint 4)
- [ ] Build analytics dashboard
- [ ] Implement conversion tracking
- [ ] Add provider fallbacks
- [ ] Create "Support the App" mode
- [ ] Performance optimization

### Phase 5: International Expansion (Sprint 5)
- [ ] Add Book Depository integration
- [ ] Implement geo-routing
- [ ] Multi-currency support
- [ ] Regional compliance (GDPR, etc.)
- [ ] Localized provider selection

## Technical Requirements

### Security & Privacy
- Never expose affiliate IDs in client code
- All affiliate URLs generated server-side
- GDPR-compliant tracking consent
- Secure storage of API credentials

### Performance
- Cache affiliate links (15-minute TTL)
- Lazy load purchase options
- Optimize database queries with indexes
- CDN for static provider assets

### Testing
- Unit tests for AffiliateManager
- Integration tests for API routes
- E2E tests for purchase flows
- A/B testing framework setup

### Monitoring
- Track affiliate API response times
- Monitor conversion funnel drop-offs
- Alert on provider API failures
- Revenue tracking and reporting

## Dependencies
- Better Auth session management
- Prisma ORM for database
- Next.js API routes
- Cloudflare for geo-detection
- Analytics platform (TBD)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Affiliate account rejection | High | Apply early, have backup providers |
| Low conversion rates | Medium | A/B test placements, optimize UX |
| User trust concerns | High | Transparent disclosure, free options first |
| International complexity | Medium | Phase rollout by region |
| Provider API changes | Low | Abstract provider logic, monitor changes |

## Success Criteria
- Successfully integrate 2+ affiliate programs
- Achieve positive ROI within 90 days
- Maintain or improve user engagement metrics
- 95%+ user trust score in surveys
- Sub-200ms affiliate link generation

## Notes
- Prioritize user experience over revenue optimization
- Always show free alternatives when available
- Build for international expansion from day one
- Consider "Founding Members" program for early adopters
- Track everything for data-driven optimization

---
*Generated by BMad Master Party Mode - Technical Implementation Discussion*