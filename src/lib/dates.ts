/**
 * Shared timezone-aware date utilities for streak and goal calculations.
 * All functions use Intl.DateTimeFormat for correct timezone handling.
 */

/**
 * Compute a day's start and end in the given timezone, returned as UTC Dates.
 * @param timezone - IANA timezone string (e.g., 'America/New_York')
 * @param referenceDate - Optional date to compute bounds for (defaults to now)
 */
export function getDayBounds(
  timezone: string,
  referenceDate?: Date
): { start: Date; end: Date } {
  const now = referenceDate ?? new Date();

  // Format the date in the target timezone to get YYYY-MM-DD
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dayStr = formatter.format(now);

  // Get the offset for the target timezone at this date
  const midnightLocal = new Date(`${dayStr}T00:00:00`);

  const utcParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(midnightLocal);

  const tzParts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(midnightLocal);

  const getPartValue = (parts: Intl.DateTimeFormatPart[], type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);

  const utcHour = getPartValue(utcParts, 'hour');
  const tzHour = getPartValue(tzParts, 'hour');
  const utcDay = getPartValue(utcParts, 'day');
  const tzDay = getPartValue(tzParts, 'day');

  // Calculate offset in hours
  let offsetHours = tzHour - utcHour;
  if (tzDay > utcDay) offsetHours += 24;
  if (tzDay < utcDay) offsetHours -= 24;

  // Day's start in UTC = midnight in TZ converted to UTC
  const start = new Date(`${dayStr}T00:00:00.000Z`);
  start.setUTCHours(start.getUTCHours() - offsetHours);

  // Day's end = start + 24 hours
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
}

/**
 * Compute today's start and end in the given timezone, returned as UTC Dates.
 * Convenience wrapper around getDayBounds.
 */
export function getTodayBounds(timezone: string): { start: Date; end: Date } {
  return getDayBounds(timezone);
}

/**
 * Compute yesterday's start and end in the given timezone, returned as UTC Dates.
 */
export function getYesterdayBounds(timezone: string): { start: Date; end: Date } {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return getDayBounds(timezone, yesterday);
}

/**
 * Get the YYYY-MM-DD string for a date in a given timezone.
 */
export function getDateInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Check if two dates fall on the same calendar day in a given timezone.
 */
export function isSameDay(date1: Date, date2: Date, timezone: string): boolean {
  return getDateInTimezone(date1, timezone) === getDateInTimezone(date2, timezone);
}
