import { Pinecone, type PineconeRecord, type Index } from '@pinecone-database/pinecone';

const EXPECTED_DIMENSION = 768; // text-embedding-004

/**
 * Pinecone SDK v6 não aceita mais a propriedade `environment`.
 * Preferimos `PINECONE_HOST` (serverless) ou deixamos o SDK resolver pelo nome do índice.
 */
function getEnv() {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName =
    process.env.PINECONE_INDEX ||
    process.env.PINECONE_INDEX_NAME ||
    'cf-dev-assets';
  const host =
    process.env.PINECONE_HOST ||
    process.env.PINECONE_HOST_URL ||
    process.env.PINECONE_CONTROLLER_HOST_URL;

  if (!apiKey) {
    throw new Error('PINECONE_API_KEY ausente. Configure .env.local / Vercel.');
  }
  if (!indexName) {
    throw new Error('PINECONE_INDEX ausente. Defina o nome do índice (ex: funnel-council-brains).');
  }

  // Ignora variáveis legadas para evitar PineconeArgumentError
  if (process.env.PINECONE_ENVIRONMENT || process.env.PINECONE_REGION) {
    console.warn('[Pinecone] Ignorando PINECONE_ENVIRONMENT/PINECONE_REGION (SDK v6 não usa environment).');
  }

  return { apiKey, indexName, host };
}

let cachedClient: Pinecone | null = null;
let cachedIndex: Index | null = null;

/**
 * Retorna instância singleton do cliente Pinecone.
 */
export function getPineconeClient(): Pinecone {
  if (typeof window !== 'undefined') {
    throw new Error('Pinecone client só pode ser instanciado no servidor.');
  }
  if (cachedClient) return cachedClient;

  const { apiKey } = getEnv();
  // SDK v6: apenas apiKey; host é usado na chamada index() se fornecido.
  cachedClient = new Pinecone({ apiKey });
  return cachedClient;
}

/**
 * Retorna referência ao índice alvo.
 */
export function getPineconeIndex(): Index {
  if (cachedIndex) return cachedIndex;

  const { indexName, host } = getEnv();
  const client = getPineconeClient();
  cachedIndex = host ? client.index(indexName, host) : client.index(indexName);
  return cachedIndex;
}

/**
 * Upsert de vetores no Pinecone.
 */
export async function upsertToPinecone(
  records: PineconeRecord[],
  options: { namespace?: string } = {}
) {
  if (!records?.length) return { upserted: 0 };

  records.forEach((r) => {
    if (!Array.isArray(r.values) || r.values.length !== EXPECTED_DIMENSION) {
      throw new Error(`Embedding deve ter ${EXPECTED_DIMENSION} dimensões para Pinecone.`);
    }
  });

  const index = getPineconeIndex();
  const target = options.namespace ? index.namespace(options.namespace) : index;
  await target.upsert(records);
  return { upserted: records.length };
}

/**
 * Query semântica no Pinecone.
 */
export async function queryPinecone(params: {
  vector: number[];
  topK?: number;
  namespace?: string;
  filter?: Record<string, unknown>;
}) {
  const { vector, topK = 10, namespace, filter } = params;

  if (!Array.isArray(vector) || vector.length !== EXPECTED_DIMENSION) {
    console.error(`[Pinecone] Erro de dimensão: recebido ${vector?.length}, esperado ${EXPECTED_DIMENSION}`);
    throw new Error(`Vector de consulta deve ter ${EXPECTED_DIMENSION} dimensões. Recebido: ${vector?.length}`);
  }

  const index = getPineconeIndex();
  const target = namespace ? index.namespace(namespace) : index;

  const response = await target.query({
    vector,
    topK,
    filter,
    includeMetadata: true,
  });

  return response;
}

/**
 * Health-check básico do índice.
 */
export async function checkPineconeHealth() {
  const { indexName } = getEnv();
  const index = getPineconeIndex();

  const stats = await index.describeIndexStats();
  const description = await getPineconeClient().describeIndex(indexName);

  const dimension = stats.dimension ?? description.dimension ?? 0;
  if (dimension && dimension !== EXPECTED_DIMENSION) {
    console.warn(`[Pinecone] Dimensão (${dimension}) difere do esperado (${EXPECTED_DIMENSION}).`);
  }

  return {
    status: 'connected',
    index: indexName,
    host: description.host,
    dimensions: dimension,
    namespaces: Object.keys(stats.namespaces || {}),
    totalVectors: stats.totalRecordCount ?? 0,
  };
}
