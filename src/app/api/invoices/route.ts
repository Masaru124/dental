import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession, authorize } from '@/lib/auth';

/**
 * GET /api/invoices?patient_id=xxx OR ?branch_id=xxx
 * Invoices list — per patient or per branch
 */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patient_id');
    const branchId = searchParams.get('branch_id');

    let invoices;
    if (patientId) {
      invoices = await sql`
        SELECT i.*, p.full_name as patient_name
        FROM invoices i
        JOIN patients p ON i.patient_id = p.id
        WHERE i.patient_id = ${patientId}
        ORDER BY i.created_at DESC
      `;
    } else if (branchId) {
      const err = authorize(session, { branchId });
      if (err) return NextResponse.json({ error: err }, { status: 403 });

      invoices = await sql`
        SELECT i.*, p.full_name as patient_name
        FROM invoices i
        JOIN patients p ON i.patient_id = p.id
        WHERE i.branch_id = ${branchId}
        ORDER BY i.created_at DESC
        LIMIT 100
      `;
    } else {
      return NextResponse.json({ error: 'patient_id or branch_id is required' }, { status: 400 });
    }

    return NextResponse.json({ invoices });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/invoices
 * Generate invoice from visit's treatment plan
 * Server computes subtotal, tax, total — never trust client totals
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const err = authorize(session, { roles: ['dentist', 'admin', 'staff'] });
    if (err) return NextResponse.json({ error: err }, { status: 403 });

    const body = await req.json();
    const { visit_id: reqVisitId, patient_id, custom_items } = body;

    if (!patient_id) {
      return NextResponse.json({ error: 'patient_id is required.' }, { status: 400 });
    }

    // Get patient's branch
    const patientRows = await sql`SELECT branch_id FROM patients WHERE id = ${patient_id} LIMIT 1`;
    if (patientRows.length === 0) {
      return NextResponse.json({ error: 'Patient not found.' }, { status: 404 });
    }
    const branchId = patientRows[0].branch_id;

    // Resolve or create a visit
    let visitId = reqVisitId;
    if (!visitId) {
      const existingVisits = await sql`
        SELECT id FROM visits WHERE patient_id = ${patient_id} ORDER BY date DESC LIMIT 1
      `;
      if (existingVisits.length > 0) {
        visitId = existingVisits[0].id;
      } else {
        visitId = 'vis_' + Date.now().toString(36);
        await sql`
          INSERT INTO visits (id, branch_id, patient_id, dentist_id, status, chief_complaint)
          VALUES (${visitId}, ${branchId}, ${patient_id}, ${session.id}, 'completed', 'Billing & Procedure')
        `;
      }
    }

    // Get branch GSTIN
    const branchRows = await sql`SELECT gstin FROM branches WHERE id = ${branchId} LIMIT 1`;
    const gstin = branchRows.length > 0 ? branchRows[0].gstin : null;

    // Determine line items
    let lineItemEntries: { id: string; description: string; amount: number; treatment_plan_item_id?: string }[] = [];

    if (Array.isArray(custom_items) && custom_items.length > 0) {
      lineItemEntries = custom_items.map((ci: any) => ({
        id: 'li_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        description: ci.description || ci.procedure_name || 'Dental Service',
        amount: Number(ci.amount || ci.unit_price || 0),
        treatment_plan_item_id: ci.treatment_plan_item_id || null,
      }));
    } else {
      // Get treatment items for this visit (or all unbilled for patient)
      let items = await sql`
        SELECT * FROM treatment_plan_items
        WHERE visit_id = ${visitId}
      `;
      if (items.length === 0) {
        // Look across recent patient visits
        items = await sql`
          SELECT * FROM treatment_plan_items
          WHERE visit_id IN (SELECT id FROM visits WHERE patient_id = ${patient_id})
          ORDER BY created_at DESC LIMIT 5
        `;
      }

      if (items.length === 0) {
        // Fallback standard consultation
        lineItemEntries = [{
          id: 'li_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          description: 'Comprehensive Clinical Dental Consultation & Diagnostics',
          amount: 800,
        }];
      } else {
        lineItemEntries = items.map((item: any) => ({
          id: 'li_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          description: item.procedure_name || 'Dental Procedure',
          amount: Number(item.quantity || 1) * Number(item.unit_price || 1000),
          treatment_plan_item_id: item.id,
        }));
      }
    }

    // Server-side compute totals
    const subtotal = lineItemEntries.reduce((sum, item) => sum + item.amount, 0);
    const defaultTaxRate = 18; // GST 18% for dental services (SAC 999312)
    const taxAmount = Math.round((subtotal * defaultTaxRate / 100) * 100) / 100;
    const total = subtotal + taxAmount;

    const invoiceId = 'inv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const invoice = await sql`
      INSERT INTO invoices (id, branch_id, patient_id, visit_id, gstin, subtotal, tax_amount, total, status, issued_at)
      VALUES (${invoiceId}, ${branchId}, ${patient_id}, ${visitId}, ${gstin}, ${subtotal}, ${taxAmount}, ${total}, 'issued', CURRENT_TIMESTAMP)
      RETURNING *
    `;

    // Create line items
    for (const item of lineItemEntries) {
      await sql`
        INSERT INTO invoice_line_items (id, invoice_id, treatment_plan_item_id, description, hsn_sac_code, tax_rate_percent, amount)
        VALUES (${item.id}, ${invoiceId}, ${item.treatment_plan_item_id || null}, ${item.description}, '999312', 18.00, ${item.amount})
      `;
    }

    const lineItems = await sql`
      SELECT * FROM invoice_line_items WHERE invoice_id = ${invoiceId} ORDER BY created_at ASC
    `;

    return NextResponse.json({ invoice: invoice[0], lineItems });
  } catch (error: any) {
    console.error('Create invoice error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/invoices — Update invoice status
 */
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required.' }, { status: 400 });
    }

    const updated = await sql`
      UPDATE invoices
      SET status = ${status},
          issued_at = CASE WHEN ${status} = 'issued' AND issued_at IS NULL THEN CURRENT_TIMESTAMP ELSE issued_at END
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({ invoice: updated[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
