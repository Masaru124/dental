import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const items = await sql`
      SELECT * FROM price_list ORDER BY category, procedure_name ASC
    `;
    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    // Allow authorized editing
    const { id, default_cost, procedure_name, category, patient_friendly_en, patient_friendly_hi } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Procedure ID is required' }, { status: 400 });
    }

    const updated = await sql`
      UPDATE price_list
      SET default_cost = COALESCE(${default_cost !== undefined ? parseFloat(default_cost) : null}, default_cost),
          procedure_name = COALESCE(${procedure_name}, procedure_name),
          category = COALESCE(${category}, category),
          patient_friendly_en = COALESCE(${patient_friendly_en}, patient_friendly_en),
          patient_friendly_hi = COALESCE(${patient_friendly_hi}, patient_friendly_hi)
      WHERE id = ${id}
      RETURNING *
    `;

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Procedure not found' }, { status: 404 });
    }

    // Log update in activity logs
    await sql`
      INSERT INTO activity_logs (id, user_id, user_name, action, details)
      VALUES (
        ${'act_' + Date.now()},
        ${session?.id || 'usr_dentist_1'},
        ${session?.name || 'Dr. Rajesh Sharma'},
        'UPDATE_PROCEDURE_FEE',
        ${JSON.stringify({ id, procedure: updated[0].procedure_name, newCost: updated[0].default_cost })}
      )
    `;

    return NextResponse.json({ item: updated[0], success: true });
  } catch (error: any) {
    console.error('Update price list error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { code, procedure_name, category, default_cost, patient_friendly_en, patient_friendly_hi } = await req.json();

    if (!code || !procedure_name || default_cost === undefined) {
      return NextResponse.json({ error: 'Code, procedure name, and fee are required' }, { status: 400 });
    }

    const id = 'pr_' + Date.now().toString(36);

    const inserted = await sql`
      INSERT INTO price_list (id, code, procedure_name, category, default_cost, patient_friendly_en, patient_friendly_hi)
      VALUES (
        ${id},
        ${code.trim()},
        ${procedure_name.trim()},
        ${category || 'General'},
        ${parseFloat(default_cost)},
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
