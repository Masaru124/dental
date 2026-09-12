import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seed';
import { sql, initDatabaseSchema } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const forceReset = searchParams.get('force') === 'true';

    // Check if tenants table exists
    const tables = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'tenants'
    `;

    if (tables.length > 0 && !forceReset) {
      return NextResponse.json({ 
        success: true, 
        message: 'Neon Database schema already initialized.' 
      });
    }

    await seedDatabase();
    return NextResponse.json({ 
      success: true, 
      message: 'Neon Database schema verified and seeded successfully.' 
    });
  } catch (error: any) {
    console.error('Database init error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
