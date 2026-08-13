import { NextRequest, NextResponse } from 'next/server';
import { getAllExercises, createExercise } from '@/lib/db';
import { CATEGORIES } from '@/lib/types';

export async function GET() {
  return NextResponse.json(getAllExercises());
}

export async function POST(req: NextRequest) {
  const { name, category } = await req.json();
  if (typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'invalid category' }, { status: 400 });
  }
  return NextResponse.json(createExercise(name, category));
}
