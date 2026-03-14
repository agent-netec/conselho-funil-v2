/**
 * case-studies-server.ts — Server-only case study operations using Firebase Admin SDK.
 * Use these functions inside Next.js API routes instead of client SDK equivalents.
 * Admin SDK bypasses security rules — authorized by service account credentials.
 */
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from './admin';
import type { CaseStudy, CreateCaseStudyInput } from '@/types/case-studies';

export async function createCaseStudyAdmin(input: CreateCaseStudyInput): Promise<string> {
  const db = getAdminFirestore();
  const now = FieldValue.serverTimestamp();
  const ref = await db
    .collection('brands')
    .doc(input.brandId)
    .collection('case_studies')
    .add({ ...input, createdAt: now, updatedAt: now });
  return ref.id;
}

export async function getBrandCaseStudiesAdmin(
  brandId: string,
  maxResults = 20
): Promise<CaseStudy[]> {
  const db = getAdminFirestore();
  const snap = await db
    .collection('brands')
    .doc(brandId)
    .collection('case_studies')
    .orderBy('createdAt', 'desc')
    .limit(maxResults)
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CaseStudy));
}

export async function deleteCaseStudyAdmin(brandId: string, caseStudyId: string): Promise<void> {
  const db = getAdminFirestore();
  await db
    .collection('brands')
    .doc(brandId)
    .collection('case_studies')
    .doc(caseStudyId)
    .delete();
}
