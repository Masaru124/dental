import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seed';

export async function GET() {
  try {
    await seedDatabase();
    return NextResponse.json({ success: true, message: 'Neon Database schema verified and seeded successfully.' });
  } catch (error: any) {
    console.error('Database init error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
