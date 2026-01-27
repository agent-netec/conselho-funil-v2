/**
 * Upload Design Brain Chunks via API
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = process.env.API_URL || 'http://127.0.0.1:3001';

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

async function uploadDesignChunks() {
  console.log('🚀 Upload via API - Design Brain\n');
  console.log(`📡 API URL: ${API_URL}`);

  const chunksPath = path.resolve(__dirname, 'design-brain-chunks.json');
  
  if (!fs.existsSync(chunksPath)) {
    console.error('❌ Arquivo design-brain-chunks.json não encontrado!');
    process.exit(1);
  }

  const chunks: ProcessedChunk[] = JSON.parse(fs.readFileSync(chunksPath, 'utf-8'));
  console.log(`📄 ${chunks.length} chunks carregados\n`);

  // Check API status
  try {
    const statusRes = await fetch(`${API_URL}/api/admin/upload-knowledge`);
    if (!statusRes.ok) throw new Error('API offline');
    const status = await statusRes.json();
    console.log('📊 Status atual da base:');
    console.log(`   Tem documentos: ${status.hasDocuments}`);
    console.log(`   Contagem aproximada: ${status.approximateCount || 0}\n`);
  } catch (error) {
    console.error('❌ Não foi possível conectar à API. O app está rodando em :3001?');
    process.exit(1);
  }

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
          clear: false, // We don't want to clear everything, just add design brain
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
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

    if (i + batchSize < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Upload de Design Brain concluído!');
  console.log(`   📊 Sucesso: ${totalUploaded} chunks`);
  console.log(`   ❌ Erros: ${totalErrors} chunks`);
  console.log('='.repeat(50));
}

uploadDesignChunks().catch(console.error);

