'use client';
import { useEffect, useState } from 'react';
import type { Exercise, Routine } from '@/lib/types';
import { relativeDate, todayStr } from '@/lib/date';
import ExercisePicker from '@/components/ExercisePicker';

interface Draft {
  id: number | null; // null = new routine
  name: string;
  exercises: Exercise[];
}

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch(`/api/routines?date=${todayStr()}`).then(r => r.json());
    setRoutines(res);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function move(index: number, delta: number) {
    setDraft(d => {
      if (!d) return d;
      const target = index + delta;
      if (target < 0 || target >= d.exercises.length) return d;
      const exercises = [...d.exercises];
      [exercises[index], exercises[target]] = [exercises[target], exercises[index]];
      return { ...d, exercises };
    });
  }

  function removeFromDraft(exerciseId: number) {
    setDraft(d => (d ? { ...d, exercises: d.exercises.filter(e => e.id !== exerciseId) } : d));
  }

  function addToDraft(exercise: Exercise) {
    setPickerOpen(false);
    setDraft(d => (d ? { ...d, exercises: [...d.exercises, exercise] } : d));
  }

  async function saveDraft() {
    if (!draft || !draft.name.trim()) return;
    setSaving(true);
    try {
      const body = JSON.stringify({ name: draft.name, exercise_ids: draft.exercises.map(e => e.id) });
      await fetch(draft.id == null ? '/api/routines' : `/api/routines/${draft.id}`, {
        method: draft.id == null ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      setDraft(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function deleteRoutine(routine: Routine) {
    if (!confirm(`Delete the “${routine.name}” routine? Past workouts stay in your history.`)) return;
    await fetch(`/api/routines/${routine.id}`, { method: 'DELETE' });
    if (draft?.id === routine.id) setDraft(null);
    await load();
  }

  const editor = draft && (
    <div className="bg-white rounded-2xl p-4 space-y-3 shadow-sm">
      <input
        autoFocus={draft.id == null}
        value={draft.name}
        onChange={e => setDraft({ ...draft, name: e.target.value })}
        placeholder="Routine name, e.g. Chest & Triceps"
        className="w-full bg-stone-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ember-400"
      />

      {draft.exercises.length === 0 ? (
        <p className="text-stone-500 text-sm px-1">No exercises yet.</p>
      ) : (
        <ol className="divide-y divide-stone-100">
          {draft.exercises.map((e, i) => (
            <li key={e.id} className="flex items-center gap-2 py-2">
              <span className="w-5 text-xs font-semibold text-stone-400 text-right shrink-0">{i + 1}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-ink-700 truncate">{e.name}</span>
                <span className="badge-ember mt-0.5 inline-block">{e.category}</span>
              </span>
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Move up"
                className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === draft.exercises.length - 1}
                aria-label="Move down"
                className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 disabled:opacity-30"
              >
                ↓
              </button>
              <button
                onClick={() => removeFromDraft(e.id)}
                aria-label="Remove from routine"
                className="w-8 h-8 rounded-lg text-stone-400"
              >
                ✕
              </button>
            </li>
          ))}
        </ol>
      )}

      <button
        onClick={() => setPickerOpen(true)}
        className="w-full bg-stone-100 text-ink-600 rounded-lg py-2.5 text-sm font-semibold"
      >
        + Add Exercise
      </button>

      <div className="flex gap-2">
        <button
          onClick={() => setDraft(null)}
          className="flex-1 bg-stone-100 text-stone-600 rounded-lg py-2.5 text-sm font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={saveDraft}
          disabled={saving || !draft.name.trim()}
          className="flex-1 bg-moss-600 text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="px-4 pt-8 space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink-700">Routines</h1>
        <p className="text-stone-600 text-sm mt-0.5">
          Each time you do a routine, the order rotates by one — the first exercise moves to the end.
        </p>
      </div>

      {draft?.id == null && draft ? (
        editor
      ) : (
        <button
          onClick={() => setDraft({ id: null, name: '', exercises: [] })}
          className="w-full bg-white text-ink-600 rounded-2xl py-3 font-semibold text-sm shadow-sm"
        >
          + New Routine
        </button>
      )}

      {loading && <p className="text-stone-500 text-sm">Loading…</p>}

      {!loading && routines.length === 0 && !draft && (
        <div className="bg-white rounded-2xl p-6 text-center space-y-1">
          <p className="text-ink-700 font-display font-semibold text-lg">No routines yet</p>
          <p className="text-stone-500 text-sm">
            Save the exercises you do on a given day, then start them from the Today page in one tap.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {routines.map(routine =>
          draft?.id === routine.id ? (
            <div key={routine.id}>{editor}</div>
          ) : (
            <div key={routine.id} className="bg-white rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display font-semibold text-ink-700 text-lg leading-tight">{routine.name}</h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {routine.last_done ? `Last done: ${relativeDate(routine.last_done)}` : 'Not done yet'}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setDraft({ id: routine.id, name: routine.name, exercises: routine.exercises })}
                    className="text-ember-700 text-xs font-semibold"
                  >
                    Edit
                  </button>
                  <button onClick={() => deleteRoutine(routine)} className="text-stone-400 text-xs font-semibold">
                    Delete
                  </button>
                </div>
              </div>

              {routine.exercises.length === 0 ? (
                <p className="text-stone-500 text-sm">No exercises — tap Edit to add some.</p>
              ) : (
                <ol className="space-y-1.5">
                  {routine.exercises.map((e, i) => (
                    <li key={e.id} className="flex items-center gap-2 text-sm">
                      <span className="w-5 text-xs font-semibold text-stone-400 text-right shrink-0">{i + 1}</span>
                      <span className="text-ink-700">{e.name}</span>
                      {i === routine.next_offset && (
                        <span className="text-[10px] font-bold uppercase tracking-wide bg-moss-100 text-moss-700 rounded px-1.5 py-0.5">
                          {routine.on_date ? 'Up first today' : 'Up first next time'}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ),
        )}
      </div>

      {pickerOpen && draft && (
        <ExercisePicker
          excludeIds={draft.exercises.map(e => e.id)}
          onSelect={addToDraft}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
