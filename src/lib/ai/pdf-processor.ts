import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker do PDF.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

/**
 * Extrai texto de um arquivo PDF a partir de uma URL.
 * 
 * @param url - URL pública do Firebase Storage ou qualquer URL acessível.
 * @returns Promise com o texto extraído do PDF.
 * 
 * @example
 * ```ts
 * const text = await extractTextFromPDF('https://firebasestorage.googleapis.com/.../document.pdf');
 * console.log('Texto extraído:', text);
 * ```
 */
export async function extractTextFromPDF(url: string): Promise<string> {
  try {
    // Carregar o documento PDF
    const loadingTask = pdfjsLib.getDocument(url);
    const pdf = await loadingTask.promise;
    
    const textParts: string[] = [];
    
    // Iterar por todas as páginas
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Extrair texto de cada item
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      textParts.push(pageText);
    }
    
    // Juntar todo o texto com quebras de página
    return textParts.join('\n\n').trim();
  } catch (error) {
    console.error('Erro ao extrair texto do PDF:', error);
    throw new Error(`Falha na extração de texto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Valida se um MIME type é um PDF.
 * 
 * @param mimeType - O MIME type a ser validado.
 * @returns true se for PDF, false caso contrário.
 */
export function isPDF(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}

