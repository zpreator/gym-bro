import { NextRequest, NextResponse } from 'next/server';
import { getPeople, renamePerson } from '@/lib/db';

export async function GET() {
  return NextResponse.json(getPeople());
}

export async function PATCH(req: NextRequest) {
  const { id, name } = await req.json();
  if (!id || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'id and name are required' }, { status: 400 });
  }
  return NextResponse.json(renamePerson(id, name));
}
