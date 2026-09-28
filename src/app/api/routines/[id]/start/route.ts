import { NextRequest, NextResponse } from 'next/server';
import { getExercisesForDate, getRoutine, removeRoutineFromDate, startRoutine } from '@/lib/db';
import { todayStr } from '@/lib/date';

/** Pulls the routine's exercises (rotated) into the day's session; returns the updated session. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { date: rawDate } = await req.json().catch(() => ({}));
  const date = rawDate || todayStr();
  const id = Number(params.id);
  if (!getRoutine(id, date)) return NextResponse.json({ error: 'routine not found' }, { status: 404 });
  startRoutine(id, date);
  return NextResponse.json(getExercisesForDate(date));
}

/** Undoes starting the routine on that day; returns the updated session. */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const date = req.nextUrl.searchParams.get('date') || todayStr();
  removeRoutineFromDate(Number(params.id), date);
  return NextResponse.json(getExercisesForDate(date));
}
