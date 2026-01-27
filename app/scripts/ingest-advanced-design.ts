/**
 * Script de Ingestão Avançada do Conselho de Design
 * Objetivo: Ingerir heurísticas avançadas com metadados específicos.
 * 
 * Uso: npx ts-node --esm scripts/ingest-advanced-design.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'http://localhost:3001';

interface ChunkMetadata {
  counselor: string;
  docType: string;
  scope: string;
  tenantId: string | null;
  status: 'approved';
  version: string;
}

interface ProcessedChunk {
  content: string;
  metadata: ChunkMetadata;
  source: {
    file: string;
    section: string;
    lineStart: number;
    lineEnd: number;
  };
}

function parseFrontmatter(content: string): { metadata: Record<string, any>; body: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  if (!match) return { metadata: {}, body: content };
  const metadata: Record<string, any> = {};
  match[1].split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
      metadata[key] = value;
    }
  });
  return { metadata, body: match[2] };
}

function chunkByHeaders(content: string): { text: string; section: string; lineStart: number; lineEnd: number }[] {
  const lines = content.split('\n');
  const chunks: any[] = [];
  let currentChunk: string[] = [];
  let currentSection = 'Introduction';
  let chunkStartLine = 1;
  
  lines.forEach((line, i) => {
    // Quebra em headers H1, H2 e H3 para preservar contexto das heurísticas
    const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headerMatch) {
      if (currentChunk.length > 0) {
        chunks.push({
          text: currentChunk.join('\n').trim(),
          section: currentSection,
          lineStart: chunkStartLine,
          lineEnd: i,
        });
      }
      currentSection = headerMatch[2];
      currentChunk = [line];
      chunkStartLine = i + 1;
    } else {
      currentChunk.push(line);
    }
  });
  if (currentChunk.length > 0) {
    chunks.push({
      text: currentChunk.join('\n').trim(),
      section: currentSection,
      lineStart: chunkStartLine,
      lineEnd: lines.length,
    });
  }
  return chunks.filter(c => c.text.length > 20);
}

async function ingestAdvancedDesign() {
  console.log('🚀 Iniciando Ingestão Avançada de Design (Full Power)');
  
  const frameworksPath = path.resolve(__dirname, '../../templates/designer/design_brain_final_with_example (1)/design_brain/council/frameworks');
  
  if (!fs.existsSync(frameworksPath)) {
    console.error(`❌ Diretório não encontrado: ${frameworksPath}`);
    process.exit(1);
  }

  const files = fs.readdirSync(frameworksPath).filter(f => f.endsWith('.md'));
  const allChunks: ProcessedChunk[] = [];
  
  console.log(`📂 Lendo ${files.length} arquivos de frameworks...`);

  files.forEach(fileName => {
    const filePath = path.join(frameworksPath, fileName);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { body } = parseFrontmatter(content);
    const chunks = chunkByHeaders(body);
    
    chunks.forEach(c => {
      allChunks.push({
        content: c.text,
        metadata: {
          counselor: 'design_director',
          docType: 'heuristics',
          scope: 'visual_intelligence',
          tenantId: null,
          status: 'approved',
          version: '1.0'
        },
        source: {
          file: `frameworks/${fileName}`,
          section: c.section,
          lineStart: c.lineStart,
          lineEnd: c.lineEnd
        }
      });
    });
  });

  console.log(`✅ Gerados ${allChunks.length} chunks de inteligência visual.`);

  // Salvar para backup
  const outputPath = path.join(__dirname, 'advanced-design-chunks.json');
  fs.writeFileSync(outputPath, JSON.stringify(allChunks, null, 2));
  console.log(`💾 Chunks salvos em ${outputPath}`);

  // Upload via API
  console.log(`📤 Enviando para API em ${API_URL}...`);
  
  const batchSize = 50;
  let totalUploaded = 0;
  let hasErrors = false;

  for (let i = 0; i < allChunks.length; i += batchSize) {
    const batch = allChunks.slice(i, i + batchSize);
    try {
      const response = await fetch(`${API_URL}/api/admin/upload-knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chunks: batch, 
          clear: false // Não limpa mais para não apagar o restante do conselho
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json() as any;
      totalUploaded += result.uploaded;
      console.log(`   ✓ Batch ${Math.floor(i / batchSize) + 1}: ${result.uploaded} chunks enviados.`);
    } catch (error) {
      console.error(`   ✗ Erro no batch ${Math.floor(i / batchSize) + 1}:`, error);
      hasErrors = true;
    }
  }

  console.log('\n' + '='.repeat(50));
  if (hasErrors) {
    console.log('⚠️ Ingestão Concluída com ALGUNS ERROS.');
  } else {
    console.log('✨ Ingestão Concluída com SUCESSO!');
  }
  console.log(`   📊 Total de ${totalUploaded} chunks ingeridos.`);
  console.log('='.repeat(50));
}

ingestAdvancedDesign().catch(error => {
  console.error('❌ Erro fatal na ingestão:', error);
  process.exit(1);
});



