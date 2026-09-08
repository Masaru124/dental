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
      SELECT id, email, password_hash, name, role
      FROM users
      WHERE LOWER(email) = LOWER(${email.trim()})
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const user = rows[0];
    const isMatch = await verifyPassword(password, user.password_hash);

    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const sessionUser: UserSession = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = await signSession(sessionUser);
    await setSessionCookie(token);

    // Record activity log
    await sql`
      INSERT INTO activity_logs (id, user_id, user_name, action, details)
      VALUES (
        ${'act_' + Date.now()},
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
