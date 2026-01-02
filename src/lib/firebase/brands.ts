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
import type { Brand } from '@/types/database';

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
  const q = query(
    collection(db, 'brands'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Brand));
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

