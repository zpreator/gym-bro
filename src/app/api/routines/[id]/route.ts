import { NextRequest, NextResponse } from 'next/server';
import { updateRoutine, deleteRoutine } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { name, exercise_ids } = await req.json();
  if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
    return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 });
  }
  const routine = updateRoutine(Number(params.id), {
    name,
    exercise_ids: Array.isArray(exercise_ids) ? exercise_ids.map(Number).filter(Boolean) : undefined,
  });
  if (!routine) return NextResponse.json({ error: 'routine not found' }, { status: 404 });
  return NextResponse.json(routine);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  deleteRoutine(Number(params.id));
  return NextResponse.json({ ok: true });
}
