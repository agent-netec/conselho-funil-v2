import { AudienceScan, DynamicContentRule } from "@/types/personalization";
import { collection, query, where, orderBy, limit, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Hook para buscar scans de audiência da marca
 */
export async function getAudienceScans(brandId: string): Promise<AudienceScan[]> {
  const scansRef = collection(db, `brands/${brandId}/audience_scans`);
  const q = query(scansRef, orderBy("metadata.createdAt", "desc"), limit(10));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AudienceScan));
}

/**
 * Hook para buscar regras de personalização
 */
export async function getPersonalizationRules(brandId: string): Promise<DynamicContentRule[]> {
  const rulesRef = collection(db, `brands/${brandId}/personalization_rules`);
  const snap = await getDocs(rulesRef);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DynamicContentRule));
}

/**
 * Salva uma nova regra de personalização
 */
export async function savePersonalizationRule(brandId: string, rule: Omit<DynamicContentRule, "id" | "updatedAt">) {
  const rulesRef = collection(db, `brands/${brandId}/personalization_rules`);
  return await addDoc(rulesRef, {
    ...rule,
    updatedAt: Timestamp.now()
  });
}
