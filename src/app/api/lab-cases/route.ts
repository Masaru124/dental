import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession, authorize } from '@/lib/auth';

/**
 * GET /api/lab-cases?branch_id=xxx&status=xxx
 */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branch_id');
    const status = searchParams.get('status');

    if (!branchId) {
      return NextResponse.json({ error: 'branch_id is required' }, { status: 400 });
    }

    const err = authorize(session, { branchId });
    if (err) return NextResponse.json({ error: err }, { status: 403 });

    let cases;
    if (status) {
      cases = await sql`
        SELECT * FROM lab_cases
        WHERE branch_id = ${branchId} AND status = ${status}
        ORDER BY created_at DESC
      `;
    } else {
      cases = await sql`
        SELECT * FROM lab_cases
        WHERE branch_id = ${branchId}
        ORDER BY
          CASE status
            WHEN 'sent' THEN 1
            WHEN 'in_progress' THEN 2
            WHEN 'ready' THEN 3
            WHEN 'returned' THEN 4
          END,
          created_at DESC
      `;
    }

    return NextResponse.json({ cases });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/lab-cases — Create a lab case
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { branch_id, visit_id, tooth_refs, lab_name, job_type, patient_name, expected_return_at, cost, notes } = body;

    if (!branch_id || !visit_id || !lab_name || !job_type) {
      return NextResponse.json({ error: 'branch_id, visit_id, lab_name, and job_type are required.' }, { status: 400 });
    }

    const err = authorize(session, { roles: ['dentist', 'admin'], branchId: branch_id });
    if (err) return NextResponse.json({ error: err }, { status: 403 });

    const id = 'lab_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const inserted = await sql`
      INSERT INTO lab_cases (id, branch_id, visit_id, tooth_refs, lab_name, job_type, patient_name, expected_return_at, cost, notes)
      VALUES (
        ${id}, ${branch_id}, ${visit_id},
        ${JSON.stringify(tooth_refs || [])}::jsonb,
        ${lab_name}, ${job_type}, ${patient_name || null},
        ${expected_return_at || null}, ${cost || 0}, ${notes || null}
      )
      RETURNING *
    `;

    return NextResponse.json({ labCase: inserted[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/lab-cases — Update lab case status
 */
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, status, returned_at, notes } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'id is required.' }, { status: 400 });
    }

    const updated = await sql`
      UPDATE lab_cases
      SET status = COALESCE(${status || null}, status),
          returned_at = COALESCE(${returned_at || null}::timestamptz, returned_at),
          notes = COALESCE(${notes || null}, notes)
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({ labCase: updated[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
