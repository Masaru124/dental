import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined.');
}

export const sql = neon(process.env.DATABASE_URL);

/**
 * DentOS v2 Schema — Multi-tenant, compliance-ready, revenue-aware
 *
 * Design principles (from architecture.md §5):
 * - Every table carries branch_id (multi-tenancy key)
 * - consent_records and activity_logs are append-only (no UPDATE/DELETE)
 * - tooth_records are append-only per visit (chart history = the append log)
 * - Server always recomputes totals; client-submitted totals are never trusted
 */
export async function initDatabaseSchema() {
  // ─── Tenant & Branch ───────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id),
      name TEXT NOT NULL,
      hfr_id TEXT,
      address TEXT,
      gstin TEXT,
      phone TEXT,
      email TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // ─── Users (role × branch-scope) ──────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id),
      branch_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
      role TEXT NOT NULL CHECK (role IN ('dentist', 'staff', 'admin', 'owner')),
      name TEXT NOT NULL,
      hpr_id TEXT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // ─── Patients ─────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL REFERENCES branches(id),
      full_name TEXT NOT NULL,
      dob DATE,
      age INTEGER,
      gender TEXT,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT,
      medical_alerts JSONB DEFAULT '[]'::jsonb,
      abha_number TEXT,
      abha_link_status TEXT NOT NULL DEFAULT 'unlinked'
        CHECK (abha_link_status IN ('unlinked', 'linked', 'pending')),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // ─── Visits ───────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL REFERENCES branches(id),
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      dentist_id TEXT NOT NULL REFERENCES users(id),
      date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'completed', 'cancelled')),
      chief_complaint TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // ─── Tooth Records (append-only per visit) ────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS tooth_records (
      id TEXT PRIMARY KEY,
      visit_id TEXT NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
      tooth_number TEXT NOT NULL,
      condition TEXT NOT NULL
        CHECK (condition IN ('healthy', 'caries', 'filling', 'crown', 'missing')),
      surfaces JSONB DEFAULT '[]'::jsonb,
      notes TEXT,
      imaging_asset_ids JSONB DEFAULT '[]'::jsonb,
      recorded_by TEXT NOT NULL REFERENCES users(id),
      recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // ─── Imaging Assets ───────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS imaging_assets (
      id TEXT PRIMARY KEY,
      visit_id TEXT NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
      tooth_number TEXT,
      type TEXT NOT NULL CHECK (type IN ('rvg', 'iopa', 'opg', 'other')),
      file_ref TEXT NOT NULL,
      file_name TEXT,
      file_size INTEGER,
      uploaded_by TEXT NOT NULL REFERENCES users(id),
      uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // ─── AI Findings (the moat — prd.md §1.5) ────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS ai_findings (
      id TEXT PRIMARY KEY,
      imaging_asset_id TEXT NOT NULL REFERENCES imaging_assets(id) ON DELETE CASCADE,
      tooth_number TEXT NOT NULL,
      finding_type TEXT NOT NULL
        CHECK (finding_type IN ('caries', 'bone_loss', 'calculus', 'other')),
      confidence_score NUMERIC(3,2) NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
      annotated_overlay_ref TEXT,
      description TEXT,
      generated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS discrepancy_flags (
      id TEXT PRIMARY KEY,
      ai_finding_id TEXT NOT NULL REFERENCES ai_findings(id) ON DELETE CASCADE,
      tooth_record_id TEXT REFERENCES tooth_records(id),
      discrepancy_type TEXT NOT NULL
        CHECK (discrepancy_type IN ('ai_found_not_charted', 'charted_not_ai_confirmed')),
      status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'reviewed_confirmed', 'reviewed_dismissed')),
      reviewed_by TEXT REFERENCES users(id),
      reviewed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS evidence_bundles (
      id TEXT PRIMARY KEY,
      visit_id TEXT NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
      tooth_number TEXT NOT NULL,
      ai_finding_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
      tooth_record_id TEXT REFERENCES tooth_records(id),
      dentist_sign_off BOOLEAN NOT NULL DEFAULT false,
      consent_record_id TEXT,
      purpose TEXT NOT NULL
        CHECK (purpose IN ('insurance_claim', 'legal_defense_export', 'internal_audit')),
      generated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // ─── Treatment Plan Items (v2 schema) ─────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS treatment_plan_items (
      id TEXT PRIMARY KEY,
      visit_id TEXT NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
      tooth_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
      procedure_name TEXT NOT NULL,
      unit_price NUMERIC(10,2) NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      priority TEXT NOT NULL
        CHECK (priority IN ('urgent', 'soon', 'preventive', 'elective')),
      status TEXT NOT NULL DEFAULT 'proposed'
        CHECK (status IN ('proposed', 'accepted', 'deferred', 'declined', 'completed')),
      insurance_claimable BOOLEAN NOT NULL DEFAULT false,
      payer_name TEXT,
      lab_job_required BOOLEAN NOT NULL DEFAULT false,
      lab_case_id TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // ─── Treatment Decay Records (revenue recovery engine) ────
  await sql`
    CREATE TABLE IF NOT EXISTS treatment_decay_records (
      id TEXT PRIMARY KEY,
      treatment_plan_item_id TEXT NOT NULL REFERENCES treatment_plan_items(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      last_represented_at TIMESTAMPTZ,
      representation_count INTEGER NOT NULL DEFAULT 0,
      outcome TEXT CHECK (outcome IN ('accepted_on_representation', 'still_pending', 'permanently_declined'))
    );
  `;

  // ─── Consent Records (append-only, ABDM compliance) ───────
  await sql`
    CREATE TABLE IF NOT EXISTS consent_records (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      requested_by TEXT NOT NULL,
      purpose TEXT NOT NULL,
      scope JSONB NOT NULL DEFAULT '[]'::jsonb,
      status TEXT NOT NULL CHECK (status IN ('granted', 'revoked', 'expired')),
      granted_at TIMESTAMPTZ,
      revoked_at TIMESTAMPTZ,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // ─── Invoices & Line Items (GST-compliant) ────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL REFERENCES branches(id),
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      visit_id TEXT NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
      gstin TEXT,
      subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
      tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      total NUMERIC(12,2) NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'issued', 'paid', 'partially_paid')),
      issued_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS invoice_line_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      treatment_plan_item_id TEXT REFERENCES treatment_plan_items(id),
      description TEXT NOT NULL,
      hsn_sac_code TEXT NOT NULL DEFAULT '',
      tax_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 18.00,
      amount NUMERIC(10,2) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // ─── Insurance Claims ─────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS insurance_claims (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      payer_name TEXT NOT NULL,
      policy_reference TEXT,
      claim_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (claim_status IN ('draft', 'submitted', 'approved', 'rejected', 'paid')),
      nhcx_reference_id TEXT,
      rejection_reason TEXT,
      submitted_at TIMESTAMPTZ,
      resolved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // ─── Lab Cases ────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS lab_cases (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL REFERENCES branches(id),
      visit_id TEXT NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
      tooth_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
      lab_name TEXT NOT NULL,
      job_type TEXT NOT NULL CHECK (job_type IN ('crown', 'bridge', 'aligner', 'other')),
      patient_name TEXT,
      sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      expected_return_at TIMESTAMPTZ,
      returned_at TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'sent'
        CHECK (status IN ('sent', 'in_progress', 'ready', 'returned')),
      cost NUMERIC(10,2) NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // ─── Inventory Items ──────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL REFERENCES branches(id),
      name TEXT NOT NULL,
      category TEXT,
      quantity_on_hand INTEGER NOT NULL DEFAULT 0,
      reorder_threshold INTEGER NOT NULL DEFAULT 5,
      unit TEXT DEFAULT 'unit',
      last_restocked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // ─── Recall Campaigns & Reminder Logs ─────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS recall_campaigns (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL REFERENCES branches(id),
      name TEXT NOT NULL,
      trigger_type TEXT NOT NULL
        CHECK (trigger_type IN ('pending_treatment_over_days', 'periodic_checkup_due', 'manual')),
      trigger_params JSONB DEFAULT '{}'::jsonb,
      channel TEXT NOT NULL CHECK (channel IN ('sms', 'whatsapp', 'email')),
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS reminder_logs (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL REFERENCES recall_campaigns(id) ON DELETE CASCADE,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      responded BOOLEAN NOT NULL DEFAULT false,
      appointment_booked BOOLEAN NOT NULL DEFAULT false,
      appointment_kept BOOLEAN
    );
  `;

  // ─── Price List ───────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS price_list (
      id TEXT PRIMARY KEY,
      branch_id TEXT REFERENCES branches(id),
      code TEXT NOT NULL,
      procedure_name TEXT NOT NULL,
      category TEXT NOT NULL,
      default_cost NUMERIC(10,2) NOT NULL,
      hsn_sac_code TEXT DEFAULT '',
      tax_rate_percent NUMERIC(5,2) DEFAULT 18.00,
      patient_friendly_en TEXT NOT NULL,
      patient_friendly_hi TEXT NOT NULL
    );
  `;

  // ─── Translations ─────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS translations (
      clinical_term TEXT PRIMARY KEY,
      friendly_en TEXT NOT NULL,
      friendly_hi TEXT NOT NULL,
      friendly_kn TEXT
    );
  `;
  await sql`ALTER TABLE translations ADD COLUMN IF NOT EXISTS friendly_kn TEXT;`;
  await sql`ALTER TABLE price_list ADD COLUMN IF NOT EXISTS patient_friendly_kn TEXT;`;

  // ─── Activity Logs (append-only) ──────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      branch_id TEXT REFERENCES branches(id),
      user_id TEXT REFERENCES users(id),
      user_name TEXT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      details JSONB,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Apply high-performance database indexes
  await ensurePerformanceIndexes();
}

