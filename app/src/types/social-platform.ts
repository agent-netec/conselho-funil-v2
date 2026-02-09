/**
 * Tipo canônico para plataformas sociais.
 * Source of truth — todos os outros tipos devem re-exportar daqui.
 * Sprint Sigma: SIG-PRE-TYP
 */
export type SocialPlatform = 'instagram' | 'tiktok' | 'linkedin' | 'x' | 'whatsapp';

const PLATFORM_MAP: Record<string, SocialPlatform> = {
  'X': 'x',
  'LinkedIn': 'linkedin',
  'Instagram': 'instagram',
  'TikTok': 'tiktok',
  'WhatsApp': 'whatsapp',
  'x': 'x',
  'linkedin': 'linkedin',
  'instagram': 'instagram',
  'tiktok': 'tiktok',
  'whatsapp': 'whatsapp',
};

/**
 * Normaliza nome de plataforma PascalCase/mixedCase para lowercase canônico.
 * Usado em runtime para compatibilidade com dados existentes no Firestore.
 * NÃO altera dados no Firestore (PA-01).
 */
export function normalizePlatform(raw: string): SocialPlatform {
  return PLATFORM_MAP[raw] || raw.toLowerCase() as SocialPlatform;
}
