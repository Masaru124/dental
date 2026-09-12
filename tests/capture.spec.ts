import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = path.resolve('public/screenshots');

test.beforeAll(() => {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
});

test.describe('DentOS Visual Capture Suite', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('Capture Dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForSelector('h1', { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/01_dashboard.png`, fullPage: true });
  });

  test('Capture Patient Profile - 3D Arch & All POVs', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('http://localhost:3000/patients/pat_aarav_101');
    await page.waitForSelector('text=Aarav Patel', { timeout: 15000 });
    await page.waitForTimeout(2000); // Wait for Three.js 3D Arch render
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/02_patient_profile_3d.png` });

    // Full Dentition View
    const btnFull = page.locator('button:has-text("Full Dentition")');
    if (await btnFull.isVisible()) {
      await btnFull.click({ force: true });
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/02_preset_full_dentition.png` });
    }
  });

  test('Capture Patient Profile - 2D FDI Chart & Slide-in Drawer', async ({ page }) => {
    await page.goto('http://localhost:3000/patients/pat_aarav_101');
    await page.waitForSelector('text=Aarav Patel', { timeout: 15000 });
    // Switch to 2D
    const btn2D = page.locator('button:has-text("2D FDI Chart")');
    if (await btn2D.isVisible()) await btn2D.click();
    await page.waitForTimeout(600);
    // Click tooth 16
    const tooth16 = page.locator('div[role="button"][aria-label*="Tooth 16"]');
    if (await tooth16.isVisible()) await tooth16.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/03_tooth_editor_drawer.png` });
  });

  test('Capture Diagnostic Imaging', async ({ page }) => {
    await page.goto('http://localhost:3000/imaging');
    await page.waitForSelector('h1', { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/04_imaging.png`, fullPage: true });
  });

  test('Capture Billing & GST', async ({ page }) => {
    await page.goto('http://localhost:3000/billing');
    await page.waitForSelector('h1', { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/05_billing.png`, fullPage: true });

    // Open Create Invoice Modal
    const newInvoiceBtn = page.locator('button:has-text("New Invoice")');
    if (await newInvoiceBtn.isVisible()) {
      await newInvoiceBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/05_billing_modal.png` });
      const cancelBtn = page.getByRole('button', { name: 'Cancel', exact: true });
      if (await cancelBtn.isVisible()) await cancelBtn.click();
    }
  });

  test('Capture Insurance Claims', async ({ page }) => {
    await page.goto('http://localhost:3000/insurance');
    await page.waitForSelector('h1', { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/06_insurance.png`, fullPage: true });

    // Open File Claim Modal
    const newClaimBtn = page.locator('button:has-text("File New Claim")');
    if (await newClaimBtn.isVisible()) {
      await newClaimBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/06_insurance_modal.png` });
      const cancelBtn = page.getByRole('button', { name: 'Cancel', exact: true });
      if (await cancelBtn.isVisible()) await cancelBtn.click();
    }
  });

  test('Capture Lab Cases Kanban', async ({ page }) => {
    await page.goto('http://localhost:3000/lab-cases');
    await page.waitForSelector('h1', { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/07_lab_cases.png`, fullPage: true });
  });

  test('Capture Clinical Inventory', async ({ page }) => {
    await page.goto('http://localhost:3000/inventory');
    await page.waitForSelector('h1', { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/08_inventory.png`, fullPage: true });
  });

  test('Capture Patient Recall', async ({ page }) => {
    await page.goto('http://localhost:3000/recall');
    await page.waitForSelector('h1', { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/09_recall.png`, fullPage: true });
  });

  test('Capture Practice Analytics', async ({ page }) => {
    await page.goto('http://localhost:3000/analytics');
    await page.waitForSelector('h1', { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/10_analytics.png`, fullPage: true });
  });

  test('Capture Patient Case Presentation', async ({ page }) => {
    await page.goto('http://localhost:3000/patients/pat_aarav_101/presentation');
    await page.waitForSelector('text=Back to Clinical Chart', { timeout: 15000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/11_presentation.png`, fullPage: true });
  });

  test('Capture Login Screen', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('button:has-text("Sign In to Clinical Suite")', { timeout: 15000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/12_login.png`, fullPage: true });
  });
});
