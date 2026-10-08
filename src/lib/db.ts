import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type {
  Category,
  Exercise,
  LogEntry,
  LogStatus,
  Person,
  LastResult,
  ExerciseWithLast,
  HistoryDay,
  ExerciseHistoryPoint,
  WeeklyVolume,
  Routine,
} from './types';
import { CATEGORIES } from './types';
import { todayStr, addDays } from './date';

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

    -- Exercises on a given day's session, whether or not anything has been logged yet.
    -- routine_id is set when the exercise came from a routine; NULL means a one-off extra.
    CREATE TABLE IF NOT EXISTS session_exercises (
      performed_at TEXT NOT NULL,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      routine_id INTEGER REFERENCES routines(id) ON DELETE SET NULL,
      PRIMARY KEY (performed_at, exercise_id)
    );

    CREATE TABLE IF NOT EXISTS routines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS routine_exercises (
      routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      PRIMARY KEY (routine_id, exercise_id)
    );

    -- Each day a routine was started, and which rotation it used (exercises[offset] went first).
    CREATE TABLE IF NOT EXISTS routine_days (
      routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
      performed_at TEXT NOT NULL,
      rotation_offset INTEGER NOT NULL,
      PRIMARY KEY (routine_id, performed_at)
    );
  `);

  const logColumns = db.prepare('PRAGMA table_info(logs)').all() as { name: string }[];
  if (!logColumns.some(c => c.name === 'sets')) {
    db.exec('ALTER TABLE logs ADD COLUMN sets INTEGER');
  }
  if (!logColumns.some(c => c.name === 'seat')) {
    db.exec('ALTER TABLE logs ADD COLUMN seat TEXT');
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
    seat: (row.seat as string | null) ?? null,
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
  const { changes } = db.prepare('DELETE FROM exercises WHERE id = ? AND is_custom = 1').run(id);
  if (changes > 0) {
    // foreign_keys isn't enabled, so clean up references by hand.
    db.prepare('DELETE FROM routine_exercises WHERE exercise_id = ?').run(id);
    db.prepare('DELETE FROM session_exercises WHERE exercise_id = ?').run(id);
  }
}

// ── Logs ─────────────────────────────────────────────────────────────────────

/** Most recent logged (non-planned) result for a person on an exercise, strictly before the given date. */
export function getLastResult(exerciseId: number, personId: number, beforeDate: string): LastResult | null {
  const db = getDb();
  const row = db.prepare(
    `SELECT performed_at, weight, reps, sets, seat, status FROM logs
     WHERE exercise_id = ? AND person_id = ? AND performed_at < ? AND status != 'planned'
     ORDER BY performed_at DESC LIMIT 1`
  ).get(exerciseId, personId, beforeDate) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    performed_at: row.performed_at as string,
    weight: (row.weight as number | null) ?? null,
    reps: (row.reps as number | null) ?? null,
    sets: (row.sets as number | null) ?? null,
    seat: (row.seat as string | null) ?? null,
    status: row.status as LogStatus,
  };
}

export function getLastResultsForPeople(exerciseId: number, beforeDate: string): Record<number, LastResult | null> {
  const people = getPeople();
  const result: Record<number, LastResult | null> = {};
  for (const p of people) result[p.id] = getLastResult(exerciseId, p.id, beforeDate);
  return result;
}

/** Ordered exercise ids (with the routine each came from) on `date`'s session. */
function getSessionRows(date: string): { exercise_id: number; routine_id: number | null }[] {
  const db = getDb();
  const sessionRows = db.prepare(
    'SELECT exercise_id, routine_id FROM session_exercises WHERE performed_at = ? ORDER BY position'
  ).all(date) as { exercise_id: number; routine_id: number | null }[];
  // Days logged before session_exercises existed only have log rows; append those in logged order.
  const legacyRows = db.prepare(`
    SELECT exercise_id FROM logs
    WHERE performed_at = ?
      AND exercise_id NOT IN (SELECT exercise_id FROM session_exercises WHERE performed_at = ?)
    GROUP BY exercise_id ORDER BY MIN(id)
  `).all(date, date) as { exercise_id: number }[];
  return [...sessionRows, ...legacyRows.map(r => ({ exercise_id: r.exercise_id, routine_id: null }))];
}

function hydrateExercise(exerciseId: number, routineId: number | null, date: string): ExerciseWithLast | null {
  const db = getDb();
  const exercise = getExercise(exerciseId);
  if (!exercise) return null;
  const today: Record<number, LogEntry | null> = {};
  const last: Record<number, LastResult | null> = {};
  for (const p of getPeople()) {
    const row = db.prepare(
      'SELECT * FROM logs WHERE exercise_id = ? AND person_id = ? AND performed_at = ?'
    ).get(exerciseId, p.id, date) as Record<string, unknown> | undefined;
    today[p.id] = row ? parseLog(row) : null;
    last[p.id] = getLastResult(exerciseId, p.id, date);
  }
  return { ...exercise, today, last, routine_id: routineId };
}

/** Exercises on `date`'s session (added, pulled from a routine, or logged), in session order, hydrated with today's entries and each person's prior result. */
export function getExercisesForDate(date: string): ExerciseWithLast[] {
  return getSessionRows(date)
    .map(({ exercise_id, routine_id }) => hydrateExercise(exercise_id, routine_id, date))
    .filter((e): e is ExerciseWithLast => e !== null);
}

/** Materializes the full session order for `date` into session_exercises so appended rows land after legacy log-only ones. */
function ensureSessionRows(date: string): number {
  const db = getDb();
  const rows = getSessionRows(date);
  const insert = db.prepare(
    'INSERT OR IGNORE INTO session_exercises (performed_at, exercise_id, position, routine_id) VALUES (?, ?, ?, ?)'
  );
  const reposition = db.prepare(
    'UPDATE session_exercises SET position = ? WHERE performed_at = ? AND exercise_id = ?'
  );
  rows.forEach((r, i) => {
    insert.run(date, r.exercise_id, i, r.routine_id);
    reposition.run(i, date, r.exercise_id);
  });
  return rows.length;
}

/** Adds an exercise to `date`'s session so it sticks around before anything is logged. */
export function addExerciseToDate(exerciseId: number, date: string): ExerciseWithLast | null {
  const db = getDb();
  const existing = db.prepare(
    'SELECT routine_id FROM session_exercises WHERE performed_at = ? AND exercise_id = ?'
  ).get(date, exerciseId) as { routine_id: number | null } | undefined;
  if (!existing) {
    db.transaction(() => {
      const next = ensureSessionRows(date);
      db.prepare(
        'INSERT OR IGNORE INTO session_exercises (performed_at, exercise_id, position, routine_id) VALUES (?, ?, ?, NULL)'
      ).run(date, exerciseId, next);
    })();
  }
  const row = db.prepare(
    'SELECT routine_id FROM session_exercises WHERE performed_at = ? AND exercise_id = ?'
  ).get(date, exerciseId) as { routine_id: number | null } | undefined;
  return hydrateExercise(exerciseId, row?.routine_id ?? null, date);
}

export function logSet(data: {
  exercise_id: number;
  person_id: number;
  performed_at: string;
  weight: number | null;
  reps: number | null;
  sets: number | null;
  seat: string | null;
  status: LogStatus;
  notes?: string;
}): LogEntry {
  const db = getDb();
  db.prepare(`
    INSERT INTO logs (exercise_id, person_id, performed_at, weight, reps, sets, seat, status, notes)
    VALUES (@exercise_id, @person_id, @performed_at, @weight, @reps, @sets, @seat, @status, @notes)
    ON CONFLICT(exercise_id, person_id, performed_at)
    DO UPDATE SET weight = @weight, reps = @reps, sets = @sets, seat = @seat, status = @status, notes = @notes
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

