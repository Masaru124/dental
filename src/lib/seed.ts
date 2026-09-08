import { sql, initDatabaseSchema } from './db';
import bcrypt from 'bcryptjs';

export async function seedDatabase() {
  console.log('--- Initializing Database Schema ---');
  await initDatabaseSchema();

  console.log('--- Checking & Seeding Users ---');
  const existingUsers = await sql`SELECT count(*)::int as count FROM users`;
  if (existingUsers[0].count === 0) {
    const dentistHash = await bcrypt.hash('Dentist123!', 10);
    const receptionistHash = await bcrypt.hash('Reception123!', 10);
    const adminHash = await bcrypt.hash('Admin123!', 10);

    await sql`
      INSERT INTO users (id, email, password_hash, name, role) VALUES
      ('usr_dentist_1', 'dr.sharma@dentchart.com', ${dentistHash}, 'Dr. Rajesh Sharma, MDS', 'dentist'),
      ('usr_reception_1', 'reception@dentchart.com', ${receptionistHash}, 'Pooja Verma', 'receptionist'),
      ('usr_admin_1', 'admin@dentchart.com', ${adminHash}, 'Clinical Admin', 'admin')
      ON CONFLICT (id) DO NOTHING;
    `;
    console.log('Default users seeded.');
  }

  console.log('--- Checking & Seeding Price List ---');
  const existingPrices = await sql`SELECT count(*)::int as count FROM price_list`;
  if (existingPrices[0].count === 0) {
    await sql`
      INSERT INTO price_list (id, code, procedure_name, category, default_cost, patient_friendly_en, patient_friendly_hi) VALUES
      ('pr_1', 'D1110', 'Scaling & Polishing', 'Preventive', 1200.00, 'Complete Dental Cleaning & Polish', 'दांतों की गहरी सफाई और पॉलिशिंग'),
      ('pr_2', 'D2391', 'Composite Resin Filling (1 Surface)', 'Restorative', 1500.00, 'Tooth-Colored Cavity Filling', 'दांत के रंग की कैविटी फिलिंग'),
      ('pr_3', 'D2392', 'Composite Resin Filling (2 Surfaces)', 'Restorative', 2200.00, 'Multi-Surface Cavity Filling', 'दांत के दोनों तरफ की फिलिंग'),
      ('pr_4', 'D3330', 'Molar Root Canal Treatment', 'Endodontics', 6500.00, 'Root Canal Therapy to Save Natural Tooth', 'दांत बचाने का रूट कैनाल इलाज'),
      ('pr_5', 'D2740', 'Zirconia Ceramic Crown', 'Prosthodontics', 8500.00, 'High-Strength Tooth Cap / Crown', 'मजबूत ज़िरकोनिया दांत की टोपी (क्राउन)'),
      ('pr_6', 'D7140', 'Simple Extraction', 'Oral Surgery', 1200.00, 'Gentle Tooth Removal', 'आरामदायक दांत निकालना'),
      ('pr_7', 'D7210', 'Surgical Extraction (Wisdom Tooth)', 'Oral Surgery', 4500.00, 'Impacted Wisdom Tooth Surgery', 'अकल दाढ़ का सर्जिकल निष्कर्षण'),
      ('pr_8', 'D4341', 'Deep Periodontal Scaling (Per Quad)', 'Periodontics', 2500.00, 'Deep Gum Treatment & Infection Removal', 'मसूड़ों का गहरा इलाज और संक्रमण निवारण')
      ON CONFLICT (id) DO NOTHING;
    `;
    console.log('Price list seeded.');
  }

  console.log('--- Checking & Seeding Translations ---');
  const existingTrans = await sql`SELECT count(*)::int as count FROM translations`;
  if (existingTrans[0].count === 0) {
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
    console.log('Translations seeded.');
  }

  console.log('--- Checking & Seeding Sample Patients ---');
  const existingPatients = await sql`SELECT count(*)::int as count FROM patients`;
  if (existingPatients[0].count === 0) {
    const pat1Id = 'pat_aarav_101';
    const pat2Id = 'pat_sneha_102';
    const pat3Id = 'pat_vikram_103';

    await sql`
      INSERT INTO patients (id, name, age, gender, phone, email, medical_history) VALUES
      (${pat1Id}, 'Aarav Patel', 34, 'Male', '+91 98765 43210', 'aarav.p@example.com', 'Mild hypertension, No known drug allergies'),
      (${pat2Id}, 'Sneha Kulkarni', 28, 'Female', '+91 98220 11223', 'sneha.k@example.com', 'Penicillin allergy noted'),
      (${pat3Id}, 'Vikram Malhotra', 52, 'Male', '+91 99887 66554', 'vikram.m@example.com', 'Type 2 Diabetes (controlled, HbA1c 6.8)')
      ON CONFLICT (id) DO NOTHING;
    `;

    // Visit for Aarav Patel
    const vis1Id = 'vis_aarav_001';
    await sql`
      INSERT INTO visits (id, patient_id, dentist_id, dentist_name, chief_complaint, notes) VALUES
      (${vis1Id}, ${pat1Id}, 'usr_dentist_1', 'Dr. Rajesh Sharma, MDS', 'Sharp pain in lower right tooth while eating sweets, routine checkup.', 'Patient exhibits good overall hygiene, localized caries on 46 and 16, missing 38.')
      ON CONFLICT (id) DO NOTHING;
    `;

    // Tooth records for visit 1 (FDI System: 16 Caries, 46 Caries, 36 Filling, 38 Missing, 21 Crown)
    await sql`
      INSERT INTO tooth_records (id, patient_id, visit_id, tooth_number, condition, surfaces, notes) VALUES
      ('tr_1', ${pat1Id}, ${vis1Id}, '16', 'caries', '["O", "M"]'::jsonb, 'Occlusal-mesial caries detected, non-vital sensitivity.'),
      ('tr_2', ${pat1Id}, ${vis1Id}, '46', 'caries', '["O", "D"]'::jsonb, 'Deep dentinal caries near pulp, tender on percussion.'),
      ('tr_3', ${pat1Id}, ${vis1Id}, '36', 'filling', '["O"]'::jsonb, 'Amalgam restoration intact from 3 years ago.'),
      ('tr_4', ${pat1Id}, ${vis1Id}, '38', 'missing', '[]'::jsonb, 'Surgically extracted previously.'),
      ('tr_5', ${pat1Id}, ${vis1Id}, '21', 'crown', '[]'::jsonb, 'Zirconia crown placed 2 years ago, margins healthy.')
      ON CONFLICT (id) DO NOTHING;
    `;

    // Treatment plan items for Aarav
    await sql`
      INSERT INTO treatment_plan_items (id, patient_id, visit_id, tooth_number, procedure_name, priority, quantity, unit_price, status, notes) VALUES
      ('tp_1', ${pat1Id}, ${vis1Id}, '46', 'Molar Root Canal Treatment', 'urgent', 1, 6500.00, 'planned', 'Deep decay reaching pulp. Root canal urgent to relieve pain and prevent abscess.'),
      ('tp_2', ${pat1Id}, ${vis1Id}, '46', 'Zirconia Ceramic Crown', 'soon', 1, 8500.00, 'planned', 'Post-RCT crown placement to protect tooth structure against fracture.'),
      ('tp_3', ${pat1Id}, ${vis1Id}, '16', 'Composite Resin Filling (2 Surfaces)', 'soon', 1, 2200.00, 'planned', 'MOD composite restoration before decay deepens.'),
      ('tp_4', ${pat1Id}, ${vis1Id}, 'All', 'Scaling & Polishing', 'preventive', 1, 1200.00, 'planned', 'Routine annual full mouth ultrasonic scaling & prophylaxis.')
      ON CONFLICT (id) DO NOTHING;
    `;

    console.log('Sample patients, visits, tooth records, and treatment plans seeded.');
  }

  console.log('--- Database Seeding Complete ---');
}
