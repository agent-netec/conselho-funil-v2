import { db } from '../firebase/config';
import { doc, getDoc, updateDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import type { Brand, LogoAsset } from '../../types/database';

/**
 * Sanitiza conteúdo SVG para evitar XSS e remover scripts maliciosos.
 * Como não temos dompurify instalado, usamos uma abordagem baseada em Regex
 * para remover tags <script>, onAttributes e outros elementos perigosos.
 */
export function sanitizeSvg(svg: string): string {
  if (!svg) return '';

  return svg
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove <script> tags
    .replace(/on\w+="[^"]*"/gi, '') // Remove onEvent attributes (onclick, onload, etc.)
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:[^"']*/gi, '') // Remove javascript: URIs
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove <iframe>
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove <object>
    .trim();
}

/**
 * Registra um log de auditoria para alterações de marca.
 */
export async function logAudit(brandId: string, action: string, details: any, userId: string) {
  try {
    const auditRef = collection(db, 'brands', brandId, 'audit_logs');
    await addDoc(auditRef, {
      action,
      details,
      userId,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
}

/**
 * Atualiza um logo específico no BrandKit, respeitando a trava de segurança.
 */
export async function updateLogoLock(
  brandId: string,
  variant: 'primary' | 'horizontal' | 'icon',
  asset: LogoAsset,
  userId: string
) {
  const brandRef = doc(db, 'brands', brandId);
  const brandSnap = await getDoc(brandRef);

  if (!brandSnap.exists()) {
    throw new Error('Marca não encontrada');
  }

  const brandData = brandSnap.data() as Brand;
  
  // Governança: Se estiver travado, bloqueia atualização
  if (brandData.brandKit?.logoLock?.locked) {
    throw new Error('Logo Lock ativo: Desbloqueie o BrandKit para alterar os logos oficiais.');
  }

  // Sanitização se for SVG
  if (asset.format === 'svg' && asset.svgRaw) {
    asset.svgRaw = sanitizeSvg(asset.svgRaw);
  }

  const updatedLogoLock = {
    ...brandData.brandKit?.logoLock,
    variants: {
      ...brandData.brandKit?.logoLock?.variants,
      [variant]: asset,
    },
    updatedAt: Timestamp.now(),
  };

  await updateDoc(brandRef, {
    'brandKit.logoLock': updatedLogoLock,
    updatedAt: Timestamp.now(),
  });

  await logAudit(brandId, `UPDATE_LOGO_${variant.toUpperCase()}`, { asset }, userId);
}

/**
 * Ativa ou desativa a trava global de governança de logos.
 */
export async function toggleLogoLock(
  brandId: string,
  locked: boolean,
  userId: string
) {
  const brandRef = doc(db, 'brands', brandId);
  
  await updateDoc(brandRef, {
    'brandKit.logoLock.locked': locked,
    'brandKit.logoLock.updatedAt': Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  await logAudit(brandId, locked ? 'LOCK_LOGOS' : 'UNLOCK_LOGOS', { locked }, userId);
}
