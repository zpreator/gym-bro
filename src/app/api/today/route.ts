import { NextRequest, NextResponse } from 'next/server';
import { getExercisesForDate, addExerciseToDate, removeExerciseFromDate } from '@/lib/db';
import { todayStr } from '@/lib/date';

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') || todayStr();
  return NextResponse.json(getExercisesForDate(date));
}

/** Adds an exercise to the day's session right away, so it survives navigating away before anything is logged. */
export async function POST(req: NextRequest) {
  const { exercise_id, date } = await req.json();
  if (!exercise_id) return NextResponse.json({ error: 'exercise_id is required' }, { status: 400 });
  const card = addExerciseToDate(Number(exercise_id), date || todayStr());
  if (!card) return NextResponse.json({ error: 'exercise not found' }, { status: 404 });
  return NextResponse.json(card);
}

export async function DELETE(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') || todayStr();
  const exerciseId = Number(req.nextUrl.searchParams.get('exercise_id'));
  if (!exerciseId) return NextResponse.json({ error: 'exercise_id is required' }, { status: 400 });
  removeExerciseFromDate(exerciseId, date);
  return NextResponse.json({ ok: true });
}
