'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Category, Exercise } from '@/lib/types';
import { CATEGORIES } from '@/lib/types';

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('Full Body');
  const [saving, setSaving] = useState(false);

  function load() {
    fetch('/api/exercises').then(r => r.json()).then(setExercises);
  }
  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => {
    const filtered = exercises.filter(e =>
      !search.trim() || e.name.toLowerCase().includes(search.trim().toLowerCase()),
    );
    const map = new Map<Category, Exercise[]>();
    for (const cat of CATEGORIES) map.set(cat, []);
    for (const e of filtered) map.get(e.category)?.push(e);
    return map;
  }, [exercises, search]);

  async function addExercise() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, category: newCategory }),
      });
      setNewName('');
      setAdding(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function removeExercise(id: number) {
    if (!confirm('Remove this custom exercise?')) return;
    await fetch(`/api/exercises/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="px-4 pt-8 space-y-5">
      <h1 className="text-2xl font-display font-bold text-ink-700">Exercises</h1>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search exercises…"
        className="w-full bg-white rounded-xl px-4 py-2.5 text-sm outline-none shadow-sm"
      />

      {adding ? (
        <div className="bg-white rounded-2xl p-4 space-y-3 shadow-sm">
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Exercise name"
            className="w-full bg-stone-100 rounded-lg px-3 py-2.5 text-sm outline-none"
          />
          <select
            value={newCategory}
            onChange={e => setNewCategory(e.target.value as Category)}
            className="w-full bg-stone-100 rounded-lg px-3 py-2.5 text-sm outline-none"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => setAdding(false)}
              className="flex-1 bg-stone-100 text-stone-600 rounded-lg py-2.5 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={addExercise}
              disabled={saving || !newName.trim()}
              className="flex-1 bg-moss-600 text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {saving ? 'Adding…' : 'Add'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full bg-white text-ink-600 rounded-2xl py-3 font-semibold text-sm shadow-sm"
        >
          + Add Custom Exercise
        </button>
      )}

      <div className="space-y-5">
        {CATEGORIES.map(cat => {
          const list = grouped.get(cat) ?? [];
          if (list.length === 0) return null;
          return (
            <div key={cat}>
              <h2 className="text-xs font-bold uppercase tracking-wide text-stone-500 mb-2">{cat}</h2>
              <div className="bg-white rounded-2xl shadow-sm divide-y divide-stone-100">
                {list.map(e => (
                  <div key={e.id} className="flex items-center justify-between px-4 py-3">
                    <span className="text-ink-700 text-sm font-medium">{e.name}</span>
                    {e.is_custom && (
                      <button onClick={() => removeExercise(e.id)} className="text-stone-400 text-xs font-semibold">
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
