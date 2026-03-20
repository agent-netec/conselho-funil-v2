---
name: firebase
description: "Firebase gives you a complete backend in minutes - auth, database, storage, functions, hosting. But the ease of setup hides real complexity. Security rules are your last line of defense, and they're often wrong. Firestore queries are limited, and you learn this after you've designed your data model.  This skill covers Firebase Authentication, Firestore, Realtime Database, Cloud Functions, Cloud Storage, and Firebase Hosting. Key insight: Firebase is optimized for read-heavy, denormalized data. I"
source: vibeship-spawner-skills (Apache 2.0)
---

# Firebase

You're a developer who has shipped dozens of Firebase projects. You've seen the
"easy" path lead to security breaches, runaway costs, and impossible migrations.
You know Firebase is powerful, but you also know its sharp edges.

Your hard-won lessons: The team that skipped security rules got pwned. The team
that designed Firestore like SQL couldn't query their data. The team that
attached listeners to large collections got a $10k bill. You've learned from
all of them.

You advocate for Firebase when it fits, and warn loudly when it doesn't.

## Capabilities

- firebase-auth
- firestore
- firebase-realtime-database
- firebase-cloud-functions
- firebase-storage
- firebase-hosting
- firebase-security-rules
- firebase-admin-sdk
- firebase-emulators

## Patterns

### Modular SDK Import

Import only what you need for smaller bundles

### Security Rules Design

Secure your data with proper rules from day one

### Data Modeling for Queries

Design Firestore data structure around query patterns

## Anti-Patterns

### ❌ No Security Rules

### ❌ Client-Side Admin Operations

### ❌ Listener on Large Collections

## Related Skills

Works well with: `nextjs-app-router`, `react-patterns`, `authentication-oauth`, `stripe`

---

# Learnings From Production — Next.js 16 + Firebase (Conselho de Funil)

The following patterns were discovered and validated through real production debugging.
Apply them to any Next.js + Firebase project.

---

## 🔴 CRITICAL: Never Use experimentalForceLongPolling or experimentalAutoDetectLongPolling

**Root cause of the most common Firebase/Next.js auth race condition.**

```typescript
// ❌ WRONG — causes permission-denied errors on login
dbInstance = initializeFirestore(app, {
  experimentalForceLongPolling: true,       // never use
  experimentalAutoDetectLongPolling: true,  // also avoid
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
});

// ✅ CORRECT — use WebChannel default
dbInstance = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
});
```

**Why it matters:**
With long polling, Firestore communicates via HTTP polling cycles. When the auth
token changes, the new token only takes effect at the start of the **next polling
cycle** — creating a race window where reads return `permission-denied` even
after the user is authenticated.

With the default WebChannel (gRPC-web), `onIdTokenChanged` (Firestore's internal
observer) fires **before** `onAuthStateChanged` (your code). By the time your
hooks run, Firestore already has the token. No race window.

`experimentalForceLongPolling` was commonly added to fix `ERR_INCOMPLETE_CHUNKED_ENCODING`
in local dev — but it causes persistent auth race conditions in production.

---

## 🔴 CRITICAL: Auth Race Condition — onAuthStateChanged vs Firestore Token Propagation

**Problem:** `onAuthStateChanged` fires before Firestore's internal `credentialsProvider`
has processed the new auth token. Any Firestore read/write made immediately after
receiving the user will fail with `Missing or insufficient permissions`.

**Why most tutorials don't mention this:** They use `experimentalForceLongPolling`
which masks some symptoms, or they have natural delays (navigation, loading states)
that hide the race window.

**Solution: Probe read in auth store before publishing user**

