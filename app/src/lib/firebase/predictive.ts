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
import { withResilience } from './resilience';
import type { Prediction, SimulationScenario } from '@/types/predictive';

export async function savePrediction(prediction: Omit<Prediction, 'id'>): Promise<string> {
  const predictionsRef = collection(db, 'predictions');
  const docRef = await addDoc(predictionsRef, {
    ...prediction,
    calculatedAt: prediction.calculatedAt || Timestamp.now()
  });
  return docRef.id;
}

export async function getLatestPrediction(targetId: string, model: Prediction['model']): Promise<Prediction | null> {
  const predictionsRef = collection(db, 'predictions');
  const q = query(
    predictionsRef,
    where('targetId', '==', targetId),
    where('model', '==', model),
    orderBy('calculatedAt', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Prediction;
}
