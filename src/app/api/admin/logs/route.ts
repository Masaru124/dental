import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const logs = await sql`
      SELECT * FROM activity_logs
      ORDER BY created_at DESC
      LIMIT 100
    `;
    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
