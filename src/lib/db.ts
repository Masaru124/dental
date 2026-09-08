import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined.');
}

export const sql = neon(process.env.DATABASE_URL);

/**
 * Initializes tables if they don't exist yet:
 * - users (dentists, receptionists, admins)
 * - patients
 * - visits
 * - tooth_records (append-only history per visit)
 * - treatment_plan_items
 * - price_list
 * - translations
 * - activity_logs
 */
export async function initDatabaseSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('dentist', 'receptionist', 'admin')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      medical_history TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      dentist_id TEXT REFERENCES users(id),
      dentist_name TEXT,
      visit_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      chief_complaint TEXT,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS tooth_records (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      visit_id TEXT NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
      tooth_number TEXT NOT NULL,
      condition TEXT NOT NULL CHECK (condition IN ('healthy', 'caries', 'filling', 'crown', 'missing')),
      surfaces JSONB DEFAULT '[]'::jsonb,
      notes TEXT,
      recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS price_list (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      procedure_name TEXT NOT NULL,
      category TEXT NOT NULL,
      default_cost NUMERIC(10, 2) NOT NULL,
      patient_friendly_en TEXT NOT NULL,
      patient_friendly_hi TEXT NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS treatment_plan_items (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      visit_id TEXT REFERENCES visits(id),
      tooth_number TEXT NOT NULL,
      procedure_name TEXT NOT NULL,
      priority TEXT NOT NULL CHECK (priority IN ('urgent', 'soon', 'preventive', 'elective')),
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price NUMERIC(10, 2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS translations (
      clinical_term TEXT PRIMARY KEY,
      friendly_en TEXT NOT NULL,
      friendly_hi TEXT NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT,
      action TEXT NOT NULL,
      details JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
}
