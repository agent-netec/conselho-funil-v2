import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { Brand, BrandKit } from '@/types/database';

// ============================================
// BRANDS - Sistema Multi-Marcas
// ============================================

/**
 * Cria uma nova marca no sistema.
 * 
 * @param data - Dados da marca (nome, vertical, posicionamento, audiência, oferta).
 * @returns O ID da marca criada.
 */
export async function createBrand(
  data: Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = Timestamp.now();
  const brandRef = await addDoc(collection(db, 'brands'), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  
  return brandRef.id;
}

/**
 * Busca uma marca específica pelo ID.
 * 
 * @param brandId - O ID da marca.
 * @returns O objeto Brand ou null se não encontrado.
 */
export async function getBrand(brandId: string): Promise<Brand | null> {
  const brandRef = doc(db, 'brands', brandId);
  const brandSnap = await getDoc(brandRef);
  
  if (!brandSnap.exists()) return null;
  
  return { id: brandSnap.id, ...brandSnap.data() } as Brand;
}

/**
 * Recupera todas as marcas pertencentes a um usuário.
 * 
 * @param userId - O ID do usuário.
 * @returns Array de marcas ordenadas pela última atualização (mais recente primeiro).
 */
export async function getUserBrands(userId: string): Promise<Brand[]> {
  // ST-11.6: Simplified query to avoid composite index (INC-004)
  const q = query(
    collection(db, 'brands'),
    where('userId', '==', userId)
  );
  
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Brand));
  
  // Sort in memory
  return data.sort((a, b) => {
    const dateA = a.updatedAt?.seconds || 0;
    const dateB = b.updatedAt?.seconds || 0;
    return dateB - dateA;
  });
}

/**
 * Atualiza os dados de uma marca existente.
 * 
 * @param brandId - O ID da marca.
 * @param data - Objeto parcial com os dados a serem atualizados.
 */
export async function updateBrand(brandId: string, data: Partial<Omit<Brand, 'id' | 'userId' | 'createdAt'>>) {
  const brandRef = doc(db, 'brands', brandId);
  await updateDoc(brandRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Atualiza especificamente o BrandKit de uma marca.
 * US-18.1 & US-18.2
 * 
 * @param brandId - O ID da marca.
 * @param kit - O objeto BrandKit completo.
 */
export async function updateBrandKit(brandId: string, kit: BrandKit) {
  const brandRef = doc(db, 'brands', brandId);
  await updateDoc(brandRef, {
    brandKit: kit,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Exclui uma marca permanentemente.
 * 
 * ⚠️ ATENÇÃO: Esta operação não remove automaticamente os vínculos em funis, 
 * conversas e propostas de copy. Certifique-se de lidar com essas dependências 
 * antes de excluir uma marca.
 * 
 * @param brandId - O ID da marca.
 */
export async function deleteBrand(brandId: string) {
  const brandRef = doc(db, 'brands', brandId);
  await deleteDoc(brandRef);
}




