import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession, authorize } from '@/lib/auth';

/**
 * GET /api/treatment-plan?visit_id=xxx OR ?patient_id=xxx
 * Server-side computed totals — never trust client-submitted totals
 */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const visitId = searchParams.get('visit_id');
    const patientId = searchParams.get('patient_id');

    let items;
    if (visitId) {
      items = await sql`
        SELECT * FROM treatment_plan_items
        WHERE visit_id = ${visitId}
        ORDER BY
          CASE priority
            WHEN 'urgent' THEN 1
            WHEN 'soon' THEN 2
            WHEN 'preventive' THEN 3
            WHEN 'elective' THEN 4
            ELSE 5
          END,
          created_at ASC
      `;
    } else if (patientId) {
      items = await sql`
        SELECT tpi.* FROM treatment_plan_items tpi
        WHERE tpi.visit_id IN (
          SELECT v.id FROM visits v WHERE v.patient_id = ${patientId}
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
      `;
    } else {
      return NextResponse.json({ error: 'visit_id or patient_id is required' }, { status: 400 });
    }

    // Server-side compute totals (architecture.md §5 invariant)
    const computeTotal = (filterFn: (i: any) => boolean) =>
      items.filter(filterFn).reduce(
        (sum: number, item: any) => sum + Number(item.quantity) * Number(item.unit_price),
        0
      );

    const grandTotal = computeTotal(() => true);
    const urgentTotal = computeTotal((i: any) => i.priority === 'urgent');
    const soonTotal = computeTotal((i: any) => i.priority === 'soon');
    const preventiveTotal = computeTotal((i: any) => i.priority === 'preventive');
    const electiveTotal = computeTotal((i: any) => i.priority === 'elective');
    const insuranceClaimable = computeTotal((i: any) => i.insurance_claimable);

    return NextResponse.json({
      items,
      totals: {
        grandTotal,
        urgentTotal,
        soonTotal,
        preventiveTotal,
        electiveTotal,
        insuranceClaimable,
      },
    });
  } catch (error: any) {
    console.error('Fetch treatment plan error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/treatment-plan
 * Add a treatment item to a visit
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const err = authorize(session, { roles: ['dentist', 'admin'] });
    if (err) return NextResponse.json({ error: err }, { status: 403 });

    const body = await req.json();
    let targetVisitId = body.visit_id;

    if (!targetVisitId && body.patient_id) {
      const recentVisit = await sql`
        SELECT id FROM visits
        WHERE patient_id = ${body.patient_id} AND status = 'in_progress'
        ORDER BY date DESC LIMIT 1
      `;
      if (recentVisit.length > 0) {
        targetVisitId = recentVisit[0].id;
      } else {
        const patientRows = await sql`SELECT branch_id FROM patients WHERE id = ${body.patient_id} LIMIT 1`;
        if (patientRows.length > 0) {
          targetVisitId = 'vis_' + Date.now().toString(36);
          await sql`
            INSERT INTO visits (id, branch_id, patient_id, dentist_id, chief_complaint)
            VALUES (${targetVisitId}, ${patientRows[0].branch_id}, ${body.patient_id}, ${session.id}, 'Treatment Plan Consultation')
          `;
        }
      }
    }

    // Handle batch creation of plan items
    if (Array.isArray(body.items) && body.items.length > 0) {
      if (!targetVisitId) {
        return NextResponse.json({ error: 'visit_id or valid patient_id is required for batch items.' }, { status: 400 });
      }

      const insertedList = [];
      for (const it of body.items) {
        if (!it.procedure_name || !it.priority || it.unit_price === undefined) continue;
        const id = 'tp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const ins = await sql`
          INSERT INTO treatment_plan_items (
            id, visit_id, tooth_refs, procedure_name, priority, quantity, unit_price,
            notes, insurance_claimable, payer_name, lab_job_required
          ) VALUES (
            ${id},
            ${targetVisitId},
            ${JSON.stringify(it.tooth_refs || [])}::jsonb,
            ${it.procedure_name},
            ${it.priority},
            ${it.quantity || 1},
            ${parseFloat(it.unit_price)},
            ${it.notes || ''},
            ${it.insurance_claimable || false},
            ${it.payer_name || null},
            ${it.lab_job_required || false}
          )
          RETURNING *
        `;
        if (ins.length > 0) insertedList.push(ins[0]);
      }

      return NextResponse.json({ items: insertedList, count: insertedList.length });
    }

    const {
      tooth_refs, procedure_name, priority, quantity,
      unit_price, notes, insurance_claimable, payer_name,
      lab_job_required
    } = body;

    if (!targetVisitId || !procedure_name || !priority || unit_price === undefined) {
      return NextResponse.json({ error: 'Missing required fields for treatment item.' }, { status: 400 });
    }

    const id = 'tp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const inserted = await sql`
      INSERT INTO treatment_plan_items (
        id, visit_id, tooth_refs, procedure_name, priority, quantity, unit_price,
        notes, insurance_claimable, payer_name, lab_job_required
      ) VALUES (
        ${id},
        ${targetVisitId},
        ${JSON.stringify(tooth_refs || [])}::jsonb,
        ${procedure_name},
        ${priority},
        ${quantity || 1},
        ${parseFloat(unit_price)},
        ${notes || ''},
        ${insurance_claimable || false},
        ${payer_name || null},
        ${lab_job_required || false}
      )
      RETURNING *
    `;

    // Get branch for activity log
    const visitRows = await sql`SELECT branch_id FROM visits WHERE id = ${targetVisitId} LIMIT 1`;
    const branchId = visitRows.length > 0 ? visitRows[0].branch_id : null;

    await sql`
      INSERT INTO activity_logs (id, branch_id, user_id, user_name, action, entity_type, entity_id, details)
      VALUES (
        ${'act_' + Date.now()},
        ${branchId},
        ${session.id},
        ${session.name},
        'ADD_TREATMENT_ITEM',
        'treatment_plan_item',
        ${id},
        ${JSON.stringify({ procedure: procedure_name, cost: unit_price, priority })}
      )
    `;

    return NextResponse.json({ item: inserted[0] });
  } catch (error: any) {
    console.error('Add treatment item error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/treatment-plan
 * Update treatment item status, details, or insurance/lab flags
 */
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      id, tooth_refs, procedure_name, priority, quantity,
      unit_price, status, notes, insurance_claimable, payer_name,
      lab_job_required, lab_case_id
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required.' }, { status: 400 });
    }

    const updated = await sql`
      UPDATE treatment_plan_items
      SET tooth_refs = COALESCE(${tooth_refs ? JSON.stringify(tooth_refs) : null}::jsonb, tooth_refs),
          procedure_name = COALESCE(${procedure_name || null}, procedure_name),
          priority = COALESCE(${priority || null}, priority),
          quantity = COALESCE(${quantity ? parseInt(quantity, 10) : null}, quantity),
          unit_price = COALESCE(${unit_price !== undefined ? parseFloat(unit_price) : null}, unit_price),
          status = COALESCE(${status || null}, status),
          notes = COALESCE(${notes || null}, notes),
          insurance_claimable = COALESCE(${insurance_claimable !== undefined ? insurance_claimable : null}, insurance_claimable),
          payer_name = COALESCE(${payer_name || null}, payer_name),
          lab_job_required = COALESCE(${lab_job_required !== undefined ? lab_job_required : null}, lab_job_required),
          lab_case_id = COALESCE(${lab_case_id || null}, lab_case_id)
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({ item: updated[0] });
  } catch (error: any) {
    console.error('Update treatment item error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/treatment-plan?id=xxx
 * Remove a treatment item (only proposed/declined items)
 */
export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const err = authorize(session, { roles: ['dentist', 'admin'] });
    if (err) return NextResponse.json({ error: err }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Only allow deletion of proposed/declined items
    await sql`
      DELETE FROM treatment_plan_items
      WHERE id = ${id} AND status IN ('proposed', 'declined')
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
