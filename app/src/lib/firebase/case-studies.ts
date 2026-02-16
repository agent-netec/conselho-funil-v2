/**
 * Case Studies Firebase CRUD
 * Collection: brands/{brandId}/case_studies
 * Shared by Spy Agent (N-3) and Page Forensics (N-4)
 * NO TTL — permanent storage
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { CaseStudy, CreateCaseStudyInput } from '@/types/case-studies';

/**
 * Save a new case study (permanent, no TTL)
 */
export async function createCaseStudy(input: CreateCaseStudyInput): Promise<string> {
  const caseStudiesRef = collection(db, 'brands', input.brandId, 'case_studies');
  const now = Timestamp.now();

  const data = {
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(caseStudiesRef, data);
  return docRef.id;
}

/**
 * Get all case studies for a brand, ordered by creation date
 */
export async function getBrandCaseStudies(
  brandId: string,
  maxResults = 20
): Promise<CaseStudy[]> {
  const caseStudiesRef = collection(db, 'brands', brandId, 'case_studies');
  const q = query(caseStudiesRef, orderBy('createdAt', 'desc'), limit(maxResults));
  const snap = await getDocs(q);

  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CaseStudy));
}

/**
 * Get a single case study by ID
 */
export async function getCaseStudy(brandId: string, caseStudyId: string): Promise<CaseStudy | null> {
  const docRef = doc(db, 'brands', brandId, 'case_studies', caseStudyId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as CaseStudy;
}

/**
 * Delete a case study
 */
export async function deleteCaseStudy(brandId: string, caseStudyId: string): Promise<void> {
  const docRef = doc(db, 'brands', brandId, 'case_studies', caseStudyId);
  await deleteDoc(docRef);
}

/**
 * Format case studies for prompt injection (brain context)
 */
export function formatCaseStudiesForPrompt(caseStudies: CaseStudy[]): string {
  if (caseStudies.length === 0) return '';

  const sections = caseStudies.slice(0, 3).map(cs => {
    const insights = cs.insights
      .filter(i => i.category === 'emulate' || i.category === 'strength')
      .slice(0, 3)
      .map(i => `  - [${i.category.toUpperCase()}] ${i.text}`)
      .join('\n');

    const actions = cs.actionableItems.slice(0, 2).map(a => `  - ${a}`).join('\n');

    return `### ${cs.title} (${cs.url})\nScore: ${cs.score ?? 'N/A'}\nInsights:\n${insights}\nAções:\n${actions}`;
  });

  return `## ESTUDOS DE CASO COMPETITIVOS (Intelligence)\n\nEstes são análises de concorrentes e páginas de referência salvos pela marca. Use-os como contexto estratégico.\n\n${sections.join('\n\n')}`;
}
