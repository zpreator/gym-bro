'use client';
import { useMemo, useState } from 'react';
import type { ExerciseHistoryPoint, Person } from '@/lib/types';
import { formatDate, relativeDate } from '@/lib/date';
import { formatPerformance } from '@/lib/format';
import { PERSON_COLORS } from '@/lib/colors';

const MAX_POINTS = 40;
const WIDTH = 320;
const HEIGHT = 148;
const PAD = { top: 16, right: 12, bottom: 24, left: 34 };

export default function ExerciseChart({
  points,
  people,
}: {
  points: ExerciseHistoryPoint[];
  people: Person[];
}) {
  const [active, setActive] = useState<{ personId: number; pointIndex: number } | null>(null);

  const usesWeight = points.some(p => p.weight != null);
  const metricOf = (p: ExerciseHistoryPoint) => (usesWeight ? p.weight : p.reps);
  const metricLabel = usesWeight ? 'lbs' : 'reps';

  const dates = useMemo(() => {
    const all = Array.from(new Set(points.map(p => p.performed_at))).sort();
    return all.slice(-MAX_POINTS);
  }, [points]);
  const dateIndex = useMemo(() => new Map(dates.map((d, i) => [d, i])), [dates]);

  const series = useMemo(
    () =>
      people.map((person, i) => {
        const seriesPoints = points
          .filter(p => p.person_id === person.id && metricOf(p) != null && dateIndex.has(p.performed_at))
          .map(p => ({ ...p, x: dateIndex.get(p.performed_at)! }));
        return { person, color: PERSON_COLORS[i % PERSON_COLORS.length], points: seriesPoints };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [points, people, dateIndex],
  );

  const allValues = series.flatMap(s => s.points.map(p => metricOf(p)!));
  const hasData = allValues.length > 0 && dates.length > 0;

  if (!hasData) {
    return <p className="text-stone-500 text-sm py-6 text-center">No completed sessions logged yet.</p>;
  }

  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const span = rawMax - rawMin || Math.max(rawMax, 1) * 0.2;
  const yMin = Math.max(0, rawMin - span * 0.15);
  const yMax = rawMax + span * 0.15;

  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const xScale = (i: number) => PAD.left + (dates.length <= 1 ? plotW / 2 : (i / (dates.length - 1)) * plotW);
  const yScale = (v: number) => PAD.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  const gridValues = [yMin, (yMin + yMax) / 2, yMax];
  const activeEntry =
    active != null ? series.find(s => s.person.id === active.personId)?.points[active.pointIndex] : null;

  return (
    <div>
      <div className="flex items-center gap-4 mb-1">
        {series.map(s => (
          <div key={s.person.id} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-xs font-semibold text-stone-600">{s.person.name}</span>
          </div>
        ))}
      </div>

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label={`Progress chart, ${metricLabel}`}>
        {gridValues.map((v, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={yScale(v)}
              y2={yScale(v)}
              stroke="#DFD9CC"
              strokeWidth={1}
            />
            <text x={PAD.left - 6} y={yScale(v)} textAnchor="end" dominantBaseline="middle" className="fill-stone-400" fontSize={9}>
              {Math.round(v)}
            </text>
          </g>
        ))}

        <text x={PAD.left} y={HEIGHT - 4} className="fill-stone-400" fontSize={9}>
          {formatDate(dates[0])}
        </text>
        <text x={WIDTH - PAD.right} y={HEIGHT - 4} textAnchor="end" className="fill-stone-400" fontSize={9}>
          {formatDate(dates[dates.length - 1])}
        </text>

        {series.map(s => (
          <g key={s.person.id}>
            {s.points.length > 1 && (
              <polyline
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                points={s.points.map(p => `${xScale(p.x)},${yScale(metricOf(p)!)}`).join(' ')}
              />
            )}
            {s.points.map((p, idx) => {
              const isActive = active?.personId === s.person.id && active.pointIndex === idx;
              return (
                <g
                  key={p.performed_at}
                  onClick={() => setActive(isActive ? null : { personId: s.person.id, pointIndex: idx })}
                  className="cursor-pointer"
                >
                  <circle cx={xScale(p.x)} cy={yScale(metricOf(p)!)} r={9} fill="transparent" />
                  <circle
                    cx={xScale(p.x)}
                    cy={yScale(metricOf(p)!)}
                    r={isActive ? 5 : 3}
                    fill={p.status === 'dnf' ? '#FAF9F6' : s.color}
                    stroke={s.color}
                    strokeWidth={p.status === 'dnf' ? 2 : 0}
                  />
                </g>
              );
            })}
          </g>
        ))}
      </svg>

      <div className="min-h-[2.25rem] mt-1">
        {activeEntry && (
          <div className="text-xs text-stone-600 bg-stone-50 rounded-lg px-2.5 py-1.5 inline-block">
            <span className="font-semibold text-ink-600">{relativeDate(activeEntry.performed_at)}</span>
            {' · '}
            {activeEntry.status === 'dnf' && <span className="text-rust-600 font-medium">DNF </span>}
            {formatPerformance(activeEntry.weight, activeEntry.reps, activeEntry.sets)}
          </div>
        )}
      </div>
    </div>
  );
}
