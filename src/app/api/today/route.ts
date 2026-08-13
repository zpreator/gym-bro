import { NextRequest, NextResponse } from 'next/server';
import { getExercisesForDate, removeExerciseFromDate } from '@/lib/db';
import { todayStr } from '@/lib/date';

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') || todayStr();
  return NextResponse.json(getExercisesForDate(date));
}

export async function DELETE(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') || todayStr();
  const exerciseId = Number(req.nextUrl.searchParams.get('exercise_id'));
  if (!exerciseId) return NextResponse.json({ error: 'exercise_id is required' }, { status: 400 });
  removeExerciseFromDate(exerciseId, date);
  return NextResponse.json({ ok: true });
}
