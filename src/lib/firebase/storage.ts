import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type UploadMetadata,
} from 'firebase/storage';
import app from './config';

const storage = getStorage(app);

/**
 * Faz upload de um arquivo de brand asset para o Firebase Storage.
 * 
 * @param file - O arquivo a ser enviado.
 * @param brandId - O ID da marca à qual o arquivo pertence.
 * @param userId - O ID do usuário que está fazendo o upload.
 * @param onProgress - Callback opcional para tracking do progresso (0-100).
 * @returns Promise com a URL pública do arquivo e metadata.
 * 
 * @example
 * ```ts
 * const result = await uploadBrandAsset(file, 'brand_123', 'user_456', (progress) => {
 *   console.log(`Upload: ${progress}%`);
 * });
 * console.log('URL:', result.url);
 * ```
 */
export async function uploadBrandAsset(
  file: File,
  brandId: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; metadata: UploadMetadata }> {
  // Gera um ID único para o arquivo
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${timestamp}_${sanitizedFileName}`;
  
  // Storage path pattern: brand-assets/{userId}/{brandId}/{uniqueId}_{fileName}
  const storagePath = `brand-assets/${userId}/${brandId}/${fileName}`;
  const storageRef = ref(storage, storagePath);
  
  // Metadata do arquivo
  const metadata: UploadMetadata = {
    contentType: file.type,
    customMetadata: {
      userId,
      brandId,
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    },
  };
  
  // Inicia o upload com tracking de progresso
  const uploadTask = uploadBytesResumable(storageRef, file, metadata);
  
  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Calcula e reporta o progresso
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(Math.round(progress));
      },
      (error) => {
        // Erro durante o upload
        reject(error);
      },
      async () => {
        // Upload completo - obter URL pública
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url: downloadURL,
            metadata: uploadTask.snapshot.metadata as UploadMetadata,
          });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

/**
 * Remove um arquivo do Firebase Storage.
 * 
 * @param storageUrl - URL completa do Firebase Storage (formato: gs:// ou https://).
 * 
 * @example
 * ```ts
 * await deleteBrandAsset('https://firebasestorage.googleapis.com/...');
 * ```
 */
export async function deleteBrandAssetFromStorage(storageUrl: string): Promise<void> {
  const storageRef = ref(storage, storageUrl);
  await deleteObject(storageRef);
}

/**
 * Valida se um arquivo atende aos requisitos de upload.
 * 
 * @param file - O arquivo a ser validado.
 * @returns Objeto com `valid` (boolean) e `error` (string opcional).
 * 
 * @example
 * ```ts
 * const validation = validateBrandAssetFile(file);
 * if (!validation.valid) {
 *   alert(validation.error);
 * }
 * ```
 */
export function validateBrandAssetFile(file: File): { valid: boolean; error?: string } {
  // Tipos permitidos
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'image/png',
    'image/jpeg',
    'image/webp',
  ];
  
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md', '.png', '.jpg', '.jpeg', '.webp'];
  
  // Valida tipo MIME
  if (!allowedTypes.includes(file.type)) {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      return {
        valid: false,
        error: `Formato não suportado. Use: ${allowedExtensions.join(', ')}`,
      };
    }
  }
  
  // Valida tamanho (10MB para documentos, 5MB para imagens)
  const isImage = file.type.startsWith('image/');
  const maxSize = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB ou 10MB
  
  if (file.size > maxSize) {
    const maxSizeMB = isImage ? 5 : 10;
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo: ${maxSizeMB}MB`,
    };
  }
  
  return { valid: true };
}

