/** Local YYYY-MM-DD for "today" — avoids UTC day-boundary drift from toISOString(). */
export function todayStr(): string {
  return toDateStr(new Date());
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parses a YYYY-MM-DD string as a local date (avoids UTC parsing of `new Date(dateStr)`). */
export function parseDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Returns the YYYY-MM-DD `delta` days from `dateStr` (negative for the past). */
export function addDays(dateStr: string, delta: number): string {
  const d = parseDateStr(dateStr);
  d.setDate(d.getDate() + delta);
  return toDateStr(d);
}

export function formatDate(dateStr: string): string {
  return parseDateStr(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Human-friendly label for a date relative to today, e.g. "Yesterday", "3 days ago", "Tomorrow", "In 3 days". */
export function relativeDate(dateStr: string): string {
  const today = todayStr();
  if (dateStr === today) return 'Today';
  const diffDays = Math.round(
    (parseDateStr(dateStr).getTime() - parseDateStr(today).getTime()) / 86400000,
  );
  if (diffDays === -1) return 'Yesterday';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < -1 && diffDays > -7) return `${-diffDays} days ago`;
  if (diffDays > 1 && diffDays < 7) return `In ${diffDays} days`;
  return formatDate(dateStr);
}

/** True if `dateStr` is strictly after today. */
export function isFutureDate(dateStr: string): boolean {
  return dateStr > todayStr();
}

/** Monday of the ISO week containing `dateStr`. */
export function getWeekStart(dateStr: string): string {
  const d = parseDateStr(dateStr);
  const dayOfWeek = d.getDay(); // 0 = Sunday .. 6 = Saturday
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  return addDays(dateStr, mondayOffset);
}

/** Compact "Mon 4 – Sun 10" style label for the week starting `weekStart`. */
export function formatWeekRange(weekStart: string): string {
  const start = parseDateStr(weekStart);
  const end = parseDateStr(addDays(weekStart, 6));
  const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endLabel =
    start.getMonth() === end.getMonth()
      ? end.toLocaleDateString('en-US', { day: 'numeric' })
      : end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${startLabel} – ${endLabel}`;
}
