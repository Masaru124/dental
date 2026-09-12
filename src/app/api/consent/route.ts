import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession, authorize } from '@/lib/auth';

/**
 * GET /api/consent?patient_id=xxx
 * List consent records for a patient
 */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patient_id');

    if (!patientId) {
      return NextResponse.json({ error: 'patient_id is required' }, { status: 400 });
    }

    const records = await sql`
      SELECT * FROM consent_records
      WHERE patient_id = ${patientId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ records });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/consent
 * Create a consent record (append-only — never UPDATE/DELETE)
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { patient_id, purpose, scope, expires_in_days } = body;

    if (!patient_id || !purpose) {
      return NextResponse.json({ error: 'patient_id and purpose are required.' }, { status: 400 });
    }

    const id = 'consent_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const expiresAt = expires_in_days
      ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // default 1 year

    const inserted = await sql`
      INSERT INTO consent_records (id, patient_id, requested_by, purpose, scope, status, granted_at, expires_at)
      VALUES (
        ${id}, ${patient_id}, ${session.id}, ${purpose},
        ${JSON.stringify(scope || ['treatment_records'])}::jsonb,
        'granted',
        CURRENT_TIMESTAMP,
        ${expiresAt}
      )
      RETURNING *
    `;

    return NextResponse.json({ record: inserted[0] });
  } catch (error: any) {
    console.error('Create consent error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/consent
 * Revoke a consent (append a revocation — does NOT delete the original)
 */
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { consent_id } = await req.json();

    if (!consent_id) {
      return NextResponse.json({ error: 'consent_id is required' }, { status: 400 });
    }

    const updated = await sql`
      UPDATE consent_records
      SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP
      WHERE id = ${consent_id} AND status = 'granted'
      RETURNING *
    `;

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Consent not found or already revoked.' }, { status: 404 });
    }

    return NextResponse.json({ record: updated[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
