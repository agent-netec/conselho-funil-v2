import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { processAsset } from '../lib/ai/worker';
import { getPineconeIndex } from '../lib/ai/pinecone';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import matter from 'gray-matter';

/**
 * Script de Ingestão em Lote (Bulk Ingest) v2 - NETECMT ST-11.1
 * Extrai metadados YAML reais e alimenta o namespace 'knowledge'
 */

const DEFAULT_PATHS = [
  join(process.cwd(), '..', 'brain', 'second brain', 'brain'),
  join(process.cwd(), '..', 'templates', 'ads_brain'),
  join(process.cwd(), '..', 'templates', 'copy')
];
const NAMESPACE = 'knowledge';

function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env.local');
    const content = readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return;
      const [k, ...rest] = trimmed.split('=');
      const v = rest.join('=').trim();
      process.env[k.trim()] = v.replace(/^\"|\"$/g, '');
    });
  } catch (err) {
    console.warn('[Env] Não foi possível carregar .env.local:', err);
  }
}

function getPathsToScan() {
  const envPaths = process.env.SCAN_PATHS;
  if (envPaths) {
    return envPaths
      .split(';')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => join(process.cwd(), '..', p));
  }
  return DEFAULT_PATHS;
}

async function bulkIngest() {
  console.log('🚀 Iniciando Ingestão Massiva v2 - Namespace:', NAMESPACE);
  loadEnv();
  process.env.SKIP_AUTH = process.env.SKIP_AUTH || '1';
  const { db } = await import('../lib/firebase/config');
  const index = await getPineconeIndex();
  if (!index) throw new Error('Pinecone index unavailable');
  const targetIndex = NAMESPACE ? index.namespace(NAMESPACE) : index;
  const hasVector = async (originalName: string) => {
    try {
      const q = await targetIndex.query({
        vector: new Array(768).fill(0),
        topK: 1,
        filter: { originalName },
        includeMetadata: true,
      });
      return !!q.matches?.length;
    } catch (err) {
      console.warn(`[Dedup] Falha ao consultar Pinecone para ${originalName}:`, err);
      return false;
    }
  };
  const PATHS_TO_SCAN = getPathsToScan();
  
  for (const scanPath of PATHS_TO_SCAN) {
    try {
      if (!statSync(scanPath).isDirectory()) continue;
      
      const files = getAllFiles(scanPath).filter(f => extname(f) === '.md');
      console.log(`📂 Escaneando ${scanPath}: Encontrados ${files.length} arquivos.`);

      for (const filePath of files) {
        const fileName = filePath.split(/[\\/]/).pop() || 'unknown.md';
        
        try {
          // Dedup: evita criar novos assets/chunks se já houver vetor com mesmo originalName
          if (await hasVector(fileName)) {
            console.log(`↩️  Skip (já indexado no Pinecone): ${fileName}`);
            continue;
          }

          const rawContent = readFileSync(filePath, 'utf8');
          const { data, content: body } = matter(rawContent); // Extrai o YAML front-matter

          // Proteção contra payloads inválidos no Firestore (vazio ou oversize)
          const trimmedBody = body || '';
          const MAX_LEN = 900_000; // abaixo de 1MB para evitar INVALID_ARGUMENT
          const extractedText = trimmedBody.length > MAX_LEN ? trimmedBody.slice(0, MAX_LEN) : trimmedBody;

          const docType = (data.doc_type || data.docType || 'heuristics') as string;
          const counselor = (data.counselor || 'universal') as string;
          const version = data.version ? String(data.version) : '2026.v1';
          const url = data.url ? String(data.url) : 'about:blank';

          // 1. Criar entrada no Firestore como BrandAsset "Universal"
          const assetRef = await addDoc(collection(db, 'brand_assets'), {
            name: fileName,
            originalName: fileName,
            type: docType,
            status: 'uploaded',
            userId: 'system-admin',
            brandId: 'universal-knowledge',
            url, // Evita undefined; usa about:blank como placeholder seguro
            isApprovedForAI: true,
            extractedText, // Injeção do texto para o worker processar
            createdAt: Timestamp.now(),
            metadata: {
              sourceType: 'text',
              processingMethod: 'bulk-ingest-v2',
              extractedAt: new Date().toISOString(),
              counselor,
              docType,
              version
            }
          });

          // 2. Chamar o Worker para processar o conteúdo (embedding + Pinecone)
          const result = await processAsset(assetRef.id, NAMESPACE);
          console.log(`✅ Sucesso: ${fileName} (${result.chunkCount} chunks) -> ${data.counselor || 'universal'}`);
          
        } catch (err) {
          console.error(`❌ Erro ao processar ${fileName}:`, err);
        }
      }
    } catch (e) {
      console.warn(`⚠️ Pula pasta ${scanPath}: não encontrada.`);
    }
  }

  console.log('🏁 Ingestão concluída!');
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
  const files = readdirSync(dirPath);
  files.forEach((file) => {
    const path = join(dirPath, file);
    if (statSync(path).isDirectory()) {
      arrayOfFiles = getAllFiles(path, arrayOfFiles);
    } else {
      arrayOfFiles.push(path);
    }
  });
  return arrayOfFiles;
}

bulkIngest();
