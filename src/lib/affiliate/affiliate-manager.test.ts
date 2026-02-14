import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateAffiliateLink,
  clearAffiliateCache,
} from './affiliate-manager';

describe('AffiliateManager', () => {
  beforeEach(() => {
    clearAffiliateCache();
    vi.unstubAllEnvs();
  });

  describe('generateAffiliateLink', () => {
    it('generates Amazon affiliate link with tracking ID', () => {
      vi.stubEnv('AMAZON_AFFILIATE_ID', 'test-tag-20');
      const url = generateAffiliateLink('1234567890', 'amazon');
      expect(url).toBe('https://www.amazon.com/dp/1234567890?tag=test-tag-20');
    });

    it('generates Amazon link without tracking ID when env not set', () => {
      vi.stubEnv('AMAZON_AFFILIATE_ID', '');
      const url = generateAffiliateLink('1234567890', 'amazon');
      expect(url).toBe('https://www.amazon.com/dp/1234567890');
    });

    it('generates Bookshop affiliate link with tracking ID', () => {
      vi.stubEnv('BOOKSHOP_AFFILIATE_ID', 'shop123');
      const url = generateAffiliateLink('1234567890', 'bookshop');
      expect(url).toBe('https://bookshop.org/a/shop123/1234567890');
    });

    it('generates Bookshop link without tracking ID when env not set', () => {
      vi.stubEnv('BOOKSHOP_AFFILIATE_ID', '');
      const url = generateAffiliateLink('1234567890', 'bookshop');
      expect(url).toBe('https://bookshop.org/book/1234567890');
    });
  });

  describe('caching', () => {
    it('returns cached link on second call', () => {
      vi.stubEnv('AMAZON_AFFILIATE_ID', 'tag1');
      const url1 = generateAffiliateLink('111', 'amazon');

      // Change env — cached value should still be returned
      vi.stubEnv('AMAZON_AFFILIATE_ID', 'tag2');
      const url2 = generateAffiliateLink('111', 'amazon');

      expect(url1).toBe(url2);
      expect(url2).toContain('tag1');
    });

    it('returns fresh link after cache is cleared', () => {
      vi.stubEnv('AMAZON_AFFILIATE_ID', 'tag1');
      generateAffiliateLink('111', 'amazon');

      clearAffiliateCache();
      vi.stubEnv('AMAZON_AFFILIATE_ID', 'tag2');
      const url = generateAffiliateLink('111', 'amazon');

      expect(url).toContain('tag2');
    });

    it('caches different providers separately', () => {
      vi.stubEnv('AMAZON_AFFILIATE_ID', 'amz');
      vi.stubEnv('BOOKSHOP_AFFILIATE_ID', 'bks');

      const amazon = generateAffiliateLink('111', 'amazon');
      const bookshop = generateAffiliateLink('111', 'bookshop');

      expect(amazon).toContain('amazon.com');
      expect(bookshop).toContain('bookshop.org');
    });
  });
});
