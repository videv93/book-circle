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
  const dayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  // Use noon UTC as a stable reference point to compute the timezone offset.
  // Noon avoids DST-transition ambiguity that can occur near midnight.
  const refPoint = new Date(`${dayStr}T12:00:00.000Z`);

  const fmtOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };

  const utcParts = new Intl.DateTimeFormat('en-US', {
    ...fmtOptions,
    timeZone: 'UTC',
  }).formatToParts(refPoint);

  const tzParts = new Intl.DateTimeFormat('en-US', {
    ...fmtOptions,
    timeZone: timezone,
  }).formatToParts(refPoint);

  const getPartValue = (parts: Intl.DateTimeFormatPart[], type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);

  const utcDay = getPartValue(utcParts, 'day');
  const utcHour = getPartValue(utcParts, 'hour');
  const utcMinute = getPartValue(utcParts, 'minute');

  const tzDay = getPartValue(tzParts, 'day');
  const tzHour = getPartValue(tzParts, 'hour');
  const tzMinute = getPartValue(tzParts, 'minute');

  // Calculate offset in minutes (TZ - UTC), handling day boundary crossings
  let offsetMinutes = (tzHour - utcHour) * 60 + (tzMinute - utcMinute);
  if (tzDay > utcDay) offsetMinutes += 24 * 60;
  if (tzDay < utcDay) offsetMinutes -= 24 * 60;

  // Day's start in UTC = midnight in target TZ converted to UTC
  const start = new Date(`${dayStr}T00:00:00.000Z`);
  start.setUTCMinutes(start.getUTCMinutes() - offsetMinutes);

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
 * Uses date arithmetic instead of 24h subtraction to handle DST transitions correctly.
 */
export function getYesterdayBounds(timezone: string): { start: Date; end: Date } {
  const todayStr = getDateInTimezone(new Date(), timezone);
  // Parse today's date and subtract 1 calendar day
  const [year, month, day] = todayStr.split('-').map(Number);
  const yesterdayDate = new Date(Date.UTC(year, month - 1, day - 1, 12, 0, 0));
  return getDayBounds(timezone, yesterdayDate);
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
