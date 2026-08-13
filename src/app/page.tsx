'use client';
import { useCallback, useEffect, useState } from 'react';
import type { Exercise, ExerciseWithLast, LogStatus, Person } from '@/lib/types';
import { todayStr, relativeDate, formatDate, isFutureDate } from '@/lib/date';
import ExercisePicker from '@/components/ExercisePicker';
import ExerciseLogCard from '@/components/ExerciseLogCard';
import DateNav from '@/components/DateNav';

export default function TodayPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [cards, setCards] = useState<ExerciseWithLast[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayStr());
  const isFuture = isFutureDate(date);

  const load = useCallback(async () => {
    const [peopleRes, todayRes] = await Promise.all([
      fetch('/api/people').then(r => r.json()),
      fetch(`/api/today?date=${date}`).then(r => r.json()),
    ]);
    setPeople(peopleRes);
    setCards(todayRes);
    setLoading(false);
  }, [date]);

  useEffect(() => { load(); }, [load]);

  async function addExercise(exercise: Exercise) {
    setPickerOpen(false);
    const last = await fetch(`/api/logs/last?exercise_id=${exercise.id}&date=${date}`).then(r => r.json());
    const today: Record<number, null> = {};
    for (const p of people) today[p.id] = null;
    setCards(prev => [...prev, { ...exercise, last, today }]);
  }

  async function removeExercise(exerciseId: number) {
    setCards(prev => prev.filter(c => c.id !== exerciseId));
    await fetch(`/api/today?exercise_id=${exerciseId}&date=${date}`, { method: 'DELETE' });
  }

  async function saveEntry(
    exerciseId: number,
    personId: number,
    data: { weight: string; reps: string; sets: string; status: LogStatus },
  ) {
    if (!data.weight && !data.reps && data.status !== 'dnf') return;
    const entry = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exercise_id: exerciseId,
        person_id: personId,
        performed_at: date,
        weight: data.weight,
        reps: data.reps,
        sets: data.sets,
        status: data.status,
      }),
    }).then(r => r.json());
    setCards(prev =>
      prev.map(c => (c.id === exerciseId ? { ...c, today: { ...c.today, [personId]: entry } } : c)),
    );
  }

  const excludeIds = cards.map(c => c.id);

  const isToday = date === todayStr();

  return (
    <div className="px-4 pt-8 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink-700">{isFuture ? 'Plan' : 'Today'}</h1>
          <p className="text-stone-600 text-sm mt-0.5">
            {isToday ? 'Today · ' : `${relativeDate(date)} · `}
            {formatDate(date)}
          </p>
        </div>
        {!isToday && (
          <button
            onClick={() => setDate(todayStr())}
            className="shrink-0 mt-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-ember-700 active:bg-stone-100"
          >
            Today
          </button>
        )}
      </div>

      <DateNav date={date} onChange={setDate} />

      {loading && <p className="text-stone-500 text-sm">Loading…</p>}

      {!loading && cards.length === 0 && (
        <div className="bg-white rounded-2xl p-6 text-center space-y-1">
          <p className="text-ink-700 font-display font-semibold text-lg">No exercises yet</p>
          <p className="text-stone-500 text-sm">
            {isFuture
              ? 'Tap “Add Exercise” to plan this workout.'
              : 'Tap “Add Exercise” to start building this session.'}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {cards.map(card => (
          <ExerciseLogCard
            key={card.id}
            card={card}
            people={people}
            isFuture={isFuture}
            onSave={(personId, data) => saveEntry(card.id, personId, data)}
            onRemove={() => removeExercise(card.id)}
          />
        ))}
      </div>

      <button
        onClick={() => setPickerOpen(true)}
        className="w-full bg-ember-600 text-white rounded-2xl py-3.5 font-semibold active:scale-[0.98] transition-transform"
      >
        + Add Exercise
      </button>

      {pickerOpen && (
        <ExercisePicker excludeIds={excludeIds} onSelect={addExercise} onClose={() => setPickerOpen(false)} />
      )}
    </div>
  );
}
