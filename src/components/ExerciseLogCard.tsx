'use client';
import { useState } from 'react';
import type { ExerciseWithLast, Person, LogStatus } from '@/lib/types';
import { relativeDate } from '@/lib/date';

interface RowState {
  weight: string;
  reps: string;
  status: LogStatus;
  saved: boolean;
  saving: boolean;
}

function initialRow(card: ExerciseWithLast, personId: number): RowState {
  const today = card.today[personId];
  return {
    weight: today?.weight != null ? String(today.weight) : '',
    reps: today?.reps != null ? String(today.reps) : '',
    status: today?.status ?? 'done',
    saved: today != null,
    saving: false,
  };
}

function lastResultText(card: ExerciseWithLast, personId: number): string {
  const last = card.last[personId];
  if (!last) return 'No history yet';
  const when = relativeDate(last.performed_at);
  if (last.status === 'dnf') {
    const attempt = last.weight != null ? `${last.weight} lbs` : 'attempted';
    return `DNF ${attempt} · ${when}`;
  }
  const weight = last.weight != null ? `${last.weight} lbs` : '—';
  const reps = last.reps != null ? ` × ${last.reps}` : '';
  return `${weight}${reps} · ${when}`;
}

export default function ExerciseLogCard({
  card,
  people,
  onSave,
  onRemove,
}: {
  card: ExerciseWithLast;
  people: Person[];
  onSave: (personId: number, data: { weight: string; reps: string; status: LogStatus }) => Promise<void>;
  onRemove: () => void;
}) {
  const [rows, setRows] = useState<Record<number, RowState>>(() => {
    const init: Record<number, RowState> = {};
    for (const p of people) init[p.id] = initialRow(card, p.id);
    return init;
  });

  function update(personId: number, patch: Partial<RowState>) {
    setRows(prev => ({ ...prev, [personId]: { ...prev[personId], ...patch, saved: false } }));
  }

  async function save(personId: number) {
    const row = rows[personId];
    setRows(prev => ({ ...prev, [personId]: { ...prev[personId], saving: true } }));
    await onSave(personId, { weight: row.weight, reps: row.reps, status: row.status });
    setRows(prev => ({ ...prev, [personId]: { ...prev[personId], saving: false, saved: true } }));
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
                  className="w-20 bg-stone-100 rounded-lg px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-ember-400"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  value={row.reps}
                  onChange={e => update(p.id, { reps: e.target.value })}
                  placeholder="reps"
                  className="w-16 bg-stone-100 rounded-lg px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-ember-400"
                />
                <button
                  onClick={() => update(p.id, { status: row.status === 'dnf' ? 'done' : 'dnf' })}
                  className={`px-2.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                    row.status === 'dnf' ? 'bg-rust-500 text-white' : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  DNF
                </button>
                <button
                  onClick={() => save(p.id)}
                  disabled={row.saving || (row.saved && !row.weight && !row.reps && row.status !== 'dnf')}
                  className={`ml-auto px-3 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-40 ${
                    row.saved ? 'bg-moss-100 text-moss-700' : 'bg-ember-600 text-white'
                  }`}
                >
                  {row.saving ? '…' : row.saved ? '✓ Saved' : 'Save'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
