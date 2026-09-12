import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession, authorize } from '@/lib/auth';

/**
 * GET /api/inventory?branch_id=xxx
 */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branch_id');

    if (!branchId) {
      return NextResponse.json({ error: 'branch_id is required' }, { status: 400 });
    }

    const err = authorize(session, { branchId });
    if (err) return NextResponse.json({ error: err }, { status: 403 });

    const items = await sql`
      SELECT * FROM inventory_items
      WHERE branch_id = ${branchId}
      ORDER BY
        CASE WHEN quantity_on_hand <= reorder_threshold THEN 0 ELSE 1 END,
        name ASC
    `;

    // Count low-stock items
    const lowStockCount = items.filter(
      (i: any) => i.quantity_on_hand <= i.reorder_threshold
    ).length;

    return NextResponse.json({ items, lowStockCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/inventory — Add new inventory item
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const err = authorize(session, { roles: ['admin', 'staff'] });
    if (err) return NextResponse.json({ error: err }, { status: 403 });

    const body = await req.json();
    const { branch_id, name, category, quantity_on_hand, reorder_threshold, unit } = body;

    if (!branch_id || !name) {
      return NextResponse.json({ error: 'branch_id and name are required.' }, { status: 400 });
    }

    const id = 'inv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const inserted = await sql`
      INSERT INTO inventory_items (id, branch_id, name, category, quantity_on_hand, reorder_threshold, unit)
      VALUES (${id}, ${branch_id}, ${name}, ${category || null}, ${quantity_on_hand || 0}, ${reorder_threshold || 5}, ${unit || 'unit'})
      RETURNING *
    `;

    return NextResponse.json({ item: inserted[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/inventory — Update stock quantity or restock
 */
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, quantity_on_hand, reorder_threshold, is_restock } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'id is required.' }, { status: 400 });
    }

    const updated = await sql`
      UPDATE inventory_items
      SET quantity_on_hand = COALESCE(${quantity_on_hand !== undefined ? parseInt(quantity_on_hand, 10) : null}, quantity_on_hand),
          reorder_threshold = COALESCE(${reorder_threshold !== undefined ? parseInt(reorder_threshold, 10) : null}, reorder_threshold),
          last_restocked_at = CASE WHEN ${is_restock || false} THEN CURRENT_TIMESTAMP ELSE last_restocked_at END
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({ item: updated[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
