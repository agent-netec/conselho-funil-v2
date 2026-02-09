import { Timestamp } from 'firebase/firestore';
import CryptoJS from 'crypto-js';
import { 
  getLead, 
  upsertLead, 
  createJourneyEvent 
} from '../../firebase/journey';
import { generateCohortId } from '../ltv/cohort-engine';
import type { 
  JourneyEvent, 
  JourneyEventType, 
  JourneyEventSource,
  JourneyLead
} from '../../../types/journey';

/**
 * @fileoverview Event Bridge para ingestão e processamento de eventos de jornada.
 * @module lib/intelligence/journey/bridge
 */

export interface IngestEventInput {
  brandId: string;
  email: string;
  type: JourneyEventType;
  source: JourneyEventSource;
  payload?: Record<string, any>;
  session?: {
    sessionId: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    ipAddress?: string;
  };
}

/**
 * Gera um LeadID determinístico a partir do email.
 */
export function generateLeadId(email: string): string {
  return CryptoJS.SHA256(email.toLowerCase().trim()).toString();
}

/**
 * Processa a ingestão de um evento, gerenciando a criação do lead e atribuição.
 */
export async function ingestJourneyEvent(input: IngestEventInput) {
  const { brandId, email, type, source, payload, session } = input;
  const leadId = generateLeadId(email);
  const now = Timestamp.now();

  // 1. Buscar lead existente
  let lead = await getLead(leadId);
  const isNewLead = !lead;
  if (lead?.brandId && lead.brandId !== brandId) {
    throw new Error('Lead pertence a outra brand.');
  }

  // 2. Preparar dados de atribuição
  const utmSource = session?.utmSource || 'direct';
  const utmMedium = session?.utmMedium || 'none';
  const utmCampaign = session?.utmCampaign || 'none';

  if (isNewLead) {
    // Criar novo lead com First Source e Cohort
    const cohort = generateCohortId(now);
    const newLead: Omit<JourneyLead, 'id'> = {
      brandId,
      pii: {
        email: email.toLowerCase().trim(),
      },
      attribution: {
        firstSource: utmSource,
        firstMedium: utmMedium,
        firstCampaign: utmCampaign,
        lastSource: utmSource,
        lastMedium: utmMedium,
        lastCampaign: utmCampaign,
      },
      metrics: {
        totalLtv: 0,
        transactionCount: 0,
        averageTicket: 0,
        cohort,
      },
      status: 'lead',
      createdAt: now,
      updatedAt: now,
    };
    await upsertLead(leadId, newLead as JourneyLead);
  } else {
    // Atualizar Last Source se houver novos UTMs
    if (session?.utmSource) {
      await upsertLead(leadId, {
        attribution: {
          ...lead!.attribution,
          lastSource: utmSource,
          lastMedium: utmMedium,
          lastCampaign: utmCampaign,
        }
      });
    }
  }

  // 3. Registrar o evento
  const journeyEvent: Omit<JourneyEvent, 'id'> = {
    leadId,
    brandId,
    type,
    source,
    payload: payload || {},
    session: {
      sessionId: session?.sessionId || 'unknown',
      utmSource,
      utmMedium,
      utmCampaign,
      ipAddress: session?.ipAddress,
    },
    timestamp: now,
  };

  const eventId = await createJourneyEvent(journeyEvent);

  return {
    leadId,
    eventId,
    isNewLead
  };
}
