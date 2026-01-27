/**
 * Script de Upload do Conselho de Ads (ST-12.12)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function uploadAdsBrain() {
  const chunksPath = path.resolve(__dirname, 'ads-brain-chunks.json');
  if (!fs.existsSync(chunksPath)) {
    console.error('❌ Erro: Execute ingest-ads-brain.ts primeiro.');
    process.exit(1);
  }

  const chunks = JSON.parse(fs.readFileSync(chunksPath, 'utf-8'));
  console.log(`🚀 Fazendo upload de ${chunks.length} chunks para ${API_URL}...`);

  try {
    const response = await fetch(`${API_URL}/api/admin/upload-knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chunks, clear: false })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    console.log(`✅ Upload finalizado: ${result.uploaded} chunks enviados.`);
  } catch (error) {
    console.error('❌ Erro no upload:', error);
  }
}

uploadAdsBrain();



