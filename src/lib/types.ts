export const CATEGORIES = [
  'Chest',
  'Back',
  'Shoulders',
  'Legs',
  'Arms',
  'Core',
  'Cardio',
  'Full Body',
] as const;

export type Category = (typeof CATEGORIES)[number];

/**
 * Categories counted toward weekly muscle-group volume. Cardio has no set-based
 * target, and Full Body compound lifts (cleans, farmer's carries, etc.) don't map
 * cleanly to a single muscle's volume landmark, so both are left out of the gap analysis.
 */
export const MUSCLE_CATEGORIES = CATEGORIES.filter(
  c => c !== 'Cardio' && c !== 'Full Body',
) as Exclude<Category, 'Cardio' | 'Full Body'>[];

export interface Person {
  id: number;
  name: string;
  sort_order: number;
}

export interface Exercise {
  id: number;
  name: string;
  category: Category;
  is_custom: boolean;
  created_at: string;
}

/** 'planned' = set up ahead of time for a future day; 'done' = actually performed; 'dnf' = attempted but not completed. */
export type LogStatus = 'planned' | 'done' | 'dnf';

export interface LogEntry {
  id: number;
  exercise_id: number;
  person_id: number;
  performed_at: string; // YYYY-MM-DD
  weight: number | null;
  reps: number | null;
  sets: number | null;
  status: LogStatus;
  notes: string;
  created_at: string;
}

/** The most recent logged entry for a person on a given exercise, before a given date. */
export interface LastResult {
  performed_at: string;
  weight: number | null;
  reps: number | null;
  sets: number | null;
  status: LogStatus;
}

export interface ExerciseWithLast extends Exercise {
  last: Record<number, LastResult | null>; // keyed by person_id
  today: Record<number, LogEntry | null>; // keyed by person_id
}

export interface HistoryDay {
  performed_at: string;
  entries: (LogEntry & { exercise_name: string; person_name: string })[];
}

/** One completed data point for an exercise's progress chart. */
export interface ExerciseHistoryPoint {
  performed_at: string;
  person_id: number;
  weight: number | null;
  reps: number | null;
  sets: number | null;
  status: LogStatus;
}

/** Total sets logged per person per muscle-group category within a Mon–Sun week. */
export interface WeeklyVolume {
  week_start: string;
  volume: Record<number, Record<string, number>>; // person_id -> category -> total sets
}
