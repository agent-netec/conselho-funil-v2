import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { db } from './config';
import { CreativePerformance } from '@/types/creative';

/**
 * @fileoverview Creative Intelligence Firebase Operations
 * @module lib/firebase/creative-intelligence
 * @story ST-26.3
 */

/**
 * Busca o ranking de performance de criativos para uma marca.
 * Collection: brands/{brandId}/creative_performance
 */
export async function getCreativePerformanceRanking(brandId: string): Promise<CreativePerformance[]> {
  const perfRef = collection(db, 'brands', brandId, 'creative_performance');
  const q = query(perfRef, orderBy('profitScore', 'desc'));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as CreativePerformance));
}