```typescript
// auth-store.ts
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const unsubscribe = onAuthChange(async (firebaseUser) => {
  if (firebaseUser) {
    // Probe Firestore to confirm token has propagated.
    // Fast path: probe succeeds immediately (no extra delay).
    // Slow path: permission-denied → retry with backoff → publish only when ready.
    try {
      await firebaseUser.getIdToken(false); // warm token cache
      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          await getDoc(doc(db, 'users', firebaseUser.uid));
          break; // Firestore has the token — safe to publish
        } catch (err: any) {
          const isPermErr = err?.code === 'permission-denied' || err?.code === 'unauthenticated';
          if (isPermErr && attempt < 5) {
            await new Promise(r => setTimeout(r, 100 * Math.pow(2, attempt)));
          } else {
            break; // non-permission error or max retries — proceed anyway
          }
        }
      }
    } catch { /* ignore */ }
  }
  set({ user: firebaseUser, isLoading: false, isInitialized: true });
});
```

**Why a fixed delay (e.g., 150ms) doesn't work:**
- Fragile on slow connections or high CPU load
- Adds latency even when Firestore is already ready
- Doesn't adapt to actual system state

**Why the probe works:**
- Adapts to real Firestore readiness
- Fast path: 0ms extra latency when WebChannel is used (default)
- Once probe succeeds, ALL subsequent hooks work on first attempt

---

## 🔴 CRITICAL: onSnapshot Permanently Dies on permission-denied

**Problem:** When a Firestore `onSnapshot` listener receives `permission-denied`,
the Firebase SDK permanently removes it from its "outstanding queries" list.
It will **never** auto-retry. The listener is dead forever, causing empty UI
that never recovers without a full page reload.

```typescript
// ❌ WRONG — listener dies permanently on first permission error
const unsubscribe = onSnapshot(doc(db, 'users', userId), (snap) => {
  setData(snap.data());
});

// ✅ CORRECT — use getDoc/getDocs with explicit retry
const fetchData = useCallback(async (retries = 0) => {
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    setData(snap.data());
    setIsLoading(false);
  } catch (err: any) {
    if (err?.code === 'permission-denied' && retries < 4) {
      const delay = 300 * Math.pow(2, retries); // 300ms, 600ms, 1200ms, 2400ms
      setTimeout(() => fetchData(retries + 1), delay);
    } else {
      setIsLoading(false);
    }
  }
}, [userId]);
```

**When onSnapshot IS acceptable:**
- Chat messages (user is already authenticated, no race risk)
- Real-time data that truly needs live updates
- After confirming auth is fully initialized

**When to use getDoc/getDocs instead:**
- Any data loaded immediately after login (user profile, brands, tier, etc.)
- Data that doesn't need sub-second real-time updates
- Data loaded in hooks that run during app initialization

---

## 🟡 IMPORTANT: Client-Side Writes During Auth Race — Use Admin SDK via API Routes

**Problem:** Any `addDoc`, `setDoc`, or `updateDoc` called during the auth race
window gets queued in Firestore's local offline cache. When the auth token arrives,
Firestore tries to flush the queue — and gets `permission-denied` again. This
creates persistent `Uncaught (in promise) FirebaseError` console errors on every
subsequent login.

**Pattern: Migrate writes that happen at login time to API routes with Admin SDK**

```typescript
// ❌ WRONG — addDoc during auth race window queues in IndexedDB, fails on every login
export async function createUser(userId, data) {
  await setDoc(doc(db, 'users', userId), { ...data });
}

// ✅ CORRECT — API route bypasses Firestore Security Rules entirely
// app/src/lib/firebase/firestore.ts
export async function createUser(userId, data) {
  const headers = await getAuthHeaders(); // { Authorization: 'Bearer <token>' }
  const res = await fetch('/api/users', {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed');
  return userId;
}

// app/src/app/api/users/route.ts
export async function POST(request: NextRequest) {
  const userId = await requireUser(request); // verifies Bearer token server-side
  const adminDb = getAdminFirestore();
  await adminDb.collection('users').doc(userId).set({ ...data, createdAt: Timestamp.now() });
  return createApiSuccess({ userId });
}
```

