import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from './config';
import type { MarketDossier } from '@/types/research';

export async function saveResearch(brandId: string, dossier: MarketDossier): Promise<string> {
  const colRef = collection(db, 'brands', brandId, 'research');
  const docRef = await addDoc(colRef, dossier);
  return docRef.id;
}

export async function getResearch(brandId: string, dossierId: string): Promise<MarketDossier | null> {
  const ref = doc(db, 'brands', brandId, 'research', dossierId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<MarketDossier, 'id'>) };
}

export async function listResearch(brandId: string, limitCount: number = 20): Promise<MarketDossier[]> {
  const colRef = collection(db, 'brands', brandId, 'research');
  const q = query(colRef, orderBy('generatedAt', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MarketDossier, 'id'>) }));
}

export async function getCachedResearch(brandId: string, topic: string): Promise<MarketDossier | null> {
  const colRef = collection(db, 'brands', brandId, 'research');
  const q = query(
    colRef,
    where('topic', '==', topic),
    where('expiresAt', '>', Timestamp.now()),
    orderBy('generatedAt', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const first = snap.docs[0];
  return { id: first.id, ...(first.data() as Omit<MarketDossier, 'id'>) };
}