/**
 * Ensures optimal btree indexes exist on all high-traffic foreign keys,
 * search columns, and date sorting fields to prevent sequential scans.
 */
export async function ensurePerformanceIndexes() {
  const indexQueries = [
    sql`CREATE INDEX IF NOT EXISTS idx_patients_branch ON patients(branch_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_patients_updated ON patients(updated_at DESC)`,
    sql`CREATE INDEX IF NOT EXISTS idx_patients_full_name ON patients(full_name)`,
    sql`CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone)`,
    sql`CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits(patient_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_visits_branch ON visits(branch_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(date DESC)`,
    sql`CREATE INDEX IF NOT EXISTS idx_tooth_records_visit ON tooth_records(visit_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_tooth_records_tooth ON tooth_records(tooth_number)`,
    sql`CREATE INDEX IF NOT EXISTS idx_treatment_plan_visit ON treatment_plan_items(visit_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_imaging_assets_visit ON imaging_assets(visit_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_ai_findings_asset ON ai_findings(imaging_asset_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_invoices_branch ON invoices(branch_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_invoices_visit ON invoices(visit_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice ON invoice_line_items(invoice_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_claims_invoice ON insurance_claims(invoice_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_lab_cases_branch ON lab_cases(branch_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_inventory_branch ON inventory_items(branch_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_consent_patient ON consent_records(patient_id)`
  ];
  await Promise.all(indexQueries);
}

/**
 * Drop all tables for a clean schema rebuild.
 * Only use in dev/staging — never in production.
 */
export async function dropAllTables() {
  await sql`
    DROP TABLE IF EXISTS
      reminder_logs,
      recall_campaigns,
      inventory_items,
      lab_cases,
      insurance_claims,
      invoice_line_items,
      invoices,
      treatment_decay_records,
      evidence_bundles,
      discrepancy_flags,
      ai_findings,
      imaging_assets,
      consent_records,
      treatment_plan_items,
      tooth_records,
      visits,
      patients,
      activity_logs,
      price_list,
      translations,
      users,
      branches,
      tenants
    CASCADE;
  `;
}
