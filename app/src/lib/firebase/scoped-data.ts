/**
 * @fileoverview Helpers para CRUD de dados com escopo no Firestore
 * @module lib/firebase/scoped-data
 * @version 1.0.0
 */

import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp, 
  setDoc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from './config';
import { 
  DataScope, 
  ScopedData, 
  validateScope, 
  scopeToNamespace, 
  getAccessibleNamespaces 
} from '@/types/scoped-data';
import { upsertToPinecone } from '../ai/pinecone';

/**
 * Cria um dado com escopo no Firestore e opcionalmente no Pinecone
 */
export async function createScopedData<T extends ScopedData & { id?: string }>(
  collectionName: string,
  brandId: string,
  data: Omit<T, 'id'>,
  options: { syncToPinecone?: boolean; dataType?: string } = {}
): Promise<string> {
  // 1. Validar scope
  const validation = validateScope(data.scope);
  if (!validation.valid) {
    throw new Error(`Invalid scope: \${validation.errors.join(', ')}`);
  }

  // 2. Salvar no Firestore (path: brands/{brandId}/{collectionName})
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, 'brands', brandId, collectionName), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });

  const docId = docRef.id;

  // 3. Sincronizar com Pinecone se solicitado e aprovado para AI
  if (options.syncToPinecone && (data as any).isApprovedForAI) {
    const namespace = scopeToNamespace(data.scope);
    const content = (data as any).content || (data as any).text || '';
    
    await upsertToPinecone([
      {
        id: docId,
        values: [], // O chamador deve fornecer o embedding ou o sistema deve gerar
        metadata: {
          scopeLevel: data.scope.level,
          brandId: data.scope.brandId ?? '',
          funnelId: data.scope.funnelId ?? '',
          campaignId: data.scope.campaignId ?? '',
          inheritToChildren: data.inheritToChildren,
          dataType: options.dataType || collectionName,
          content: content,
          isApprovedForAI: true,
          firestoreId: docId,
          createdAt: now.toMillis(),
        }
      }
    ], { namespace });

    // Atualizar doc com o pineconeId
    await updateDoc(docRef, { pineconeId: docId });
  }

  return docId;
}

/**
 * Busca dados com escopo respeitando a hierarquia
 */
export async function queryScopedData<T extends ScopedData>(
  collectionName: string,
  brandId: string,
  funnelId?: string,
  campaignId?: string,
  filters: any[] = []
): Promise<T[]> {
  const namespaces = getAccessibleNamespaces(brandId, funnelId, campaignId);
  const results: T[] = [];

  // No Firestore, como os dados estão na mesma subcoleção da marca, 
  // filtramos pelo scope.level e IDs específicos
  const baseQuery = collection(db, 'brands', brandId, collectionName);
  
  // 1. Buscar dados do nível mais específico
  // 2. Buscar dados de níveis superiores com inheritToChildren = true
  
  // Implementação simplificada: buscar todos da marca e filtrar em memória 
  // ou fazer múltiplas queries paralelas
  
  const q = query(baseQuery, ...filters);
  const snapshot = await getDocs(q);
  const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));

  // Filtragem hierárquica em memória
  return allDocs.filter(item => {
    const itemScope = item.scope;
    
    // Se for o nível exato solicitado
    if (campaignId && itemScope.level === 'campaign' && itemScope.campaignId === campaignId) return true;
    if (funnelId && itemScope.level === 'funnel' && itemScope.funnelId === funnelId) return true;
    if (itemScope.level === 'brand' && itemScope.brandId === brandId) {
      // Se estamos em um funil/campanha, só incluir se herdar
      return (funnelId || campaignId) ? item.inheritToChildren : true;
    }
    if (itemScope.level === 'universal') return true;

    // Se for nível funnel mas estamos em uma campanha deste funil
    if (campaignId && itemScope.level === 'funnel' && itemScope.funnelId === funnelId) {
      return item.inheritToChildren;
    }

    return false;
  }).sort((a, b) => {
    // Ordenar por prioridade de escopo (mais específico primeiro)
    const priority = { campaign: 4, funnel: 3, brand: 2, universal: 1 };
    return priority[b.scope.level] - priority[a.scope.level];
  });
}
