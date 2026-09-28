'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Routine } from '@/lib/types';
import { parseDateStr, relativeDate } from '@/lib/date';

/** Routines not yet on this day, with last week's same-weekday routine first, then least recently done. */
function sortAvailable(routines: Routine[]): Routine[] {
  return routines
    .filter(r => !r.on_date)
    .sort((a, b) => {
      if (a.on_last_week !== b.on_last_week) return a.on_last_week ? -1 : 1;
      if (a.last_done === b.last_done) return a.id - b.id;
      if (a.last_done == null) return -1;
      if (b.last_done == null) return 1;
      return a.last_done < b.last_done ? -1 : 1;
    });
}

export default function TodayRoutines({
  routines,
  date,
  onStart,
  onRemove,
}: {
  routines: Routine[];
  date: string;
  onStart: (routine: Routine) => Promise<void>;
  onRemove: (routine: Routine) => Promise<void>;
}) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [showMore, setShowMore] = useState(false);

  if (routines.length === 0) {
    return (
      <Link
        href="/routines"
        className="block bg-white rounded-2xl px-4 py-3 text-sm text-stone-600 shadow-sm"
      >
        Do the same workouts every week? <span className="font-semibold text-ember-700">Set up a routine →</span>
      </Link>
    );
  }

  const started = routines.filter(r => r.on_date);
  const available = sortAvailable(routines);
  const collapsed = started.length > 0 && !showMore;
  const weekday = parseDateStr(date).toLocaleDateString('en-US', { weekday: 'long' });

  async function run(routine: Routine, action: (r: Routine) => Promise<void>) {
    setBusyId(routine.id);
    try {
      await action(routine);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-2">
      {started.map(r => (
        <div key={r.id} className="flex items-center justify-between gap-3 bg-moss-100 rounded-xl px-3 py-2">
          <span className="text-sm text-moss-700">
            <span className="font-semibold">{r.name}</span> routine
          </span>
          <button
            onClick={() => {
              if (confirm(`Remove the “${r.name}” routine from this day? Exercises you've already logged stay.`)) {
                run(r, onRemove);
              }
            }}
            disabled={busyId === r.id}
            className="text-xs font-semibold text-moss-700 disabled:opacity-50"
          >
            {busyId === r.id ? '…' : 'Undo'}
          </button>
        </div>
      ))}

      {available.length > 0 && collapsed && (
        <button onClick={() => setShowMore(true)} className="text-xs font-semibold text-ember-700 px-0.5">
          + Add another routine
        </button>
      )}

      {available.length > 0 && !collapsed && (
        <>
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wide px-0.5">
            {started.length > 0 ? 'Add another routine' : 'Start a routine'}
          </h2>
          <div className="space-y-2">
            {available.map(r => {
              const first = r.exercises[r.next_offset];
              const empty = r.exercises.length === 0;
              return (
                <div key={r.id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 shadow-sm">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink-700 truncate">{r.name}</span>
                      {r.on_last_week && (
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide bg-ember-600 text-white rounded px-1.5 py-0.5">
                          Last {weekday}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 truncate mt-0.5">
                      {empty
                        ? 'No exercises yet'
                        : `${r.exercises.length} exercises · starts with ${first.name}`}
                      {r.last_done && !r.on_last_week ? ` · last: ${relativeDate(r.last_done)}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => run(r, onStart)}
                    disabled={empty || busyId === r.id}
                    className="shrink-0 px-3 py-2 rounded-lg text-xs font-bold bg-ember-600 text-white disabled:opacity-40"
                  >
                    {busyId === r.id ? '…' : 'Start'}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
