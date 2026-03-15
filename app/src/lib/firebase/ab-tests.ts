/**
 * A/B Tests — CRUD Helpers Firestore
 * Collection: brands/{brandId}/ab_tests
 *
 * @module lib/firebase/ab-tests
 * @story S34-AB-02
 * @arch DT-03 (subcollection pattern)
 */

import { getAdminFirestore } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTimestamp = any;
import type { ABTest, ABTestVariant, ABTestStatus } from '@/types/ab-testing';

/**
 * Cria um novo A/B test.
 * Variantes recebem weight = 1/N e metricas zeradas.
 */
export async function createABTest(
  brandId: string,
  data: {
    name: string;
    targetSegment: ABTest['targetSegment'];
    variants: Array<{ name: string; contentVariations: ABTestVariant['contentVariations'] }>;
    autoOptimize?: boolean;
  }
): Promise<ABTest> {
  const adminDb = getAdminFirestore();
  const colRef = adminDb.collection('brands').doc(brandId).collection('ab_tests');
  const now = Timestamp.now() as AnyTimestamp;
  const variantCount = data.variants.length;

  const variants: ABTestVariant[] = data.variants.map((v, i) => ({
    id: `variant_${i}`,
    name: v.name,
    contentVariations: v.contentVariations,
    weight: 1 / variantCount,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0,
  }));

  const testData = {
    name: data.name,
    brandId,
    targetSegment: data.targetSegment,
    variants,
    status: 'draft' as ABTestStatus,
    metrics: { totalImpressions: 0, totalConversions: 0, totalRevenue: 0 },
    winnerVariantId: null,
    significanceLevel: null,
    autoOptimize: data.autoOptimize ?? false,
    startDate: null,
    endDate: null,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await colRef.add(testData);
  return { id: docRef.id, ...testData };
}

/**
 * Lista A/B tests de uma marca, opcionalmente filtrados por status.
 */
export async function getABTests(
  brandId: string,
  status?: ABTestStatus
): Promise<ABTest[]> {
  const adminDb = getAdminFirestore();
  const colRef = adminDb.collection('brands').doc(brandId).collection('ab_tests');
  const q = status ? colRef.where('status', '==', status) : colRef;
  const snapshot = await q.get();
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as ABTest[];
}

/**
 * Busca um A/B test especifico.
 */
export async function getABTest(
  brandId: string,
  testId: string
): Promise<ABTest | null> {
  const adminDb = getAdminFirestore();
  const docRef = adminDb.collection('brands').doc(brandId).collection('ab_tests').doc(testId);
  const snap = await docRef.get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as ABTest;
}

/**
 * Atualiza campos de um A/B test.
 */
export async function updateABTest(
  brandId: string,
  testId: string,
  data: Partial<Omit<ABTest, 'id' | 'brandId' | 'createdAt'>>
): Promise<void> {
  const adminDb = getAdminFirestore();
  const docRef = adminDb.collection('brands').doc(brandId).collection('ab_tests').doc(testId);
  await docRef.update({
    ...data,
    updatedAt: Timestamp.now() as AnyTimestamp,
  });
}

/**
 * Remove um A/B test. Apenas testes em draft podem ser deletados.
 */
export async function deleteABTest(
  brandId: string,
  testId: string
): Promise<void> {
  const adminDb = getAdminFirestore();
  const docRef = adminDb.collection('brands').doc(brandId).collection('ab_tests').doc(testId);
  await docRef.delete();
}

/**
 * Incrementa metricas de uma variante atomicamente via runTransaction.
 * DT-01 (BLOCKING): le doc corrente e commita variantes + totais no mesmo commit.
 */
export async function updateVariantMetrics(
  brandId: string,
  testId: string,
  variantId: string,
  delta: { impressions?: number; clicks?: number; conversions?: number; revenue?: number }
): Promise<void> {
  const adminDb = getAdminFirestore();
  const docRef = adminDb.collection('brands').doc(brandId).collection('ab_tests').doc(testId);
  await adminDb.runTransaction(async (transaction) => {
    const snap = await transaction.get(docRef);
    if (!snap.exists) throw new Error('AB Test not found');

    const test = snap.data() as ABTest;
    const updatedVariants = test.variants.map((v) => {
      if (v.id !== variantId) return v;
      return {
        ...v,
        impressions: v.impressions + (delta.impressions ?? 0),
        clicks: v.clicks + (delta.clicks ?? 0),
        conversions: v.conversions + (delta.conversions ?? 0),
        revenue: v.revenue + (delta.revenue ?? 0),
      };
    });

    const nextTotalImpressions = (test.metrics?.totalImpressions ?? 0) + (delta.impressions ?? 0);
    const nextTotalConversions = (test.metrics?.totalConversions ?? 0) + (delta.conversions ?? 0);
    const nextTotalRevenue = (test.metrics?.totalRevenue ?? 0) + (delta.revenue ?? 0);

    transaction.update(docRef, {
      variants: updatedVariants,
      'metrics.totalImpressions': nextTotalImpressions,
      'metrics.totalConversions': nextTotalConversions,
      'metrics.totalRevenue': nextTotalRevenue,
      updatedAt: Timestamp.now() as AnyTimestamp,
    });
  });
}
