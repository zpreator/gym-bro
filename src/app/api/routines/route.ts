import { NextRequest, NextResponse } from 'next/server';
import { getRoutines, createRoutine } from '@/lib/db';
import { todayStr } from '@/lib/date';

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') || todayStr();
  return NextResponse.json(getRoutines(date));
}

export async function POST(req: NextRequest) {
  const { name, exercise_ids } = await req.json();
  if (typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  const ids = Array.isArray(exercise_ids) ? exercise_ids.map(Number).filter(Boolean) : [];
  return NextResponse.json(createRoutine(name, ids));
}
