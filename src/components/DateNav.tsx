'use client';
import { useEffect, useRef } from 'react';
import { addDays, todayStr } from '@/lib/date';

const STRIP_RANGE = 14; // days shown on each side of today in the swipeable strip

export default function DateNav({ date, onChange }: { date: string; onChange: (date: string) => void }) {
  const selectedRef = useRef<HTMLButtonElement>(null);
  const today = todayStr();

  const days = Array.from({ length: STRIP_RANGE * 2 + 1 }, (_, i) => addDays(today, i - STRIP_RANGE));

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [date]);

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1.5 overflow-x-auto px-0.5 py-1 flex-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {days.map(d => {
          const dt = new Date(d + 'T00:00:00');
          const isSelected = d === date;
          const isToday = d === today;
          return (
            <button
              key={d}
              ref={isSelected ? selectedRef : undefined}
              onClick={() => onChange(d)}
              className={`shrink-0 flex flex-col items-center justify-center w-11 h-14 rounded-xl transition-colors ${
                isSelected
                  ? 'bg-ember-600 text-white'
                  : isToday
                    ? 'bg-ember-50 text-ember-700'
                    : 'bg-white text-stone-600'
              }`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                {dt.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className="text-sm font-bold leading-tight">{dt.getDate()}</span>
            </button>
          );
        })}
      </div>

      <div className="relative shrink-0 w-11 h-14">
        {/* The date input itself is the real tap target (layered on top, invisible).
            Icon buttons wired via JS (showPicker/focus/click) on a hidden decoy input
            are unreliable on iOS Safari; a directly-tapped native date input always works. */}
        <input
          type="date"
          value={date}
          onChange={e => e.target.value && onChange(e.target.value)}
          aria-label="Pick a date"
          className="peer absolute inset-0 z-10 w-full h-full opacity-0"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-xl bg-white text-stone-500 flex items-center justify-center pointer-events-none peer-active:bg-stone-100 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path strokeLinecap="round" d="M8 3v4M16 3v4M3 10h18" />
          </svg>
        </div>
      </div>
    </div>
  );
}
