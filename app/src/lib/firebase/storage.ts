import {
  getStorage,
  ref,
  uploadBytesResumable,
  uploadString,
  getDownloadURL,
  deleteObject,
  type UploadMetadata,
} from 'firebase/storage';
import app from './config';
import { createVaultAsset } from './vault';

const storage = getStorage(app);

/**
 * Faz upload de um asset para o Vault (Creative Vault).
 * Sincroniza metadados no Firestore após o upload.
 */
export async function uploadVaultAsset(
  file: File,
  brandId: string,
  userId: string,
  tags: string[] = []
): Promise<string> {
  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const storagePath = `brands/${brandId}/vault/assets/${fileName}`;
  const storageRef = ref(storage, storagePath);

  const metadata: UploadMetadata = {
    contentType: file.type,
    customMetadata: {
      userId,
      brandId,
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    },
  };

  const uploadTask = await uploadBytesResumable(storageRef, file, metadata);
  const downloadURL = await getDownloadURL(uploadTask.ref);

  // Determinar o tipo do asset
  let type: 'image' | 'video' | 'logo' | 'document' = 'document';
  if (file.type.startsWith('image/')) type = 'image';
  else if (file.type.startsWith('video/')) type = 'video';

  // Salvar metadados no Firestore (sub-coleção vault/assets)
  await createVaultAsset(brandId, {
    name: file.name,
    type,
    url: downloadURL,
    storagePath,
    status: 'approved', // Assets manuais são aprovados por padrão
    tags,
    metadata: {
      size: file.size,
      contentType: file.type,
      uploadedBy: userId,
    },
  });

  return downloadURL;
}

/**
 * Faz upload de uma imagem em Base64 (Data URL) para o Firebase Storage.
 */
export async function uploadBase64Image(
  dataUrl: string,
  brandId: string,
  userId: string,
  fileName: string
): Promise<string> {
  const storagePath = `brand-assets/${userId}/${brandId}/${Date.now()}_${fileName}`;
  const storageRef = ref(storage, storagePath);
  
  // QA Hardening: Limpeza e conversão Data URL para Blob
  try {
    // Remove qualquer query parameter acidental que possa ter sido anexado à string Base64
    const cleanDataUrl = dataUrl.split('&')[0].split('?')[0];
    const res = await fetch(cleanDataUrl);
    const blob = await res.blob();
    
    await uploadBytesResumable(storageRef, blob, {
      contentType: blob.type,
      customMetadata: {
        userId,
        brandId,
        originalName: fileName,
        uploadedAt: new Date().toISOString(),
      },
    });
    
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Erro ao processar binário da imagem para upload:', error);
    throw new Error('Falha na conversão binária da imagem gerada.');
  }
}

/**
 * Faz upload de uma logo de marca para o Firebase Storage.
 * US-18.2
 */
export async function uploadLogo(
  file: File,
  brandId: string,
  userId: string
): Promise<string> {
  const timestamp = Date.now();
  const fileExtension = file.name.split('.').pop();
  const fileName = `logo_${timestamp}.${fileExtension}`;
  
  // Storage path pattern: brands/{userId}/{brandId}/logos/{fileName}
  const storagePath = `brands/${userId}/${brandId}/logos/${fileName}`;
  const storageRef = ref(storage, storagePath);
  
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
  });
  
  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      null,
      (error) => reject(error),
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

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
    'application/x-pdf',
    'application/vnd.pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/svg+xml',
  ];
  
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md', '.png', '.jpg', '.jpeg', '.webp', '.svg'];
  
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
  
  // Valida tamanho (10MB para documentos, 10MB para imagens) - US-13.8
  const isImage = file.type.startsWith('image/');
  const maxSize = isImage ? 10 * 1024 * 1024 : 10 * 1024 * 1024; // 10MB
  
  if (file.size > maxSize) {
    const maxSizeMB = 10;
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo: ${maxSizeMB}MB`,
    };
  }

  // Valida integridade básica (arquivos com 0 bytes ou sem nome)
  if (file.size === 0) {
    return {
      valid: false,
      error: 'O arquivo parece estar vazio ou corrompido.',
    };
  }
  
  return { valid: true };
}

