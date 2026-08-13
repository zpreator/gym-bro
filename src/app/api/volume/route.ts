import { NextRequest, NextResponse } from 'next/server';
import { getWeeklyVolume } from '@/lib/db';
import { getWeekStart, todayStr } from '@/lib/date';

export async function GET(req: NextRequest) {
  const week = req.nextUrl.searchParams.get('week');
  const weekStart = getWeekStart(week || todayStr());
  return NextResponse.json(getWeeklyVolume(weekStart));
}
