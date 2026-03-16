/**
 * Logo Fetcher
 *
 * Busca a logo da brand e converte para base64
 * para embedding direto no HTML do briefing.
 */

export async function fetchLogoAsBase64(logoUrl: string | undefined | null): Promise<string | null> {
  if (!logoUrl) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(logoUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    // Detect mime type from URL or default to png
    let mimeType = 'image/png';
    if (logoUrl.includes('.jpg') || logoUrl.includes('.jpeg')) mimeType = 'image/jpeg';
    else if (logoUrl.includes('.svg')) mimeType = 'image/svg+xml';
    else if (logoUrl.includes('.webp')) mimeType = 'image/webp';

    return `data:${mimeType};base64,${base64}`;
  } catch {
    console.warn('[BriefingLogoFetcher] Failed to fetch logo, continuing without it');
    return null;
  }
}
