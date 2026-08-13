'use client';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Exercise, ExerciseHistoryPoint, HistoryDay, Person, WeeklyVolume } from '@/lib/types';
import { relativeDate, todayStr, getWeekStart, addDays, formatWeekRange } from '@/lib/date';
import { formatPerformance } from '@/lib/format';
import ExerciseChart from '@/components/ExerciseChart';
import VolumeChart from '@/components/VolumeChart';
import MuscleMap from '@/components/MuscleMap';

type Tab = 'log' | 'progress' | 'volume';
const TABS: { id: Tab; label: string }[] = [
  { id: 'log', label: 'Log' },
  { id: 'progress', label: 'Progress' },
  { id: 'volume', label: 'Volume' },
];

export default function HistoryPage() {
  return (
    <Suspense>
      <HistoryContent />
    </Suspense>
  );
}

function HistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || (searchParams.get('exercise') ? 'progress' : 'log');
  const [tab, setTab] = useState<Tab>(initialTab);

  function selectTab(next: Tab) {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', next);
    if (next !== 'progress') params.delete('exercise');
    router.replace(`/history?${params.toString()}`);
  }

  return (
    <div className="px-4 pt-8 space-y-5">
      <h1 className="text-2xl font-display font-bold text-ink-700">History</h1>

      <div className="flex gap-1.5 bg-stone-100 rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => selectTab(t.id)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === t.id ? 'bg-white text-ember-700 shadow-sm' : 'text-stone-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'log' && <LogTab />}
      {tab === 'progress' && <ProgressTab />}
      {tab === 'volume' && <VolumeTab />}
    </div>
  );
}

// ── Log ──────────────────────────────────────────────────────────────────────

