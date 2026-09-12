import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession, authorize } from '@/lib/auth';

/**
 * GET /api/insurance-claims?invoice_id=xxx OR ?branch_id=xxx
 */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get('invoice_id');
    const branchId = searchParams.get('branch_id');

    let claims;
    if (invoiceId) {
      claims = await sql`
        SELECT ic.*, i.total as invoice_total, p.full_name as patient_name
        FROM insurance_claims ic
        JOIN invoices i ON ic.invoice_id = i.id
        JOIN patients p ON i.patient_id = p.id
        WHERE ic.invoice_id = ${invoiceId}
        ORDER BY ic.created_at DESC
      `;
    } else if (branchId) {
      const err = authorize(session, { branchId });
      if (err) return NextResponse.json({ error: err }, { status: 403 });

      claims = await sql`
        SELECT ic.*, i.total as invoice_total, p.full_name as patient_name
        FROM insurance_claims ic
        JOIN invoices i ON ic.invoice_id = i.id
        JOIN patients p ON i.patient_id = p.id
        WHERE i.branch_id = ${branchId}
        ORDER BY ic.created_at DESC
        LIMIT 100
      `;
    } else {
      return NextResponse.json({ error: 'invoice_id or branch_id is required' }, { status: 400 });
    }

    return NextResponse.json({ claims });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/insurance-claims — Submit a new claim
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { invoice_id, payer_name, policy_reference } = await req.json();

    if (!invoice_id || !payer_name) {
      return NextResponse.json({ error: 'invoice_id and payer_name are required.' }, { status: 400 });
    }

    const id = 'claim_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const inserted = await sql`
      INSERT INTO insurance_claims (id, invoice_id, payer_name, policy_reference, claim_status, submitted_at)
      VALUES (${id}, ${invoice_id}, ${payer_name}, ${policy_reference || null}, 'submitted', CURRENT_TIMESTAMP)
      RETURNING *
    `;

    return NextResponse.json({ claim: inserted[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/insurance-claims — Update claim status
 */
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, claim_status, rejection_reason, nhcx_reference_id } = await req.json();

    if (!id || !claim_status) {
      return NextResponse.json({ error: 'id and claim_status are required.' }, { status: 400 });
    }

    const resolvedStatuses = ['approved', 'rejected', 'paid'];

    const updated = await sql`
      UPDATE insurance_claims
      SET claim_status = ${claim_status},
          rejection_reason = COALESCE(${rejection_reason || null}, rejection_reason),
          nhcx_reference_id = COALESCE(${nhcx_reference_id || null}, nhcx_reference_id),
          resolved_at = CASE WHEN ${claim_status} = ANY(${resolvedStatuses}) THEN CURRENT_TIMESTAMP ELSE resolved_at END
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({ claim: updated[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
