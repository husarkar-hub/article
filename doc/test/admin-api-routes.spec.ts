import { test, expect, request } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// Helper for admin login (returns cookies)
async function adminLogin(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('03102003');
  await page.getByRole('button', { name: /login|enter/i }).click();
  await expect(page).toHaveURL(/\/admin/);
}

test.describe('Admin API Routes', () => {
  test('GET /api/admin/articles returns articles', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/articles`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('GET /api/admin/dashboard/metrics returns metrics', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/dashboard/metrics`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('totalArticles');
  });

  test('GET /api/admin/logs returns logs or unauthorized', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/logs`);
    expect([200, 401]).toContain(res.status());
  });

  test('POST /api/admin/users creates user or returns error', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/admin/users`, {
      data: {
        username: 'testuser',
        email: `testuser${Date.now()}@example.com`,
        password: 'testpass123',
        role: 'Super Admin',
      },
    });
    expect([201, 409, 400]).toContain(res.status());
  });

  test('POST /api/admin/registerArtical returns 401 if not logged in', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/admin/registerArtical`, {
      data: {
        title: 'Test Article',
        slug: `test-article-${Date.now()}`,
        content: 'Test content',
        categories: [],
        isBreakingNews: false,
        isTopRated: false,
        featuredImageUrl: '',
        author: 'admin',
      },
    });
    expect([401, 400]).toContain(res.status());
  });
});
