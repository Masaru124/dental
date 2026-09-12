import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession, authorize } from '@/lib/auth';

/**
 * Mock AI Provider — DentOS v2
 * 
 * Simulates an AI diagnostic service that analyzes dental X-rays.
 * Returns realistic mock findings for demo/testing purposes.
 * Ready to be replaced with a real API (e.g., Overjet, Pearl, etc.)
 */
function generateMockFindings(toothNumber: string | null): Array<{
  tooth_number: string;
  finding_type: string;
  confidence_score: number;
  description: string;
}> {
  const possibleFindings = [
    {
      tooth_number: toothNumber || '16',
      finding_type: 'caries' as const,
      confidence_score: 0.87,
      description: 'Probable interproximal caries detected on mesial surface. Radiolucency extends into dentin.',
    },
    {
      tooth_number: toothNumber || '36',
      finding_type: 'bone_loss' as const,
      confidence_score: 0.72,
      description: 'Horizontal bone loss detected. Approximately 2mm alveolar bone reduction on distal aspect.',
    },
    {
      tooth_number: toothNumber || '46',
      finding_type: 'calculus' as const,
      confidence_score: 0.91,
      description: 'Sub-gingival calculus deposit identified on lingual surface.',
    },
  ];

  // Return 1-2 random findings for realism
  const count = Math.random() > 0.5 ? 2 : 1;
  return possibleFindings.slice(0, count);
}

/**
 * GET /api/imaging?visit_id=xxx
 * List imaging assets for a visit
 */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const visitId = searchParams.get('visit_id');

    if (!visitId) {
      return NextResponse.json({ error: 'visit_id is required' }, { status: 400 });
    }

    const assets = await sql`
      SELECT ia.*, 
             (SELECT COUNT(*)::int FROM ai_findings af WHERE af.imaging_asset_id = ia.id) as finding_count
      FROM imaging_assets ia
      WHERE ia.visit_id = ${visitId}
      ORDER BY ia.uploaded_at DESC
    `;

    return NextResponse.json({ assets });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/imaging
 * Upload imaging metadata + trigger mock AI analysis
 * 
 * NOTE: Actual file upload goes to Vercel Blob.
 * This endpoint records the metadata and file_ref (Vercel Blob URL).
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const err = authorize(session, { roles: ['dentist'] });
    if (err) return NextResponse.json({ error: err }, { status: 403 });

    const body = await req.json();
    const { visit_id, tooth_number, type, file_ref, file_name, file_size } = body;

    if (!visit_id || !type || !file_ref) {
      return NextResponse.json({ error: 'visit_id, type, and file_ref are required.' }, { status: 400 });
    }

    const assetId = 'img_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const inserted = await sql`
      INSERT INTO imaging_assets (id, visit_id, tooth_number, type, file_ref, file_name, file_size, uploaded_by)
      VALUES (${assetId}, ${visit_id}, ${tooth_number || null}, ${type}, ${file_ref}, ${file_name || null}, ${file_size || null}, ${session.id})
      RETURNING *
    `;

    // ─── Mock AI Analysis ───────────────────────────────
    const mockFindings = generateMockFindings(tooth_number);
    const savedFindings = [];

    for (const finding of mockFindings) {
      const findingId = 'aif_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const saved = await sql`
        INSERT INTO ai_findings (id, imaging_asset_id, tooth_number, finding_type, confidence_score, description)
        VALUES (${findingId}, ${assetId}, ${finding.tooth_number}, ${finding.finding_type}, ${finding.confidence_score}, ${finding.description})
        RETURNING *
      `;
      savedFindings.push(saved[0]);
    }

    // Activity log
    const visitRows = await sql`SELECT branch_id FROM visits WHERE id = ${visit_id} LIMIT 1`;
    const branchId = visitRows.length > 0 ? visitRows[0].branch_id : null;

    await sql`
      INSERT INTO activity_logs (id, branch_id, user_id, user_name, action, entity_type, entity_id, details)
      VALUES (
        ${'act_' + Date.now()},
        ${branchId},
        ${session.id},
        ${session.name},
        'UPLOAD_IMAGING',
        'imaging_asset',
        ${assetId},
        ${JSON.stringify({ type, toothNumber: tooth_number, aiFindings: savedFindings.length })}
      )
    `;

    return NextResponse.json({
      asset: inserted[0],
      aiFindings: savedFindings,
      message: `Image uploaded. AI analysis generated ${savedFindings.length} finding(s).`,
    });
  } catch (error: any) {
    console.error('Upload imaging error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
