import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

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

    const id = 'vis_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const inserted = await sql`
      INSERT INTO visits (id, patient_id, dentist_id, dentist_name, chief_complaint, notes)
      VALUES (${id}, ${patient_id}, ${session.id}, ${session.name}, ${chief_complaint || ''}, ${notes || ''})
      RETURNING *
    `;

    // Activity log
    await sql`
      INSERT INTO activity_logs (id, user_id, user_name, action, details)
      VALUES (
        ${'act_' + Date.now()},
        ${session.id},
        ${session.name},
        'CREATE_VISIT',
        ${JSON.stringify({ visitId: id, patientId: patient_id })}
      )
    `;

    return NextResponse.json({ visit: inserted[0] });
  } catch (error: any) {
    console.error('Create visit error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
