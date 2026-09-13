import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await params;
    const { searchParams } = new URL(req.url);
    const rawLang = searchParams.get('lang');
    const lang: 'en' | 'hi' | 'kn' = rawLang === 'kn' ? 'kn' : rawLang === 'hi' ? 'hi' : 'en';

    const KANNADA_TERMS: Record<string, string> = {
      caries: 'ಹಲ್ಲಿನ ಹುಳುಕು / ಸವೆತ (ಕ್ಯಾವಿಟಿ)',
      filling: 'ಹಲ್ಲಿನ ಸಿಮೆಂಟಿಂಗ್ / ಫಿಲ್ಲಿಂಗ್',
      crown: 'ಹಲ್ಲಿನ ಕ್ಯಾಪ್ / ಕಿರೀಟ (ಕ್ರೌನ್)',
      missing: 'ಕಾಣೆಯಾದ / ತೆಗೆದ ಹಲ್ಲು',
      healthy: 'ಸಂಪೂರ್ಣ ಆರೋಗ್ಯಕರ ಹಲ್ಲು',
      urgent: 'ತಕ್ಷಣದ ಅಗತ್ಯ ಚಿಕಿತ್ಸೆ (ನೋವು / ಸೋಂಕು ತಡೆ)',
      soon: 'ಮುಂದಿನ ೨-೪ ವಾರಗಳಲ್ಲಿ ಮಾಡಿಸಬಹುದಾದ ಚಿಕಿತ್ಸೆ',
      preventive: 'ನಿಯಮಿತ ದಂತ ರಕ್ಷಣೆ ಮತ್ತು ನಿರ್ವಹಣೆ',
      elective: 'ಸೌಂದರ್ಯ ವರ್ಧಕ ಚಿಕಿತ್ಸೆ',
    };

    const KANNADA_PROCEDURES: Record<string, string> = {
      'Composite Restoration': 'ನೈಸರ್ಗಿಕ ಹಲ್ಲಿನ ಬಣ್ಣದ ಕಾಂಪೋಸಿಟ್ ಫಿಲ್ಲಿಂಗ್',
      'Root Canal Treatment (RCT)': 'ನೈಸರ್ಗಿಕ ಹಲ್ಲು ಉಳಿಸುವ ರೋಟರಿ ರೂಟ್ ಕೆನಾಲ್ ಚಿಕಿತ್ಸೆ',
      'Zirconia Crown': 'ದೀರ್ಘಕಾಲ ಬಾಳಿಕೆ ಬರುವ ಪ್ರೀಮಿಯಂ ಜಿರ್ಕೋನಿಯಾ ಹಲ್ಲಿನ ಕ್ಯಾಪ್',
      'Dental Implant': 'ಟೈಟಾನಿಯಂ ದಂತ ಇಂಪ್ಲಾಂಟ್ (ಕೃತಕ ಬೇರು)',
      'Scaling & Polishing': 'ಅಲ್ಟ್ರಾಸಾನಿಕ್ ಹಲ್ಲುಗಳ ಸ್ವಚ್ಛತೆ ಮತ್ತು ಪಾಲಿಶ್',
      'Surgical Extraction': 'ನೋವಿಲ್ಲದ ದವಡೆ ಹಲ್ಲು ಹೊರತೆಗೆಯುವಿಕೆ',
      'Tooth Extraction': 'ಸುಲಭ ಹಲ್ಲು ಕೀಳುವಿಕೆ',
      'Teeth Whitening': 'ವೃತ್ತಿಪರ ಲೇಸರ್ ಹಲ್ಲು ಬೆಳ್ಳಗಾಗಿಸುವ ಚಿಕಿತ್ಸೆ',
      'Orthodontic Consultation': 'ಹಲ್ಲುಗಳ ಜೋಡಣೆ ಮತ್ತು ಕ್ಲಿಪ್ ತಪಾಸಣೆ',
      'Panoramic OPG X-Ray': 'ಪೂರ್ಣ ಮುಖದ ಡಿಜಿಟಲ್ ಪನೋರಮಿಕ್ ಎಕ್ಸ್-ರೇ',
      'Dental IOPA X-Ray': 'ಕಡಿಮೆ ವಿಕಿರಣದ ಡಿಜಿಟಲ್ ಐಒಪಿಎ ಎಕ್ಸ್-ರೇ',
    };

    // 1. Fetch patient
    const patients = await sql`SELECT * FROM patients WHERE id = ${patientId} LIMIT 1`;
    if (patients.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }
    const patient = patients[0];

    // 2. Fetch branch info for clinic header
    const branches = await sql`SELECT * FROM branches WHERE id = ${patient.branch_id} LIMIT 1`;
    const branch = branches.length > 0 ? branches[0] : null;

    // 3. Fetch translations dictionary
    const translationsRows = await sql`SELECT * FROM translations`;
    const transMap: Record<string, { en: string; hi: string; kn: string }> = {};
    for (const t of translationsRows) {
      transMap[t.clinical_term] = {
        en: t.friendly_en,
        hi: t.friendly_hi,
        kn: t.friendly_kn || KANNADA_TERMS[t.clinical_term] || t.friendly_en,
      };
    }

    // 4. Fetch price list for procedure friendly descriptions
    const priceListRows = await sql`SELECT * FROM price_list`;
    const priceMap: Record<string, { en: string; hi: string; kn: string; category: string }> = {};
    for (const p of priceListRows) {
      priceMap[p.procedure_name] = {
        en: p.patient_friendly_en,
        hi: p.patient_friendly_hi,
        kn: p.patient_friendly_kn || KANNADA_PROCEDURES[p.procedure_name] || p.patient_friendly_en,
        category: p.category,
      };
    }

    // 5. Fetch latest tooth findings (latest per tooth across all visits)
    const toothRecords = await sql`
      SELECT DISTINCT ON (tr.tooth_number) tr.*
      FROM tooth_records tr
      JOIN visits v ON tr.visit_id = v.id
      WHERE v.patient_id = ${patientId}
      ORDER BY tr.tooth_number, tr.recorded_at DESC
    `;

    // Filter only non-healthy teeth for patient summary
    const findings = toothRecords
      .filter((t: any) => t.condition !== 'healthy')
      .map((t: any) => {
        const condMeta = transMap[t.condition] || {
          en: t.condition,
          hi: t.condition,
          kn: KANNADA_TERMS[t.condition] || t.condition,
        };
        return {
          toothNumber: t.tooth_number,
          clinicalCondition: t.condition,
          surfaces: t.surfaces,
          notes: t.notes,
          friendlyDescription: lang === 'kn' ? condMeta.kn : lang === 'hi' ? condMeta.hi : condMeta.en,
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

    const formattedPlan = planItems.map((item: any) => {
      const procInfo = priceMap[item.procedure_name];
      const prioMeta = transMap[item.priority] || {
        en: item.priority,
        hi: item.priority,
        kn: KANNADA_TERMS[item.priority] || item.priority,
      };
      const toothRefs = item.tooth_refs || [];
      const toothNumber = toothRefs.length > 0 ? toothRefs[0] : 'all';

      const friendlyProcedureName = procInfo
        ? (lang === 'kn' ? procInfo.kn : lang === 'hi' ? procInfo.hi : procInfo.en)
        : (lang === 'kn' ? (KANNADA_PROCEDURES[item.procedure_name] || item.procedure_name) : item.procedure_name);

      return {
        id: item.id,
        toothNumber,
        toothRefs,
        procedureName: item.procedure_name,
        friendlyProcedureName,
        category: procInfo ? procInfo.category : 'General',
        priority: item.priority,
        friendlyPriority: lang === 'kn' ? prioMeta.kn : lang === 'hi' ? prioMeta.hi : prioMeta.en,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        totalPrice: Number(item.quantity) * Number(item.unit_price),
        notes: item.notes,
        status: item.status,
        insuranceClaimable: item.insurance_claimable,
        payerName: item.payer_name,
      };
    });

    const grandTotal = formattedPlan.reduce((acc: number, cur: any) => acc + cur.totalPrice, 0);
    const insuranceTotal = formattedPlan
      .filter((i: any) => i.insuranceClaimable)
      .reduce((acc: number, cur: any) => acc + cur.totalPrice, 0);

    // 7. Fetch AI findings for this patient (for evidence)
    const aiFindings = await sql`
      SELECT af.*, ia.tooth_number as image_tooth, ia.type as image_type
      FROM ai_findings af
      JOIN imaging_assets ia ON af.imaging_asset_id = ia.id
      WHERE ia.visit_id IN (
        SELECT v.id FROM visits v WHERE v.patient_id = ${patientId}
      )
      ORDER BY af.generated_at DESC
    `;

    // Get dentist name from most recent visit
    const recentVisit = await sql`
      SELECT u.name as dentist_name, u.hpr_id
      FROM visits v
      JOIN users u ON v.dentist_id = u.id
      WHERE v.patient_id = ${patientId}
      ORDER BY v.date DESC
      LIMIT 1
    `;

    return NextResponse.json({
      language: lang,
      patient: {
        id: patient.id,
        name: patient.full_name,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone,
        abhaNumber: patient.abha_number,
        abhaStatus: patient.abha_link_status,
      },
      clinicInfo: {
        name: branch?.name || 'Apex Dental',
        address: branch?.address || '',
        phone: branch?.phone || '',
        gstin: branch?.gstin || '',
        doctorName: recentVisit.length > 0 ? recentVisit[0].dentist_name : '',
        hprId: recentVisit.length > 0 ? recentVisit[0].hpr_id : '',
      },
      findings,
      treatmentPlan: formattedPlan,
      grandTotal,
      insuranceTotal,
      aiFindings: aiFindings.map((af: any) => ({
        toothNumber: af.tooth_number,
        findingType: af.finding_type,
        confidence: Number(af.confidence_score),
        description: af.description,
        imageType: af.image_type,
      })),
    });
  } catch (error: any) {
    console.error('Presentation API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
