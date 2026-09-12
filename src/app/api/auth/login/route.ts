import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyPassword, signSession, setSessionCookie, UserSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const rows = await sql`
      SELECT id, email, password_hash, name, role, tenant_id, branch_ids, hpr_id, is_active
      FROM users
      WHERE LOWER(email) = LOWER(${email.trim()})
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const user = rows[0];

    if (!user.is_active) {
      return NextResponse.json({ error: 'Account is disabled. Contact your admin.' }, { status: 403 });
    }

    const isMatch = await verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const sessionUser: UserSession = {
      id: user.id,
      tenantId: user.tenant_id,
      branchIds: user.branch_ids,
      email: user.email,
      name: user.name,
      role: user.role,
      hprId: user.hpr_id || undefined,
    };

    const token = await signSession(sessionUser);
    await setSessionCookie(token);

    // Record activity log
    const activeBranchId = user.branch_ids.includes('*')
      ? null
      : (user.branch_ids[0] || null);

    await sql`
      INSERT INTO activity_logs (id, branch_id, user_id, user_name, action, details)
      VALUES (
        ${'act_' + Date.now()},
        ${activeBranchId},
        ${user.id},
        ${user.name},
        'USER_LOGIN',
        ${JSON.stringify({ ip: req.headers.get('x-forwarded-for') || 'local', role: user.role })}
      )
    `;

    return NextResponse.json({ success: true, user: sessionUser });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}
