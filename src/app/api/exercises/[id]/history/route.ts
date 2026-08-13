import { NextResponse } from 'next/server';
import { getExerciseHistory } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const exerciseId = Number(params.id);
  if (!exerciseId) return NextResponse.json({ error: 'invalid exercise id' }, { status: 400 });
  return NextResponse.json(getExerciseHistory(exerciseId));
}
