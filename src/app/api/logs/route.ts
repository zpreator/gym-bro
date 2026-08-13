import { NextRequest, NextResponse } from 'next/server';
import { logSet, deleteLogEntry } from '@/lib/db';
import { todayStr } from '@/lib/date';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { exercise_id, person_id, performed_at, weight, reps, sets, status, notes } = body;

  if (!exercise_id || !person_id) {
    return NextResponse.json({ error: 'exercise_id and person_id are required' }, { status: 400 });
  }
  if (status !== 'done' && status !== 'dnf' && status !== 'planned') {
    return NextResponse.json({ error: 'status must be "done", "dnf", or "planned"' }, { status: 400 });
  }

  const entry = logSet({
    exercise_id,
    person_id,
    performed_at: performed_at || todayStr(),
    weight: weight === '' || weight === undefined ? null : Number(weight),
    reps: reps === '' || reps === undefined ? null : Number(reps),
    sets: sets === '' || sets === undefined ? null : Number(sets),
    status,
    notes,
  });
  return NextResponse.json(entry);
}

export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  deleteLogEntry(id);
  return NextResponse.json({ ok: true });
}
