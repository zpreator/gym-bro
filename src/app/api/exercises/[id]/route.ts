import { NextRequest, NextResponse } from 'next/server';
import { deleteExercise } from '@/lib/db';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  deleteExercise(Number(params.id));
  return NextResponse.json({ ok: true });
}
