type AffiliateProvider = 'amazon' | 'bookshop';

interface CacheEntry {
  url: string;
  expiresAt: number;
}

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const linkCache = new Map<string, CacheEntry>();

function getCacheKey(isbn: string, provider: AffiliateProvider): string {
  return `${provider}:${isbn}`;
}

function getFromCache(key: string): string | null {
  const entry = linkCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    linkCache.delete(key);
    return null;
  }
  return entry.url;
}

function setCache(key: string, url: string): void {
  linkCache.set(key, { url, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function getAffiliateConfig() {
  const amazonId = process.env.AMAZON_AFFILIATE_ID;
  const bookshopId = process.env.BOOKSHOP_AFFILIATE_ID;

  return { amazonId, bookshopId };
}

export function generateAffiliateLink(
  isbn: string,
  provider: AffiliateProvider
): string {
  const cacheKey = getCacheKey(isbn, provider);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const { amazonId, bookshopId } = getAffiliateConfig();
  let url: string;

  switch (provider) {
    case 'amazon':
      url = amazonId
        ? `https://www.amazon.com/dp/${isbn}?tag=${amazonId}`
        : `https://www.amazon.com/dp/${isbn}`;
      break;
    case 'bookshop':
      url = bookshopId
        ? `https://bookshop.org/a/${bookshopId}/${isbn}`
        : `https://bookshop.org/book/${isbn}`;
      break;
  }

  setCache(cacheKey, url);
  return url;
}

export function clearAffiliateCache(): void {
  linkCache.clear();
}

export type { AffiliateProvider };
