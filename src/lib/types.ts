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

export type LogStatus = 'done' | 'dnf';

export interface LogEntry {
  id: number;
  exercise_id: number;
  person_id: number;
  performed_at: string; // YYYY-MM-DD
  weight: number | null;
  reps: number | null;
  status: LogStatus;
  notes: string;
  created_at: string;
}

/** The most recent logged entry for a person on a given exercise, before today. */
export interface LastResult {
  performed_at: string;
  weight: number | null;
  reps: number | null;
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
