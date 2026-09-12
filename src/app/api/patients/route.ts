import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession, authorize } from '@/lib/auth';

/**
 * GET /api/patients?branchId=xxx&q=search
 * Branch-scoped patient list with visit count and ABHA status
 */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();
    const branchId = searchParams.get('branchId') || searchParams.get('branch_id');

    // Determine which branches to query
    let branchFilter: string[];
    if (branchId) {
      const err = authorize(session, { branchId });
      if (err) return NextResponse.json({ error: err }, { status: 403 });
      branchFilter = [branchId];
    } else if (session.branchIds.includes('*')) {
      // Owner/admin: get all branches for tenant
      const branches = await sql`SELECT id FROM branches WHERE tenant_id = ${session.tenantId}`;
      branchFilter = branches.map(b => b.id);
    } else {
      branchFilter = session.branchIds;
    }

    let patients;
    if (q) {
      const pattern = `%${q}%`;
      patients = await sql`
        SELECT p.*,
               p.full_name as name,
               (SELECT COUNT(*)::int FROM visits v WHERE v.patient_id = p.id) as visit_count,
               (SELECT MAX(v.date) FROM visits v WHERE v.patient_id = p.id) as last_visit_date
        FROM patients p
        WHERE p.branch_id = ANY(${branchFilter})
          AND (p.full_name ILIKE ${pattern} OR p.phone ILIKE ${pattern} OR p.abha_number ILIKE ${pattern})
        ORDER BY p.updated_at DESC
        LIMIT 50
      `;
    } else {
      patients = await sql`
        SELECT p.*,
               p.full_name as name,
               (SELECT COUNT(*)::int FROM visits v WHERE v.patient_id = p.id) as visit_count,
               (SELECT MAX(v.date) FROM visits v WHERE v.patient_id = p.id) as last_visit_date
        FROM patients p
        WHERE p.branch_id = ANY(${branchFilter})
        ORDER BY p.updated_at DESC
        LIMIT 50
      `;
    }

    return NextResponse.json({ patients });
  } catch (error: any) {
    console.error('Fetch patients error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/patients
 * Create a new patient — requires branchId in body
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      full_name, age, gender, phone, email, address,
      medical_alerts, abha_number, branch_id
    } = body;

    if (!full_name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required.' }, { status: 400 });
    }

    const targetBranch = branch_id || session.branchIds[0];
    const err = authorize(session, { roles: ['dentist', 'staff', 'admin'], branchId: targetBranch });
    if (err) return NextResponse.json({ error: err }, { status: 403 });

    const id = 'pat_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const inserted = await sql`
      INSERT INTO patients (
        id, branch_id, full_name, age, gender, phone, email, address,
        medical_alerts, abha_number, abha_link_status
      ) VALUES (
        ${id}, ${targetBranch}, ${full_name.trim()},
        ${age ? parseInt(age, 10) : null}, ${gender || null},
        ${phone.trim()}, ${email ? email.trim() : null}, ${address || null},
        ${JSON.stringify(medical_alerts || [])}::jsonb,
        ${abha_number || null},
        ${abha_number ? 'pending' : 'unlinked'}
      )
      RETURNING *
    `;

    // Activity log
    await sql`
      INSERT INTO activity_logs (id, branch_id, user_id, user_name, action, entity_type, entity_id, details)
      VALUES (
        ${'act_' + Date.now()},
        ${targetBranch},
        ${session.id},
        ${session.name},
        'CREATE_PATIENT',
        'patient',
        ${id},
        ${JSON.stringify({ patientName: full_name })}
      )
    `;

    return NextResponse.json({ patient: inserted[0] });
  } catch (error: any) {
    console.error('Create patient error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
