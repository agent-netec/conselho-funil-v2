/**
 * Script de Upload do Ads Brain Profundo (ST-12.12 Final)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function uploadDeepAdsBrain() {
  const chunksPath = path.resolve(__dirname, 'ads-brain-deep-chunks.json');
  if (!fs.existsSync(chunksPath)) {
    console.error('❌ Erro: Execute ingest-deep-ads-brain.ts primeiro.');
    process.exit(1);
  }

  const chunks = JSON.parse(fs.readFileSync(chunksPath, 'utf-8'));
  console.log(`🚀 Fazendo upload de ${chunks.length} chunks profundos para ${API_URL}...`);

  // Batch upload (50 per batch) to avoid timeouts
  const batchSize = 50;
  let totalUploaded = 0;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    try {
      const response = await fetch(`${API_URL}/api/admin/upload-knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chunks: batch, clear: false })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      totalUploaded += result.uploaded;
      console.log(`  ✓ Batch ${Math.floor(i/batchSize) + 1}: ${result.uploaded} chunks enviados.`);
    } catch (error) {
      console.error(`  ✗ Erro no batch ${Math.floor(i/batchSize) + 1}:`, error);
    }
  }

  console.log(`\n✅ Upload Profundo Finalizado: ${totalUploaded} chunks integrados à base.`);
}

uploadDeepAdsBrain();



