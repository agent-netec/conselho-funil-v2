import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import type { DesignPreferences, StyleSelection } from '@/types/design-system';

const RECOMPUTE_THRESHOLD = 3;
const AVOID_REJECTION_THRESHOLD = 3;
const TOP_PREFERRED_COUNT = 3;

function getDocRef(brandId: string, userId: string) {
  return doc(db, 'brands', brandId, 'design_preferences', userId);
}

/**
 * Computes preferred styles and avoid patterns from selection history.
 * - preferred: top 3 most-selected styles
 * - avoid: styles rejected 3+ times AND never selected
 */
export function computePreferences(history: StyleSelection[]): { preferred: string[]; avoid: string[] } {
  const selectedCounts = new Map<string, number>();
  const rejectedCounts = new Map<string, number>();

  for (const entry of history) {
    const style = entry.selectedStyle;
    if (style && style !== 'unknown') {
      selectedCounts.set(style, (selectedCounts.get(style) || 0) + 1);
    }

    for (const rejected of entry.rejectedStyles) {
      if (rejected && rejected !== 'unknown') {
        rejectedCounts.set(rejected, (rejectedCounts.get(rejected) || 0) + 1);
      }
    }
  }

  // Top 3 most-selected styles, sorted by frequency descending
  const preferred = [...selectedCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_PREFERRED_COUNT)
    .map(([style]) => style);

  // Styles rejected 3+ times that were never selected
  const avoid = [...rejectedCounts.entries()]
    .filter(([style, count]) => count >= AVOID_REJECTION_THRESHOLD && !selectedCounts.has(style))
    .map(([style]) => style);

  return { preferred, avoid };
}

/**
 * Records a design selection and updates preference learning.
 * After 3+ selections, recomputes preferred/avoid patterns automatically.
 */
export async function recordDesignSelection(
  userId: string,
  brandId: string,
  selection: Omit<StyleSelection, 'createdAt'>
): Promise<void> {
  if (!db) {
    console.warn('[DesignPreferences] Firestore not initialized, skipping.');
    return;
  }

  const ref = getDocRef(brandId, userId);
  const now = Timestamp.now();

  const fullSelection: StyleSelection = {
    ...selection,
    createdAt: now,
  };

  const snapshot = await getDoc(ref);

  if (snapshot.exists()) {
    const existing = snapshot.data() as DesignPreferences;
    const newTotal = (existing.totalSelections || 0) + 1;

    const updatePayload: Record<string, unknown> = {
      styleHistory: arrayUnion(fullSelection),
      totalSelections: newTotal,
      updatedAt: now,
    };

    // Recompute preferences after threshold is met
    if (newTotal >= RECOMPUTE_THRESHOLD) {
      const allHistory = [...(existing.styleHistory || []), fullSelection];
      const { preferred, avoid } = computePreferences(allHistory);
      updatePayload.preferredStyles = preferred;
      updatePayload.avoidPatterns = avoid;

      // Also compute preferred compositions
      const compositionCounts = new Map<string, number>();
      for (const entry of allHistory) {
        if (entry.composition) {
          compositionCounts.set(entry.composition, (compositionCounts.get(entry.composition) || 0) + 1);
        }
      }
      updatePayload.preferredCompositions = [...compositionCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, TOP_PREFERRED_COUNT)
        .map(([comp]) => comp);
    }

    await updateDoc(ref, updatePayload);
  } else {
    // Create new document
    const newDoc: DesignPreferences = {
      userId,
      brandId,
      styleHistory: [fullSelection],
      preferredStyles: [],
      preferredCompositions: [],
      avoidPatterns: [],
      totalSelections: 1,
      updatedAt: now,
    };

    await setDoc(ref, newDoc);
  }
}

/**
 * Fetches design preferences for a user+brand pair.
 * Returns null if no preferences exist yet.
 */
export async function getDesignPreferences(
  userId: string,
  brandId: string
): Promise<DesignPreferences | null> {
  if (!db) {
    console.warn('[DesignPreferences] Firestore not initialized, skipping.');
    return null;
  }

  const ref = getDocRef(brandId, userId);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as DesignPreferences;
}
