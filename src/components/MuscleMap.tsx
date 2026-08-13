'use client';
import { useState } from 'react';
import type { Category, Person, WeeklyVolume } from '@/lib/types';
import { VOLUME_TARGET_MAX } from '@/lib/colors';

type View = 'front' | 'back';

// Shared limb shapes (identical from front and back).
const SHOULDERS_D =
  'M15,28 C15,22 20,18 27,18 L37,18 C44,18 49,22 49,28 C49,31.5 46,33 41,32 L32,30.5 L23,32 C18,33 15,31.5 15,28 Z';
const LEFT_ARM_D =
  'M5,28 C5,25 6.5,23 9.5,23 C12.5,23 14,25 14,28 L14,60 C14,63.5 12.5,65.5 9.5,65.5 C6.5,65.5 5,63.5 5,60 Z';
const RIGHT_ARM_D =
  'M59,28 C59,25 57.5,23 54.5,23 C51.5,23 50,25 50,28 L50,60 C50,63.5 51.5,65.5 54.5,65.5 C57.5,65.5 59,63.5 59,60 Z';
const LEFT_LEG_D =
  'M18.5,76 C18.5,73 20.8,71 24,71 C27.2,71 29.5,73 29.5,76 L28.5,122 C28.5,126 26.5,129 24,129 C21.5,129 19.5,126 19.5,122 Z';
const RIGHT_LEG_D =
  'M34.5,76 C34.5,73 36.8,71 40,71 C43.2,71 45.5,73 45.5,76 L44.5,122 C44.5,126 42.5,129 40,129 C37.5,129 35.5,126 34.5,122 Z';

const FRONT_REGIONS: { category: Category; label: string; d: string }[] = [
  { category: 'Shoulders', label: 'Shoulders', d: SHOULDERS_D },
  {
    category: 'Chest',
    label: 'Chest',
    d: 'M19,34 C19,33 23,32.5 32,32.5 C41,32.5 45,33 45,34 L45,46 C45,50 40,52.5 32,52.5 C24,52.5 19,50 19,46 Z',
  },
  {
    category: 'Core',
    label: 'Core',
    d: 'M22,55 C22,54 26,53.5 32,53.5 C38,53.5 42,54 42,55 L42,66 C42,69.5 38,71.5 32,71.5 C26,71.5 22,69.5 22,66 Z',
  },
  { category: 'Arms', label: 'Arms', d: LEFT_ARM_D },
  { category: 'Arms', label: 'Arms', d: RIGHT_ARM_D },
  { category: 'Legs', label: 'Legs', d: LEFT_LEG_D },
  { category: 'Legs', label: 'Legs', d: RIGHT_LEG_D },
];

const BACK_REGIONS: { category: Category; label: string; d: string }[] = [
  { category: 'Shoulders', label: 'Shoulders', d: SHOULDERS_D },
  {
    category: 'Back',
    label: 'Back',
    d: 'M18,34 C18,33 23,32.5 32,32.5 C41,32.5 46,33 46,34 L46,64 C46,68.5 40,71.5 32,71.5 C24,71.5 18,68.5 18,64 Z',
  },
  { category: 'Arms', label: 'Arms', d: LEFT_ARM_D },
  { category: 'Arms', label: 'Arms', d: RIGHT_ARM_D },
  { category: 'Legs', label: 'Legs', d: LEFT_LEG_D },
  { category: 'Legs', label: 'Legs', d: RIGHT_LEG_D },
];

function opacityFor(sets: number): number {
  if (sets <= 0) return 0;
  return Math.min(1, 0.3 + (sets / VOLUME_TARGET_MAX) * 0.7);
}

function Figure({ volumeForPerson, view }: { volumeForPerson: Record<string, number>; view: View }) {
  const regions = view === 'front' ? FRONT_REGIONS : BACK_REGIONS;
  return (
    <svg viewBox="0 0 64 134" className="w-full max-w-[92px]" role="img" aria-hidden="true">
      <path d="M28,17 L36,17 L34,22 L30,22 Z" className="fill-stone-200" />
      <ellipse cx={32} cy={11} rx={7.5} ry={8.5} className="fill-stone-200" />
      {regions.map((r, i) => {
        const sets = volumeForPerson[r.category] ?? 0;
        return (
          <path key={i} d={r.d} fill="#953619" fillOpacity={opacityFor(sets)} stroke="#B8AE96" strokeWidth={0.75}>
            <title>{`${r.label}: ${sets} sets this week`}</title>
          </path>
        );
      })}
    </svg>
  );
}

export default function MuscleMap({ volume, people }: { volume: WeeklyVolume['volume']; people: Person[] }) {
  const [view, setView] = useState<View>('front');

  return (
    <div>
      <div className="flex justify-center mb-3">
        <div className="flex gap-1 bg-stone-100 rounded-lg p-1">
          {(['front', 'back'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-colors ${
                view === v ? 'bg-white text-ember-700 shadow-sm' : 'text-stone-500'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-start justify-around">
        {people.map(p => (
          <div key={p.id} className="flex flex-col items-center gap-1.5">
            <Figure volumeForPerson={volume[p.id] ?? {}} view={view} />
            <span className="text-xs font-semibold text-stone-600">{p.name}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-stone-400 text-center mt-2">
        Darker = more sets this week. Full-body lifts aren’t tied to one muscle, so they’re not shown here.
      </p>
    </div>
  );
}
