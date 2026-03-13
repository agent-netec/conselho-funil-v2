import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

/**
 * Meta Data Deletion Callback
 * Required by Meta for Apps in Live mode.
 * Called when a user requests deletion of their data via Facebook Settings.
 * https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const signedRequest = body.get('signed_request') as string;

    if (!signedRequest) {
      return NextResponse.json({ error: 'signed_request missing' }, { status: 400 });
    }

    // Decode the signed_request (base64url encoded JSON payload)
    const [, payload] = signedRequest.split('.');
    const decoded = JSON.parse(
      Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
    );

    const metaUserId = decoded?.user_id as string;

    if (metaUserId) {
      // Delete any integrations linked to this Meta user ID
      const adminDb = getAdminFirestore();
      const snap = await adminDb.collection('integrations').where('metaUserId', '==', metaUserId).get();
      for (const docSnap of snap.docs) {
        await docSnap.ref.delete();
      }
    }

    // Return confirmation URL as required by Meta
    const confirmationCode = `deletion_${metaUserId}_${Date.now()}`;
    const origin = new URL(req.url).origin;
    const statusUrl = `${origin}/data-deletion?code=${confirmationCode}`;

    return NextResponse.json({
      url: statusUrl,
      confirmation_code: confirmationCode,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to process deletion request' }, { status: 500 });
  }
}

// GET endpoint for status page (Meta may check this)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  return NextResponse.json({
    status: 'deleted',
    confirmation_code: code || 'unknown',
    message: 'User data has been deleted as requested.',
  });
}
