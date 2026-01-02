/**
 * Upload Knowledge Chunks via API
 * 
 * Este script lê os chunks processados e faz upload via API do app
 * 
 * Pré-requisito: 
 * 1. Executar ingest-knowledge.ts primeiro
 * 2. O app deve estar rodando (npm run dev)
 * 
 * Uso: npx ts-node --esm scripts/upload-via-api.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = process.env.API_URL || 'http://localhost:3001';

interface ProcessedChunk {
  content: string;
  metadata: {
    counselor?: string;
    docType: string;
    scope?: string;
    channel?: string;
    stage?: string;
    tenantId?: string | null;
    status: string;
    version: string;
  };
  source: {
    file: string;
    section: string;
    lineStart: number;
    lineEnd: number;
  };
}

async function uploadChunks() {
  console.log('🚀 Upload via API - Conselho de Funil\n');
  console.log(`📡 API URL: ${API_URL}`);

  // Check for processed chunks
  const chunksPath = path.resolve(__dirname, 'processed-chunks.json');
  
  if (!fs.existsSync(chunksPath)) {
    console.error('❌ Arquivo processed-chunks.json não encontrado!');
    console.log('\n📝 Execute primeiro:');
    console.log('   npx ts-node --esm scripts/ingest-knowledge.ts');
    process.exit(1);
  }

  // Load chunks
  const chunks: ProcessedChunk[] = JSON.parse(fs.readFileSync(chunksPath, 'utf-8'));
  console.log(`📄 ${chunks.length} chunks carregados\n`);

  // Check API status first
  try {
    const statusRes = await fetch(`${API_URL}/api/admin/upload-knowledge`);
    const status = await statusRes.json();
    console.log('📊 Status atual da base:');
    console.log(`   Tem documentos: ${status.hasDocuments}`);
    console.log(`   Contagem aproximada: ${status.approximateCount || 0}`);
    console.log('');
  } catch (error) {
    console.error('❌ Não foi possível conectar à API.');
    console.log('   Certifique-se de que o app está rodando: npm run dev');
    process.exit(1);
  }

  // Ask about clearing
  const shouldClear = process.argv.includes('--clear');
  console.log(`🗑️  Limpar base existente: ${shouldClear ? 'SIM' : 'NÃO'}`);
  if (!shouldClear) {
    console.log('   (use --clear para limpar antes de fazer upload)');
  }
  console.log('');

  // Upload in batches
  const batchSize = 50;
  let totalUploaded = 0;
  let totalErrors = 0;

  console.log('📤 Iniciando upload...\n');

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batchChunks = chunks.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(chunks.length / batchSize);
    
    try {
      const response = await fetch(`${API_URL}/api/admin/upload-knowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chunks: batchChunks,
          clear: shouldClear && i === 0, // Only clear on first batch
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      totalUploaded += result.uploaded;
      totalErrors += result.errors;
      
      const progress = ((i + batchChunks.length) / chunks.length * 100).toFixed(0);
      console.log(`  ✓ Batch ${batchNum}/${totalBatches}: ${result.uploaded} chunks (${progress}%)`);
    } catch (error) {
      console.error(`  ✗ Batch ${batchNum}/${totalBatches}: Erro - ${error}`);
      totalErrors += batchChunks.length;
    }

    // Small delay between batches
    if (i + batchSize < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Upload concluído!');
  console.log(`   📊 Sucesso: ${totalUploaded} chunks`);
  console.log(`   ❌ Erros: ${totalErrors} chunks`);
  console.log('='.repeat(50));

  // Final check
  try {
    const statusRes = await fetch(`${API_URL}/api/admin/upload-knowledge`);
    const status = await statusRes.json();
    console.log('\n📊 Status final da base:');
    console.log(`   Contagem aproximada: ${status.approximateCount || 0} documentos`);
    if (status.sample) {
      console.log(`   Amostra: ${status.sample.id}`);
      console.log(`     - Tipo: ${status.sample.docType}`);
      console.log(`     - Conselheiro: ${status.sample.counselor || 'N/A'}`);
      console.log(`     - Tem embedding: ${status.sample.hasEmbedding}`);
    }
  } catch (error) {
    // Ignore status check errors
  }

  console.log('\n🎯 Próximo passo: Teste o chat em http://localhost:3001/chat');
}

// Run
uploadChunks().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});