function LogTab() {
  const [days, setDays] = useState<HistoryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const loadInitial = useCallback(async () => {
    const res: HistoryDay[] = await fetch('/api/history?limit=14').then(r => r.json());
    setDays(res);
    setHasMore(res.length === 14);
    setLoading(false);
  }, []);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  async function loadMore() {
    const last = days[days.length - 1];
    if (!last) return;
    const more: HistoryDay[] = await fetch(`/api/history?limit=14&before=${last.performed_at}`).then(r => r.json());
    setDays(prev => [...prev, ...more]);
    setHasMore(more.length === 14);
  }

  return (
    <div className="space-y-5">
      {loading && <p className="text-stone-500 text-sm">Loading…</p>}

      {!loading && days.length === 0 && (
        <div className="bg-white rounded-2xl p-6 text-center">
          <p className="text-stone-500 text-sm">No workouts logged yet.</p>
        </div>
      )}

      <div className="space-y-5">
        {days.map(day => (
          <div key={day.performed_at} className="bg-white rounded-2xl p-4 space-y-3 shadow-sm">
            <h2 className="font-display font-semibold text-ink-700">{relativeDate(day.performed_at)}</h2>
            <div className="space-y-2">
              {groupByExercise(day).map(([exerciseName, entries]) => (
                <div key={exerciseName} className="border-t border-stone-100 pt-2 first:border-t-0 first:pt-0">
                  <p className="text-sm font-semibold text-ink-600 mb-1">{exerciseName}</p>
                  <div className="space-y-0.5">
                    {entries.map(e => (
                      <div key={e.id} className="flex items-center justify-between text-sm">
                        <span className="text-stone-600">{e.person_name}</span>
                        <span className={e.status === 'dnf' ? 'text-rust-600 font-medium' : 'text-ink-700'}>
                          {e.status === 'dnf' ? 'DNF ' : ''}
                          {formatPerformance(e.weight, e.reps, e.sets)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!loading && hasMore && days.length > 0 && (
        <button
          onClick={loadMore}
          className="w-full bg-white text-ink-600 rounded-2xl py-3 font-semibold text-sm shadow-sm"
        >
          Load more
        </button>
      )}
    </div>
  );
}

function groupByExercise(day: HistoryDay) {
  const map = new Map<string, HistoryDay['entries']>();
  for (const entry of day.entries) {
    if (!map.has(entry.exercise_name)) map.set(entry.exercise_name, []);
    map.get(entry.exercise_name)!.push(entry);
  }
  return Array.from(map.entries());
}

// ── Progress ─────────────────────────────────────────────────────────────────

function ProgressTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exerciseId = searchParams.get('exercise') ? Number(searchParams.get('exercise')) : null;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [points, setPoints] = useState<ExerciseHistoryPoint[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/exercises').then(r => r.json()),
      fetch('/api/people').then(r => r.json()),
    ]).then(([ex, ppl]) => {
      setExercises(ex);
      setPeople(ppl);
    });
  }, []);

  useEffect(() => {
    if (!exerciseId) {
      setPoints([]);
      return;
    }
    setLoading(true);
    fetch(`/api/exercises/${exerciseId}/history`)
      .then(r => r.json())
      .then(res => { setPoints(res); setLoading(false); });
  }, [exerciseId]);

  function pickExercise(id: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'progress');
    params.set('exercise', String(id));
    router.replace(`/history?${params.toString()}`);
    setSearch('');
  }

  function changeExercise() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('exercise');
    router.replace(`/history?${params.toString()}`);
  }

  const selectedExercise = exercises.find(e => e.id === exerciseId);
  const filtered = useMemo(
    () => exercises.filter(e => e.name.toLowerCase().includes(search.trim().toLowerCase())),
    [exercises, search],
  );

  if (!exerciseId || !selectedExercise) {
    return (
      <div className="space-y-3">
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search exercises…"
          className="w-full bg-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ember-400 shadow-sm"
        />
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-stone-100 max-h-[60vh] overflow-y-auto">
          {filtered.map(e => (
            <button
              key={e.id}
              onClick={() => pickExercise(e.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left active:bg-stone-50"
            >
              <span className="text-ink-700 font-medium">{e.name}</span>
              <span className="badge-ember">{e.category}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="p-4 text-stone-500 text-sm">No exercises match “{search.trim()}”.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold text-ink-700 text-lg leading-tight">{selectedExercise.name}</h3>
          <span className="badge-ember mt-1 inline-block">{selectedExercise.category}</span>
        </div>
        <button onClick={changeExercise} className="shrink-0 text-xs font-semibold text-ember-700 px-1 py-1">
          Change
        </button>
      </div>

      {loading ? (
        <p className="text-stone-500 text-sm py-6 text-center">Loading…</p>
      ) : (
        <ExerciseChart points={points} people={people} />
      )}
    </div>
  );
}

// ── Volume ───────────────────────────────────────────────────────────────────

function VolumeTab() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(todayStr()));
  const [people, setPeople] = useState<Person[]>([]);
  const [volume, setVolume] = useState<WeeklyVolume['volume']>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/people').then(r => r.json()).then(setPeople);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/volume?week=${weekStart}`)
      .then(r => r.json())
      .then((res: WeeklyVolume) => { setVolume(res.volume); setLoading(false); });
  }, [weekStart]);

  const isCurrentWeek = weekStart === getWeekStart(todayStr());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white rounded-2xl px-3 py-2.5 shadow-sm">
        <button onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week" className="p-2 text-stone-500">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-ink-700">{formatWeekRange(weekStart)}</p>
          {isCurrentWeek && <p className="text-[10px] text-ember-600 font-semibold uppercase tracking-wide">This week</p>}
        </div>
        <button
          onClick={() => setWeekStart(addDays(weekStart, 7))}
          disabled={isCurrentWeek}
          aria-label="Next week"
          className="p-2 text-stone-500 disabled:opacity-30"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {loading ? (
        <p className="text-stone-500 text-sm py-6 text-center">Loading…</p>
      ) : (
        <>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-display font-semibold text-ink-700 mb-3">Sets per muscle group</h3>
            <VolumeChart volume={volume} people={people} />
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-display font-semibold text-ink-700 mb-3">Muscle map</h3>
            <MuscleMap volume={volume} people={people} />
          </div>
        </>
      )}
    </div>
  );
}
