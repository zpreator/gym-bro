'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Category, Exercise } from '@/lib/types';
import { CATEGORIES } from '@/lib/types';

export default function ExercisePicker({
  excludeIds,
  onSelect,
  onClose,
}: {
  excludeIds: number[];
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category | 'All'>('All');
  const [newCategory, setNewCategory] = useState<Category>('Full Body');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch('/api/exercises').then(r => r.json()).then(setExercises);
  }, []);

  const excludeSet = useMemo(() => new Set(excludeIds), [excludeIds]);

  const filtered = exercises.filter(e => {
    if (excludeSet.has(e.id)) return false;
    if (category !== 'All' && e.category !== category) return false;
    if (search.trim() && !e.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  const exactMatch = exercises.some(e => e.name.toLowerCase() === search.trim().toLowerCase());

  async function createAndSelect() {
    setCreating(true);
    try {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: search.trim(), category: newCategory }),
      });
      const exercise = await res.json();
      onSelect(exercise);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-lg max-h-[85vh] rounded-t-2xl sm:rounded-2xl flex flex-col">
        <div className="p-4 border-b border-stone-200 flex items-center gap-3">
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search exercises…"
            className="flex-1 bg-stone-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ember-400"
          />
          <button onClick={onClose} className="text-stone-500 text-sm font-medium px-1">
            Cancel
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto px-4 py-3 border-b border-stone-100">
          {(['All', ...CATEGORIES] as const).map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                category === c ? 'bg-ember-600 text-white' : 'bg-stone-100 text-stone-600'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {filtered.map(e => (
            <button
              key={e.id}
              onClick={() => onSelect(e)}
              className="w-full flex items-center justify-between px-3 py-3 rounded-xl active:bg-stone-100 text-left"
            >
              <span className="text-ink-700 font-medium">{e.name}</span>
              <span className="badge-ember">{e.category}</span>
            </button>
          ))}

          {filtered.length === 0 && search.trim() && !exactMatch && (
            <div className="p-4 space-y-3">
              <p className="text-stone-500 text-sm">No matches for “{search.trim()}”.</p>
              <div className="flex items-center gap-2">
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as Category)}
                  className="bg-stone-100 rounded-lg px-3 py-2 text-sm outline-none"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  onClick={createAndSelect}
                  disabled={creating}
                  className="flex-1 bg-moss-600 text-white rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  {creating ? 'Adding…' : `Add "${search.trim()}"`}
                </button>
              </div>
            </div>
          )}

          {filtered.length === 0 && !search.trim() && (
            <p className="p-4 text-stone-500 text-sm">No exercises left in this category.</p>
          )}
        </div>
      </div>
    </div>
  );
}
