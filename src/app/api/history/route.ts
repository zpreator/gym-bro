import { NextRequest, NextResponse } from 'next/server';
import { getHistoryDays } from '@/lib/db';

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get('limit') || 20);
  const before = req.nextUrl.searchParams.get('before') || undefined;
  return NextResponse.json(getHistoryDays(limit, before));
}
