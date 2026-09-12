import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession, authorize } from '@/lib/auth';

/**
 * POST /api/teeth
 * Record a tooth finding — append-only per visit
 * v2 schema: tooth_records no longer have patient_id (resolved via visit)
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const err = authorize(session, { roles: ['dentist'] });
    if (err) return NextResponse.json({ error: err }, { status: 403 });

    const { visit_id, patient_id, tooth_number, condition, surfaces, notes } = await req.json();

    if (!tooth_number || !condition) {
      return NextResponse.json({ error: 'Tooth number and condition are required.' }, { status: 400 });
    }

    // Resolve or create visit
    let targetVisitId = visit_id;
    if (!targetVisitId && patient_id) {
      // Find or create a visit for this patient
      const recentVisit = await sql`
        SELECT id FROM visits
        WHERE patient_id = ${patient_id} AND status = 'in_progress'
        ORDER BY date DESC LIMIT 1
      `;
      if (recentVisit.length > 0) {
        targetVisitId = recentVisit[0].id;
      } else {
        // Get patient branch
        const patientRows = await sql`SELECT branch_id FROM patients WHERE id = ${patient_id} LIMIT 1`;
        if (patientRows.length === 0) {
          return NextResponse.json({ error: 'Patient not found.' }, { status: 404 });
        }
        targetVisitId = 'vis_' + Date.now().toString(36);
        await sql`
          INSERT INTO visits (id, branch_id, patient_id, dentist_id, chief_complaint)
          VALUES (${targetVisitId}, ${patientRows[0].branch_id}, ${patient_id}, ${session.id}, 'Clinical Examination & Charting')
        `;
      }
    }

    if (!targetVisitId) {
      return NextResponse.json({ error: 'Either visit_id or patient_id is required.' }, { status: 400 });
    }

    // Verify visit exists and check branch access
    const visitRows = await sql`SELECT branch_id FROM visits WHERE id = ${targetVisitId} LIMIT 1`;
    if (visitRows.length === 0) {
      return NextResponse.json({ error: 'Visit not found.' }, { status: 404 });
    }
    const branchErr = authorize(session, { branchId: visitRows[0].branch_id });
    if (branchErr) return NextResponse.json({ error: branchErr }, { status: 403 });

    const id = 'tr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const inserted = await sql`
      INSERT INTO tooth_records (id, visit_id, tooth_number, condition, surfaces, notes, recorded_by)
      VALUES (
        ${id},
        ${targetVisitId},
        ${tooth_number},
        ${condition},
        ${JSON.stringify(surfaces || [])}::jsonb,
        ${notes || ''},
        ${session.id}
      )
      RETURNING *
    `;

    // Activity log
    await sql`
      INSERT INTO activity_logs (id, branch_id, user_id, user_name, action, entity_type, entity_id, details)
      VALUES (
        ${'act_' + Date.now()},
        ${visitRows[0].branch_id},
        ${session.id},
        ${session.name},
        'RECORD_TOOTH_FINDING',
        'tooth_record',
        ${id},
        ${JSON.stringify({ toothNumber: tooth_number, condition, surfaces })}
      )
    `;

    return NextResponse.json({ record: inserted[0] });
  } catch (error: any) {
    console.error('Save tooth record error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
