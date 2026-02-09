/**
 * PersonalizationResolver — Matching Engine
 * Resolve quais contentVariations aplicar para um lead específico.
 *
 * Lógica:
 * 1. Buscar LeadState → obter segment
 * 2. Buscar DynamicContentRules ativas
 * 3. Buscar scans por ID direto (NÃO getAudienceScans — DT-06, PA-05)
 * 4. Match: rule.targetPersonaId aponta para scan do MESMO segment do lead
 * 5. Retornar contentVariations matched
 *
 * LIMITAÇÃO CONHECIDA (DT-10): O segment reflete o ÚLTIMO estado persistido.
 * Se o lead acabou de interagir, pode haver delay sub-segundo até o segment
 * ser atualizado pelo PropensityEngine (fire-and-forget persist).
 *
 * @module lib/intelligence/personalization/resolver
 * @story S31-RT-02
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getPersonalizationRules } from '@/lib/firebase/personalization';
import type { DynamicContentRule } from '@/types/personalization';

export interface ResolveResult {
  segment: string;
  variations: DynamicContentRule['contentVariations'][];
  fallback: boolean;
}

export class PersonalizationResolver {
  /**
   * Resolve quais contentVariations aplicar para um lead específico.
   *
   * @param brandId - ID da marca (multi-tenant)
   * @param leadId - ID do lead a resolver
   * @returns ResolveResult com segment, variations matched e flag fallback
   */
  static async resolve(brandId: string, leadId: string): Promise<ResolveResult> {
    // 1. Buscar estado do lead
    const leadRef = doc(db, 'brands', brandId, 'leads', leadId);
    const leadSnap = await getDoc(leadRef);

    if (!leadSnap.exists()) {
      return { segment: 'unknown', variations: [], fallback: true };
    }

    const lead = leadSnap.data();
    const leadSegment = (lead.segment as string) || 'cold';

    // 2. Buscar rules ativas
    const allRules = await getPersonalizationRules(brandId);
    const activeRules = allRules.filter(r => r.isActive);

    if (activeRules.length === 0) {
      return { segment: leadSegment, variations: [], fallback: true };
    }

    // 3. Buscar APENAS os scans referenciados pelas rules (DT-06, PA-05)
    //    NÃO usar getAudienceScans() — tem limit(10) que causa false negatives
    const targetScanIds = [...new Set(activeRules.map(r => r.targetPersonaId))];
    const scanSnaps = await Promise.all(
      targetScanIds.map(id =>
        getDoc(doc(db, 'brands', brandId, 'audience_scans', id))
      )
    );

    // 4. Build map: scanId → segment
    const scanSegmentMap = new Map<string, string>();
    for (const snap of scanSnaps) {
      if (snap.exists()) {
        const data = snap.data();
        const segment = data?.propensity?.segment as string;
        if (segment) {
          scanSegmentMap.set(snap.id, segment);
        }
      }
    }

    // 5. Match rules cujo targetPersonaId aponta para scan do MESMO segment do lead
    const matched = activeRules.filter(rule => {
      const scanSegment = scanSegmentMap.get(rule.targetPersonaId);
      return scanSegment === leadSegment;
    });

    return {
      segment: leadSegment,
      variations: matched.map(r => r.contentVariations),
      fallback: matched.length === 0,
    };
  }
}
