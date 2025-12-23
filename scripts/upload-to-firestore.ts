/**
 * Upload Knowledge Chunks to Firestore
 * 
 * Este script lê os chunks processados e faz upload para o Firestore
 * com embeddings gerados.
 * 
 * Pré-requisito: Executar ingest-knowledge.ts primeiro
 * 
 * Uso: npx ts-node --esm scripts/upload-to-firestore.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
const serviceAccountPath = path.resolve(__dirname, '../service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Arquivo service-account.json não encontrado!');
  console.log('\n📝 Para configurar:');
  console.log('1. Acesse o Firebase Console → Configurações do Projeto → Contas de Serviço');
  console.log('2. Clique em "Gerar nova chave privada"');
  console.log('3. Salve o arquivo como app/service-account.json');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Types
interface ProcessedChunk {
  content: string;
  metadata: {
    counselor?: string;
    docType: string;
    scope?: string;
    channel?: string;
    stage?: string;
    tenantId?: string | null;
    status: 'draft' | 'approved';
    version: string;
  };
  source: {
    file: string;
    section: string;
    lineStart: number;
    lineEnd: number;
  };
}

/**
 * Generate fallback embedding (same as in vertex.ts)
 * For production, use actual Vertex AI embeddings
 */
function generateFallbackEmbedding(text: string): number[] {
  const vector = new Array(768).fill(0);
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, '');
  const words = normalized.split(/\s+/).filter(w => w.length > 2);
  
  const wordCounts: Record<string, number> = {};
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  const hashString = (str: string): number => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    }
    return hash;
  };
  
  Object.entries(wordCounts).forEach(([word, count]) => {
    const hash1 = hashString(word);
    const hash2 = hashString(word + '_secondary');
    const hash3 = hashString(word + '_tertiary');
    
    const indices = [
      Math.abs(hash1) % 768,
      Math.abs(hash2) % 768,
      Math.abs(hash3) % 768,
    ];
    
    const weight = Math.log(1 + count) / Math.log(1 + words.length);
    indices.forEach(idx => {
      vector[idx] += weight * (1 + Math.random() * 0.1);
    });
  });
  
  words.slice(0, 10).forEach((word, i) => {
    const idx = Math.abs(hashString(word + '_pos')) % 768;
    vector[idx] += (10 - i) * 0.05;
  });
  
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude > 0) {
    return vector.map(v => v / magnitude);
  }
  
  return vector;
}

/**
 * Upload chunks in batches
 */
async function uploadChunks(chunks: ProcessedChunk[]) {
  console.log(`\n📤 Iniciando upload de ${chunks.length} chunks...`);
  
  const batchSize = 500; // Firestore batch limit
  let uploaded = 0;
  let errors = 0;
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = db.batch();
    const batchChunks = chunks.slice(i, i + batchSize);
    
    for (const chunk of batchChunks) {
      try {
        // Generate embedding
        const embedding = generateFallbackEmbedding(chunk.content);
        
        // Create document ID from content hash
        const docId = createDocId(chunk);
        const docRef = db.collection('knowledge').doc(docId);
        
        batch.set(docRef, {
          content: chunk.content,
          embedding: embedding,
          metadata: {
            ...chunk.metadata,
            status: 'approved',
          },
          source: chunk.source,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        uploaded++;
      } catch (error) {
        console.error(`  ✗ Erro no chunk: ${chunk.source.file}`, error);
        errors++;
      }
    }
    
    // Commit batch
    try {
      await batch.commit();
      console.log(`  ✓ Batch ${Math.floor(i / batchSize) + 1}: ${batchChunks.length} chunks`);
    } catch (error) {
      console.error(`  ✗ Erro no batch ${Math.floor(i / batchSize) + 1}:`, error);
      errors += batchChunks.length;
    }
    
    // Small delay between batches
    if (i + batchSize < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`\n✅ Upload concluído!`);
  console.log(`   📊 Sucesso: ${uploaded - errors} chunks`);
  console.log(`   ❌ Erros: ${errors} chunks`);
}

/**
 * Create deterministic document ID
 */
function createDocId(chunk: ProcessedChunk): string {
  const str = `${chunk.source.file}_${chunk.source.section}_${chunk.source.lineStart}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `chunk_${Math.abs(hash).toString(36)}`;
}

/**
 * Clear existing knowledge base
 */
async function clearKnowledgeBase() {
  console.log('🗑️  Limpando base de conhecimento existente...');
  
  const snapshot = await db.collection('knowledge').limit(500).get();
  
  if (snapshot.empty) {
    console.log('   Base já está vazia.');
    return;
  }
  
  let deleted = 0;
  while (true) {
    const batch = db.batch();
    const docs = await db.collection('knowledge').limit(500).get();
    
    if (docs.empty) break;
    
    docs.forEach(doc => {
      batch.delete(doc.ref);
      deleted++;
    });
    
    await batch.commit();
    console.log(`   Deletados: ${deleted} documentos`);
  }
  
  console.log(`✓ Base limpa: ${deleted} documentos removidos`);
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Upload para Firestore - Conselho de Funil\n');
  
  // Check for processed chunks
  const chunksPath = path.resolve(__dirname, 'processed-chunks.json');
  
  if (!fs.existsSync(chunksPath)) {
    console.error('❌ Arquivo processed-chunks.json não encontrado!');
    console.log('\n📝 Execute primeiro:');
    console.log('   npx ts-node scripts/ingest-knowledge.ts');
    process.exit(1);
  }
  
  // Load chunks
  const chunks: ProcessedChunk[] = JSON.parse(fs.readFileSync(chunksPath, 'utf-8'));
  console.log(`📄 ${chunks.length} chunks carregados`);
  
  // Ask about clearing
  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear');
  
  if (shouldClear) {
    await clearKnowledgeBase();
  }
  
  // Upload
  await uploadChunks(chunks);
  
  // Create summary
  console.log('\n📈 Resumo da Base de Conhecimento:');
  
  const snapshot = await db.collection('knowledge').count().get();
  console.log(`   Total de documentos: ${snapshot.data().count}`);
  
  // Sample check
  const sample = await db.collection('knowledge').limit(3).get();
  console.log('\n🔍 Amostra de documentos:');
  sample.docs.forEach(doc => {
    const data = doc.data();
    console.log(`   - ${doc.id}`);
    console.log(`     Tipo: ${data.metadata?.docType}`);
    console.log(`     Conselheiro: ${data.metadata?.counselor || 'N/A'}`);
    console.log(`     Embedding: ${data.embedding?.length || 0} dimensões`);
  });
  
  console.log('\n✅ Processo finalizado!');
  process.exit(0);
}

// Run
main().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
