import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession, authorize } from '@/lib/auth';

/**
 * GET /api/recall?branch_id=xxx
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

    const campaigns = await sql`
      SELECT rc.*,
             (SELECT COUNT(*)::int FROM reminder_logs rl WHERE rl.campaign_id = rc.id) as total_sent,
             (SELECT COUNT(*)::int FROM reminder_logs rl WHERE rl.campaign_id = rc.id AND rl.responded = true) as responded,
             (SELECT COUNT(*)::int FROM reminder_logs rl WHERE rl.campaign_id = rc.id AND rl.appointment_booked = true) as booked,
             (SELECT COUNT(*)::int FROM reminder_logs rl WHERE rl.campaign_id = rc.id AND rl.appointment_kept = true) as kept
      FROM recall_campaigns rc
      WHERE rc.branch_id = ${branchId}
      ORDER BY rc.created_at DESC
    `;

    return NextResponse.json({ campaigns });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/recall — Create a recall campaign
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const err = authorize(session, { roles: ['admin', 'staff'] });
    if (err) return NextResponse.json({ error: err }, { status: 403 });

    const body = await req.json();
    const { branch_id, name, trigger_type, trigger_params, channel } = body;

    if (!branch_id || !name || !trigger_type || !channel) {
      return NextResponse.json({ error: 'branch_id, name, trigger_type, and channel are required.' }, { status: 400 });
    }

    const id = 'recall_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const inserted = await sql`
      INSERT INTO recall_campaigns (id, branch_id, name, trigger_type, trigger_params, channel)
      VALUES (
        ${id}, ${branch_id}, ${name}, ${trigger_type},
        ${JSON.stringify(trigger_params || {})}::jsonb, ${channel}
      )
      RETURNING *
    `;

    return NextResponse.json({ campaign: inserted[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/recall — Toggle campaign active/inactive
 */
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, is_active } = await req.json();

    if (!id || is_active === undefined) {
      return NextResponse.json({ error: 'id and is_active are required.' }, { status: 400 });
    }

    const updated = await sql`
      UPDATE recall_campaigns
      SET is_active = ${is_active}
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({ campaign: updated[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
