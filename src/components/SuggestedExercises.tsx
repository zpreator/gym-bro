'use client';
import type { Exercise, ExerciseWithLast } from '@/lib/types';
import { parseDateStr } from '@/lib/date';

function wasCompleted(card: ExerciseWithLast): boolean {
  return Object.values(card.today).some(e => e && (e.status === 'done' || e.status === 'dnf'));
}

export default function SuggestedExercises({
  candidates,
  excludeIds,
  sourceDate,
  onAdd,
}: {
  candidates: ExerciseWithLast[];
  excludeIds: number[];
  sourceDate: string;
  onAdd: (exercise: Exercise) => void;
}) {
  const excludeSet = new Set(excludeIds);
  const suggestions = candidates.filter(c => !excludeSet.has(c.id) && wasCompleted(c));

  if (suggestions.length === 0) return null;

  const weekday = parseDateStr(sourceDate).toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wide px-0.5">
        Last {weekday}
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {suggestions.map(exercise => (
          <button
            key={exercise.id}
            onClick={() => onAdd(exercise)}
            className="shrink-0 flex items-center gap-2.5 bg-white rounded-xl pl-3 pr-2.5 py-2 shadow-sm active:scale-[0.98] transition-transform"
          >
            <span className="text-left">
              <span className="block text-sm font-medium text-ink-700 leading-tight whitespace-nowrap">
                {exercise.name}
              </span>
              <span className="badge-ember mt-1 inline-block">{exercise.category}</span>
            </span>
            <span
              aria-hidden="true"
              className="w-6 h-6 rounded-full bg-ember-600 text-white flex items-center justify-center text-base font-bold leading-none shrink-0"
            >
              +
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
