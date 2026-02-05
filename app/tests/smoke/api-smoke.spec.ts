import { test, expect } from '@playwright/test';

const brandId = (process.env.TEST_BRAND_ID ?? '').trim();
const userId = (process.env.TEST_USER_ID ?? '').trim();
const targetUrl = (process.env.TEST_TARGET_URL ?? '').trim();

const missingConfig = !brandId || !userId || !targetUrl;

test.describe('P0 smoke - APIs', () => {
  test.skip(missingConfig, 'Defina TEST_BRAND_ID, TEST_USER_ID e TEST_TARGET_URL.');

  test('POST /api/ingest/url retorna 200 @smoke', async ({ request }) => {
    const response = await request.post('/api/ingest/url', {
      data: { url: targetUrl, brandId, userId },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toMatchObject({ success: true });
    expect(body.assetId).toBeTruthy();
  });

  test('POST /api/intelligence/autopsy/run retorna 200 @smoke', async ({ request }) => {
    const response = await request.post('/api/intelligence/autopsy/run', {
      data: { url: targetUrl, brandId, depth: 'quick' },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toMatchObject({ status: 'completed', url: targetUrl });
    expect(body.report).toBeTruthy();
  });
});
