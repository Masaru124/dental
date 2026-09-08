import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const patientRows = await sql`
      SELECT * FROM patients WHERE id = ${id} LIMIT 1
    `;

    if (patientRows.length === 0) {
      return NextResponse.json({ error: 'Patient not found.' }, { status: 404 });
    }

    const patient = patientRows[0];

    // Get all visits for patient
    const visits = await sql`
      SELECT * FROM visits WHERE patient_id = ${id} ORDER BY visit_date DESC
    `;

    // Get all tooth records for patient (ordered by recorded_at DESC)
    const toothRecords = await sql`
      SELECT * FROM tooth_records WHERE patient_id = ${id} ORDER BY recorded_at DESC
    `;

    // Compute active tooth chart state: most recent status per tooth_number
    const activeToothChart: Record<string, any> = {};
    for (const record of toothRecords) {
      if (!activeToothChart[record.tooth_number]) {
        activeToothChart[record.tooth_number] = record;
      }
    }

    // Get treatment plan items
    const treatmentPlan = await sql`
      SELECT * FROM treatment_plan_items WHERE patient_id = ${id} ORDER BY created_at ASC
    `;

    return NextResponse.json({
      patient,
      visits,
      toothRecords,
      activeToothChart,
      treatmentPlan,
    });
  } catch (error: any) {
    console.error('Fetch patient details error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const updated = await sql`
      UPDATE patients
      SET name = COALESCE(${body.name}, name),
          age = COALESCE(${body.age ? parseInt(body.age, 10) : null}, age),
          gender = COALESCE(${body.gender}, gender),
          phone = COALESCE(${body.phone}, phone),
          email = COALESCE(${body.email}, email),
          medical_history = COALESCE(${body.medical_history}, medical_history),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Patient not found.' }, { status: 404 });
    }

    return NextResponse.json({ patient: updated[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
