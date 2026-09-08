import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();

    let patients;
    if (q) {
      const pattern = `%${q}%`;
      patients = await sql`
        SELECT p.*, 
               (SELECT COUNT(*)::int FROM visits v WHERE v.patient_id = p.id) as visit_count,
               (SELECT MAX(visit_date) FROM visits v WHERE v.patient_id = p.id) as last_visit_date
        FROM patients p
        WHERE p.name ILIKE ${pattern} OR p.phone ILIKE ${pattern} OR p.id ILIKE ${pattern}
        ORDER BY p.updated_at DESC
        LIMIT 50
      `;
    } else {
      patients = await sql`
        SELECT p.*, 
               (SELECT COUNT(*)::int FROM visits v WHERE v.patient_id = p.id) as visit_count,
               (SELECT MAX(visit_date) FROM visits v WHERE v.patient_id = p.id) as last_visit_date
        FROM patients p
        ORDER BY p.updated_at DESC
        LIMIT 50
      `;
    }

    return NextResponse.json({ patients });
  } catch (error: any) {
    console.error('Fetch patients error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { name, age, gender, phone, email, medical_history } = await req.json();

    if (!name || !age || !gender || !phone) {
      return NextResponse.json({ error: 'Name, age, gender, and phone number are required.' }, { status: 400 });
    }

    const id = 'pat_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const inserted = await sql`
      INSERT INTO patients (id, name, age, gender, phone, email, medical_history)
      VALUES (${id}, ${name.trim()}, ${parseInt(age, 10)}, ${gender}, ${phone.trim()}, ${email ? email.trim() : null}, ${medical_history || ''})
      RETURNING *
    `;

    // Activity log
    await sql`
      INSERT INTO activity_logs (id, user_id, user_name, action, details)
      VALUES (
        ${'act_' + Date.now()},
        ${session.id},
        ${session.name},
        'CREATE_PATIENT',
        ${JSON.stringify({ patientId: id, patientName: name })}
      )
    `;

    return NextResponse.json({ patient: inserted[0] });
  } catch (error: any) {
    console.error('Create patient error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
