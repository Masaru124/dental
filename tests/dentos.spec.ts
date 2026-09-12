import { test, expect } from '@playwright/test';

test.describe('DentOS v2 Comprehensive End-to-End Test Suite', () => {

  test('01: Dashboard loads with metrics and patient list', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await expect(page).toHaveTitle(/DentChart/);
    await expect(page.locator('h1')).toContainText('Practice Dashboard');

    // Check KPI cards
    await expect(page.locator('text=Registered Patients')).toBeVisible();
    await expect(page.locator('text=Urgent Attention')).toBeVisible();
    await expect(page.locator('text=Pipeline Value')).toBeVisible();

    // Check Active Patients Table
    await expect(page.locator('text=Active Patient Cases')).toBeVisible();
    await expect(page.locator('text=Aarav Patel')).toBeVisible();
  });

  test('02: Patient directory and search', async ({ page }) => {
    await page.goto('http://localhost:3000/patients');
    await expect(page.locator('h1')).toContainText('Patient Directory');

    // Verify seeded patients appear for active branch (Koramangala)
    await expect(page.locator('text=Aarav Patel')).toBeVisible();
    await expect(page.locator('text=Sneha Kulkarni')).toBeVisible();

    // Test Search input
    const searchInput = page.locator('input[placeholder*="Search by patient name"]');
    await searchInput.fill('Sneha');
    await page.waitForTimeout(500); // Debounce
    await expect(page.locator('text=Sneha Kulkarni')).toBeVisible();
    await expect(page.locator('text=Aarav Patel')).not.toBeVisible();
  });

  test('03: Patient Profile, FDI 2D Chart, 3D Arch, and Slide-in Panel', async ({ page }) => {
    // Open Aarav Patel's chart
    await page.goto('http://localhost:3000/patients/pat_aarav_101');
    
    // Check Patient Header and ABHA badge
    await expect(page.locator('h1')).toContainText('Aarav Patel', { timeout: 15000 });
    await expect(page.locator('.badge-abha')).toBeVisible();

    // Switch between 3D Arch and 2D FDI Chart
    const btn2D = page.locator('button:has-text("2D FDI Chart")');
    await btn2D.click();
    await expect(page.locator('text=FDI 2-Digit Dental Chart')).toBeVisible();

    // Click tooth #16 to open slide-in panel
    const tooth16 = page.locator('div[role="button"][aria-label*="Tooth 16"]');
    await tooth16.click();

    // Check slide-in panel opens
    await expect(page.locator('.slide-panel')).toBeVisible();
    await expect(page.locator('text=FDI #16')).toBeVisible();
    await expect(page.locator('text=Tooth Condition')).toBeVisible();

    // Close panel
    await page.locator('.slide-panel-header button').click();
    await expect(page.locator('.slide-panel')).not.toBeVisible();
  });

  test('04: Diagnostic Imaging & AI Suite', async ({ page }) => {
    await page.goto('http://localhost:3000/imaging');
    await expect(page.locator('h1')).toContainText('Diagnostic Imaging & AI Suite');
    await expect(page.locator('text=Bitewing • IOPA • OPG • CBCT')).toBeVisible();
    await expect(page.locator('text=Aarav Patel')).toBeVisible();

    // Navigate to patient chart from imaging
    const openChartLink = page.locator('a:has-text("Open Scans & AI Chart")').first();
    await openChartLink.click();
    await expect(page.locator('text=Diagnostic Imaging & Radiographs')).toBeVisible({ timeout: 15000 });
  });

  test('05: GST Billing & Invoicing', async ({ page }) => {
    await page.goto('http://localhost:3000/billing');
    await expect(page.locator('h1')).toContainText('GST Invoicing & Billing');

    // Verify financial summary cards
    await expect(page.locator('text=Total Invoiced')).toBeVisible();
    await expect(page.locator('text=Total Collected (Paid)')).toBeVisible();

    // Check filter buttons
    await expect(page.locator('button:has-text("All Invoices")')).toBeVisible();
    await expect(page.locator('button:has-text("Paid")')).toBeVisible();
  });

  test('06: Insurance Claims Tracker', async ({ page }) => {
    await page.goto('http://localhost:3000/insurance');
    await expect(page.locator('h1')).toContainText('Insurance Claims (NHCX / TPA)');
    await expect(page.locator('table.clinical-table')).toBeVisible();
  });

  test('07: Dental Lab Cases Kanban', async ({ page }) => {
    await page.goto('http://localhost:3000/lab-cases');
    await expect(page.locator('h1')).toContainText('Dental Lab Cases Kanban');

    // Check Kanban columns
    await expect(page.locator('text=Sent to Lab')).toBeVisible();
    await expect(page.locator('text=In Production')).toBeVisible();
    await expect(page.locator('text=Ready for Pickup')).toBeVisible();
    await expect(page.locator('text=Received at Clinic')).toBeVisible();

    // Verify New Lab Order Modal
    await page.locator('button:has-text("New Lab Order")').click();
    await expect(page.locator('text=Create Dental Lab Order')).toBeVisible();
    await page.locator('button:has-text("Cancel")').click();
  });

  test('08: Clinical Supplies Inventory', async ({ page }) => {
    await page.goto('http://localhost:3000/inventory');
    await expect(page.locator('h1')).toContainText('Clinical Inventory & Supplies');
    await expect(page.locator('button:has-text("Add Stock Item")')).toBeVisible();
  });

  test('09: Patient Recall & Reminders', async ({ page }) => {
    await page.goto('http://localhost:3000/recall');
    await expect(page.locator('h1')).toContainText('Automated Patient Recall & Reminders');
    await expect(page.locator('button:has-text("New Campaign")')).toBeVisible();
  });

  test('10: Executive Practice Analytics', async ({ page }) => {
    await page.goto('http://localhost:3000/analytics');
    await expect(page.locator('h1')).toContainText('Executive Practice Analytics');
    await expect(page.locator('text=Financial Performance')).toBeVisible();
    await expect(page.locator('text=Clinical Operations & Diagnostics')).toBeVisible();
    await expect(page.locator('text=Branch Performance Matrix')).toBeVisible();
  });

  test('11: Patient Case Presentation & PDF View', async ({ page }) => {
    await page.goto('http://localhost:3000/patients/pat_aarav_101/presentation');
    await expect(page.locator('h1')).toContainText('Apex Dental');
    await expect(page.locator('text=Patient Care Plan & Estimate')).toBeVisible();

    // Toggle language to Hindi
    const hindiBtn = page.locator('button:has-text("हिंदी (Hindi)")');
    await hindiBtn.click();
    await expect(page.locator('text=उपचार योजना एवं अनुमान')).toBeVisible();

    // Toggle back to English
    const engBtn = page.locator('button:has-text("English")');
    await engBtn.click();
    await expect(page.locator('text=Patient Care Plan & Estimate')).toBeVisible();

    // Verify Download PDF button is visible
    await expect(page.locator('button:has-text("Download Official PDF")')).toBeVisible();
  });

  test('12: Authentication & Quick Role Login', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await expect(page.locator('h1')).toContainText('DentChart 3D');

    // Click demo dentist quick-login button
    const dentistBtn = page.locator('button:has-text("Dentist: Dr. Rajesh Sharma")');
    await dentistBtn.click();

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Verify redirection to dashboard
    await page.waitForURL('**/', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Practice Dashboard');
  });

  test('13: Chairside WhatsApp 3D Link & QR Modal', async ({ page }) => {
    await page.goto('http://localhost:3000/patients/pat_aarav_101/presentation');
    await expect(page.locator('h1')).toContainText('Apex Dental');

    // Click Send to Patient WhatsApp / QR
    const shareBtn = page.locator('button:has-text("Send to Patient WhatsApp / QR")');
    await expect(shareBtn).toBeVisible();
    await shareBtn.click();

    // Verify modal elements
    await expect(page.locator('text=Chairside WhatsApp 3D Link')).toBeVisible();
    await expect(page.locator('text=Ask patient to scan with phone camera')).toBeVisible();
    await expect(page.locator('text=Send directly to')).toBeVisible();
    await expect(page.locator('button:has-text("Copy Link")')).toBeVisible();
    await expect(page.locator('a:has-text("Preview Mobile Portal")')).toBeVisible();
  });

  test('14: Mobile-First Patient 3D Portal & Conversion Engine', async ({ page }) => {
    await page.goto('http://localhost:3000/plan/pat_aarav_101');

    // Verify brand header and patient greeting
    await expect(page.locator('header').locator('text=Apex Dental')).toBeVisible();
    await expect(page.locator('text=Welcome, Aarav Patel')).toBeVisible();
    await expect(page.locator('text=Interactive 3D Oral Health Record')).toBeVisible();

    // Verify bilingual toggle
    const hindiBtn = page.locator('button:has-text("हिंदी")');
    await hindiBtn.click();
    await expect(page.locator('text=नमस्ते, Aarav Patel')).toBeVisible();

    const engBtn = page.locator('button:has-text("English")');
    await engBtn.click();
    await expect(page.locator('text=Welcome, Aarav Patel')).toBeVisible();

    // Verify treatment & cost estimate
    await expect(page.locator('text=Treatment & Cost Estimate')).toBeVisible();
    await expect(page.locator('text=Net Treatment Estimate')).toBeVisible();

    // Test UPI Modal Conversion Trigger
    const bookBtn = page.locator('button:has-text("Accept Plan & Book Slot")');
    await expect(bookBtn).toBeVisible();
    await bookBtn.click();

    // Verify UPI Payment dialog
    await expect(page.locator('text=Instant UPI Appointment Deposit')).toBeVisible();
    await expect(page.locator('button:has-text("Simulate")')).toBeVisible();

    // Simulate payment
    await page.locator('button:has-text("Simulate")').click();
    await expect(page.locator('text=Treatment Plan Accepted!')).toBeVisible();
  });

  test('15: Milestone Ledger, Operatory Chair Economics & Lab Reconciler', async ({ page }) => {
    await page.goto('http://localhost:3000/billing');

    // Default view: Invoices
    await expect(page.locator('#billing-tab-invoices')).toBeVisible();

    // 1. Switch to Milestones & Advance Ledger tab
    const milestoneTab = page.locator('#billing-tab-milestones');
    await expect(milestoneTab).toBeVisible();
    await milestoneTab.click();

    await expect(page.locator('text=Active Multi-Sitting Pipeline')).toBeVisible();
    await expect(page.locator('text=Sitting 1: Abutment Prep')).toBeVisible();
    await expect(page.locator('text=Sitting 2: Lab CAD/CAM Bisque')).toBeVisible();
    await expect(page.locator('text=Sitting 3: Final Resin Cementation')).toBeVisible();

    // Test Advance Deposit Modal
    const depositBtn = page.locator('#record-deposit-btn');
    await expect(depositBtn).toBeVisible();
    await depositBtn.click();
    await expect(page.locator('text=Record Advance Patient Deposit')).toBeVisible();
    await page.locator('#submit-deposit-btn').click();
    await expect(page.locator('text=Advance Deposit credited')).toBeVisible();

    // 2. Switch to Operatory Chair Economics tab
    const chairsTab = page.locator('#billing-tab-chairs');
    await expect(chairsTab).toBeVisible();
    await chairsTab.click();

    await expect(page.locator('text=Average Net Profit / Chair-Hour')).toBeVisible();
    await expect(page.locator('text=Operatory 1: Surgical & Implant Suite')).toBeVisible();
    await expect(page.locator('text=Operatory 2: Prostho & Aesthetic Studio')).toBeVisible();
    await expect(page.locator('text=Operatory 3: General & Pediatric Bay')).toBeVisible();
    await expect(page.locator('text=Net Clinic Contribution').first()).toBeVisible();

    // 3. Switch to Dental Lab Split Reconciler tab
    const labTab = page.locator('#billing-tab-lab');
    await expect(labTab).toBeVisible();
    await labTab.click();

    await expect(page.locator('text=Net Clinic Retained Margin')).toBeVisible();
    await expect(page.locator('text=Commercial Lab Payouts')).toBeVisible();
    await expect(page.locator('text=Apex Aesthetics Milling Centre')).toBeVisible();
    await expect(page.locator('text=Margin %')).toBeVisible();
  });

  test('16: 45-Second Rapid Intraoral Charting Flow, Macros & 1-Click Plan Generation', async ({ page }) => {
    await page.goto('http://localhost:3000/patients/pat_aarav_101');

    // Wait for patient header to load
    await expect(page.locator('h1')).toContainText('Aarav Patel', { timeout: 15000 });

    // Switch to 2D view to inspect chart
    const view2dBtn = page.locator('button:has-text("2D FDI Chart")');
    await view2dBtn.click();

    // Verify FDI Dental Chart
    await expect(page.locator('text=FDI 2-Digit Dental Chart')).toBeVisible();

    // Verify Rapid Mode controls
    const rapidBtn = page.locator('#toggle-rapid-mode-btn');
    await expect(rapidBtn).toBeVisible();
    await rapidBtn.click();

    // Check Rapid Mode badge and timer
    await expect(page.locator('text=⚡ 45s Rapid Mode Active')).toBeVisible();
    await expect(page.locator('#rapid-charting-timer')).toBeVisible();

    // Verify hotkey buttons
    await expect(page.locator('#hotkey-btn-caries')).toBeVisible();
    await expect(page.locator('#hotkey-btn-crown')).toBeVisible();

    // Test Macro preset: Upper Molars Caries
    const upperMolarsMacro = page.locator('#macro-upper-molars');
    await expect(upperMolarsMacro).toBeVisible();
    await upperMolarsMacro.click();

    // Wait for macro toast notification
    await expect(page.locator('text=Macro applied')).toBeVisible();

    // Test 1-Click Auto-Generate Plan
    const autoPlanBtn = page.locator('#auto-generate-plan-btn');
    await expect(autoPlanBtn).toBeVisible();
    await autoPlanBtn.click();

    // Verify auto-generation toast
    await expect(page.locator('text=Generated')).toBeVisible();

    // Verify Treatment Plan Section displays planned procedures
    await expect(page.locator('text=Treatment Plan')).toBeVisible();
    await expect(page.locator('text=Class II Composite Restoration').first()).toBeVisible();
  });

  test('17: 3D Disease Progression & Delay Penalty Simulator (Normal + Edge Cases)', async ({ page }) => {
    await page.goto('http://localhost:3000/plan/pat_aarav_101');

    // Wait for patient portal header
    await expect(page.locator('text=Interactive 3D Oral Health Record')).toBeVisible({ timeout: 15000 });

    // 1. Verify Disease Progression Simulator card is rendered
    const simulator = page.locator('#disease-progression-simulator');
    await expect(simulator).toBeVisible();
    await expect(page.locator('text=3D Disease Progression & Delay Penalty Simulator')).toBeVisible();

    // 2. Normal Case: Stage 'Today' (baseline)
    await expect(page.locator('#stage-btn-today')).toBeVisible();
    await expect(page.locator('text=Early Intervention')).toBeVisible();
    await expect(page.locator('text=1 / 10')).toBeVisible();
    await expect(page.locator('text=₹2,000').first()).toBeVisible();

    // 3. Normal Case: Switch to '+6 Months' stage
    await page.locator('#stage-btn-6mo').click();
    await expect(page.locator('text=Urgent / Pulpitis')).toBeVisible();
    await expect(page.locator('text=8 / 10')).toBeVisible();
    await expect(page.locator('text=₹14,500').first()).toBeVisible();
    await expect(page.locator('text=₹12,500 Delay Cost Penalty')).toBeVisible();

    // 4. Normal Case: Switch to '+12 Months' stage
    await page.locator('#stage-btn-12mo').click();
    await expect(page.locator('text=Irreversible Loss')).toBeVisible();
    await expect(page.locator('text=10 / 10')).toBeVisible();
    await expect(page.locator('text=₹42,000').first()).toBeVisible();
    await expect(page.locator('text=₹40,000 Delay Cost Penalty')).toBeVisible();

    // 5. Edge Case: Interactive Slider control
    const slider = page.locator('#disease-delay-slider');
    await expect(slider).toBeVisible();
    await slider.fill('0');
    await expect(page.locator('text=Early Intervention')).toBeVisible();

    // 6. Edge Case: Bilingual Hindi Translation
    const hindiBtn = page.locator('button:has-text("हिंदी")');
    await hindiBtn.click();
    await expect(page.locator('text=उपचार में देरी का जोखिम व खर्च वृद्धि सिमुलेटर')).toBeVisible();
    await page.locator('#stage-btn-6mo').click();
    await expect(page.locator('text=+6 महीने: नस तक संक्रमण व तीव्र दर्द')).toBeVisible();
    await expect(page.locator('text=अतिरिक्त नुकसान')).toBeVisible();

    // Revert back to English
    await page.locator('button:has-text("English")').click();
  });

  test('18: Visiting Consultant Commission & Statutory 194J TDS Settlement Engine', async ({ page }) => {
    await page.goto('http://localhost:3000/billing');
    await expect(page.locator('h1')).toContainText('GST Invoicing', { timeout: 15000 });

    // 1. Switch to 5th Tab: Visiting Specialist Splits & 194J TDS
    const consultantTab = page.locator('#billing-tab-consultants');
    await expect(consultantTab).toBeVisible();
    await consultantTab.click();

    // 2. Verify Executive KPI Cards
    await expect(page.locator('text=Gross Visiting Case Revenue')).toBeVisible();
    await expect(page.locator('text=Visiting Doctor Net Payouts')).toBeVisible();
    await expect(page.locator('text=Section 194J TDS Retained (10%)')).toBeVisible();
    await expect(page.locator('text=Hospital Retained Surgical Margin')).toBeVisible();

    // 3. Verify Waterfall Ledger columns & rows
    await expect(page.locator('text=Visiting Specialist Fee Waterfall & Statutory TDS Ledger')).toBeVisible();
    await expect(page.locator('td:has-text("Dr. Vikram Malhotra")').first()).toBeVisible();
    await expect(page.locator('td:has-text("Dr. Ananya Roy")').first()).toBeVisible();
    await expect(page.locator('td:has-text("Dr. Sameer Khan")').first()).toBeVisible();

    // 4. Edge Case: Filter by Specialist dropdown
    const filterSelect = page.locator('#consultant-filter-select');
    await expect(filterSelect).toBeVisible();
    await filterSelect.selectOption('Dr. Vikram Malhotra');
    await expect(page.locator('td:has-text("Dr. Vikram Malhotra")').first()).toBeVisible();
    await expect(page.locator('td:has-text("Dr. Sameer Khan")')).not.toBeVisible();

    // Reset filter
    await filterSelect.selectOption('all');
    await expect(page.locator('td:has-text("Dr. Sameer Khan")').first()).toBeVisible();

    // 5. Normal Case: Disburse Settlement with NEFT UTR
    const disburseBtn = page.locator('#disburse-btn-CON-901');
    await expect(disburseBtn).toBeVisible();
    await disburseBtn.click();

    // Check modal contents
    await expect(page.locator('#disburse-settlement-modal')).toBeVisible();
    await expect(page.locator('text=Section 194J TDS Withholding & NEFT Bank Advice')).toBeVisible();
    await expect(page.locator('#disburse-settlement-modal').getByText('₹11,700')).toBeVisible();

    // Fill Bank UTR and submit
    await page.locator('#utr-input').fill('NEFT-AXIS-994102');
    await page.locator('#submit-disbursement-btn').click();

    // Verify toast & status updated to DISBURSED
    await expect(page.locator('text=disbursed to Dr. Vikram Malhotra')).toBeVisible();
    await expect(page.locator('text=✓ DISBURSED').first()).toBeVisible();

    // 6. WhatsApp Voucher generation test
    const voucherBtn = page.locator('#voucher-btn-CON-902');
    await expect(voucherBtn).toBeVisible();
    await voucherBtn.click();
    await expect(page.locator('text=WhatsApp Payment Advice Voucher dispatched')).toBeVisible();
  });

  test('19: 3D Medico-Legal Touch/Stylus e-Consent & Signature Pad (Normal + Edge Cases)', async ({ page }) => {
    await page.goto('http://localhost:3000/plan/pat_aarav_101');
    await expect(page.locator('text=Interactive 3D Oral Health Record')).toBeVisible({ timeout: 15000 });

    // 1. Open e-Consent Modal
    const openConsentBtn = page.locator('#open-consent-btn');
    await expect(openConsentBtn).toBeVisible();
    await openConsentBtn.click();

    const consentModal = page.locator('#consent-modal');
    await expect(consentModal).toBeVisible();
    await expect(page.locator('text=Digital Medico-Legal Informed Consent')).toBeVisible();
    await expect(page.locator('text=Clinical Procedure & Risk Disclosures:')).toBeVisible();

    // 2. Edge Case: Empty signature validation error
    const submitConsentBtn = page.locator('#submit-consent-btn');
    await expect(submitConsentBtn).toBeVisible();
    await submitConsentBtn.click();

    // Check validation error shown
    const errorMsg = page.locator('#consent-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText('Please provide your touch or mouse signature');

    // 3. Normal Case: Draw signature on HTML5 canvas
    const canvas = page.locator('#consent-signature-canvas');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 20, box.y + 30);
      await page.mouse.down();
      await page.mouse.move(box.x + 80, box.y + 60);
      await page.mouse.move(box.x + 140, box.y + 30);
      await page.mouse.move(box.x + 200, box.y + 70);
      await page.mouse.up();
    }

    // 4. Edge Case: Test Clear Signature button
    const clearBtn = page.locator('#clear-signature-btn');
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    // Redraw signature after clear
    if (box) {
      await page.mouse.move(box.x + 30, box.y + 40);
      await page.mouse.down();
      await page.mouse.move(box.x + 120, box.y + 50);
      await page.mouse.move(box.x + 180, box.y + 35);
      await page.mouse.up();
    }

    // 5. Submit valid signed consent
    await submitConsentBtn.click();

    // Modal should close
    await expect(consentModal).not.toBeVisible();

    // 6. Verify Sealed Legal Consent badge is displayed
    const sealedBadge = page.locator('#consent-sealed-badge');
    await expect(sealedBadge).toBeVisible();
    await expect(sealedBadge).toContainText('Medico-Legal Informed Consent Sealed');
    await expect(sealedBadge).toContainText('NABH & NMC Signed');
  });

});

