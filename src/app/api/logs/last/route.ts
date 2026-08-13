import { NextRequest, NextResponse } from 'next/server';
import { getLastResultsForPeople } from '@/lib/db';
import { todayStr } from '@/lib/date';

export async function GET(req: NextRequest) {
  const exerciseId = Number(req.nextUrl.searchParams.get('exercise_id'));
  const date = req.nextUrl.searchParams.get('date') || todayStr();
  if (!exerciseId) return NextResponse.json({ error: 'exercise_id is required' }, { status: 400 });
  return NextResponse.json(getLastResultsForPeople(exerciseId, date));
}
