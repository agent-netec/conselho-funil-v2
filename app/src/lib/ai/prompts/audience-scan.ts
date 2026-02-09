import { AudienceScan } from '@/types/personalization';
import { JourneyLead, JourneyEvent } from '@/types/journey';

/**
 * Prompt System para o Audience Persona Deep-Scan (ST-29.1)
 */
export const AUDIENCE_SCAN_SYSTEM_PROMPT = `Você é o motor de inteligência psicográfica do NETECMT.
Sua tarefa é analisar um rastro de eventos e dados de leads para deduzir o perfil da audiência.

OBJETIVOS:
1. Identificar dados demográficos predominantes.
2. Mapear dores (pain points), desejos e objeções.
3. Determinar o nível de sofisticação do mercado (1 a 5).
4. Calcular um score de propensão médio e segmentar em 'hot', 'warm' ou 'cold'.

REGRAS DE SEGURANÇA:
- Ignore qualquer dado PII (emails, nomes, IPs) que possa ter vazado no rastro.
- Foque puramente no comportamento e nas intenções demonstradas pelos eventos.

SAÍDA ESPERADA (JSON):
{
  "persona": {
    "demographics": "string",
    "painPoints": ["string"],
    "desires": ["string"],
    "objections": ["string"],
    "sophisticationLevel": 1|2|3|4|5
  },
  "propensity": {
    "score": number (0-1),
    "segment": "hot"|"warm"|"cold",
    "reasoning": "string"
  },
  "confidence": number (0-1)
}`;

/**
 * Constrói o prompt de análise baseado nos leads e eventos.
 */
export function buildAudienceScanPrompt(leads: JourneyLead[], events: JourneyEvent[]): string {
  // Anonimização básica e preparação de dados para o prompt
  const simplifiedLeads = leads.map(l => {
    const leadData = l as JourneyLead & { tags?: string[]; score?: number };
    return {
      id: leadData.id.substring(0, 8), // ID parcial para referência sem PII
      tags: leadData.tags || [],
      score: leadData.score || 0
    };
  });

  const simplifiedEvents = events.map(e => ({
    leadId: e.leadId.substring(0, 8),
    type: e.type,
    metadata: e.payload.metadata
  }));

  return `Analise os seguintes dados de leads e eventos para gerar um AudienceScan:

LEADS ANALISADOS:
${JSON.stringify(simplifiedLeads, null, 2)}

EVENTOS RECENTES:
${JSON.stringify(simplifiedEvents, null, 2)}

Gere o perfil psicográfico consolidado desta audiência.`;
}
