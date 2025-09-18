import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const adminEmail = 'admin@example.com';
const adminPassword = '03102003';

const articleTitle = `Test Article ${Date.now()}`;
const articleContent = 'This is a test article created by Playwright.';

// Helper: Login as admin
async function adminLogin(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel('Email').fill(adminEmail);
  await page.getByLabel('Password').fill(adminPassword);
  await page.getByRole('button', { name: /login|enter/i }).click();
  await expect(page).toHaveURL(`${BASE_URL}/admin`);
}

test('Admin can add article and change status', async ({ page }) => {
  // Login
  await adminLogin(page);

  // Go to articles management (adjust selector if needed)
  await page.goto(`${BASE_URL}/admin/articles`);
  await expect(page.getByText(/add|create/i)).toBeVisible();

  // Click add/create article button (adjust selector as needed)
  await page.getByRole('button', { name: /add|create/i }).click();

  // Fill article form (adjust selectors as needed)
  await page.getByLabel(/title/i).fill(articleTitle);
  await page.getByLabel(/content/i).fill(articleContent);
  // If category is required, select the first available
  const categorySelect = page.locator('select[name="category"], [aria-label="Category"]');
  if (await categorySelect.count()) {
    await categorySelect.selectOption({ index: 0 });
  }
  // Submit
  await page.getByRole('button', { name: /submit|save|publish/i }).click();

  // Check for success message or article in list
  await expect(page.getByText(articleTitle)).toBeVisible();

  // Change status (find the article row and click status change, adjust selectors as needed)
  const row = page.locator(`tr:has-text("${articleTitle}")`);
  await expect(row).toBeVisible();
  // Click status dropdown/button (adjust selector as needed)
  const statusButton = row.getByRole('button', { name: /status|edit|change/i });
  if (await statusButton.count()) {
    await statusButton.click();
    // Select a new status (e.g., Published)
    await page.getByRole('option', { name: /publish|published/i }).click();
    // Optionally confirm
    const confirm = page.getByRole('button', { name: /confirm|ok|yes/i });
    if (await confirm.count()) await confirm.click();
    // Check for status update
    await expect(row.getByText(/publish|published/i)).toBeVisible();
  }
});
