// Este módulo é apenas para uso no cliente (navegador)
// OCR via Tesseract.js (Free). Evita dependências server-side proibidas.

export interface OcrOptions {
  /**
   * Idiomas no formato do Tesseract (ex: 'por', 'eng', 'por+eng').
   * Observação: pode disparar download de traineddata no primeiro uso.
   */
  lang?: string;
  /**
   * Callback opcional para monitorar progresso (0-1) quando disponível.
   */
  onProgress?: (progress: number) => void;
}

/**
 * Extrai texto de uma imagem usando OCR (Tesseract.js) no client-side.
 *
 * @param file - Arquivo de imagem (PNG/JPG/JPEG/WEBP).
 * @param options - Opções de OCR (idioma e progresso).
 * @returns Texto extraído (string), já trimado.
 */
export async function extractTextFromImage(file: File, options: OcrOptions = {}): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('extractTextFromImage só pode ser usado no navegador.');
  }

  const { lang = 'por+eng', onProgress } = options;

  // Import dinâmico para não pesar o bundle inicial
  const { recognize } = await import('tesseract.js');

  try {
    const result = await recognize(file, lang, {
      logger: (m: any) => {
        if (m?.status === 'recognizing text' && typeof m.progress === 'number') {
          onProgress?.(m.progress);
        }
      },
    });

    const text = result?.data?.text ?? '';
    return String(text).trim();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Falha no OCR: ${message}`);
  }
}


