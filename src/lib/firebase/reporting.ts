import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './config';
import type { AnomalyAlert } from '@/types/reporting';

export async function saveAnomalyAlert(alert: Omit<AnomalyAlert, 'id' | 'status' | 'timestamp'>): Promise<string> {
  const alertsRef = collection(db, 'alerts');
  const docRef = await addDoc(alertsRef, {
    ...alert,
    status: 'new',
    timestamp: Timestamp.now()
  });
  return docRef.id;
}

export async function getRecentAlerts(clientId: string, limitCount: number = 10): Promise<AnomalyAlert[]> {
  const alertsRef = collection(db, 'alerts');
  const q = query(
    alertsRef,
    where('clientId', '==', clientId),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnomalyAlert));
}
