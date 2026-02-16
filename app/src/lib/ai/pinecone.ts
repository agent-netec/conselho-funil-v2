import { type PineconeRecord, type Index, type RecordMetadata } from '@pinecone-database/pinecone';

const EXPECTED_DIMENSION = 768; // text-embedding-004

/**
 * Pinecone SDK v6 não aceita mais a propriedade `environment`.
 */
function getEnv() {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX || process.env.PINECONE_INDEX_NAME || 'cf-dev-assets';
  const host = process.env.PINECONE_HOST || process.env.PINECONE_HOST_URL;

  if (!apiKey && typeof window === 'undefined') {
    throw new Error('PINECONE_API_KEY ausente.');
  }
  return { apiKey, indexName, host };
}

let cachedClient: any = null;
let cachedIndex: Index | null = null;

export async function getPineconeClient() {
  if (typeof window !== 'undefined') return null;
  if (cachedClient) return cachedClient;

  const { apiKey } = getEnv();
  const { Pinecone } = await import('@pinecone-database/pinecone');
  cachedClient = new Pinecone({ apiKey: apiKey! });
  return cachedClient;
}

export async function getPineconeIndex(): Promise<Index | null> {
  if (typeof window !== 'undefined') return null;
  if (cachedIndex) return cachedIndex;

  const { indexName, host } = getEnv();
  const client = await getPineconeClient();
  if (!client) return null;
  
  cachedIndex = host ? client.index(indexName, host) : client.index(indexName);
  return cachedIndex;
}

export async function upsertToPinecone(
  records: PineconeRecord[],
  options: { namespace?: string } = {}
) {
  if (typeof window !== 'undefined' || !records?.length) return { upserted: 0 };

  const index = await getPineconeIndex();
  if (!index) return { upserted: 0 };

  const target = options.namespace ? index.namespace(options.namespace) : index;
  await target.upsert(records);
  return { upserted: records.length };
}

export async function queryPinecone(params: {
  vector: number[];
  topK?: number;
  namespace?: string;
  filter?: Record<string, unknown>;
}) {
  if (typeof window !== 'undefined') return { matches: [] };
  
  const { vector, topK = 10, namespace, filter } = params;
  const index = await getPineconeIndex();
  if (!index) return { matches: [] };

  const target = namespace ? index.namespace(namespace) : index;
  return await target.query({
    vector,
    topK,
    filter,
    includeMetadata: true,
  });
}

export async function checkPineconeHealth() {
  if (typeof window !== 'undefined') return null;
  const { indexName } = getEnv();
  const index = await getPineconeIndex();
  const client = await getPineconeClient();
  
  if (!index || !client) return null;

  const stats = await index.describeIndexStats();
  const description = await client.describeIndex(indexName);

  return {
    status: 'connected',
    index: indexName,
    totalVectors: stats.totalRecordCount ?? 0,
  };
}

/**
 * Deletes all vectors for a given asset from Pinecone (brand namespace + visual + knowledge).
 */
export async function deleteFromPinecone(
  assetId: string,
  brandId: string
): Promise<{ deleted: boolean }> {
  if (typeof window !== 'undefined') return { deleted: false };

  const index = await getPineconeIndex();
  if (!index) return { deleted: false };

  const namespacesToClean = [`brand_${brandId}`, 'knowledge', 'visual'];

  for (const ns of namespacesToClean) {
    try {
      const target = index.namespace(ns);
      await target.deleteMany({ assetId: { '$eq': assetId } });
    } catch (err: any) {
      console.warn(`[Pinecone] Failed to delete from namespace '${ns}':`, err.message);
    }
  }

  return { deleted: true };
}

/**
 * Prepara vetor para upsert no Pinecone seguindo o contrato de ingestão.
 * Absorvido de pinecone-client.ts (SIG-ARC-01 / DT-11).
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
