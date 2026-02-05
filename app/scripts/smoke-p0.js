#!/usr/bin/env node
/**
 * Smoke P0 — Um comando único para validar endpoints críticos.
 * Uso: SMOKE_BASE_URL=https://... TEST_BRAND_ID=... node scripts/smoke-p0.js
 *      ou: npm run smoke
 *
 * Critério de sucesso: status em acceptStatuses e nunca 500.
 * Ingest/Autopsy: 200 ou 422 (scraping pode falhar) = pass.
 * Ref: _netecmt/packs/stories/sprint-22-stabilization/smoke-tests.md
 */

const BASE_URL = (process.env.SMOKE_BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://app-rho-flax-25.vercel.app')
).replace(/\/$/, '');

// IDs do seed (scripts/seed-test-data.js) como default
const brandId = process.env.TEST_BRAND_ID || 'test_brand_seed';
const userId = process.env.TEST_USER_ID || 'test_user_seed';
const conversationId = process.env.TEST_CONVERSATION_ID || 'test_conversation_seed';
const competitorId = process.env.TEST_COMPETITOR_ID || 'test_competitor_seed';
const targetUrl = process.env.TEST_TARGET_URL || 'https://example.com';

const P0_TESTS = [
  {
    name: 'POST /api/intelligence/keywords',
    method: 'POST',
    path: '/api/intelligence/keywords',
    body: { brandId, seedTerm: 'exemplo' },
    acceptStatuses: [200, 400],
  },
  {
    name: 'POST /api/intelligence/autopsy/run',
    method: 'POST',
    path: '/api/intelligence/autopsy/run',
    body: { brandId, url: targetUrl },
    acceptStatuses: [200, 422, 400],
  },
  {
    name: 'POST /api/intelligence/spy',
    method: 'POST',
    path: '/api/intelligence/spy',
    body: { brandId, competitorId },
    acceptStatuses: [200, 404, 400, 502],
  },
  {
    name: 'POST /api/chat',
    method: 'POST',
    path: '/api/chat',
    body: { message: 'teste', conversationId },
    acceptStatuses: [200, 404, 403],
  },
  {
    name: 'POST /api/ingest/url',
    method: 'POST',
    path: '/api/ingest/url',
    body: { url: targetUrl, brandId, userId },
    acceptStatuses: [200, 422, 400],
  },
  {
    name: 'GET /api/assets/metrics',
    method: 'GET',
    path: `/api/assets/metrics?brandId=${encodeURIComponent(brandId)}`,
    acceptStatuses: [200, 400],
  },
];

async function runOne(test) {
  const url = test.path.startsWith('http') ? test.path : `${BASE_URL}${test.path}`;
  const options = {
    method: test.method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (test.body && test.method !== 'GET') options.body = JSON.stringify(test.body);

  let status;
  let bodyText;
  let error;

  try {
    const res = await fetch(url, options);
    status = res.status;
    bodyText = await res.text();
  } catch (e) {
    error = e.message;
    status = 0;
  }

  const ok = status !== 500 && (status === 0 ? false : test.acceptStatuses.includes(status));
  let msg = status.toString();
  if (status === 0) msg = `ERR: ${error || 'network'}`;
  else if (status >= 400 && bodyText) {
    try {
      const j = JSON.parse(bodyText);
      if (j.error) msg += ` — ${typeof j.error === 'string' ? j.error : JSON.stringify(j.error)}`;
    } catch (_) {}
  }

  return { name: test.name, ok, status, msg };
}

async function main() {
  console.log('Smoke P0 — Base URL:', BASE_URL);
  console.log('brandId:', brandId, '| userId:', userId, '| conversationId:', conversationId, '| competitorId:', competitorId);
  console.log('');

  const results = [];
  for (const test of P0_TESTS) {
    const r = await runOne(test);
    results.push(r);
    const icon = r.ok ? '✓' : '✗';
    const statusStr = r.status === 0 ? 'ERR' : r.status;
    console.log(`${icon} ${r.name} → ${statusStr} ${r.msg ? r.msg : ''}`);
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log('');
  console.log(`Resultado: ${passed}/${results.length} passou, ${failed} falhou. ${failed > 0 ? 'FALHA' : 'OK'}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
