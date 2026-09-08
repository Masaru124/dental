import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { patient_id, visit_id, tooth_number, condition, surfaces, notes } = await req.json();

    if (!patient_id || !tooth_number || !condition) {
      return NextResponse.json({ error: 'Patient ID, tooth number, and condition are required.' }, { status: 400 });
    }

    // If visit_id is not supplied, check if there is an active visit or create one
    let targetVisitId = visit_id;
    if (!targetVisitId) {
      const recentVisit = await sql`
        SELECT id FROM visits WHERE patient_id = ${patient_id} ORDER BY visit_date DESC LIMIT 1
      `;
      if (recentVisit.length > 0) {
        targetVisitId = recentVisit[0].id;
      } else {
        targetVisitId = 'vis_' + Date.now().toString(36);
        await sql`
          INSERT INTO visits (id, patient_id, dentist_id, dentist_name, chief_complaint)
          VALUES (${targetVisitId}, ${patient_id}, ${session.id}, ${session.name}, 'Clinical Examination & Charting')
        `;
      }
    }

    const id = 'tr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const inserted = await sql`
      INSERT INTO tooth_records (id, patient_id, visit_id, tooth_number, condition, surfaces, notes)
      VALUES (
        ${id},
        ${patient_id},
        ${targetVisitId},
        ${tooth_number},
        ${condition},
        ${JSON.stringify(surfaces || [])}::jsonb,
        ${notes || ''}
      )
      RETURNING *
    `;

    // Activity log
    await sql`
      INSERT INTO activity_logs (id, user_id, user_name, action, details)
      VALUES (
        ${'act_' + Date.now()},
        ${session.id},
        ${session.name},
        'RECORD_TOOTH_FINDING',
        ${JSON.stringify({ patientId: patient_id, toothNumber: tooth_number, condition, surfaces })}
      )
    `;

    return NextResponse.json({ record: inserted[0] });
  } catch (error: any) {
    console.error('Save tooth record error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
