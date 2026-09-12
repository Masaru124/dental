import { sql, initDatabaseSchema, dropAllTables } from './db';
import bcrypt from 'bcryptjs';

/**
 * DentOS v2 Seed Data
 * 
 * Creates a realistic multi-tenant setup:
 * - 1 Tenant: "Apex Dental Group" (a dental chain)
 * - 2 Branches: Koramangala and Indiranagar
 * - 4 Users: owner, admin, dentist, staff across branches
 * - 3 Sample patients with visits, tooth records, and treatment plans
 * - Price list with HSN/SAC codes and GST rates
 * - Translations for clinical terms (English + Hindi)
 */
export async function seedDatabase() {
  console.log('--- Dropping existing tables ---');
  await dropAllTables();

  console.log('--- Creating v2 schema ---');
  await initDatabaseSchema();

  // ─── Tenant ───────────────────────────────────────────────
  const tenantId = 'tenant_apex';
  await sql`
    INSERT INTO tenants (id, name) VALUES (${tenantId}, 'Apex Dental Group')
    ON CONFLICT (id) DO NOTHING;
  `;

  // ─── Branches ─────────────────────────────────────────────
  const branch1Id = 'br_koramangala';
  const branch2Id = 'br_indiranagar';

  await sql`
    INSERT INTO branches (id, tenant_id, name, address, gstin, phone, email) VALUES
    (${branch1Id}, ${tenantId}, 'Apex Dental — Koramangala',
     '123, 4th Block, Koramangala, Bengaluru 560034',
     '29AADCA1234F1ZH', '+91 80 4567 8901', 'koramangala@apexdental.in'),
    (${branch2Id}, ${tenantId}, 'Apex Dental — Indiranagar',
     '456, 100 Feet Road, Indiranagar, Bengaluru 560038',
     '29AADCA1234F1ZH', '+91 80 4567 8902', 'indiranagar@apexdental.in')
    ON CONFLICT (id) DO NOTHING;
  `;

  // ─── Users (4 roles, scoped to branches) ──────────────────
  const ownerHash = await bcrypt.hash('Owner123!', 10);
  const dentistHash = await bcrypt.hash('Dentist123!', 10);
  const staffHash = await bcrypt.hash('Staff123!', 10);
  const adminHash = await bcrypt.hash('Admin123!', 10);

  await sql`
    INSERT INTO users (id, tenant_id, branch_ids, role, name, hpr_id, email, password_hash) VALUES
    ('usr_owner_1', ${tenantId}, '["*"]'::jsonb, 'owner',
     'Dr. Vikram Menon', 'HPR-KA-1234567890',
     'vikram@apexdental.in', ${ownerHash}),
    ('usr_dentist_1', ${tenantId}, ${JSON.stringify([branch1Id])}::jsonb, 'dentist',
     'Dr. Rajesh Sharma, MDS', 'HPR-KA-9876543210',
     'dr.sharma@apexdental.in', ${dentistHash}),
    ('usr_dentist_2', ${tenantId}, ${JSON.stringify([branch2Id])}::jsonb, 'dentist',
     'Dr. Priya Nair, BDS', 'HPR-KA-5555555555',
     'dr.priya@apexdental.in', ${dentistHash}),
    ('usr_staff_1', ${tenantId}, ${JSON.stringify([branch1Id])}::jsonb, 'staff',
     'Pooja Verma', NULL,
     'pooja@apexdental.in', ${staffHash}),
    ('usr_admin_1', ${tenantId}, '["*"]'::jsonb, 'admin',
     'Ravi Kumar', NULL,
     'admin@apexdental.in', ${adminHash})
    ON CONFLICT (id) DO NOTHING;
  `;

  // ─── Patients (branch-scoped, ABHA-aware) ─────────────────
  const pat1Id = 'pat_aarav_101';
  const pat2Id = 'pat_sneha_102';
  const pat3Id = 'pat_vikram_103';

  await sql`
    INSERT INTO patients (id, branch_id, full_name, age, gender, phone, email, medical_alerts, abha_number, abha_link_status) VALUES
    (${pat1Id}, ${branch1Id}, 'Aarav Patel', 34, 'Male',
     '+91 98765 43210', 'aarav.p@example.com',
     '["Mild hypertension"]'::jsonb, '12-3456-7890-1234', 'linked'),
    (${pat2Id}, ${branch1Id}, 'Sneha Kulkarni', 28, 'Female',
     '+91 98220 11223', 'sneha.k@example.com',
     '["Penicillin allergy"]'::jsonb, NULL, 'unlinked'),
    (${pat3Id}, ${branch2Id}, 'Vikram Malhotra', 52, 'Male',
     '+91 99887 66554', 'vikram.m@example.com',
     '["Type 2 Diabetes (controlled, HbA1c 6.8)"]'::jsonb, '98-7654-3210-5678', 'linked')
    ON CONFLICT (id) DO NOTHING;
  `;

  // ─── Visits ───────────────────────────────────────────────
  const vis1Id = 'vis_aarav_001';
  const vis2Id = 'vis_sneha_001';

  await sql`
    INSERT INTO visits (id, branch_id, patient_id, dentist_id, status, chief_complaint, notes) VALUES
    (${vis1Id}, ${branch1Id}, ${pat1Id}, 'usr_dentist_1', 'completed',
     'Sharp pain in lower right tooth while eating sweets, routine checkup.',
     'Patient exhibits good overall hygiene, localized caries on 46 and 16, missing 38.'),
    (${vis2Id}, ${branch1Id}, ${pat2Id}, 'usr_dentist_1', 'in_progress',
     'Routine 6-month checkup, mild sensitivity on cold drinks.',
     'Mild gingival inflammation, scaling recommended.')
    ON CONFLICT (id) DO NOTHING;
  `;

  // ─── Tooth Records (append-only) ─────────────────────────
  await sql`
    INSERT INTO tooth_records (id, visit_id, tooth_number, condition, surfaces, notes, recorded_by) VALUES
    ('tr_1', ${vis1Id}, '16', 'caries', '["mesial","occlusal"]'::jsonb,
     'Occlusal-mesial caries detected, non-vital sensitivity.', 'usr_dentist_1'),
    ('tr_2', ${vis1Id}, '46', 'caries', '["occlusal","distal"]'::jsonb,
     'Deep dentinal caries near pulp, tender on percussion.', 'usr_dentist_1'),
    ('tr_3', ${vis1Id}, '36', 'filling', '["occlusal"]'::jsonb,
     'Amalgam restoration intact from 3 years ago.', 'usr_dentist_1'),
    ('tr_4', ${vis1Id}, '38', 'missing', '[]'::jsonb,
     'Surgically extracted previously.', 'usr_dentist_1'),
    ('tr_5', ${vis1Id}, '21', 'crown', '[]'::jsonb,
     'Zirconia crown placed 2 years ago, margins healthy.', 'usr_dentist_1')
    ON CONFLICT (id) DO NOTHING;
  `;

  // ─── Treatment Plan Items (v2 schema) ────────────────────
  await sql`
    INSERT INTO treatment_plan_items (id, visit_id, tooth_refs, procedure_name, priority, quantity, unit_price, status, insurance_claimable, payer_name, lab_job_required, notes) VALUES
    ('tp_1', ${vis1Id}, '["46"]'::jsonb, 'Molar Root Canal Treatment', 'urgent', 1, 6500.00,
     'accepted', true, 'Star Health Insurance', false,
     'Deep decay reaching pulp. Root canal urgent to relieve pain and prevent abscess.'),
    ('tp_2', ${vis1Id}, '["46"]'::jsonb, 'Zirconia Ceramic Crown', 'soon', 1, 8500.00,
     'accepted', true, 'Star Health Insurance', true,
     'Post-RCT crown placement to protect tooth structure against fracture.'),
    ('tp_3', ${vis1Id}, '["16"]'::jsonb, 'Composite Resin Filling (2 Surfaces)', 'soon', 1, 2200.00,
     'proposed', false, NULL, false,
     'MOD composite restoration before decay deepens.'),
    ('tp_4', ${vis1Id}, '["all"]'::jsonb, 'Scaling & Polishing', 'preventive', 1, 1200.00,
     'accepted', false, NULL, false,
     'Routine annual full mouth ultrasonic scaling & prophylaxis.')
    ON CONFLICT (id) DO NOTHING;
  `;

  // ─── Consent Record (sample) ──────────────────────────────
  await sql`
    INSERT INTO consent_records (id, patient_id, requested_by, purpose, scope, status, granted_at, expires_at) VALUES
    ('consent_1', ${pat1Id}, 'usr_dentist_1', 'Treatment record sharing with Star Health Insurance',
     '["tooth_records", "treatment_plan", "imaging"]'::jsonb,
     'granted', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 year')
    ON CONFLICT (id) DO NOTHING;
  `;

  // ─── Price List (with HSN/SAC codes for GST) ──────────────
  await sql`
    INSERT INTO price_list (id, branch_id, code, procedure_name, category, default_cost, hsn_sac_code, tax_rate_percent, patient_friendly_en, patient_friendly_hi) VALUES
    ('pr_1', ${branch1Id}, 'D1110', 'Scaling & Polishing', 'Preventive', 1200.00, '999312', 18.00,
     'Complete Dental Cleaning & Polish', 'दांतों की गहरी सफाई और पॉलिशिंग'),
    ('pr_2', ${branch1Id}, 'D2391', 'Composite Resin Filling (1 Surface)', 'Restorative', 1500.00, '999312', 18.00,
     'Tooth-Colored Cavity Filling', 'दांत के रंग की कैविटी फिलिंग'),
    ('pr_3', ${branch1Id}, 'D2392', 'Composite Resin Filling (2 Surfaces)', 'Restorative', 2200.00, '999312', 18.00,
     'Multi-Surface Cavity Filling', 'दांत के दोनों तरफ की फिलिंग'),
    ('pr_4', ${branch1Id}, 'D3330', 'Molar Root Canal Treatment', 'Endodontics', 6500.00, '999312', 18.00,
     'Root Canal Therapy to Save Natural Tooth', 'दांत बचाने का रूट कैनाल इलाज'),
    ('pr_5', ${branch1Id}, 'D2740', 'Zirconia Ceramic Crown', 'Prosthodontics', 8500.00, '999312', 18.00,
     'High-Strength Tooth Cap / Crown', 'मजबूत ज़िरकोनिया दांत की टोपी (क्राउन)'),
    ('pr_6', ${branch1Id}, 'D7140', 'Simple Extraction', 'Oral Surgery', 1200.00, '999312', 18.00,
     'Gentle Tooth Removal', 'आरामदायक दांत निकालना'),
    ('pr_7', ${branch1Id}, 'D7210', 'Surgical Extraction (Wisdom Tooth)', 'Oral Surgery', 4500.00, '999312', 18.00,
     'Impacted Wisdom Tooth Surgery', 'अकल दाढ़ का सर्जिकल निष्कर्षण'),
    ('pr_8', ${branch1Id}, 'D4341', 'Deep Periodontal Scaling (Per Quad)', 'Periodontics', 2500.00, '999312', 18.00,
     'Deep Gum Treatment & Infection Removal', 'मसूड़ों का गहरा इलाज और संक्रमण निवारण')
    ON CONFLICT (id) DO NOTHING;
  `;

  // ─── Translations ─────────────────────────────────────────
  await sql`
    INSERT INTO translations (clinical_term, friendly_en, friendly_hi) VALUES
    ('caries', 'Cavity / Tooth Decay that needs filling', 'दांत में कीड़ा या सड़न (कैविटी)'),
    ('filling', 'Previously Filled Tooth (Stable)', 'पहले से भरा हुआ दांत (फिलिंग)'),
    ('crown', 'Tooth Cap / Protected Crown', 'दांत पर लगी टोपी (क्राउन)'),
    ('missing', 'Missing Tooth', 'खाली जगह / गायब दांत'),
    ('healthy', 'Clean, Sound & Healthy Tooth', 'पूरी तरह स्वस्थ और मजबूत दांत'),
    ('urgent', 'Needs Immediate Attention (Pain/Infection risk)', 'तुरंत इलाज आवश्यक (दर्द या संक्रमण से बचाव)'),
    ('soon', 'Recommended within next 2-4 weeks', 'अगले २-४ हफ्तों में कराने की सलाह'),
    ('preventive', 'Preventive care to protect teeth', 'दांतों को सुरक्षित रखने हेतु निवारक देखभाल'),
    ('elective', 'Elective / Aesthetic improvement', 'सौंदर्य व ऐच्छिक सुधार')
    ON CONFLICT (clinical_term) DO NOTHING;
  `;

  // ─── Sample Inventory Items ───────────────────────────────
  await sql`
    INSERT INTO inventory_items (id, branch_id, name, category, quantity_on_hand, reorder_threshold, unit) VALUES
    ('inv_1', ${branch1Id}, 'Composite Resin (A2 shade)', 'Restorative', 15, 5, 'syringe'),
    ('inv_2', ${branch1Id}, 'Disposable Gloves (Medium)', 'Consumable', 200, 50, 'pair'),
    ('inv_3', ${branch1Id}, 'Anesthetic Cartridges (Lignocaine)', 'Anesthetic', 45, 20, 'cartridge'),
    ('inv_4', ${branch1Id}, 'Suction Tips', 'Consumable', 3, 10, 'pack'),
    ('inv_5', ${branch2Id}, 'Composite Resin (A2 shade)', 'Restorative', 8, 5, 'syringe'),
    ('inv_6', ${branch2Id}, 'Disposable Gloves (Medium)', 'Consumable', 150, 50, 'pair')
    ON CONFLICT (id) DO NOTHING;
  `;

  // ─── Sample Invoices & Line Items ─────────────────────────
  await sql`
    INSERT INTO invoices (id, branch_id, patient_id, visit_id, gstin, subtotal, tax_amount, total, status, issued_at) VALUES
    ('inv_1', ${branch1Id}, ${pat1Id}, ${vis1Id}, '29AAAAA0000A1Z5', 15000.00, 2700.00, 17700.00, 'paid', CURRENT_TIMESTAMP - INTERVAL '3 days'),
    ('inv_2', ${branch1Id}, ${pat1Id}, ${vis1Id}, '29AAAAA0000A1Z5', 1200.00, 216.00, 1416.00, 'issued', CURRENT_TIMESTAMP - INTERVAL '1 day')
    ON CONFLICT (id) DO NOTHING;
  `;

  await sql`
    INSERT INTO invoice_line_items (id, invoice_id, treatment_plan_item_id, description, hsn_sac_code, tax_rate_percent, amount) VALUES
    ('ili_1', 'inv_1', 'tp_1', 'Molar Root Canal Treatment', '999312', 18.00, 6500.00),
    ('ili_2', 'inv_1', 'tp_2', 'Zirconia Ceramic Crown', '999312', 18.00, 8500.00),
    ('ili_3', 'inv_2', 'tp_4', 'Scaling & Polishing', '999312', 18.00, 1200.00)
    ON CONFLICT (id) DO NOTHING;
  `;

  // ─── Sample Insurance Claim ───────────────────────────────
  await sql`
    INSERT INTO insurance_claims (id, invoice_id, payer_name, policy_reference, claim_status, nhcx_reference_id, submitted_at) VALUES
    ('clm_1', 'inv_1', 'Star Health Allied Insurance', 'POL-STAR-883921', 'submitted', 'NHCX-772910', CURRENT_TIMESTAMP - INTERVAL '2 days')
    ON CONFLICT (id) DO NOTHING;
  `;


  // ─── Sample Lab Case ─────────────────────────────────────
  await sql`
    INSERT INTO lab_cases (id, branch_id, visit_id, tooth_refs, lab_name, job_type, patient_name, expected_return_at, status, cost) VALUES
    ('lab_1', ${branch1Id}, ${vis1Id}, '["46"]'::jsonb, 'Ivoclar Dental Lab',
     'crown', 'Aarav Patel',
     CURRENT_TIMESTAMP + INTERVAL '7 days', 'sent', 3500.00)
    ON CONFLICT (id) DO NOTHING;
  `;

  // ─── Activity Log Entry ───────────────────────────────────
  await sql`
    INSERT INTO activity_logs (id, branch_id, user_id, user_name, action, entity_type, entity_id, details) VALUES
    ('log_1', ${branch1Id}, 'usr_dentist_1', 'Dr. Rajesh Sharma, MDS',
     'created_visit', 'visit', ${vis1Id},
     '{"patient": "Aarav Patel"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;
  `;

  console.log('--- DentOS v2 Database Seeding Complete ---');
  console.log('  Tenant: Apex Dental Group');
  console.log('  Branches: Koramangala, Indiranagar');
  console.log('  Users: owner (vikram@), dentist (dr.sharma@, dr.priya@), staff (pooja@), admin (admin@)');
  console.log('  Patients: Aarav Patel, Sneha Kulkarni, Vikram Malhotra');
}
