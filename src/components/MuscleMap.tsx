'use client';
import type { Category, Person, WeeklyVolume } from '@/lib/types';
import { VOLUME_TARGET_MAX } from '@/lib/colors';

// Schematic front-view regions. Back and Full Body aren't visible from the front,
// so they're covered by the bar chart above instead of this map.
const REGIONS: { category: Category; label: string; d: string }[] = [
  { category: 'Shoulders', label: 'Shoulders', d: 'M14,24 h32 a3,3 0 0 1 3,3 v2 a3,3 0 0 1 -3,3 h-32 a3,3 0 0 1 -3,-3 v-2 a3,3 0 0 1 3,-3 z' },
  { category: 'Chest', label: 'Chest', d: 'M16,34 h28 a3,3 0 0 1 3,3 v11 a3,3 0 0 1 -3,3 h-28 a3,3 0 0 1 -3,-3 v-11 a3,3 0 0 1 3,-3 z' },
  { category: 'Core', label: 'Core', d: 'M18,53 h24 a3,3 0 0 1 3,3 v13 a3,3 0 0 1 -3,3 h-24 a3,3 0 0 1 -3,-3 v-13 a3,3 0 0 1 3,-3 z' },
  { category: 'Arms', label: 'Arms', d: 'M6,26 h8 v37 a4,4 0 0 1 -8,0 z' },
  { category: 'Arms', label: 'Arms', d: 'M46,26 h8 v37 a4,4 0 0 1 -8,0 v-37 z' },
  { category: 'Legs', label: 'Legs', d: 'M17,72 h10 v42 a5,5 0 0 1 -10,0 z' },
  { category: 'Legs', label: 'Legs', d: 'M33,72 h10 v42 a5,5 0 0 1 -10,0 v-42 z' },
];

function opacityFor(sets: number): number {
  if (sets <= 0) return 0;
  return Math.min(1, 0.3 + (sets / VOLUME_TARGET_MAX) * 0.7);
}

function Figure({ volumeForPerson }: { volumeForPerson: Record<string, number> }) {
  return (
    <svg viewBox="0 0 60 118" className="w-full max-w-[90px]" role="img" aria-hidden="true">
      <ellipse cx={30} cy={12} rx={9} ry={10} className="fill-stone-200" />
      {REGIONS.map((r, i) => {
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
  return (
    <div>
      <div className="flex items-start justify-around">
        {people.map(p => (
          <div key={p.id} className="flex flex-col items-center gap-1.5">
            <Figure volumeForPerson={volume[p.id] ?? {}} />
            <span className="text-xs font-semibold text-stone-600">{p.name}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-stone-400 text-center mt-2">
        Darker = more sets this week. Back &amp; full-body lifts aren’t shown here — see the chart above.
      </p>
    </div>
  );
}
