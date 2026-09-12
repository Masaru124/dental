import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession, authorize } from '@/lib/auth';

/**
 * GET /api/price-list?branchId=xxx
 * Branch-scoped price list with HSN/SAC codes
 */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId') || session.branchIds[0];

    let items;
    if (branchId === '*' || session.branchIds.includes('*')) {
      items = await sql`
        SELECT * FROM price_list ORDER BY category, procedure_name ASC
      `;
    } else {
      items = await sql`
        SELECT * FROM price_list
        WHERE branch_id = ${branchId} OR branch_id IS NULL
        ORDER BY category, procedure_name ASC
      `;
    }

    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/price-list — Update procedure fee (admin/owner only)
 */
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const err = authorize(session, { roles: ['admin', 'owner'] });
    if (err) return NextResponse.json({ error: err }, { status: 403 });

    const body = await req.json();
    const { id, default_cost, procedure_name, category, patient_friendly_en, patient_friendly_hi, hsn_sac_code, tax_rate_percent } = body;

    if (!id) {
      return NextResponse.json({ error: 'Procedure ID is required' }, { status: 400 });
    }

    const updated = await sql`
      UPDATE price_list
      SET default_cost = COALESCE(${default_cost !== undefined ? parseFloat(default_cost) : null}, default_cost),
          procedure_name = COALESCE(${procedure_name || null}, procedure_name),
          category = COALESCE(${category || null}, category),
          patient_friendly_en = COALESCE(${patient_friendly_en || null}, patient_friendly_en),
          patient_friendly_hi = COALESCE(${patient_friendly_hi || null}, patient_friendly_hi),
          hsn_sac_code = COALESCE(${hsn_sac_code || null}, hsn_sac_code),
          tax_rate_percent = COALESCE(${tax_rate_percent !== undefined ? parseFloat(tax_rate_percent) : null}, tax_rate_percent)
      WHERE id = ${id}
      RETURNING *
    `;

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Procedure not found' }, { status: 404 });
    }

    // Activity log
    const branchId = session.branchIds.includes('*') ? null : session.branchIds[0];
    await sql`
      INSERT INTO activity_logs (id, branch_id, user_id, user_name, action, entity_type, entity_id, details)
      VALUES (
        ${'act_' + Date.now()},
        ${branchId},
        ${session.id},
        ${session.name},
        'UPDATE_PROCEDURE_FEE',
        'price_list',
        ${id},
        ${JSON.stringify({ procedure: updated[0].procedure_name, newCost: updated[0].default_cost })}
      )
    `;

    return NextResponse.json({ item: updated[0], success: true });
  } catch (error: any) {
    console.error('Update price list error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/price-list — Add new procedure (admin/owner only)
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const err = authorize(session, { roles: ['admin', 'owner'] });
    if (err) return NextResponse.json({ error: err }, { status: 403 });

    const body = await req.json();
    const { code, procedure_name, category, default_cost, patient_friendly_en, patient_friendly_hi, branch_id, hsn_sac_code, tax_rate_percent } = body;

    if (!code || !procedure_name || default_cost === undefined) {
      return NextResponse.json({ error: 'Code, procedure name, and fee are required' }, { status: 400 });
    }

    const id = 'pr_' + Date.now().toString(36);
    const targetBranch = branch_id || (session.branchIds.includes('*') ? null : session.branchIds[0]);

    const inserted = await sql`
      INSERT INTO price_list (id, branch_id, code, procedure_name, category, default_cost, hsn_sac_code, tax_rate_percent, patient_friendly_en, patient_friendly_hi)
      VALUES (
        ${id},
        ${targetBranch},
        ${code.trim()},
        ${procedure_name.trim()},
        ${category || 'General'},
        ${parseFloat(default_cost)},
        ${hsn_sac_code || '999312'},
        ${tax_rate_percent !== undefined ? parseFloat(tax_rate_percent) : 18.00},
        ${patient_friendly_en || procedure_name},
        ${patient_friendly_hi || procedure_name}
      )
      RETURNING *
    `;

    return NextResponse.json({ item: inserted[0], success: true });
  } catch (error: any) {
    console.error('Create procedure error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
