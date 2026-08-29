import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('create a new journal with an image attachment', async ({ page }) => {
  // 1. Navigate to login
  await page.goto('http://localhost:3000/login');
  
  // 2. We don't have a known user, so let's try to register first.
  await page.goto('http://localhost:3000/register');
  const uniqueEmail = `testuser_${Date.now()}@example.com`;
  await page.fill('input[id="register-name"]', 'Playwright User');
  await page.fill('input[id="register-email"]', uniqueEmail);
  await page.fill('input[id="register-password"]', 'password123');
  await page.fill('input[id="register-confirm"]', 'password123');
  
  // Submit register
  await page.click('button[type="submit"]');
  
  // Wait for register request to complete
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test_dashboard.png' });
  
  // 3. Navigate to New Journal
  await page.goto('http://localhost:3000/journals/new');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test_new_journal.png' });
  
  // 4. Fill form
  await page.fill('input[id="journal-title"]', 'E2E Test Upload Journal');
  await page.fill('textarea[id="journal-did"]', 'Testing image uploads via Playwright.');
  
  // 5. Upload file
  // Wait for the file input to be attached
  const fileInput = page.locator('input[type="file"]');
  
  // Provide the path to a test image
  // We'll generate a dummy file to upload
  const dummyFilePath = path.join(__dirname, 'dummy_test_image.png');
  // Create a 1x1 valid PNG
  const validPNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0, 144, 119, 83, 222, 0, 0, 0, 12, 73, 68, 65, 84, 8, 215, 99, 248, 255, 255, 63, 0, 5, 254, 2, 254, 220, 204, 89, 231, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
  fs.writeFileSync(dummyFilePath, validPNG);
  
  await fileInput.setInputFiles(dummyFilePath);
  
  // Verify preview is shown
  await expect(page.locator('.image-preview-item')).toBeVisible();
  
  // 6. Submit the journal
  await page.click('button[type="submit"]');
  
  // 7. Verify redirection to Dashboard or success
  await page.waitForTimeout(2000);
  
  // Clean up
  fs.unlinkSync(dummyFilePath);
});
