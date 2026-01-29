import { storage } from './config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * @fileoverview Utilitários de Storage para execução no Servidor (Node.js)
 */

/**
 * Faz upload de um buffer (ex: screenshot) para o Firebase Storage
 */
export async function uploadBufferToStorage(
  buffer: Buffer,
  path: string,
  contentType: string = 'image/png'
): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage não inicializado. Verifique as variáveis de ambiente.');
  }

  const storageRef = ref(storage, path);
  
  try {
    const snapshot = await uploadBytes(storageRef, buffer, {
      contentType,
    });
    
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error(`[uploadBufferToStorage] Erro ao enviar arquivo para ${path}:`, error);
    throw error;
  }
}
