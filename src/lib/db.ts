import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { Category, Exercise, LogEntry, LogStatus, Person, LastResult, ExerciseWithLast, HistoryDay } from './types';
import { CATEGORIES } from './types';
import { todayStr } from './date';

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'gym.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    fs.mkdirSync(dataDir, { recursive: true });
    _db = new Database(dbPath);
    _db.pragma('journal_mode = WAL');
    initDb(_db);
  }
  return _db;
}

function initDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      is_custom INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
      performed_at TEXT NOT NULL,
      weight REAL,
      reps INTEGER,
      status TEXT NOT NULL DEFAULT 'done',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(exercise_id, person_id, performed_at)
    );

    CREATE INDEX IF NOT EXISTS idx_logs_performed_at ON logs(performed_at);
    CREATE INDEX IF NOT EXISTS idx_logs_exercise_person ON logs(exercise_id, person_id, performed_at);
  `);

  const logColumns = db.prepare('PRAGMA table_info(logs)').all() as { name: string }[];
  if (!logColumns.some(c => c.name === 'sets')) {
    db.exec('ALTER TABLE logs ADD COLUMN sets INTEGER');
  }

  const { count: peopleCount } = db.prepare('SELECT COUNT(*) as count FROM people').get() as { count: number };
  if (peopleCount === 0) seedPeople(db);

  const { count: exCount } = db.prepare('SELECT COUNT(*) as count FROM exercises').get() as { count: number };
  if (exCount === 0) seedExercises(db);
}

function seedPeople(db: Database.Database) {
  const insert = db.prepare('INSERT INTO people (name, sort_order) VALUES (?, ?)');
  insert.run('Me', 0);
  insert.run('Wife', 1);
}

function seedExercises(db: Database.Database) {
  const insert = db.prepare('INSERT OR IGNORE INTO exercises (name, category, is_custom) VALUES (?, ?, 0)');

  const seed: [string, Category][] = [
    // Chest
    ['Barbell Bench Press', 'Chest'],
    ['Incline Barbell Bench Press', 'Chest'],
    ['Dumbbell Bench Press', 'Chest'],
    ['Incline Dumbbell Press', 'Chest'],
    ['Decline Bench Press', 'Chest'],
    ['Dumbbell Fly', 'Chest'],
    ['Cable Fly', 'Chest'],
    ['Chest Dip', 'Chest'],
    ['Push-Up', 'Chest'],
    ['Pec Deck Machine', 'Chest'],
    ['Chest Press Machine', 'Chest'],
    // Back
    ['Deadlift', 'Back'],
    ['Barbell Row', 'Back'],
    ['Dumbbell Row', 'Back'],
    ['T-Bar Row', 'Back'],
    ['Pull-Up', 'Back'],
    ['Chin-Up', 'Back'],
    ['Lat Pulldown', 'Back'],
    ['Seated Cable Row', 'Back'],
    ['Face Pull', 'Back'],
    ['Straight-Arm Pulldown', 'Back'],
    ['Rack Pull', 'Back'],
    ['Good Morning', 'Back'],
    // Shoulders
    ['Overhead Press', 'Shoulders'],
    ['Dumbbell Shoulder Press', 'Shoulders'],
    ['Arnold Press', 'Shoulders'],
    ['Lateral Raise', 'Shoulders'],
    ['Cable Lateral Raise', 'Shoulders'],
    ['Front Raise', 'Shoulders'],
    ['Rear Delt Fly', 'Shoulders'],
    ['Upright Row', 'Shoulders'],
    ['Barbell Shrug', 'Shoulders'],
    // Legs
    ['Back Squat', 'Legs'],
    ['Front Squat', 'Legs'],
    ['Leg Press', 'Legs'],
    ['Romanian Deadlift', 'Legs'],
    ['Bulgarian Split Squat', 'Legs'],
    ['Walking Lunge', 'Legs'],
    ['Leg Extension', 'Legs'],
    ['Leg Curl', 'Legs'],
    ['Standing Calf Raise', 'Legs'],
    ['Seated Calf Raise', 'Legs'],
    ['Hip Thrust', 'Legs'],
    ['Goblet Squat', 'Legs'],
    ['Hack Squat', 'Legs'],
    // Arms
    ['Barbell Curl', 'Arms'],
    ['Dumbbell Curl', 'Arms'],
    ['Hammer Curl', 'Arms'],
    ['Preacher Curl', 'Arms'],
    ['Cable Curl', 'Arms'],
    ['Tricep Pushdown', 'Arms'],
    ['Skullcrusher', 'Arms'],
    ['Overhead Tricep Extension', 'Arms'],
    ['Close-Grip Bench Press', 'Arms'],
    ['Tricep Dip', 'Arms'],
    // Core
    ['Plank', 'Core'],
    ['Hanging Leg Raise', 'Core'],
    ['Cable Crunch', 'Core'],
    ['Ab Wheel Rollout', 'Core'],
    ['Russian Twist', 'Core'],
    ['Weighted Sit-Up', 'Core'],
    ['Weighted Crunch', 'Core'],
    // Cardio
    ['Treadmill Run', 'Cardio'],
    ['Rowing Machine', 'Cardio'],
    ['Stationary Bike', 'Cardio'],
    ['Stair Climber', 'Cardio'],
    ['Jump Rope', 'Cardio'],
    // Full Body
    ['Kettlebell Swing', 'Full Body'],
    ["Farmer's Carry", 'Full Body'],
    ['Thruster', 'Full Body'],
    ['Clean and Jerk', 'Full Body'],
    ['Snatch', 'Full Body'],
  ];

  const insertMany = db.transaction((rows: typeof seed) => {
    for (const [name, category] of rows) insert.run(name, category);
  });
  insertMany(seed);
}

function parsePerson(row: Record<string, unknown>): Person {
  return { id: row.id as number, name: row.name as string, sort_order: row.sort_order as number };
}

function parseExercise(row: Record<string, unknown>): Exercise {
  return {
    id: row.id as number,
    name: row.name as string,
    category: row.category as Category,
    is_custom: Boolean(row.is_custom),
    created_at: row.created_at as string,
  };
}

function parseLog(row: Record<string, unknown>): LogEntry {
  return {
    id: row.id as number,
    exercise_id: row.exercise_id as number,
    person_id: row.person_id as number,
    performed_at: row.performed_at as string,
    weight: (row.weight as number | null) ?? null,
    reps: (row.reps as number | null) ?? null,
    sets: (row.sets as number | null) ?? null,
    status: row.status as LogStatus,
    notes: (row.notes as string) ?? '',
    created_at: row.created_at as string,
  };
}

// ── People ───────────────────────────────────────────────────────────────────

export function getPeople(): Person[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM people ORDER BY sort_order, id').all() as Record<string, unknown>[];
  return rows.map(parsePerson);
}

export function renamePerson(id: number, name: string): Person[] {
  const db = getDb();
  db.prepare('UPDATE people SET name = ? WHERE id = ?').run(name.trim(), id);
  return getPeople();
}

// ── Exercises ────────────────────────────────────────────────────────────────

export function getAllExercises(): Exercise[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM exercises ORDER BY category, name').all() as Record<string, unknown>[];
  return rows.map(parseExercise);
}

export function getExercise(id: number): Exercise | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM exercises WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  return row ? parseExercise(row) : null;
}

export function createExercise(name: string, category: Category): Exercise {
  const db = getDb();
  const trimmed = name.trim();
  const existing = db.prepare('SELECT * FROM exercises WHERE name = ? COLLATE NOCASE').get(trimmed) as Record<string, unknown> | undefined;
  if (existing) return parseExercise(existing);
  const result = db.prepare('INSERT INTO exercises (name, category, is_custom) VALUES (?, ?, 1)').run(trimmed, category);
  const row = db.prepare('SELECT * FROM exercises WHERE id = ?').get(result.lastInsertRowid) as Record<string, unknown>;
  return parseExercise(row);
}

export function deleteExercise(id: number): void {
  const db = getDb();
  db.prepare('DELETE FROM exercises WHERE id = ? AND is_custom = 1').run(id);
}

// ── Logs ─────────────────────────────────────────────────────────────────────

/** Most recent logged (non-planned) result for a person on an exercise, strictly before the given date. */
export function getLastResult(exerciseId: number, personId: number, beforeDate: string): LastResult | null {
  const db = getDb();
  const row = db.prepare(
    `SELECT performed_at, weight, reps, sets, status FROM logs
     WHERE exercise_id = ? AND person_id = ? AND performed_at < ? AND status != 'planned'
     ORDER BY performed_at DESC LIMIT 1`
  ).get(exerciseId, personId, beforeDate) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    performed_at: row.performed_at as string,
    weight: (row.weight as number | null) ?? null,
    reps: (row.reps as number | null) ?? null,
    sets: (row.sets as number | null) ?? null,
    status: row.status as LogStatus,
  };
}

export function getLastResultsForPeople(exerciseId: number, beforeDate: string): Record<number, LastResult | null> {
  const people = getPeople();
  const result: Record<number, LastResult | null> = {};
  for (const p of people) result[p.id] = getLastResult(exerciseId, p.id, beforeDate);
  return result;
}

/** Exercises with at least one log entry on `date`, hydrated with today's entries and each person's prior result. */
export function getExercisesForDate(date: string): ExerciseWithLast[] {
  const db = getDb();
  const exerciseIds = db.prepare(
    'SELECT DISTINCT exercise_id FROM logs WHERE performed_at = ?'
  ).all(date) as { exercise_id: number }[];

  const people = getPeople();
  return exerciseIds
    .map(({ exercise_id }) => {
      const exercise = getExercise(exercise_id);
      if (!exercise) return null;
      const today: Record<number, LogEntry | null> = {};
      const last: Record<number, LastResult | null> = {};
      for (const p of people) {
        const row = db.prepare(
          'SELECT * FROM logs WHERE exercise_id = ? AND person_id = ? AND performed_at = ?'
        ).get(exercise_id, p.id, date) as Record<string, unknown> | undefined;
        today[p.id] = row ? parseLog(row) : null;
        last[p.id] = getLastResult(exercise_id, p.id, date);
      }
      return { ...exercise, today, last };
    })
    .filter((e): e is ExerciseWithLast => e !== null);
}

export function logSet(data: {
  exercise_id: number;
  person_id: number;
  performed_at: string;
  weight: number | null;
  reps: number | null;
  sets: number | null;
  status: LogStatus;
  notes?: string;
}): LogEntry {
  const db = getDb();
  db.prepare(`
    INSERT INTO logs (exercise_id, person_id, performed_at, weight, reps, sets, status, notes)
    VALUES (@exercise_id, @person_id, @performed_at, @weight, @reps, @sets, @status, @notes)
    ON CONFLICT(exercise_id, person_id, performed_at)
    DO UPDATE SET weight = @weight, reps = @reps, sets = @sets, status = @status, notes = @notes
  `).run({ notes: '', ...data });
  const row = db.prepare(
    'SELECT * FROM logs WHERE exercise_id = ? AND person_id = ? AND performed_at = ?'
  ).get(data.exercise_id, data.person_id, data.performed_at) as Record<string, unknown>;
  return parseLog(row);
}

export function deleteLogEntry(id: number): void {
  const db = getDb();
  db.prepare('DELETE FROM logs WHERE id = ?').run(id);
}

/** Removes an exercise from a given day's session (all people). */
export function removeExerciseFromDate(exerciseId: number, date: string): void {
  const db = getDb();
  db.prepare('DELETE FROM logs WHERE exercise_id = ? AND performed_at = ?').run(exerciseId, date);
}

// ── History ──────────────────────────────────────────────────────────────────

/** History shows only completed workouts (done/dnf) — planned/future entries live on the recording page instead. */
export function getHistoryDays(limit = 30, beforeDate?: string): HistoryDay[] {
  const db = getDb();
  const dateRows = db.prepare(
    beforeDate
      ? `SELECT DISTINCT performed_at FROM logs WHERE performed_at < ? AND status != 'planned' ORDER BY performed_at DESC LIMIT ?`
      : `SELECT DISTINCT performed_at FROM logs WHERE status != 'planned' ORDER BY performed_at DESC LIMIT ?`
  ).all(...(beforeDate ? [beforeDate, limit] : [limit])) as { performed_at: string }[];

  return dateRows.map(({ performed_at }) => {
    const rows = db.prepare(`
      SELECT logs.*, exercises.name as exercise_name, people.name as person_name
      FROM logs
      JOIN exercises ON exercises.id = logs.exercise_id
      JOIN people ON people.id = logs.person_id
      WHERE logs.performed_at = ? AND logs.status != 'planned'
      ORDER BY exercises.category, exercises.name, people.sort_order
    `).all(performed_at) as Record<string, unknown>[];
    return {
      performed_at,
      entries: rows.map(r => ({ ...parseLog(r), exercise_name: r.exercise_name as string, person_name: r.person_name as string })),
    };
  });
}
