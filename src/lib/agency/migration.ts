import { db } from '../firebase/config';
import { 
  collection, 
  getDocs, 
  writeBatch, 
  doc, 
  Timestamp,
  query,
  limit
} from 'firebase/firestore';

/**
 * Script de migração para adicionar agencyId e clientId aos dados existentes.
 * Este script é destrutivo e deve ser usado com cautela.
 */
export async function migrateToMultiTenancy(defaultAgencyId: string, defaultClientId: string) {
  const collectionsToMigrate = ['funnels', 'conversations', 'brands', 'campaigns'];
  const batch = writeBatch(db);
  let count = 0;

  for (const colName of collectionsToMigrate) {
    const q = query(collection(db, colName), limit(500));
    const snap = await getDocs(q);
    
    snap.docs.forEach(d => {
      const data = d.data();
      if (!data.agencyId || !data.clientId) {
        batch.update(d.ref, {
          agencyId: defaultAgencyId,
          clientId: defaultClientId,
          updatedAt: Timestamp.now()
        });
        count++;
      }
    });
  }

  if (count > 0) {
    await batch.commit();
    console.log(`[Migration] ${count} documentos atualizados com sucesso.`);
  } else {
    console.log('[Migration] Nenhum documento precisava de atualização.');
  }
  
  return count;
}
