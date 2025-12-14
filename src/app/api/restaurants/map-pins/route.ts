import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const mapPins = await db.getMapPins();
    return NextResponse.json(mapPins);
  } catch (error) {
    console.error('Error fetching map pins:', error);
    return NextResponse.json({ error: 'Failed to fetch map pins' }, { status: 500 });
  }
}