**Writes to migrate first (highest risk — called right after onAuthStateChanged):**
- `createUser` — called on first login
- `updateUserLastLogin` — called on every login
- `createBrand` / `updateBrand` — called during onboarding
- `updateUserPreferences` — called during onboarding completion

**Admin SDK via API routes is NOT a workaround — it's the officially recommended
pattern for Next.js App Router.** Server components and route handlers should use
Admin SDK; client components use Firebase client SDK for reads.

### Auth Guard Reference

| Function | Use when | Checks |
|---|---|---|
| `requireUser(req)` | Any authenticated user | Bearer token valid → returns `userId` |
| `requireBrandAccess(req, brandId)` | Accessing a specific brand | Token valid + brand.userId == userId → returns `{ userId, brandId }` |
| `verifyAdminRole(req)` | Admin-only operations | Token valid + users/{uid}.role == 'admin' |

### Client-Side Write Fallback (when API route is not an option)

If you MUST use client-side Firestore writes, prime the auth token first:

```typescript
import { auth } from '@/lib/firebase/config';

// Before any Firestore write:
if (auth?.currentUser) {
  await auth.currentUser.getIdToken(false); // warms up credentialsProvider cache
}
await addDoc(collection(db, 'your-collection'), data);
```

Also valid at app initialization:
```typescript
await auth.authStateReady(); // ensures auth state is settled before any Firestore operation
```

### Security Rules Still Matter

Even with Admin SDK for writes, Security Rules still protect:
- **Client-side reads** (getDocs, getDoc, onSnapshot)
- **Any direct client write** that bypasses API routes

For Admin SDK writes, `requireUser`/`requireBrandAccess` in the API route IS the security layer.

---

## 🟡 IMPORTANT: Uncaught (in promise) FirebaseError from enqueueAndForget

**These console errors CANNOT be silenced from application code.**

When any Firestore read (`getDoc`, `getDocs`) fails with `permission-denied`, the
Firebase SDK internally creates a Promise via `enqueueAndForget` that has no `.catch()`
handler. This appears as `Uncaught (in promise) FirebaseError: Missing or insufficient
permissions` in the browser console even when your code handles the error correctly.

**Stack trace signature (minified production build):**
```
Uncaught (in promise) FirebaseError: Missing or insufficient permissions.
  enqueueAndForget @ d340963c...js
  lL @ d340963c...js
  h0 @ d340963c...js
  [your code] @ VM1128...js
```

**This means:**
1. Your retry logic IS working (the rejected Promise from `getDoc` is caught)
2. The console error is a SIDE EFFECT from Firestore SDK internals
3. You cannot prevent it — but you can reduce it by fixing the root cause (probe + WebChannel)

**The fix is removing the race condition, not silencing the error.**

---

## 🟡 IMPORTANT: getAuthHeaders() — Client-Side Auth Token for API Routes

Any API route that uses Firebase Admin SDK needs the user's identity. Use this
pattern to get the Bearer token from the client and verify it server-side.

```typescript
// app/src/lib/utils/auth-headers.ts
import { auth } from '@/lib/firebase/config';

export async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth?.currentUser;
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// Server-side (API route) — verify the token
// app/src/lib/auth/brand-guard.ts
export async function requireUser(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) throw new ApiError(401, 'Unauthorized');
  // Verify via Firebase Identity Toolkit REST API or Admin SDK verifyIdToken
  const decoded = await adminAuth.verifyIdToken(token);
  return decoded.uid;
}
```

---

## 🟡 IMPORTANT: Next.js 16 Dynamic Route Params Are Promises

**Breaking change in Next.js 16 (App Router):** `params` in route handlers is now
`Promise<{ paramName: string }>` and must be awaited.

```typescript
// ❌ WRONG — works in Next.js 14/15, TypeScript error in Next.js 16
export async function PATCH(
  request: NextRequest,
  { params }: { params: { brandId: string } }
) {
  const { brandId } = params; // TypeError in Next.js 16
}

// ✅ CORRECT — Next.js 16
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  const { brandId } = await params;
}
```

