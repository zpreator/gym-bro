'use client';
import { useCallback, useEffect, useState } from 'react';
import type { HistoryDay } from '@/lib/types';
import { relativeDate } from '@/lib/date';

export default function HistoryPage() {
  const [days, setDays] = useState<HistoryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const loadInitial = useCallback(async () => {
    const res: HistoryDay[] = await fetch('/api/history?limit=14').then(r => r.json());
    setDays(res);
    setHasMore(res.length === 14);
    setLoading(false);
  }, []);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  async function loadMore() {
    const last = days[days.length - 1];
    if (!last) return;
    const more: HistoryDay[] = await fetch(`/api/history?limit=14&before=${last.performed_at}`).then(r => r.json());
    setDays(prev => [...prev, ...more]);
    setHasMore(more.length === 14);
  }

  return (
    <div className="px-4 pt-8 space-y-5">
      <h1 className="text-2xl font-display font-bold text-ink-700">History</h1>

      {loading && <p className="text-stone-500 text-sm">Loading…</p>}

      {!loading && days.length === 0 && (
        <div className="bg-white rounded-2xl p-6 text-center">
          <p className="text-stone-500 text-sm">No workouts logged yet.</p>
        </div>
      )}

      <div className="space-y-5">
        {days.map(day => (
          <div key={day.performed_at} className="bg-white rounded-2xl p-4 space-y-3 shadow-sm">
            <h2 className="font-display font-semibold text-ink-700">{relativeDate(day.performed_at)}</h2>
            <div className="space-y-2">
              {groupByExercise(day).map(([exerciseName, entries]) => (
                <div key={exerciseName} className="border-t border-stone-100 pt-2 first:border-t-0 first:pt-0">
                  <p className="text-sm font-semibold text-ink-600 mb-1">{exerciseName}</p>
                  <div className="space-y-0.5">
                    {entries.map(e => (
                      <div key={e.id} className="flex items-center justify-between text-sm">
                        <span className="text-stone-600">{e.person_name}</span>
                        <span className={e.status === 'dnf' ? 'text-rust-600 font-medium' : 'text-ink-700'}>
                          {e.status === 'dnf' ? 'DNF ' : ''}
                          {e.weight != null ? `${e.weight} lbs` : '—'}
                          {e.reps != null ? ` × ${e.reps}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!loading && hasMore && days.length > 0 && (
        <button
          onClick={loadMore}
          className="w-full bg-white text-ink-600 rounded-2xl py-3 font-semibold text-sm shadow-sm"
        >
          Load more
        </button>
      )}
    </div>
  );
}

function groupByExercise(day: HistoryDay) {
  const map = new Map<string, HistoryDay['entries']>();
  for (const entry of day.entries) {
    if (!map.has(entry.exercise_name)) map.set(entry.exercise_name, []);
    map.get(entry.exercise_name)!.push(entry);
  }
  return Array.from(map.entries());
}