/** Persists a new exercise order for `date`'s session; ids not listed keep their relative order after the listed ones. */
export function reorderSessionExercises(date: string, orderedIds: number[]): void {
  const db = getDb();
  db.transaction(() => {
    ensureSessionRows(date);
    const current = getSessionRows(date).map(r => r.exercise_id);
    const known = new Set(current);
    const listed = orderedIds.filter((id, i) => known.has(id) && orderedIds.indexOf(id) === i);
    const rest = current.filter(id => !listed.includes(id));
    const update = db.prepare('UPDATE session_exercises SET position = ? WHERE performed_at = ? AND exercise_id = ?');
    [...listed, ...rest].forEach((id, i) => update.run(i, date, id));
  })();
}

/** Removes an exercise from a given day's session (all people). The routine itself is left untouched. */
export function removeExerciseFromDate(exerciseId: number, date: string): void {
  const db = getDb();
  db.prepare('DELETE FROM logs WHERE exercise_id = ? AND performed_at = ?').run(exerciseId, date);
  db.prepare('DELETE FROM session_exercises WHERE exercise_id = ? AND performed_at = ?').run(exerciseId, date);
}

// ── Routines ─────────────────────────────────────────────────────────────────

function getRoutineExercises(routineId: number): Exercise[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT exercises.* FROM routine_exercises
    JOIN exercises ON exercises.id = routine_exercises.exercise_id
    WHERE routine_exercises.routine_id = ?
    ORDER BY routine_exercises.position
  `).all(routineId) as Record<string, unknown>[];
  return rows.map(parseExercise);
}

/**
 * Rotation offset for a routine on `date`: the offset already used that day if it was started,
 * otherwise one past the most recent earlier day's offset (so the previous first exercise moves to the end).
 */
function routineOffsetForDate(routineId: number, date: string, count: number): number {
  if (count === 0) return 0;
  const db = getDb();
  const sameDay = db.prepare(
    'SELECT rotation_offset FROM routine_days WHERE routine_id = ? AND performed_at = ?'
  ).get(routineId, date) as { rotation_offset: number } | undefined;
  if (sameDay) return sameDay.rotation_offset % count;
  const prev = db.prepare(
    'SELECT rotation_offset FROM routine_days WHERE routine_id = ? AND performed_at < ? ORDER BY performed_at DESC LIMIT 1'
  ).get(routineId, date) as { rotation_offset: number } | undefined;
  return prev ? (prev.rotation_offset + 1) % count : 0;
}

function buildRoutine(row: { id: number; name: string }, date: string): Routine {
  const db = getDb();
  const exercises = getRoutineExercises(row.id);
  const lastDone = db.prepare(
    'SELECT performed_at FROM routine_days WHERE routine_id = ? AND performed_at < ? ORDER BY performed_at DESC LIMIT 1'
  ).get(row.id, date) as { performed_at: string } | undefined;
  const has = db.prepare('SELECT 1 FROM routine_days WHERE routine_id = ? AND performed_at = ?');
  return {
    id: row.id,
    name: row.name,
    exercises,
    next_offset: routineOffsetForDate(row.id, date, exercises.length),
    last_done: lastDone?.performed_at ?? null,
    on_date: has.get(row.id, date) !== undefined,
    on_last_week: has.get(row.id, addDays(date, -7)) !== undefined,
  };
}

/** All routines, with rotation/last-done info computed relative to `date`. */
export function getRoutines(date: string = todayStr()): Routine[] {
  const db = getDb();
  const rows = db.prepare('SELECT id, name FROM routines ORDER BY id').all() as { id: number; name: string }[];
  return rows.map(r => buildRoutine(r, date));
}

export function getRoutine(id: number, date: string = todayStr()): Routine | null {
  const db = getDb();
  const row = db.prepare('SELECT id, name FROM routines WHERE id = ?').get(id) as { id: number; name: string } | undefined;
  return row ? buildRoutine(row, date) : null;
}

function setRoutineExercises(routineId: number, exerciseIds: number[]) {
  const db = getDb();
  db.prepare('DELETE FROM routine_exercises WHERE routine_id = ?').run(routineId);
  const insert = db.prepare('INSERT INTO routine_exercises (routine_id, exercise_id, position) VALUES (?, ?, ?)');
  Array.from(new Set(exerciseIds)).forEach((exerciseId, i) => insert.run(routineId, exerciseId, i));
}

export function createRoutine(name: string, exerciseIds: number[]): Routine {
  const db = getDb();
  const id = db.transaction(() => {
    const result = db.prepare('INSERT INTO routines (name) VALUES (?)').run(name.trim());
    const routineId = Number(result.lastInsertRowid);
    setRoutineExercises(routineId, exerciseIds);
    return routineId;
  })();
  return getRoutine(id)!;
}

export function updateRoutine(id: number, data: { name?: string; exercise_ids?: number[] }): Routine | null {
  const db = getDb();
  db.transaction(() => {
    if (data.name !== undefined) db.prepare('UPDATE routines SET name = ? WHERE id = ?').run(data.name.trim(), id);
    if (data.exercise_ids !== undefined) setRoutineExercises(id, data.exercise_ids);
  })();
  return getRoutine(id);
}

/** Deletes a routine. Past sessions keep their exercises and logs; they just become one-offs. */
export function deleteRoutine(id: number): void {
  const db = getDb();
  db.transaction(() => {
    db.prepare('DELETE FROM routine_exercises WHERE routine_id = ?').run(id);
    db.prepare('DELETE FROM routine_days WHERE routine_id = ?').run(id);
    db.prepare('UPDATE session_exercises SET routine_id = NULL WHERE routine_id = ?').run(id);
    db.prepare('DELETE FROM routines WHERE id = ?').run(id);
  })();
}

/**
 * Starts a routine on `date`: appends its exercises to the session in rotated order
 * (exercises[offset] first, wrapping around) and records the rotation so the next time starts one later.
 */
export function startRoutine(routineId: number, date: string): void {
  const db = getDb();
  db.transaction(() => {
    const already = db.prepare('SELECT 1 FROM routine_days WHERE routine_id = ? AND performed_at = ?').get(routineId, date);
    if (already) return;
    const exercises = getRoutineExercises(routineId);
    const offset = routineOffsetForDate(routineId, date, exercises.length);
    const rotated = [...exercises.slice(offset), ...exercises.slice(0, offset)];

    let next = ensureSessionRows(date);
    const insert = db.prepare(
      'INSERT OR IGNORE INTO session_exercises (performed_at, exercise_id, position, routine_id) VALUES (?, ?, ?, ?)'
    );
    const claim = db.prepare(
      'UPDATE session_exercises SET routine_id = ? WHERE performed_at = ? AND exercise_id = ? AND routine_id IS NULL'
    );
    for (const e of rotated) {
      const { changes } = insert.run(date, e.id, next, routineId);
      if (changes > 0) next++;
      else claim.run(routineId, date, e.id); // already on the session as an extra — it's part of the routine now
    }
    db.prepare('INSERT INTO routine_days (routine_id, performed_at, rotation_offset) VALUES (?, ?, ?)').run(routineId, date, offset);
  })();
}

/** Undoes starting a routine on `date`. Exercises that already have logged sets stay (as extras); untouched ones are removed. */
export function removeRoutineFromDate(routineId: number, date: string): void {
  const db = getDb();
  db.transaction(() => {
    db.prepare('DELETE FROM routine_days WHERE routine_id = ? AND performed_at = ?').run(routineId, date);
    db.prepare(`
      DELETE FROM session_exercises
      WHERE routine_id = ? AND performed_at = ?
        AND exercise_id NOT IN (SELECT exercise_id FROM logs WHERE performed_at = ?)
    `).run(routineId, date, date);
    db.prepare('UPDATE session_exercises SET routine_id = NULL WHERE routine_id = ? AND performed_at = ?').run(routineId, date);
  })();
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
      ORDER BY people.sort_order
    `).all(performed_at) as Record<string, unknown>[];
    // Show exercises in the order they appear in the day's session.
    const order = new Map(getSessionRows(performed_at).map((r, i) => [r.exercise_id, i]));
    const rank = (r: Record<string, unknown>) => order.get(r.exercise_id as number) ?? Number.MAX_SAFE_INTEGER;
    rows.sort((a, b) => rank(a) - rank(b));
    return {
      performed_at,
      entries: rows.map(r => ({ ...parseLog(r), exercise_name: r.exercise_name as string, person_name: r.person_name as string })),
    };
  });
}

