import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession, authorize } from '@/lib/auth';

/**
 * GET /api/analytics?branch_id=xxx (optional — owner sees all)
 * 
 * Owner Dashboard KPIs (prd.md §1.5, architecture.md §4):
 * - Revenue (total invoiced, paid, pending)
 * - Patient counts and visit trends
 * - Treatment acceptance rates
 * - AI finding statistics
 * - Insurance claim pipeline
 * - Lab case pipeline
 * - Inventory alerts
 */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const err = authorize(session, { roles: ['dentist', 'admin', 'owner'] });
    if (err) return NextResponse.json({ error: err }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branch_id');

    // Determine branch scope
    let branchFilter: string[];
    if (branchId) {
      const branchErr = authorize(session, { branchId });
      if (branchErr) return NextResponse.json({ error: branchErr }, { status: 403 });
      branchFilter = [branchId];
    } else if (session.branchIds.includes('*')) {
      const branches = await sql`SELECT id FROM branches WHERE tenant_id = ${session.tenantId}`;
      branchFilter = branches.map(b => b.id);
    } else {
      branchFilter = session.branchIds;
    }

    // Execute all 9 analytics and KPI queries concurrently via Promise.all
    const [
      revenueStats,
      patientStats,
      visitStats,
      treatmentStats,
      aiStats,
      claimStats,
      labStats,
      inventoryAlerts,
      branchBreakdown
    ] = await Promise.all([
      // 1. Revenue KPIs
      sql`
        SELECT
          COALESCE(SUM(total), 0) as total_invoiced,
          COALESCE(SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0) as total_paid,
          COALESCE(SUM(CASE WHEN status IN ('draft', 'issued') THEN total ELSE 0 END), 0) as total_pending,
          COUNT(*)::int as invoice_count
        FROM invoices
        WHERE branch_id = ANY(${branchFilter})
      `,
      // 2. Patient KPIs
      sql`
        SELECT
          COUNT(*)::int as total_patients,
          COUNT(CASE WHEN abha_link_status = 'linked' THEN 1 END)::int as abha_linked_count
        FROM patients
        WHERE branch_id = ANY(${branchFilter})
      `,
      // 3. Visit KPIs (last 30 days)
      sql`
        SELECT COUNT(*)::int as visits_last_30d
        FROM visits
        WHERE branch_id = ANY(${branchFilter})
          AND date >= CURRENT_TIMESTAMP - INTERVAL '30 days'
      `,
      // 4. Treatment Acceptance Rate
      sql`
        SELECT
          COUNT(*)::int as total_items,
          COUNT(CASE WHEN status = 'accepted' THEN 1 END)::int as accepted,
          COUNT(CASE WHEN status = 'completed' THEN 1 END)::int as completed,
          COUNT(CASE WHEN status = 'declined' THEN 1 END)::int as declined,
          COUNT(CASE WHEN status = 'proposed' THEN 1 END)::int as proposed,
          COALESCE(SUM(quantity * unit_price), 0) as total_plan_value,
          COALESCE(SUM(CASE WHEN status IN ('accepted', 'completed') THEN quantity * unit_price ELSE 0 END), 0) as accepted_value
        FROM treatment_plan_items
        WHERE visit_id IN (
          SELECT id FROM visits WHERE branch_id = ANY(${branchFilter})
        )
      `,
      // 5. AI Finding Stats
      sql`
        SELECT
          COUNT(*)::int as total_findings,
          COUNT(CASE WHEN finding_type = 'caries' THEN 1 END)::int as caries_found,
          COUNT(CASE WHEN finding_type = 'bone_loss' THEN 1 END)::int as bone_loss_found,
          COUNT(CASE WHEN finding_type = 'calculus' THEN 1 END)::int as calculus_found
        FROM ai_findings
        WHERE imaging_asset_id IN (
          SELECT id FROM imaging_assets
          WHERE visit_id IN (
            SELECT id FROM visits WHERE branch_id = ANY(${branchFilter})
          )
        )
      `,
      // 6. Insurance Pipeline
      sql`
        SELECT
          COUNT(*)::int as total_claims,
          COUNT(CASE WHEN claim_status = 'submitted' THEN 1 END)::int as submitted,
          COUNT(CASE WHEN claim_status = 'approved' THEN 1 END)::int as approved,
          COUNT(CASE WHEN claim_status = 'rejected' THEN 1 END)::int as rejected,
          COUNT(CASE WHEN claim_status = 'paid' THEN 1 END)::int as paid
        FROM insurance_claims
        WHERE invoice_id IN (
          SELECT id FROM invoices WHERE branch_id = ANY(${branchFilter})
        )
      `,
      // 7. Lab Case Pipeline
      sql`
        SELECT
          COUNT(*)::int as total_cases,
          COUNT(CASE WHEN status = 'sent' THEN 1 END)::int as sent,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END)::int as in_progress,
          COUNT(CASE WHEN status = 'ready' THEN 1 END)::int as ready,
          COUNT(CASE WHEN status = 'returned' THEN 1 END)::int as returned
        FROM lab_cases
        WHERE branch_id = ANY(${branchFilter})
      `,
      // 8. Inventory Alerts
      sql`
        SELECT COUNT(*)::int as low_stock_count
        FROM inventory_items
        WHERE branch_id = ANY(${branchFilter})
          AND quantity_on_hand <= reorder_threshold
      `,
      // 9. Branch Breakdown
      sql`
        SELECT
          b.id as branch_id,
          b.name as branch_name,
          (SELECT COUNT(*)::int FROM patients p WHERE p.branch_id = b.id) as patient_count,
          (SELECT COUNT(*)::int FROM visits v WHERE v.branch_id = b.id AND v.date >= CURRENT_TIMESTAMP - INTERVAL '30 days') as visits_30d,
          (SELECT COALESCE(SUM(i.total), 0) FROM invoices i WHERE i.branch_id = b.id) as revenue
        FROM branches b
        WHERE b.id = ANY(${branchFilter})
        ORDER BY b.name
      `
    ]);

    return NextResponse.json({
      revenue: revenueStats[0],
      patients: patientStats[0],
      visits: visitStats[0],
      treatments: treatmentStats[0],
      aiFindings: aiStats[0],
      claims: claimStats[0],
      labCases: labStats[0],
      inventory: inventoryAlerts[0],
      branchBreakdown,
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
