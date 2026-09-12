import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    // Support token formats: pat_xxx or share_pat_xxx or direct patient ID
    const patientId = token.startsWith('share_') ? token.replace('share_', '') : token;

    // 1. Fetch patient
    const patients = await sql`SELECT id, full_name, age, gender, phone, branch_id FROM patients WHERE id = ${patientId} LIMIT 1`;
    if (patients.length === 0) {
      return NextResponse.json({ error: 'Shared plan not found or expired.' }, { status: 404 });
    }
    const patient = patients[0];

    // 2. Fetch branch info
    const branches = await sql`SELECT * FROM branches WHERE id = ${patient.branch_id} LIMIT 1`;
    const branch = branches.length > 0 ? branches[0] : {
      name: 'Apex Dental Care & Implant Centre',
      address: '100 Feet Road, Koramangala, Bengaluru',
      phone: '+91 80 4123 4567',
    };

    // 3. Fetch translations
    const translationsRows = await sql`SELECT * FROM translations`;
    const transMap: Record<string, { en: string; hi: string }> = {};
    for (const t of translationsRows) {
      transMap[t.clinical_term] = { en: t.friendly_en, hi: t.friendly_hi };
    }

    // 4. Fetch price list for metadata
    const priceListRows = await sql`SELECT * FROM price_list`;
    const priceMap: Record<string, { en: string; hi: string; category: string }> = {};
    for (const p of priceListRows) {
      priceMap[p.procedure_name] = {
        en: p.patient_friendly_en,
        hi: p.patient_friendly_hi,
        category: p.category,
      };
    }

    // 5. Fetch tooth records
    const toothRecords = await sql`
      SELECT DISTINCT ON (tr.tooth_number) tr.*
      FROM tooth_records tr
      JOIN visits v ON tr.visit_id = v.id
      WHERE v.patient_id = ${patientId}
      ORDER BY tr.tooth_number, tr.recorded_at DESC
    `;

    const toothRecordsMap: Record<string, any> = {};
    for (const t of toothRecords) {
      toothRecordsMap[t.tooth_number] = {
        tooth_number: t.tooth_number,
        condition: t.condition,
        surfaces: t.surfaces || [],
        notes: t.notes || '',
      };
    }

    const findings = toothRecords
      .filter((t: any) => t.condition !== 'healthy')
      .map((t: any) => {
        const condMeta = transMap[t.condition] || { en: t.condition, hi: t.condition };
        return {
          toothNumber: t.tooth_number,
          clinicalCondition: t.condition,
          surfaces: t.surfaces,
          notes: t.notes,
          friendlyDescription_en: condMeta.en,
          friendlyDescription_hi: condMeta.hi,
        };
      });

    // 6. Fetch treatment plan items
    const planItems = await sql`
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

    let grandTotal = 0;
    const formattedPlan = planItems.map((item: any) => {
      const procInfo = priceMap[item.procedure_name];
      const prioMeta = transMap[item.priority] || { en: item.priority, hi: item.priority };
      const toothRefs = item.tooth_refs || [];
      const toothNumber = toothRefs.length > 0 ? toothRefs[0] : 'all';
      const itemTotal = Number(item.quantity) * Number(item.unit_price);
      grandTotal += itemTotal;

      return {
        id: item.id,
        toothNumber,
        toothRefs,
        procedureName: item.procedure_name,
        friendlyProcedureName_en: procInfo ? procInfo.en : item.procedure_name,
        friendlyProcedureName_hi: procInfo ? procInfo.hi : item.procedure_name,
        category: procInfo ? procInfo.category : 'General',
        priority: item.priority,
        friendlyPriority_en: prioMeta.en,
        friendlyPriority_hi: prioMeta.hi,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        totalPrice: itemTotal,
        notes: item.notes,
      };
    });

    const depositAmount = Math.max(500, Math.round(grandTotal * 0.1));

    return NextResponse.json({
      success: true,
      patient: {
        id: patient.id,
        name: patient.name || patient.full_name,
        age: patient.age,
        gender: patient.gender,
      },
      clinicInfo: {
        name: branch.name || 'Apex Dental Care',
        address: branch.address || 'Koramangala, Bengaluru',
        phone: branch.phone || '+91 80 4123 4567',
        doctorName: 'Dr. Rajesh Sharma, MDS (Chief Endodontist)',
        whatsappPhone: '919876543210',
      },
      findings,
      toothRecords: toothRecordsMap,
      treatmentPlan: formattedPlan,
      grandTotal,
      depositAmount,
      shareUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/plan/${token}`,
    });
  } catch (error: any) {
    console.error('Patient share error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
