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
import { db } from '@/lib/firebase/config';
import type { AnomalyAlert } from '@/types/reporting';

/**
 * @fileoverview Operações de Firestore para Alertas de Anomalia (ST-24.2)
 * @module lib/firebase/reporting
 */

/**
 * Salva um novo alerta de anomalia na coleção /alerts.
 * Estrutura: /agencies/{agencyId}/clients/{clientId}/alerts/{alertId}
 * Ou coleção global /alerts com referências (seguindo o briefing).
 */
export async function saveAnomalyAlert(alert: Omit<AnomalyAlert, 'id' | 'status' | 'timestamp'>): Promise<string> {
  const alertsRef = collection(db, 'alerts');
  
  const docRef = await addDoc(alertsRef, {
    ...alert,
    status: 'new',
    timestamp: Timestamp.now()
  });
  
  return docRef.id;
}

/**
 * Busca alertas recentes de um cliente para evitar duplicidade ou verificar persistência.
 */
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
