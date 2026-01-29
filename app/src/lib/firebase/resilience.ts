import { 
  FirestoreError,
} from 'firebase/firestore';

/**
 * Opções para a estratégia de resiliência.
 */
interface ResilienceOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  factor?: number;
}

const DEFAULT_OPTIONS: Required<ResilienceOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  factor: 2,
};

/**
 * Erros do Firestore que são considerados transientes e seguros para tentar novamente.
 * Ref: https://firebase.google.com/docs/firestore/manage-data/error-handling
 */
const RETRYABLE_ERROR_CODES = [
  'aborted',
  'deadline-exceeded',
  'resource-exhausted',
  'unavailable',
  'internal',
];

/**
 * Executa uma operação do Firestore com estratégia de retry e exponential backoff.
 * 
 * @param operation - A função assíncrona que executa a operação do Firestore.
 * @param options - Configurações de retry.
 * @returns O resultado da operação.
 */
export async function withResilience<T>(
  operation: () => Promise<T>,
  options: ResilienceOptions = {}
): Promise<T> {
  const { maxRetries, initialDelay, maxDelay, factor } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Verifica se o erro é transiente
      const isRetryable = error instanceof FirestoreError && RETRYABLE_ERROR_CODES.includes(error.code);
      
      if (!isRetryable || attempt === maxRetries) {
        break;
      }

      console.warn(
        `[Resilience] Falha na operação (tentativa ${attempt + 1}/${maxRetries + 1}). ` +
        `Erro: ${error.code}. Tentando novamente em ${delay}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * factor, maxDelay);
    }
  }

  console.error('[Resilience] Operação falhou permanentemente após retries.', lastError);
  throw lastError;
}

/**
 * Função utilitária para salvar métricas em lote (batching) com consistência eventual.
 * Útil para picos de carga onde não queremos sobrecarregar o Firestore com escritas individuais.
 */
export class PersistenceQueue {
  private queue: Array<{ id: string; data: any; collection: string }> = [];
  private timer: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 2000; // 2 segundos de acumulação

  constructor(private saveFn: (batch: any[]) => Promise<void>) {}

  add(id: string, collection: string, data: any) {
    this.queue.push({ id, collection, data });
    
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.BATCH_DELAY);
    }
  }

  private async flush() {
    if (this.queue.length === 0) return;

    const currentBatch = [...this.queue];
    this.queue = [];
    this.timer = null;

    try {
      await withResilience(() => this.saveFn(currentBatch));
    } catch (error) {
      console.error('[PersistenceQueue] Erro ao processar lote de persistência:', error);
      // Opcional: Re-adicionar à fila ou salvar em localStorage para retry posterior
    }
  }
}
