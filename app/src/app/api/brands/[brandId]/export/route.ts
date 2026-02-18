/**
 * R-4.3: Brand Export (JSON) — backup all brand data + subcollections.
 * GET /api/brands/[brandId]/export
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';

const SUBCOLLECTIONS = [
  'content_calendar',
  'automation_rules',
  'automation_logs',
  'social_interactions',
  'voice_profiles',
  'funnels',
  'conversations',
  'proposals',
  'research',
  'keywords',
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const { brandId } = await params;
    await requireBrandAccess(req, brandId);

    // Export brand document
    const brandRef = doc(db, 'brands', brandId);
    const brandSnap = await getDoc(brandRef);

    if (!brandSnap.exists()) {
      return NextResponse.json({ error: 'Brand não encontrada' }, { status: 404 });
    }

    const exportData: Record<string, unknown> = {
      _exportedAt: new Date().toISOString(),
      _version: '1.0',
      brand: { id: brandSnap.id, ...brandSnap.data() },
    };

    // Export subcollections
    for (const sub of SUBCOLLECTIONS) {
      const subRef = collection(db, 'brands', brandId, sub);
      const snapshot = await getDocs(subRef);
      exportData[sub] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="brand-${brandId}-export.json"`,
      },
    });
  } catch (error) {
    return handleSecurityError(error);
  }
}
