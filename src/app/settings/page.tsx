'use client';
import { useEffect, useState } from 'react';
import type { Person } from '@/lib/types';

export default function SettingsPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [names, setNames] = useState<Record<number, string>>({});
  const [savedId, setSavedId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/people').then(r => r.json()).then((res: Person[]) => {
      setPeople(res);
      const map: Record<number, string> = {};
      for (const p of res) map[p.id] = p.name;
      setNames(map);
    });
  }, []);

  async function save(id: number) {
    const name = names[id]?.trim();
    if (!name) return;
    await fetch('/api/people', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name }),
    });
    setSavedId(id);
    setTimeout(() => setSavedId(null), 1500);
  }

  return (
    <div className="px-4 pt-8 space-y-5">
      <h1 className="text-2xl font-display font-bold text-ink-700">Settings</h1>

      <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wide text-stone-500">Who&rsquo;s lifting?</h2>
        {people.map(p => (
          <div key={p.id} className="flex items-center gap-2">
            <input
              value={names[p.id] ?? ''}
              onChange={e => setNames(prev => ({ ...prev, [p.id]: e.target.value }))}
              className="flex-1 bg-stone-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ember-400"
            />
            <button
              onClick={() => save(p.id)}
              className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                savedId === p.id ? 'bg-moss-100 text-moss-700' : 'bg-ember-600 text-white'
              }`}
            >
              {savedId === p.id ? '✓ Saved' : 'Save'}
            </button>
          </div>
        ))}
      </div>

      <p className="text-stone-500 text-xs px-1">
        These names show up everywhere you log a set — on today&rsquo;s session and in history.
      </p>
    </div>
  );
}
