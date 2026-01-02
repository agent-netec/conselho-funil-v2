/**
 * Utilitários para divisão de texto em chunks (pedaços menores) para RAG.
 */

/**
 * Divide um texto em chunks de tamanho fixo com sobreposição (overlap).
 * 
 * @param text - O texto a ser dividido.
 * @param size - O tamanho desejado de cada chunk em caracteres.
 * @param overlap - A quantidade de caracteres que devem se sobrepor entre chunks vizinhos.
 * @returns Um array de strings representando os chunks.
 * 
 * @example
 * ```ts
 * const chunks = createChunks("Texto longo aqui...", 1000, 200);
 * ```
 */
export function createChunks(
  text: string, 
  size: number = 1500, 
  overlap: number = 200
): string[] {
  if (!text) return [];
  if (size <= overlap) {
    throw new Error('O tamanho do chunk (size) deve ser maior que a sobreposição (overlap).');
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    // Calcula o fim do chunk
    let end = start + size;
    
    // Se não for o último chunk, tenta encontrar um final melhor (quebra de linha ou espaço)
    if (end < text.length) {
      // Procura o último espaço ou quebra de linha dentro dos últimos 20% do chunk
      const searchRange = Math.floor(size * 0.2);
      const lookback = text.lastIndexOf(' ', end);
      const lookbackNewline = text.lastIndexOf('\n', end);
      
      const bestEnd = Math.max(lookback, lookbackNewline);
      
      // Se encontrar um ponto de quebra razoável (não muito longe do ideal), usa ele
      if (bestEnd > end - searchRange) {
        end = bestEnd;
      }
    } else {
      end = text.length;
    }

    const chunk = text.slice(start, end).trim();
    if (chunk) {
      chunks.push(chunk);
    }

    // Move o ponteiro para o próximo chunk considerando o overlap
    start = end - overlap;
    
    // Proteção contra loop infinito se por algum motivo o ponteiro não avançar
    if (start >= text.length || end >= text.length) break;
    if (start < 0) start = 0;
  }

  return chunks;
}

