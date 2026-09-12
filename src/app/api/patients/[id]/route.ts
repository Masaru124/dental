import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession, authorize, hasAccessToBranch } from '@/lib/auth';

/**
 * GET /api/patients/[id]
 * Full patient profile with visits, tooth chart, treatment plan, imaging, consent
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const patientRows = await sql`
      SELECT * FROM patients WHERE id = ${id} LIMIT 1
    `;

    if (patientRows.length === 0) {
      return NextResponse.json({ error: 'Patient not found.' }, { status: 404 });
    }

    const rawPatient = patientRows[0];
    const patient = {
      ...rawPatient,
      name: rawPatient.full_name,
    };

    // Branch-scope check
    if (!hasAccessToBranch(session, rawPatient.branch_id)) {
      return NextResponse.json({ error: 'No access to this branch.' }, { status: 403 });
    }

    // Fetch all related clinical records concurrently via Promise.all
    const [
      visits,
      toothRecords,
      treatmentPlan,
      imagingAssets,
      aiFindings,
      consentRecords,
      invoices
    ] = await Promise.all([
      // 1. Visits with dentist names
      sql`
        SELECT v.*, u.name as dentist_name
        FROM visits v
        LEFT JOIN users u ON v.dentist_id = u.id
        WHERE v.patient_id = ${id}
        ORDER BY v.date DESC
      `,
      // 2. Tooth records across visits
      sql`
        SELECT tr.*, v.date as visit_date
        FROM tooth_records tr
        JOIN visits v ON tr.visit_id = v.id
        WHERE v.patient_id = ${id}
        ORDER BY tr.recorded_at DESC
      `,
      // 3. Treatment plan items ordered by clinical urgency
      sql`
        SELECT * FROM treatment_plan_items tpi
        WHERE tpi.visit_id IN (
          SELECT v.id FROM visits v WHERE v.patient_id = ${id}
        )
        ORDER BY
          CASE tpi.priority
            WHEN 'urgent' THEN 1
            WHEN 'soon' THEN 2
            WHEN 'preventive' THEN 3
            WHEN 'elective' THEN 4
            ELSE 5
          END,
          tpi.created_at ASC
      `,
      // 4. Imaging assets
      sql`
        SELECT ia.* FROM imaging_assets ia
        WHERE ia.visit_id IN (
          SELECT v.id FROM visits v WHERE v.patient_id = ${id}
        )
        ORDER BY ia.uploaded_at DESC
      `,
      // 5. AI findings
      sql`
        SELECT af.* FROM ai_findings af
        WHERE af.imaging_asset_id IN (
          SELECT ia.id FROM imaging_assets ia
          WHERE ia.visit_id IN (
            SELECT v.id FROM visits v WHERE v.patient_id = ${id}
          )
        )
        ORDER BY af.generated_at DESC
      `,
      // 6. Consent records
      sql`
        SELECT * FROM consent_records WHERE patient_id = ${id}
        ORDER BY created_at DESC
      `,
      // 7. Invoices
      sql`
        SELECT * FROM invoices WHERE patient_id = ${id}
        ORDER BY created_at DESC
      `
    ]);

    // Compute active tooth chart state: most recent status per tooth_number
    const activeToothChart: Record<string, any> = {};
    for (const record of toothRecords) {
      if (!activeToothChart[record.tooth_number]) {
        activeToothChart[record.tooth_number] = record;
      }
    }

    return NextResponse.json({
      patient,
      visits,
      toothRecords,
      activeToothChart,
      treatmentPlan,
      imagingAssets,
      aiFindings,
      consentRecords,
      invoices,
    });
  } catch (error: any) {
    console.error('Fetch patient details error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/patients/[id]
 * Update patient profile
 */
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

    // Verify patient exists and check branch access
    const existingRows = await sql`SELECT branch_id FROM patients WHERE id = ${id} LIMIT 1`;
    if (existingRows.length === 0) {
      return NextResponse.json({ error: 'Patient not found.' }, { status: 404 });
    }

    const err = authorize(session, {
      roles: ['dentist', 'staff', 'admin'],
      branchId: existingRows[0].branch_id,
    });
    if (err) return NextResponse.json({ error: err }, { status: 403 });

    const updated = await sql`
      UPDATE patients
      SET full_name = COALESCE(${body.full_name || null}, full_name),
          age = COALESCE(${body.age ? parseInt(body.age, 10) : null}, age),
          gender = COALESCE(${body.gender || null}, gender),
          phone = COALESCE(${body.phone || null}, phone),
          email = COALESCE(${body.email || null}, email),
          address = COALESCE(${body.address || null}, address),
          medical_alerts = COALESCE(${body.medical_alerts ? JSON.stringify(body.medical_alerts) : null}::jsonb, medical_alerts),
          abha_number = COALESCE(${body.abha_number || null}, abha_number),
          abha_link_status = COALESCE(${body.abha_link_status || null}, abha_link_status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({ patient: updated[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
