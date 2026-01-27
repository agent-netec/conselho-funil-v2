import { Pinecone, type PineconeRecord, type Index, type RecordMetadata } from '@pinecone-database/pinecone';

/**
 * Carrega e valida as variáveis de ambiente necessárias para o Pinecone.
 */
function getPineconeEnv() {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX_NAME;
  const environment = process.env.PINECONE_ENVIRONMENT || process.env.PINECONE_REGION;

  if (!apiKey) {
    throw new Error('PINECONE_API_KEY ausente. Configure o .env.local / Vercel.');
  }

  if (!indexName) {
    throw new Error('PINECONE_INDEX_NAME ausente. Defina o nome do índice (ex: funnel-council-brains).');
  }

  // Para serverless, o host é suficiente. Para regiões clássicas, environment continua válido.
  return { apiKey, indexName, environment };
}

let cachedClient: Pinecone | null = null;
let cachedIndex: Index | null = null;

/**
 * Retorna uma instância singleton do cliente Pinecone.
 */
export function getPineconeClient(): Pinecone {
  if (typeof window !== 'undefined') {
    throw new Error('Pinecone client só pode ser instanciado no servidor.');
  }

  if (cachedClient) return cachedClient;

  const { apiKey } = getPineconeEnv();

  cachedClient = new Pinecone({ apiKey });

  return cachedClient;
}

/**
 * Retorna a referência ao index configurado.
 */
export function getPineconeIndex(): Index {
  if (cachedIndex) return cachedIndex;

  const { indexName } = getPineconeEnv();
  const client = getPineconeClient();

  cachedIndex = client.index(indexName);

  return cachedIndex;
}

/**
 * Health-check básico do Pinecone.
 * - Verifica acesso ao índice
 * - Retorna estatísticas relevantes para monitoramento
 */
export async function checkPineconeHealth() {
  const { indexName } = getPineconeEnv();
  const index = getPineconeIndex();

  const stats = await index.describeIndexStats();
  const description = await getPineconeClient().describeIndex(indexName);

  const totalVectors = stats.totalRecordCount ?? 0;
  const dimension = stats.dimension ?? 0;
  const namespaces = Object.keys(stats.namespaces || {});

  // Guardrail: dimension esperado pelo text-embedding-004 é 768
  if (dimension && dimension !== 768) {
    console.warn(`[Pinecone] Dimensão do índice (${dimension}) difere do esperado (768).`);
  }

  return {
    ok: true,
    indexName,
    host: description.host,
    dimension,
    totalVectors,
    namespaces,
  };
}

/**
 * Prepara vetor para upsert no Pinecone seguindo o contrato de ingestão.
 */
export function buildPineconeRecord(
  id: string,
  values: number[],
  metadata: RecordMetadata = {}
): PineconeRecord {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('Embedding vazio ou inválido fornecido ao Pinecone.');
  }

  return {
    id,
    values,
    metadata,
  };
}
