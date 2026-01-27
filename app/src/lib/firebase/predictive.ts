import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { withResilience } from './resilience';
import type { Prediction, SimulationScenario } from '@/types/predictive';

/**
 * @fileoverview Operações de Firestore para o Prediction Engine
 * @module lib/firebase/predictive
 */

// ============================================
// PREDICTIONS
// ============================================

/**
 * Salva uma nova previsão no Firestore.
 */
export async function savePrediction(prediction: Omit<Prediction, 'id'>): Promise<string> {
  const predictionsRef = collection(db, 'predictions');
  
  const docRef = await addDoc(predictionsRef, {
    ...prediction,
    calculatedAt: prediction.calculatedAt || Timestamp.now()
  });
  
  return docRef.id;
}

/**
 * Busca a previsão mais recente para um alvo (lead ou cohort).
 */
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

  const data = snap.docs[0].data();
  return { id: snap.docs[0].id, ...data } as Prediction;
}

// ============================================
// SIMULATIONS
// ============================================

/**
 * Salva um cenário de simulação.
 */
export async function saveSimulationScenario(scenario: Omit<SimulationScenario, 'id'>): Promise<string> {
  const scenariosRef = collection(db, 'simulation_scenarios');
  
  const docRef = await addDoc(scenariosRef, {
    ...scenario,
    createdAt: scenario.createdAt || Timestamp.now()
  });
  
  return docRef.id;
}

/**
 * Lista simulações de um usuário.
 */
export async function getUserSimulations(userId: string): Promise<SimulationScenario[]> {
  const scenariosRef = collection(db, 'simulation_scenarios');
  const q = query(
    scenariosRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SimulationScenario));
}
