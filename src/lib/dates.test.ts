import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getTodayBounds,
  getYesterdayBounds,
  getDateInTimezone,
  isSameDay,
  getDayBounds,
} from './dates';

describe('dates utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getTodayBounds', () => {
    it('returns correct bounds for UTC', () => {
      vi.setSystemTime(new Date('2026-02-06T14:30:00.000Z'));

      const { start, end } = getTodayBounds('UTC');

      expect(start.toISOString()).toBe('2026-02-06T00:00:00.000Z');
      expect(end.toISOString()).toBe('2026-02-07T00:00:00.000Z');
    });

    it('returns correct bounds for US/Eastern (UTC-5)', () => {
      // 2026-02-06T03:00:00Z = 2026-02-05T22:00:00 ET (still Feb 5 in ET)
      vi.setSystemTime(new Date('2026-02-06T03:00:00.000Z'));

      const { start, end } = getTodayBounds('America/New_York');

      // Feb 5 in ET → midnight Feb 5 ET = Feb 5 05:00 UTC
      expect(start.toISOString()).toBe('2026-02-05T05:00:00.000Z');
      expect(end.toISOString()).toBe('2026-02-06T05:00:00.000Z');
    });

    it('returns correct bounds for Asia/Tokyo (UTC+9)', () => {
      // 2026-02-06T14:00:00Z = 2026-02-06T23:00:00 JST (still Feb 6 in JST)
      vi.setSystemTime(new Date('2026-02-06T14:00:00.000Z'));

      const { start, end } = getTodayBounds('Asia/Tokyo');

      // Feb 6 in JST → midnight Feb 6 JST = Feb 5 15:00 UTC
      expect(start.toISOString()).toBe('2026-02-05T15:00:00.000Z');
      expect(end.toISOString()).toBe('2026-02-06T15:00:00.000Z');
    });

    it('returns correct bounds for Asia/Kolkata (UTC+5:30)', () => {
      // 2026-02-06T20:00:00Z = 2026-02-07T01:30:00 IST (Feb 7 in IST)
      vi.setSystemTime(new Date('2026-02-06T20:00:00.000Z'));

      const { start, end } = getTodayBounds('Asia/Kolkata');

      // Feb 7 in IST → midnight Feb 7 IST = Feb 6 18:30 UTC
      expect(start.toISOString()).toBe('2026-02-06T18:30:00.000Z');
      expect(end.toISOString()).toBe('2026-02-07T18:30:00.000Z');
    });

    it('returns correct bounds for Asia/Kathmandu (UTC+5:45)', () => {
      // 2026-02-06T20:00:00Z = 2026-02-07T01:45:00 NPT (Feb 7 in NPT)
      vi.setSystemTime(new Date('2026-02-06T20:00:00.000Z'));

      const { start, end } = getTodayBounds('Asia/Kathmandu');

      // Feb 7 in NPT → midnight Feb 7 NPT = Feb 6 18:15 UTC
      expect(start.toISOString()).toBe('2026-02-06T18:15:00.000Z');
      expect(end.toISOString()).toBe('2026-02-07T18:15:00.000Z');
    });

    it('spans exactly 24 hours', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));

      const { start, end } = getTodayBounds('America/Los_Angeles');

      expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
    });

    it('spans exactly 24 hours for fractional timezone', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));

      const { start, end } = getTodayBounds('Asia/Kolkata');

      expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe('getYesterdayBounds', () => {
    it('returns the day before today bounds', () => {
      vi.setSystemTime(new Date('2026-02-06T14:30:00.000Z'));

      const { start, end } = getYesterdayBounds('UTC');

      expect(start.toISOString()).toBe('2026-02-05T00:00:00.000Z');
      expect(end.toISOString()).toBe('2026-02-06T00:00:00.000Z');
    });

    it('spans exactly 24 hours', () => {
      vi.setSystemTime(new Date('2026-02-06T14:30:00.000Z'));

      const { start, end } = getYesterdayBounds('America/New_York');

      expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
    });

    it('returns correct yesterday across DST spring-forward (US/Eastern)', () => {
      // 2026 DST spring-forward: March 8, 2:00 AM ET
      // On March 8 at 3:00 AM ET (07:00 UTC), yesterday should be March 7
      vi.setSystemTime(new Date('2026-03-08T07:00:00.000Z'));

      const { start, end } = getYesterdayBounds('America/New_York');

      // March 7 in ET is a standard time day (UTC-5)
      expect(start.toISOString()).toBe('2026-03-07T05:00:00.000Z');
      expect(end.toISOString()).toBe('2026-03-08T05:00:00.000Z');
    });
  });

  describe('getDateInTimezone', () => {
    it('returns YYYY-MM-DD for UTC', () => {
      const date = new Date('2026-02-06T14:30:00.000Z');
      expect(getDateInTimezone(date, 'UTC')).toBe('2026-02-06');
    });

    it('returns correct date for timezone ahead of UTC', () => {
      // 2026-02-06T23:00:00Z is Feb 7 in Tokyo (UTC+9)
      const date = new Date('2026-02-06T23:00:00.000Z');
      expect(getDateInTimezone(date, 'Asia/Tokyo')).toBe('2026-02-07');
    });

    it('returns correct date for timezone behind UTC', () => {
      // 2026-02-06T03:00:00Z is still Feb 5 in New York (UTC-5)
      const date = new Date('2026-02-06T03:00:00.000Z');
      expect(getDateInTimezone(date, 'America/New_York')).toBe('2026-02-05');
    });
  });

  describe('isSameDay', () => {
    it('returns true for same day in timezone', () => {
      const d1 = new Date('2026-02-06T10:00:00.000Z');
      const d2 = new Date('2026-02-06T22:00:00.000Z');
      expect(isSameDay(d1, d2, 'UTC')).toBe(true);
    });

    it('returns false for different days in timezone', () => {
      const d1 = new Date('2026-02-06T10:00:00.000Z');
      const d2 = new Date('2026-02-07T10:00:00.000Z');
      expect(isSameDay(d1, d2, 'UTC')).toBe(false);
    });

    it('handles timezone boundary correctly', () => {
      // Both are in UTC Feb 6, but in Tokyo one is Feb 6, one is Feb 7
      const d1 = new Date('2026-02-06T14:00:00.000Z'); // Feb 6 23:00 JST
      const d2 = new Date('2026-02-06T16:00:00.000Z'); // Feb 7 01:00 JST
      expect(isSameDay(d1, d2, 'Asia/Tokyo')).toBe(false);
      expect(isSameDay(d1, d2, 'UTC')).toBe(true);
    });
  });

  describe('getDayBounds', () => {
    it('computes bounds for a specific reference date', () => {
      const ref = new Date('2026-01-15T10:00:00.000Z');
      const { start, end } = getDayBounds('UTC', ref);

      expect(start.toISOString()).toBe('2026-01-15T00:00:00.000Z');
      expect(end.toISOString()).toBe('2026-01-16T00:00:00.000Z');
    });
  });
});
