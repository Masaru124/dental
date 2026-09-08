import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const patient_id = searchParams.get('patient_id');

    if (!patient_id) {
      return NextResponse.json({ error: 'patient_id is required' }, { status: 400 });
    }

    const items = await sql`
      SELECT * FROM treatment_plan_items
      WHERE patient_id = ${patient_id}
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

    // Server-side compute totals
    const grandTotal = items.reduce(
      (sum: number, item: any) => sum + Number(item.quantity) * Number(item.unit_price),
      0
    );

    const urgentTotal = items
      .filter((i: any) => i.priority === 'urgent')
      .reduce((sum: number, item: any) => sum + Number(item.quantity) * Number(item.unit_price), 0);

    const soonTotal = items
      .filter((i: any) => i.priority === 'soon')
      .reduce((sum: number, item: any) => sum + Number(item.quantity) * Number(item.unit_price), 0);

    const preventiveTotal = items
      .filter((i: any) => i.priority === 'preventive')
      .reduce((sum: number, item: any) => sum + Number(item.quantity) * Number(item.unit_price), 0);

    const electiveTotal = items
      .filter((i: any) => i.priority === 'elective')
      .reduce((sum: number, item: any) => sum + Number(item.quantity) * Number(item.unit_price), 0);

    return NextResponse.json({
      items,
      totals: {
        grandTotal,
        urgentTotal,
        soonTotal,
        preventiveTotal,
        electiveTotal,
      },
    });
  } catch (error: any) {
    console.error('Fetch treatment plan error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { patient_id, visit_id, tooth_number, procedure_name, priority, quantity, unit_price, notes } = await req.json();

    if (!patient_id || !tooth_number || !procedure_name || !priority || unit_price === undefined) {
      return NextResponse.json({ error: 'Missing required fields for treatment item.' }, { status: 400 });
    }

    const id = 'tp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const inserted = await sql`
      INSERT INTO treatment_plan_items (
        id, patient_id, visit_id, tooth_number, procedure_name, priority, quantity, unit_price, notes
      ) VALUES (
        ${id},
        ${patient_id},
        ${visit_id || null},
        ${tooth_number},
        ${procedure_name},
        ${priority},
        ${quantity || 1},
        ${parseFloat(unit_price)},
        ${notes || ''}
      )
      RETURNING *
    `;

    // Activity log
    await sql`
      INSERT INTO activity_logs (id, user_id, user_name, action, details)
      VALUES (
        ${'act_' + Date.now()},
        ${session.id},
        ${session.name},
        'ADD_TREATMENT_ITEM',
        ${JSON.stringify({ patientId: patient_id, procedure: procedure_name, cost: unit_price, priority })}
      )
    `;

    return NextResponse.json({ item: inserted[0] });
  } catch (error: any) {
    console.error('Add treatment item error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id, tooth_number, procedure_name, priority, quantity, unit_price, status, notes } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required.' }, { status: 400 });
    }

    const updated = await sql`
      UPDATE treatment_plan_items
      SET tooth_number = COALESCE(${tooth_number}, tooth_number),
          procedure_name = COALESCE(${procedure_name}, procedure_name),
          priority = COALESCE(${priority}, priority),
          quantity = COALESCE(${quantity ? parseInt(quantity, 10) : null}, quantity),
          unit_price = COALESCE(${unit_price ? parseFloat(unit_price) : null}, unit_price),
          status = COALESCE(${status}, status),
          notes = COALESCE(${notes}, notes)
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({ item: updated[0] });
  } catch (error: any) {
    console.error('Update treatment item error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await sql`DELETE FROM treatment_plan_items WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