---

## 🟢 GOOD: Retry Pattern for Firestore Reads at Login Time

Any hook that reads Firestore immediately after the user is set (home page,
layout, providers) should have this retry pattern as a safety net — even with
the probe in auth-store:

```typescript
const fetchData = useCallback(async (retries = 0) => {
  if (!userId) { setIsLoading(false); return; }
  try {
    const snap = await getDoc(doc(db, 'collection', userId));
    setData(snap.data());
    setIsLoading(false);
  } catch (err: any) {
    if (err?.code === 'permission-denied' && retries < 4) {
      // Exponential backoff: 300ms, 600ms, 1200ms, 2400ms
      setTimeout(() => fetchData(retries + 1), 300 * Math.pow(2, retries));
    } else {
      console.warn('[hook] Could not load data:', err?.message);
      setIsLoading(false);
    }
  }
}, [userId]);

useEffect(() => {
  setIsLoading(true);
  fetchData(0);
}, [fetchData]);
```

**Hooks that should always have this pattern:**
- `useTier` — reads `users/{uid}`
- `useBrandAssets` — reads `brand_assets`
- `useUser` — reads `users/{uid}`
- Any hook active on the initial page after login

---

## 🟢 GOOD: Firebase Firestore Config for Next.js (Correct)

```typescript
// app/src/lib/firebase/config.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, CACHE_SIZE_UNLIMITED, getFirestore } from 'firebase/firestore';

const isServer = typeof window === 'undefined';

dbInstance = isServer
  ? getFirestore(appInstance)          // lightweight for SSR
  : initializeFirestore(appInstance, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,  // in-memory cache, no eviction
      // DO NOT add experimentalForceLongPolling or experimentalAutoDetectLongPolling
      // These flags break auth token delivery and cause persistent permission errors
    });
```

**Server vs Client split:**
- Server: `getFirestore()` — lightweight, no persistence, for SSR/API routes
- Client: `initializeFirestore()` — full SDK with in-memory cache

---

## Reference: Firebase Auth Observer Order (Why the Race Exists)

```
Firebase Auth token change event
  │
  ├─► idTokenObservers (fires FIRST)
  │     └─► Firestore CredentialsProvider — stores new token internally
  │           └─► schedules async gRPC connection restart ← THE RACE IS HERE
  │
  └─► authStateObservers (fires SECOND)
        └─► Your onAuthStateChanged callback
              └─► hooks set up Firestore reads ← these fire BEFORE connection restart
```

With WebChannel (default): connection restart is fast and often completes
before hooks fire → race window is minimal or zero.

With long polling: the token only takes effect after the current poll cycle
completes → race window = poll interval (can be seconds).

The probe read in auth-store detects when the connection restart is complete
by testing an actual Firestore read, then publishes the user only when safe.

---

## Quick Diagnostic: "Missing or insufficient permissions"

1. **Is user authenticated?** Check `useAuthStore().user?.uid` in console
2. **Is it a read or write?** Reads less likely to hit race; writes more critical
3. **Is it a new session?** Race more likely immediately after login
4. **Is it after 60 min idle?** Token may have expired (check `onIdTokenChanged`)
5. **Is it a client-side write?** → Move to API route with Admin SDK
6. **Are Security Rules deployed?** `firebase deploy --only firestore:rules` from `/app`
7. **Check `request.resource.data.userId == request.auth.uid`** for create rules

---

## Sources

- firebase/firebase-js-sdk #1981 — auth race with synchronizeTabs
- firebase/firebase-js-sdk #6964 — user signed in but request.auth is null
- firebase/firebase-js-sdk #8201 — missing or insufficient permissions race
- firebase/firebase-js-sdk #8176 — experimentalForceLongPolling inconsistency
- firebase.blog/posts/2024/05/firebase-serverapp-ssr — FirebaseServerApp official
- firebase.google.com/docs/web/ssr-apps — official SSR guidance
