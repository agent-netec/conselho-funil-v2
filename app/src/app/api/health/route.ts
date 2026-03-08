import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 15;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function checkWithTimeout(
  fn: () => Promise<string>,
  timeoutMs = 5000
): Promise<string> {
  return new Promise<string>((resolve) => {
    const timer = setTimeout(() => resolve('timeout'), timeoutMs);

    fn()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        resolve(error instanceof Error ? error.message : 'unknown error');
      });
  });
}

// ---------------------------------------------------------------------------
// Service checks
// ---------------------------------------------------------------------------

async function checkFirebase(): Promise<string> {
  const apiKey = (process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '').trim();
  const projectId = (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '').trim();

  if (!apiKey) return 'missing NEXT_PUBLIC_FIREBASE_API_KEY';
  if (!projectId) return 'missing NEXT_PUBLIC_FIREBASE_PROJECT_ID';

  // Light connectivity probe: hit the Firestore REST discovery endpoint.
  // This validates that the API key + project ID are reachable without
  // reading any user data and without importing the Firebase SDK.
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: '__health__' }],
        limit: { value: 1 },
      },
    }),
  });

  // 200 = collection exists (or empty), 404-ish = collection not found (still means Firestore is up)
  if (res.ok || res.status === 400 || res.status === 404) return 'ok';
  return `firestore responded ${res.status}`;
}

async function checkGemini(): Promise<string> {
  // Mirrors the priority used in lib/ai/gemini.ts → getGeminiApiKey()
  const publicKey = (process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY ?? '').trim();
  const privateKey = (process.env.GOOGLE_AI_API_KEY ?? '').trim();
  const apiKey = publicKey || privateKey;

  if (!apiKey) return 'missing GOOGLE_AI_API_KEY';

  // Lightweight probe: list models (tiny payload, no token cost)
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=1`;
  const res = await fetch(url);

  if (res.ok) return 'ok';
  return `gemini responded ${res.status}`;
}

async function checkPinecone(): Promise<string> {
  const apiKey = (process.env.PINECONE_API_KEY ?? '').trim();
  const indexName = (
    process.env.PINECONE_INDEX ||
    process.env.PINECONE_INDEX_NAME ||
    ''
  ).trim();

  if (!apiKey) return 'missing PINECONE_API_KEY';
  if (!indexName) return 'missing PINECONE_INDEX';

  // Lightweight probe: describe index via Pinecone REST API
  const url = `https://api.pinecone.io/indexes/${indexName}`;
  const res = await fetch(url, {
    headers: { 'Api-Key': apiKey },
  });

  if (res.ok) return 'ok';
  return `pinecone responded ${res.status}`;
}

// ---------------------------------------------------------------------------
// GET /api/health
// ---------------------------------------------------------------------------

export async function GET() {
  const [firebase, gemini, pinecone] = await Promise.all([
    checkWithTimeout(checkFirebase),
    checkWithTimeout(checkGemini),
    checkWithTimeout(checkPinecone),
  ]);

  const services = { firebase, gemini, pinecone };
  const allOk = Object.values(services).every((s) => s === 'ok');

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services,
    },
    { status: allOk ? 200 : 503 }
  );
}
