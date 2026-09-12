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

});
