'use client';
import type { Person, WeeklyVolume } from '@/lib/types';
import { MUSCLE_CATEGORIES } from '@/lib/types';
import { PERSON_COLORS, VOLUME_TARGET_MIN, VOLUME_TARGET_MAX } from '@/lib/colors';

const WIDTH = 320;
const LABEL_W = 70;
const ROW_H = 28;
const BAR_H = 7;
const BAR_GAP = 3;

export default function VolumeChart({ volume, people }: { volume: WeeklyVolume['volume']; people: Person[] }) {
  const plotW = WIDTH - LABEL_W - 8;
  const dataMax = Math.max(
    0,
    ...MUSCLE_CATEGORIES.flatMap(cat => people.map(p => volume[p.id]?.[cat] ?? 0)),
  );
  const maxVal = Math.max(VOLUME_TARGET_MAX * 1.2, dataMax * 1.15);
  const xScale = (v: number) => (v / maxVal) * plotW;
  const chartHeight = MUSCLE_CATEGORIES.length * ROW_H;

  const gaps = people.map(p => ({
    person: p,
    categories: MUSCLE_CATEGORIES.filter(cat => (volume[p.id]?.[cat] ?? 0) < VOLUME_TARGET_MIN),
  }));

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

      <svg viewBox={`0 0 ${WIDTH} ${chartHeight + 12}`} className="w-full" role="img" aria-label="Weekly sets per muscle group">
        <rect
          x={LABEL_W + xScale(VOLUME_TARGET_MIN)}
          y={12}
          width={xScale(VOLUME_TARGET_MAX) - xScale(VOLUME_TARGET_MIN)}
          height={chartHeight}
          fill="#DFD9CC"
          fillOpacity={0.35}
        />
        <line
          x1={LABEL_W + xScale(VOLUME_TARGET_MIN)}
          x2={LABEL_W + xScale(VOLUME_TARGET_MIN)}
          y1={12}
          y2={chartHeight + 12}
          stroke="#C7BEA9"
          strokeWidth={1}
          strokeDasharray="2,2"
        />
        <line
          x1={LABEL_W + xScale(VOLUME_TARGET_MAX)}
          x2={LABEL_W + xScale(VOLUME_TARGET_MAX)}
          y1={12}
          y2={chartHeight + 12}
          stroke="#C7BEA9"
          strokeWidth={1}
          strokeDasharray="2,2"
        />
        <text
          x={LABEL_W + (xScale(VOLUME_TARGET_MIN) + xScale(VOLUME_TARGET_MAX)) / 2}
          y={9}
          textAnchor="middle"
          fontSize={8}
          className="fill-stone-400 font-semibold uppercase tracking-wide"
        >
          target
        </text>
        {MUSCLE_CATEGORIES.map((cat, i) => {
          const y = 12 + i * ROW_H;
          const barsHeight = people.length * BAR_H + (people.length - 1) * BAR_GAP;
          const firstBarY = y + (ROW_H - barsHeight) / 2;
          return (
            <g key={cat}>
              <text x={0} y={y + ROW_H / 2} dominantBaseline="middle" fontSize={10} className="fill-ink-600 font-semibold">
                {cat}
              </text>
              {people.map((p, pi) => {
                const val = volume[p.id]?.[cat] ?? 0;
                const barY = firstBarY + pi * (BAR_H + BAR_GAP);
                const barW = Math.max(val > 0 ? 3 : 0, xScale(val));
                return (
                  <g key={p.id}>
                    {val > 0 && (
                      <rect x={LABEL_W} y={barY} width={barW} height={BAR_H} rx={3} fill={PERSON_COLORS[pi % PERSON_COLORS.length]} />
                    )}
                    {val > 0 && (
                      <text x={LABEL_W + barW + 4} y={barY + BAR_H / 2} dominantBaseline="middle" fontSize={9} className="fill-stone-500">
                        {val}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>

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
