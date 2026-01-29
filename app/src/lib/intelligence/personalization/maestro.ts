import { db } from '../../firebase/config';
import { doc, getDoc, setDoc, updateDoc, Timestamp, collection, addDoc } from 'firebase/firestore';
import { LeadState } from '@/types/personalization'; // Assumindo que criaremos este tipo

/**
 * @fileoverview Personalization Engine "Maestro" (ST-20.1)
 * Orquestra o estado de consciência dos leads e personalização dinâmica.
 */

export type AwarenessLevel = 'UNAWARE' | 'PROBLEM_AWARE' | 'SOLUTION_AWARE' | 'PRODUCT_AWARE' | 'MOST_AWARE';

export interface LeadContext {
  id: string;
  brandId: string;
  currentAwareness: AwarenessLevel;
  lastInteraction: {
    type: 'ad_click' | 'dm_received' | 'comment_made' | 'page_view';
    platform: 'meta' | 'instagram' | 'web';
    timestamp: Timestamp;
    contentId?: string;
  };
  tags: string[];
  score: number;
  metadata: Record<string, any>;
  updatedAt: Timestamp;
}

export class PersonalizationMaestro {
  
  /**
   * Recupera o contexto atual de um lead.
   */
  static async getLeadContext(brandId: string, leadId: string): Promise<LeadContext | null> {
    const leadRef = doc(db, `brands/${brandId}/leads`, leadId);
    const snap = await getDoc(leadRef);
    
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as LeadContext;
  }

  /**
   * Atualiza o nível de consciência de um lead baseado em uma nova interação.
   */
  static async processInteraction(brandId: string, leadId: string, interaction: LeadContext['lastInteraction']): Promise<void> {
    const leadRef = doc(db, `brands/${brandId}/leads`, leadId);
    const context = await this.getLeadContext(brandId, leadId);

    if (!context) {
      // Criar novo lead se não existir
      const newContext: Omit<LeadContext, 'id'> = {
        brandId,
        currentAwareness: 'UNAWARE',
        lastInteraction: interaction,
        tags: [],
        score: 10,
        metadata: {},
        updatedAt: Timestamp.now()
      };
      await setDoc(leadRef, newContext);
      return;
    }

    // Lógica de progressão de consciência (Simplificada para MVP)
    let nextAwareness = context.currentAwareness;
    const currentScore = context.score;
    let scoreGain = 5;

    if (interaction.type === 'ad_click') scoreGain = 10;
    if (interaction.type === 'dm_received') scoreGain = 15;

    const newScore = currentScore + scoreGain;

    // Regras de transição baseadas em score (Exemplo)
    if (newScore > 80) nextAwareness = 'MOST_AWARE';
    else if (newScore > 60) nextAwareness = 'PRODUCT_AWARE';
    else if (newScore > 40) nextAwareness = 'SOLUTION_AWARE';
    else if (newScore > 20) nextAwareness = 'PROBLEM_AWARE';

    await updateDoc(leadRef, {
      currentAwareness: nextAwareness,
      lastInteraction: interaction,
      score: newScore,
      updatedAt: Timestamp.now()
    });

    // Registrar evento na timeline do lead
    const eventsRef = collection(db, `brands/${brandId}/leads/${leadId}/events`);
    await addDoc(eventsRef, {
      ...interaction,
      awarenessAtTime: nextAwareness,
      timestamp: Timestamp.now()
    });
  }
}
