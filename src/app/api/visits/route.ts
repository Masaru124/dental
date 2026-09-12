import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession, authorize } from '@/lib/auth';

/**
 * POST /api/visits
 * Create a new visit — requires patient_id, resolves branch from patient
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { patient_id, chief_complaint, notes } = await req.json();

    if (!patient_id) {
      return NextResponse.json({ error: 'Patient ID is required.' }, { status: 400 });
    }

    // Resolve branch from patient
    const patientRows = await sql`SELECT branch_id FROM patients WHERE id = ${patient_id} LIMIT 1`;
    if (patientRows.length === 0) {
      return NextResponse.json({ error: 'Patient not found.' }, { status: 404 });
    }

    const branchId = patientRows[0].branch_id;
    const err = authorize(session, { roles: ['dentist', 'admin'], branchId });
    if (err) return NextResponse.json({ error: err }, { status: 403 });

    const id = 'vis_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const inserted = await sql`
      INSERT INTO visits (id, branch_id, patient_id, dentist_id, chief_complaint, notes)
      VALUES (${id}, ${branchId}, ${patient_id}, ${session.id}, ${chief_complaint || ''}, ${notes || ''})
      RETURNING *
    `;

    // Activity log
    await sql`
      INSERT INTO activity_logs (id, branch_id, user_id, user_name, action, entity_type, entity_id, details)
      VALUES (
        ${'act_' + Date.now()},
        ${branchId},
        ${session.id},
        ${session.name},
        'CREATE_VISIT',
        'visit',
        ${id},
        ${JSON.stringify({ patientId: patient_id })}
      )
    `;

    return NextResponse.json({ visit: inserted[0] });
  } catch (error: any) {
    console.error('Create visit error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
