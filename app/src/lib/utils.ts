import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina classes CSS usando clsx e tailwind-merge.
 * 
 * Esta função utilitária permite mesclar classes do Tailwind de forma inteligente,
 * resolvendo conflitos onde a última classe definida prevalece.
 * 
 * @param inputs - Lista de classes CSS, objetos ou arrays de classes.
 * @returns Uma string contendo as classes combinadas e formatadas.
 * 
 * @example
 * ```tsx
 * <div className={cn("px-4 py-2", isPrimary && "bg-blue-500", className)}>
 *   Conteúdo
 * </div>
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata um valor numérico para moeda (BRL).
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Formata uma data para o padrão brasileiro.
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('pt-BR').format(d)
}

/**
 * Trunca um texto para um tamanho máximo.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * Formata o tamanho de um arquivo em bytes para uma unidade legível.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Converte um arquivo para Base64.
 * Utilizado para enviar arquivos multimodal para o Gemini.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result?.toString().split(',')[1];
      if (base64String) resolve(base64String);
      else reject(new Error('Falha ao converter arquivo'));
    };
    reader.onerror = (error) => reject(error);
  });
}
