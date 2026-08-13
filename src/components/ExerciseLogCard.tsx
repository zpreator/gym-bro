'use client';
import { useState } from 'react';
import type { ExerciseWithLast, Person, LogStatus } from '@/lib/types';
import { relativeDate } from '@/lib/date';
import { formatPerformance } from '@/lib/format';

interface RowState {
  weight: string;
  reps: string;
  sets: string;
  dnf: boolean;
  savedStatus: LogStatus | null;
  dirty: boolean;
  saving: boolean;
}

function initialRow(card: ExerciseWithLast, personId: number): RowState {
  const today = card.today[personId];
  const last = card.last[personId];
  const source = today ?? last;
  return {
    weight: source?.weight != null ? String(source.weight) : '',
    reps: source?.reps != null ? String(source.reps) : '',
    sets: source?.sets != null ? String(source.sets) : '',
    dnf: today?.status === 'dnf',
    savedStatus: today?.status ?? null,
    dirty: false,
    saving: false,
  };
}

function lastResultText(card: ExerciseWithLast, personId: number): string {
  const last = card.last[personId];
  if (!last) return 'No history yet';
  const when = relativeDate(last.performed_at);
  const perf = formatPerformance(last.weight, last.reps, last.sets);
  if (last.status === 'dnf') return `DNF ${perf} · ${when}`;
  return `${perf} · ${when}`;
}

export default function ExerciseLogCard({
  card,
  people,
  isFuture,
  onSave,
  onRemove,
}: {
  card: ExerciseWithLast;
  people: Person[];
  isFuture: boolean;
  onSave: (
    personId: number,
    data: { weight: string; reps: string; sets: string; status: LogStatus },
  ) => Promise<void>;
  onRemove: () => void;
}) {
  const [rows, setRows] = useState<Record<number, RowState>>(() => {
    const init: Record<number, RowState> = {};
    for (const p of people) init[p.id] = initialRow(card, p.id);
    return init;
  });

  function update(personId: number, patch: Partial<Pick<RowState, 'weight' | 'reps' | 'sets' | 'dnf'>>) {
    setRows(prev => ({ ...prev, [personId]: { ...prev[personId], ...patch, dirty: true } }));
  }

  async function save(personId: number) {
    const row = rows[personId];
    const status: LogStatus = isFuture ? 'planned' : row.dnf ? 'dnf' : 'done';
    setRows(prev => ({ ...prev, [personId]: { ...prev[personId], saving: true } }));
    await onSave(personId, { weight: row.weight, reps: row.reps, sets: row.sets, status });
    setRows(prev => ({
      ...prev,
      [personId]: { ...prev[personId], saving: false, savedStatus: status, dirty: false },
    }));
  }

  return (
    <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display font-semibold text-ink-700 text-lg leading-tight">{card.name}</h3>
          <span className="badge-ember mt-1 inline-block">{card.category}</span>
        </div>
        <button onClick={onRemove} aria-label="Remove exercise" className="text-stone-400 p-1 -m-1">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        {people.map(p => {
          const row = rows[p.id];
          const hasData = row.weight.trim() !== '' || row.reps.trim() !== '' || row.dnf;
          const unchanged = !row.dirty && row.savedStatus != null;

          let label: string;
          let btnClass: string;
          if (row.saving) {
            label = '…';
            btnClass = 'bg-ember-600 text-white';
          } else if (unchanged) {
            if (row.savedStatus === 'planned') {
              label = '○ Planned';
              btnClass = 'bg-stone-200 text-stone-600';
            } else if (row.savedStatus === 'dnf') {
              label = '✕ DNF';
              btnClass = 'bg-rust-100 text-rust-700';
            } else {
              label = '✓ Done';
              btnClass = 'bg-moss-100 text-moss-700';
            }
          } else {
            label = isFuture ? 'Plan' : 'Done';
            btnClass = 'bg-ember-600 text-white';
          }

          return (
            <div key={p.id} className="border-t border-stone-100 pt-3 first:border-t-0 first:pt-0">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="font-semibold text-sm text-ink-600">{p.name}</span>
                <span className="text-xs text-stone-500">{lastResultText(card, p.id)}</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  value={row.weight}
                  onChange={e => update(p.id, { weight: e.target.value })}
                  placeholder="lbs"
                  className="w-16 bg-stone-100 rounded-lg px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-ember-400"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  value={row.sets}
                  onChange={e => update(p.id, { sets: e.target.value })}
                  placeholder="sets"
                  className="w-14 bg-stone-100 rounded-lg px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-ember-400"
                />
                <span className="text-stone-400 text-xs">×</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={row.reps}
                  onChange={e => update(p.id, { reps: e.target.value })}
                  placeholder="reps"
                  className="w-14 bg-stone-100 rounded-lg px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-ember-400"
                />
              </div>

              <div className="flex items-center gap-2 mt-2">
                {!isFuture && (
                  <button
                    onClick={() => update(p.id, { dnf: !row.dnf })}
                    className={`px-2.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                      row.dnf ? 'bg-rust-500 text-white' : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    DNF
                  </button>
                )}
                <button
                  onClick={() => save(p.id)}
                  disabled={row.saving || !hasData || unchanged}
                  className={`ml-auto px-3 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-40 ${btnClass}`}
                >
                  {label}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
