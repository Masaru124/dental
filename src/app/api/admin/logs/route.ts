import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession, authorize } from '@/lib/auth';

/**
 * GET /api/admin/logs?branchId=xxx
 * Activity logs — branch-scoped for admin, tenant-wide for owner
 */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const err = authorize(session, { roles: ['admin', 'owner'] });
    if (err) return NextResponse.json({ error: err }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');

    let logs;
    if (branchId) {
      const branchErr = authorize(session, { branchId });
      if (branchErr) return NextResponse.json({ error: branchErr }, { status: 403 });

      logs = await sql`
        SELECT * FROM activity_logs
        WHERE branch_id = ${branchId}
        ORDER BY created_at DESC
        LIMIT 200
      `;
    } else if (session.branchIds.includes('*')) {
      // Owner/admin with wildcard: all logs for tenant
      logs = await sql`
        SELECT al.* FROM activity_logs al
        LEFT JOIN branches b ON al.branch_id = b.id
        WHERE b.tenant_id = ${session.tenantId} OR al.branch_id IS NULL
        ORDER BY al.created_at DESC
        LIMIT 200
      `;
    } else {
      // Admin scoped to specific branches
      logs = await sql`
        SELECT * FROM activity_logs
        WHERE branch_id = ANY(${session.branchIds})
        ORDER BY created_at DESC
        LIMIT 200
      `;
    }

    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
