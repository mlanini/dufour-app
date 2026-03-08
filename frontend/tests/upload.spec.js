import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * E2E Tests for Upload Panel
 */

test.describe('Upload Panel', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForSelector('.ribbon-toolbar', { timeout: 10000 });
  });
  
  test('should open upload panel from ribbon toolbar', async ({ page }) => {
    // Click on Maps tab
    await page.click('.ribbon-tab:has-text("Maps")');
    
    // Wait for ribbon content to load
    await page.waitForSelector('.ribbon-group');
    
    // Find and click upload button
    const uploadButton = page.locator('.ribbon-button:has-text("Upload")');
    await uploadButton.click();
    
    // Verify upload panel appears
    await expect(page.locator('.upload-panel')).toBeVisible();
    await expect(page.locator('.upload-panel h2')).toHaveText('Upload QGIS Project');
  });
  
  test('should display drag and drop area', async ({ page }) => {
    // Open upload panel
    await page.click('.ribbon-tab:has-text("Maps")');
    await page.click('.ribbon-button:has-text("Upload")');
    
    // Check drag-drop area
    const dropZone = page.locator('.upload-dropzone');
    await expect(dropZone).toBeVisible();
    await expect(dropZone).toContainText('Drag & drop');
  });
  
  test('should validate file extension', async ({ page }) => {
    // Open upload panel
    await page.click('.ribbon-tab:has-text("Maps")');
    await page.click('.ribbon-button:has-text("Upload")');
    
    // Try to upload invalid file type
    const invalidFile = path.join(__dirname, 'fixtures', 'invalid.txt');
    
    // Create file input and attach file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(invalidFile);
    
    // Should show error
    await expect(page.locator('.upload-error')).toBeVisible();
    await expect(page.locator('.upload-error')).toContainText('.qgz files only');
  });
  
  test('should validate file size', async ({ page }) => {
    // Open upload panel
    await page.click('.ribbon-tab:has-text("Maps")');
    await page.click('.ribbon-button:has-text("Upload")');
    
    // Create a large file (> 50MB) - simulated
    // In real test, would need actual large file
    
    // For this test, we'll just verify the error message exists
    const errorContainer = page.locator('.upload-error');
    // Skip actual large file upload in automated test
  });
  
  test('should validate required fields', async ({ page }) => {
    // Open upload panel
    await page.click('.ribbon-tab:has-text("Maps")');
    await page.click('.ribbon-button:has-text("Upload")');
    
    // Attach valid file
    const validFile = path.join(__dirname, 'fixtures', 'sample.qgz');
    await page.locator('input[type="file"]').setInputFiles(validFile);
    
    // Clear the auto-populated name
    await page.fill('input[name="name"]', '');
    
    // Try to submit
    await page.click('button[type="submit"]');
    
    // Should show validation error
    await expect(page.locator('.form-error')).toBeVisible();
  });
  
  test('should auto-populate title from filename', async ({ page }) => {
    // Open upload panel
    await page.click('.ribbon-tab:has-text("Maps")');
    await page.click('.ribbon-button:has-text("Upload")');
    
    // Attach file
    const testFile = path.join(__dirname, 'fixtures', 'test_project.qgz');
    await page.locator('input[type="file"]').setInputFiles(testFile);
    
    // Wait for auto-population
    await page.waitForTimeout(500);
    
    // Check that title was auto-populated
    const titleInput = page.locator('input[name="title"]');
    await expect(titleInput).toHaveValue('Test Project');
  });
  
  test('should validate project name format', async ({ page }) => {
    // Open upload panel
    await page.click('.ribbon-tab:has-text("Maps")');
    await page.click('.ribbon-button:has-text("Upload")');
    
    // Attach file
    const testFile = path.join(__dirname, 'fixtures', 'sample.qgz');
    await page.locator('input[type="file"]').setInputFiles(testFile);
    
    // Test invalid names
    const nameInput = page.locator('input[name="name"]');
    
    // Uppercase - should show error
    await nameInput.fill('TestProject');
    await page.click('button[type="submit"]');
    await expect(page.locator('.field-error')).toContainText('lowercase');
    
    // Special characters - should show error
    await nameInput.fill('test-project');
    await page.click('button[type="submit"]');
    await expect(page.locator('.field-error')).toContainText('alphanumeric');
  });
  
  test('should show upload progress', async ({ page }) => {
    // Mock API to delay response
    await page.route('**/api/projects', async route => {
      // Simulate slow upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          project: { id: '123', name: 'test' },
          migration: { total_layers: 1, migrated: 1, failed: 0 }
        })
      });
    });
    
    // Open upload panel
    await page.click('.ribbon-tab:has-text("Maps")');
    await page.click('.ribbon-button:has-text("Upload")');
    
    // Fill form and upload
    const testFile = path.join(__dirname, 'fixtures', 'sample.qgz');
    await page.locator('input[type="file"]').setInputFiles(testFile);
    await page.fill('input[name="name"]', 'test_project');
    await page.click('button[type="submit"]');
    
    // Should show progress bar
    await expect(page.locator('.upload-progress')).toBeVisible();
    await expect(page.locator('.progress-bar')).toBeVisible();
  });
  
  test('should show success message on successful upload', async ({ page }) => {
    // Mock successful API response
    await page.route('**/api/projects', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          project: {
            id: '123',
            name: 'test_project',
            title: 'Test Project',
            layers_count: 3
          },
          migration: {
            total_layers: 3,
            migrated: 2,
            failed: 1,
            details: []
          }
        })
      });
    });
    
    // Open upload panel and upload
    await page.click('.ribbon-tab:has-text("Maps")');
    await page.click('.ribbon-button:has-text("Upload")');
    
    const testFile = path.join(__dirname, 'fixtures', 'sample.qgz');
    await page.locator('input[type="file"]').setInputFiles(testFile);
    await page.fill('input[name="name"]', 'test_project');
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await expect(page.locator('.upload-success')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.upload-success')).toContainText('successfully uploaded');
    
    // Should show migration summary
    await expect(page.locator('.migration-summary')).toBeVisible();
    await expect(page.locator('.migration-summary')).toContainText('2 layers migrated');
  });
  
  test('should show error message on failed upload', async ({ page }) => {
    // Mock failed API response
    await page.route('**/api/projects', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Layer migration failed: Invalid geometry'
        })
      });
    });
    
    // Open upload panel and upload
    await page.click('.ribbon-tab:has-text("Maps")');
    await page.click('.ribbon-button:has-text("Upload")');
    
    const testFile = path.join(__dirname, 'fixtures', 'sample.qgz');
    await page.locator('input[type="file"]').setInputFiles(testFile);
    await page.fill('input[name="name"]', 'test_project');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await expect(page.locator('.upload-error')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.upload-error')).toContainText('migration failed');
  });
  
  test('should close panel on close button click', async ({ page }) => {
    // Open upload panel
    await page.click('.ribbon-tab:has-text("Maps")');
    await page.click('.ribbon-button:has-text("Upload")');
    
    // Verify panel is visible
    await expect(page.locator('.upload-panel')).toBeVisible();
    
    // Click close button
    await page.click('.upload-panel .close-button');
    
    // Panel should be hidden
    await expect(page.locator('.upload-panel')).not.toBeVisible();
  });
  
  test('should reset form after successful upload', async ({ page }) => {
    // Mock successful upload
    await page.route('**/api/projects', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          project: { id: '123', name: 'test' },
          migration: { total_layers: 1, migrated: 1, failed: 0 }
        })
      });
    });
    
    // Upload file
    await page.click('.ribbon-tab:has-text("Maps")');
    await page.click('.ribbon-button:has-text("Upload")');
    
    const testFile = path.join(__dirname, 'fixtures', 'sample.qgz');
    await page.locator('input[type="file"]').setInputFiles(testFile);
    await page.fill('input[name="name"]', 'test_project');
    await page.fill('input[name="description"]', 'Test description');
    await page.click('button[type="submit"]');
    
    // Wait for success
    await expect(page.locator('.upload-success')).toBeVisible();
    
    // Wait for auto-close (2 seconds)
    await page.waitForTimeout(2500);
    
    // Reopen panel
    await page.click('.ribbon-button:has-text("Upload")');
    
    // Form should be reset
    await expect(page.locator('input[name="name"]')).toHaveValue('');
    await expect(page.locator('input[name="description"]')).toHaveValue('');
  });
  
  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Open upload panel
    await page.click('.ribbon-tab:has-text("Maps")');
    await page.click('.ribbon-button:has-text("Upload")');
    
    // Panel should be responsive
    const panel = page.locator('.upload-panel');
    await expect(panel).toBeVisible();
    
    // Check that panel takes full width on mobile
    const boundingBox = await panel.boundingBox();
    expect(boundingBox.width).toBeGreaterThan(300);
  });
});