// ── Charts ───────────────────────────────────────────────────────────────────

/** Completed (non-planned) log points for an exercise, oldest first, for the progress chart. */
export function getExerciseHistory(exerciseId: number): ExerciseHistoryPoint[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT performed_at, person_id, weight, reps, sets, status FROM logs
    WHERE exercise_id = ? AND status != 'planned'
    ORDER BY performed_at ASC
  `).all(exerciseId) as Record<string, unknown>[];
  return rows.map(r => ({
    performed_at: r.performed_at as string,
    person_id: r.person_id as number,
    weight: (r.weight as number | null) ?? null,
    reps: (r.reps as number | null) ?? null,
    sets: (r.sets as number | null) ?? null,
    status: r.status as LogStatus,
  }));
}

/** Total sets per person per category for the Mon–Sun week starting `weekStart`, counting done+dnf entries (a null `sets` counts as 1). */
export function getWeeklyVolume(weekStart: string): WeeklyVolume {
  const db = getDb();
  const weekEnd = addDays(weekStart, 6);
  const rows = db.prepare(`
    SELECT logs.person_id as person_id, exercises.category as category,
           COALESCE(SUM(COALESCE(logs.sets, 1)), 0) as total_sets
    FROM logs
    JOIN exercises ON exercises.id = logs.exercise_id
    WHERE logs.performed_at BETWEEN ? AND ? AND logs.status != 'planned'
    GROUP BY logs.person_id, exercises.category
  `).all(weekStart, weekEnd) as { person_id: number; category: string; total_sets: number }[];

  const volume: Record<number, Record<string, number>> = {};
  for (const p of getPeople()) volume[p.id] = {};
  for (const row of rows) {
    if (!volume[row.person_id]) volume[row.person_id] = {};
    volume[row.person_id][row.category] = row.total_sets;
  }
  return { week_start: weekStart, volume };
}
