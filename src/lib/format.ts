/** Formats a logged performance as "3×8 @ 140 lbs" (gym shorthand for sets×reps @ weight). */
export function formatPerformance(weight: number | null, reps: number | null, sets: number | null): string {
  const load = sets != null && reps != null ? `${sets}×${reps}` : reps != null ? `${reps} reps` : null;
  const parts = [load, weight != null ? `${weight} lbs` : null].filter((p): p is string => p != null);
  return parts.length ? parts.join(' @ ') : '—';
}
