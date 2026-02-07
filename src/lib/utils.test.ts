import { describe, it, expect } from 'vitest';
import { formatDuration, formatRelativeTime, getInitials } from './utils';

describe('formatDuration', () => {
  it('returns "< 1 min" for less than 60 seconds', () => {
    expect(formatDuration(0)).toBe('< 1 min');
    expect(formatDuration(30)).toBe('< 1 min');
    expect(formatDuration(59)).toBe('< 1 min');
  });

  it('returns minutes for less than 1 hour', () => {
    expect(formatDuration(60)).toBe('1 min');
    expect(formatDuration(1920)).toBe('32 min');
    expect(formatDuration(3540)).toBe('59 min');
  });

  it('returns hours and minutes for 1+ hours', () => {
    expect(formatDuration(3600)).toBe('1h');
    expect(formatDuration(4500)).toBe('1h 15min');
    expect(formatDuration(7200)).toBe('2h');
    expect(formatDuration(7800)).toBe('2h 10min');
  });
});

describe('formatRelativeTime', () => {
  it('returns "just now" for very recent times', () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe('just now');
  });

  it('returns "just now" for future dates (clock skew)', () => {
    const futureDate = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes in future
    expect(formatRelativeTime(futureDate)).toBe('just now');
  });

  it('returns minutes for times under an hour', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinAgo)).toBe('5 min ago');
  });

  it('returns hours for times under a day', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeHoursAgo)).toBe('3h ago');
  });

  it('returns "yesterday" for 1 day ago', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(yesterday)).toBe('yesterday');
  });

  it('returns days for times under 30 days', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(fiveDaysAgo)).toBe('5 days ago');
  });

  it('returns months for times under a year', () => {
    const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoMonthsAgo)).toBe('2mo ago');
  });
});

describe('getInitials', () => {
  it('returns ? for null', () => {
    expect(getInitials(null)).toBe('?');
  });

  it('returns first two letters for single name', () => {
    expect(getInitials('Jane')).toBe('J');
  });

  it('returns initials for two names', () => {
    expect(getInitials('Jane Doe')).toBe('JD');
  });
});
