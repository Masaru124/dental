import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await params;
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get('lang') === 'hi' ? 'hi' : 'en';

    // 1. Fetch patient
    const patients = await sql`SELECT * FROM patients WHERE id = ${patientId} LIMIT 1`;
    if (patients.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }
    const patient = patients[0];

    // 2. Fetch translations dictionary
    const translationsRows = await sql`SELECT * FROM translations`;
    const transMap: Record<string, { en: string; hi: string }> = {};
    for (const t of translationsRows) {
      transMap[t.clinical_term] = { en: t.friendly_en, hi: t.friendly_hi };
    }

    // 3. Fetch price list for procedure friendly descriptions
    const priceListRows = await sql`SELECT * FROM price_list`;
    const priceMap: Record<string, { en: string; hi: string; category: string }> = {};
    for (const p of priceListRows) {
      priceMap[p.procedure_name] = {
        en: p.patient_friendly_en,
        hi: p.patient_friendly_hi,
        category: p.category,
      };
    }

    // 4. Fetch latest tooth findings
    const toothRecords = await sql`
      SELECT DISTINCT ON (tooth_number) *
      FROM tooth_records
      WHERE patient_id = ${patientId}
      ORDER BY tooth_number, recorded_at DESC
    `;

    // Filter only non-healthy teeth for patient summary
    const findings = toothRecords
      .filter((t: any) => t.condition !== 'healthy')
      .map((t: any) => {
        const condMeta = transMap[t.condition] || { en: t.condition, hi: t.condition };
        return {
          toothNumber: t.tooth_number,
          clinicalCondition: t.condition,
          surfaces: t.surfaces,
          notes: t.notes,
          friendlyDescription: lang === 'hi' ? condMeta.hi : condMeta.en,
        };
      });

    // 5. Fetch treatment plan items
    const planItems = await sql`
      SELECT * FROM treatment_plan_items
      WHERE patient_id = ${patientId}
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

    const formattedPlan = planItems.map((item: any) => {
      const procInfo = priceMap[item.procedure_name];
      const prioMeta = transMap[item.priority] || { en: item.priority, hi: item.priority };
      return {
        id: item.id,
        toothNumber: item.tooth_number,
        procedureName: item.procedure_name,
        friendlyProcedureName: procInfo ? (lang === 'hi' ? procInfo.hi : procInfo.en) : item.procedure_name,
        category: procInfo ? procInfo.category : 'General',
        priority: item.priority,
        friendlyPriority: lang === 'hi' ? prioMeta.hi : prioMeta.en,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        totalPrice: Number(item.quantity) * Number(item.unit_price),
        notes: item.notes,
        status: item.status,
      };
    });

    const grandTotal = formattedPlan.reduce((acc: number, cur: any) => acc + cur.totalPrice, 0);

    return NextResponse.json({
      language: lang,
      patient: {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone,
      },
      clinicInfo: {
        name: 'Apex Dental Care & Implant Center',
        address: 'Suite 402, Medical Enclave, MG Road',
        phone: '+91 22 5550 1920',
        doctorName: 'Dr. Rajesh Sharma, MDS (Oral & Maxillofacial Prosthodontics)',
      },
      findings,
      treatmentPlan: formattedPlan,
      grandTotal,
    });
  } catch (error: any) {
    console.error('Presentation API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
