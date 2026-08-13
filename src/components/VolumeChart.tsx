'use client';
import { useState } from 'react';
import type { Person, WeeklyVolume } from '@/lib/types';
import { MUSCLE_CATEGORIES } from '@/lib/types';
import { PERSON_COLORS, VOLUME_TARGET_MIN, VOLUME_TARGET_MAX } from '@/lib/colors';

const SIZE_W = 340;
const SIZE_H = 300;
const CX = 170;
const CY = 150;
const RADIUS = 95;
const LABEL_OFFSET = 15;
const GRID_RINGS = 4;

const N = MUSCLE_CATEGORIES.length;
const ANGLE_STEP = (2 * Math.PI) / N;
const START_ANGLE = -Math.PI / 2;

function angleFor(i: number): number {
  return START_ANGLE + i * ANGLE_STEP;
}

function pointAt(i: number, r: number): [number, number] {
  const a = angleFor(i);
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

function ringPoints(r: number): [number, number][] {
  return MUSCLE_CATEGORIES.map((_, i) => pointAt(i, r));
}

function polygonPath(points: [number, number][]): string {
  return `M${points.map(p => p.join(',')).join('L')}Z`;
}

export default function VolumeChart({ volume, people }: { volume: WeeklyVolume['volume']; people: Person[] }) {
  const [active, setActive] = useState<{ personId: number; index: number } | null>(null);

  const dataMax = Math.max(
    0,
    ...MUSCLE_CATEGORIES.flatMap(cat => people.map(p => volume[p.id]?.[cat] ?? 0)),
  );
  const maxVal = Math.max(VOLUME_TARGET_MAX * 1.2, dataMax * 1.15);
  const valueRadius = (v: number) => (v / maxVal) * RADIUS;

  const gaps = people.map(p => ({
    person: p,
    categories: MUSCLE_CATEGORIES.filter(cat => (volume[p.id]?.[cat] ?? 0) < VOLUME_TARGET_MIN),
  }));

  const activePerson = active ? people.find(p => p.id === active.personId) : null;
  const activeCategory = active ? MUSCLE_CATEGORIES[active.index] : null;
  const activeValue = active && activeCategory ? volume[active.personId]?.[activeCategory] ?? 0 : null;

  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
        {people.map((p, i) => (
          <div key={p.id} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PERSON_COLORS[i % PERSON_COLORS.length] }} />
            <span className="text-xs font-semibold text-stone-600">{p.name}</span>
          </div>
        ))}
        <span className="ml-auto text-[10px] text-stone-400">
          Target {VOLUME_TARGET_MIN}–{VOLUME_TARGET_MAX} sets/wk
        </span>
      </div>

      <svg viewBox={`0 0 ${SIZE_W} ${SIZE_H}`} className="w-full" role="img" aria-label="Weekly sets per muscle group">
        {Array.from({ length: GRID_RINGS }, (_, i) => {
          const r = (RADIUS * (i + 1)) / GRID_RINGS;
          return (
            <polygon
              key={i}
              points={ringPoints(r).map(p => p.join(',')).join(' ')}
              fill="none"
              stroke="#DFD9CC"
              strokeWidth={1}
            />
          );
        })}

        {MUSCLE_CATEGORIES.map((cat, i) => {
          const [x, y] = pointAt(i, RADIUS);
          return <line key={cat} x1={CX} y1={CY} x2={x} y2={y} stroke="#DFD9CC" strokeWidth={1} />;
        })}

        <path
          d={`${polygonPath(ringPoints(valueRadius(VOLUME_TARGET_MAX)))} ${polygonPath(ringPoints(valueRadius(VOLUME_TARGET_MIN)))}`}
          fillRule="evenodd"
          fill="#DFD9CC"
          fillOpacity={0.4}
        />

        {MUSCLE_CATEGORIES.map((cat, i) => {
          const [x, y] = pointAt(i, RADIUS + LABEL_OFFSET);
          const cos = Math.cos(angleFor(i));
          const anchor = cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle';
          return (
            <text
              key={cat}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize={10}
              className="fill-ink-600 font-semibold"
            >
              {cat}
            </text>
          );
        })}

        {people.map((p, pi) => {
          const color = PERSON_COLORS[pi % PERSON_COLORS.length];
          const pts = MUSCLE_CATEGORIES.map((cat, i) => pointAt(i, valueRadius(volume[p.id]?.[cat] ?? 0)));
          return (
            <g key={p.id}>
              <path d={polygonPath(pts)} fill={color} fillOpacity={0.14} stroke={color} strokeWidth={2} strokeLinejoin="round" />
              {pts.map(([x, y], i) => {
                const isActive = active?.personId === p.id && active.index === i;
                return (
                  <g
                    key={i}
                    onClick={() => setActive(isActive ? null : { personId: p.id, index: i })}
                    className="cursor-pointer"
                  >
                    <circle cx={x} cy={y} r={9} fill="transparent" />
                    <circle cx={x} cy={y} r={isActive ? 5 : 3} fill={color} />
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>

      <div className="min-h-[1.75rem]">
        {activePerson && activeCategory && (
          <span className="text-xs text-stone-600 bg-stone-50 rounded-lg px-2.5 py-1.5 inline-block">
            <span className="font-semibold text-ink-600">{activeCategory}</span> — {activeValue} sets ({activePerson.name})
          </span>
        )}
      </div>

      <div className="space-y-0.5 mt-1">
        {gaps.map(
          g =>
            g.categories.length > 0 && (
              <p key={g.person.id} className="text-xs text-stone-500">
                <span className="font-semibold text-rust-600">{g.person.name}:</span> below target on{' '}
                {g.categories.join(', ')}
              </p>
            ),
        )}
      </div>
    </div>
  );
}
