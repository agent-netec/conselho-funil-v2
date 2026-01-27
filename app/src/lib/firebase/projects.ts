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
import { FirebaseError } from 'firebase/app';
import { db } from './config';
import type { Project } from '@/types/database';

// ============================================
// PROJECTS - Gestão de Projetos por Marca
// ============================================

/**
 * Cria um novo projeto vinculado a uma marca.
 * US-19.1
 * 
 * @param data - Dados do projeto (brandId, userId, name, description).
 * @returns O ID do projeto criado.
 */
export async function createProject(
  data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<string> {
  const now = Timestamp.now();
  const projectRef = await addDoc(collection(db, 'projects'), {
    ...data,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  });
  
  return projectRef.id;
}

/**
 * Busca um projeto específico pelo ID.
 * 
 * @param projectId - O ID do projeto.
 * @returns O objeto Project ou null se não encontrado.
 */
export async function getProject(projectId: string): Promise<Project | null> {
  const projectRef = doc(db, 'projects', projectId);
  const projectSnap = await getDoc(projectRef);
  
  if (!projectSnap.exists()) return null;
  
  return { id: projectSnap.id, ...projectSnap.data() } as Project;
}

/**
 * Recupera todos os projetos vinculados a uma marca específica.
 * US-19.1
 * 
 * @param brandId - O ID da marca.
 * @returns Array de projetos ordenados pela última atualização (mais recente primeiro).
 */
export async function getBrandProjects(brandId: string): Promise<Project[]> {
  try {
    // Preferência: ordenar por última atualização (requer índice composto brandId + updatedAt)
    const q = query(
      collection(db, 'projects'),
      where('brandId', '==', brandId),
      orderBy('updatedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
  } catch (error) {
    // Fallback quando o índice não existe: retorna sem ordenação e ordena em memória
    if (error instanceof FirebaseError && error.code === 'failed-precondition') {
      console.warn('[getBrandProjects] Índice ausente, usando fallback sem orderBy.', error.message);
      const fallbackQuery = query(
        collection(db, 'projects'),
        where('brandId', '==', brandId)
      );
      const snapshot = await getDocs(fallbackQuery);
      return snapshot
        .docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Project))
        .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
    }
    throw error;
  }
}

/**
 * Atualiza os dados de um projeto existente.
 * 
 * @param projectId - O ID do projeto.
 * @param data - Objeto parcial com os dados a serem atualizados.
 */
export async function updateProject(projectId: string, data: Partial<Omit<Project, 'id' | 'brandId' | 'userId' | 'createdAt'>>) {
  const projectRef = doc(db, 'projects', projectId);
  await updateDoc(projectRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Exclui um projeto permanentemente.
 * 
 * @param projectId - O ID do projeto.
 */
export async function deleteProject(projectId: string) {
  const projectRef = doc(db, 'projects', projectId);
  await deleteDoc(projectRef);
}

