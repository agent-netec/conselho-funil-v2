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
