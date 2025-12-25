/**
 * Script de Ingestão da Base de Conhecimento - Social Brain (E12)
 * 
 * Processa os documentos do Conselho Social
 * e os prepara para upload via API
 * 
 * Uso: npx ts-node scripts/ingest-social-brain.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Types
interface ChunkMetadata {
  counselor?: string | string[];
  docType: string;
  scope?: string;
  channel?: string | string[];
  platform?: string | string[];
  stage?: string;
  severity?: string;
  tenantId: string | null;
  status: string;
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

// Lista de arquivos do Social Brain
const SOCIAL_BRAIN_FILES = [
  // Identity (4 cadeiras)
  'brain/second brain/brain/social/identity/algoritmo_descoberta.md',
  'brain/second brain/brain/social/identity/criativo_hooks.md',
  'brain/second brain/brain/social/identity/viralizacao_distribuicao.md',
  'brain/second brain/brain/social/identity/funil_conversao.md',
  
  // Heuristics (por plataforma)
  'brain/second brain/brain/social/heuristics/tiktok_heuristics.md',
  'brain/second brain/brain/social/heuristics/instagram_heuristics.md',
  'brain/second brain/brain/social/heuristics/x_twitter_heuristics.md',
  'brain/second brain/brain/social/heuristics/linkedin_heuristics.md',
  
  // Playbooks
  'brain/second brain/brain/social/playbooks/viral_content_playbook.md',
  
  // Scorecards
  'brain/second brain/brain/social/scorecards/content_scorecard.md',
  
  // Alg Updates
  'brain/second brain/brain/social/alg-updates/tiktok_updates.md',
  
  // Sources e Digest
  'brain/second brain/brain/social/sources.md',
  'brain/second brain/brain/social/weekly_digest.md',
];

// Parse YAML frontmatter
function parseFrontmatter(content: string): { metadata: Record<string, any>; body: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { metadata: {}, body: content };
  }

  const yamlContent = match[1];
  const body = match[2];
  
  const metadata: Record<string, any> = {};
  yamlContent.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const rawValue = line.slice(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
      
      // Handle arrays
      if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
        const arrayValue = rawValue.slice(1, -1).split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        metadata[key] = arrayValue;
      } else {
        metadata[key] = rawValue;
      }
    }
  });

  return { metadata, body };
}

// Get doc type from path
function getDocType(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  
  if (normalized.includes('/identity/')) return 'identity';
  if (normalized.includes('/heuristics/')) return 'heuristics';
  if (normalized.includes('/playbooks/')) return 'playbook';
  if (normalized.includes('/scorecards/')) return 'scorecard';
  if (normalized.includes('/anti-patterns/')) return 'anti_pattern';
  if (normalized.includes('/case-library/')) return 'case_library';
  if (normalized.includes('/alg-updates/')) return 'alg_updates';
  if (normalized.includes('sources.md')) return 'sources';
  if (normalized.includes('weekly_digest.md')) return 'digest';
  
  return 'general';
}

// Get platform from path or content
function getPlatform(filePath: string, metadata: Record<string, any>): string | string[] {
  // Check metadata first
  if (metadata.platform) return metadata.platform;
  
  const normalized = filePath.toLowerCase();
  
  if (normalized.includes('tiktok')) return 'tiktok';
  if (normalized.includes('instagram')) return 'instagram';
  if (normalized.includes('x_twitter') || normalized.includes('twitter')) return 'x';
  if (normalized.includes('linkedin')) return 'linkedin';
  
  return 'multi';
}

// Get counselor from file
function getCounselor(filePath: string, metadata: Record<string, any>): string | string[] {
  // Check metadata first
  if (metadata.counselor) return metadata.counselor;
  
  // Social brain always uses 'social' as counselor
  return 'social';
}

// Chunk content by headers
function chunkByHeaders(body: string, filePath: string): Array<{ section: string; content: string; lineStart: number; lineEnd: number }> {
  const lines = body.split('\n');
  const chunks: Array<{ section: string; content: string; lineStart: number; lineEnd: number }> = [];
  
  let currentSection = 'Introduction';
  let currentContent: string[] = [];
  let lineStart = 1;
  
  lines.forEach((line, index) => {
    // Check for H1 or H2 headers
    if (line.match(/^#{1,2}\s+/)) {
      // Save previous chunk if it has content
      if (currentContent.length > 0 && currentContent.some(l => l.trim())) {
        chunks.push({
          section: currentSection,
          content: currentContent.join('\n').trim(),
          lineStart,
          lineEnd: index,
        });
      }
      
      // Start new chunk
      currentSection = line.replace(/^#+\s+/, '').trim();
      currentContent = [line];
      lineStart = index + 1;
    } else {
      currentContent.push(line);
    }
  });
  
  // Don't forget the last chunk
  if (currentContent.length > 0 && currentContent.some(l => l.trim())) {
    chunks.push({
      section: currentSection,
      content: currentContent.join('\n').trim(),
      lineStart,
      lineEnd: lines.length,
    });
  }
  
  return chunks;
}

// Process a single file
function processFile(filePath: string, projectRoot: string): ProcessedChunk[] {
  const fullPath = path.join(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  File not found: ${filePath}`);
    return [];
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const { metadata, body } = parseFrontmatter(content);
  const docType = metadata.doc_type || getDocType(filePath);
  const platform = getPlatform(filePath, metadata);
  const counselor = getCounselor(filePath, metadata);
  
  const rawChunks = chunkByHeaders(body, filePath);
  
  return rawChunks.map(chunk => ({
    content: chunk.content,
    metadata: {
      counselor,
      docType,
      platform,
      scope: 'social',
      channel: metadata.channel || undefined,
      stage: metadata.stage || 'traffic',
      tenantId: null, // Universal knowledge
      status: 'approved',
      version: '1.0',
    },
    source: {
      file: filePath,
      section: chunk.section,
      lineStart: chunk.lineStart,
      lineEnd: chunk.lineEnd,
    },
  }));
}

// Main function
async function main() {
  console.log('🚀 Iniciando ingestão do Social Brain (E12)...\n');
  
  const projectRoot = path.resolve(__dirname, '../..');
  const outputPath = path.join(__dirname, 'social-brain-chunks.json');
  
  let totalChunks: ProcessedChunk[] = [];
  let filesProcessed = 0;
  let filesSkipped = 0;
  
  for (const file of SOCIAL_BRAIN_FILES) {
    // Skip temp files
    if (file.includes('~$')) {
      console.log(`⏭️  Skipping temp file: ${file}`);
      filesSkipped++;
      continue;
    }
    
    console.log(`📄 Processando: ${file}`);
    const chunks = processFile(file, projectRoot);
    
    if (chunks.length > 0) {
      totalChunks = totalChunks.concat(chunks);
      filesProcessed++;
      console.log(`   ✅ ${chunks.length} chunks extraídos`);
    } else {
      filesSkipped++;
      console.log(`   ⚠️  Arquivo não encontrado ou vazio`);
    }
  }
  
  // Save to JSON
  fs.writeFileSync(outputPath, JSON.stringify(totalChunks, null, 2));
  
  console.log('\n📊 Resumo:');
  console.log(`   Arquivos processados: ${filesProcessed}`);
  console.log(`   Arquivos pulados: ${filesSkipped}`);
  console.log(`   Total de chunks: ${totalChunks.length}`);
  console.log(`   Output: ${outputPath}`);
  
  // Merge with existing processed-chunks.json if exists
  const processedChunksPath = path.join(__dirname, 'processed-chunks.json');
  if (fs.existsSync(processedChunksPath)) {
    console.log('\n🔄 Mesclando com processed-chunks.json existente...');
    const existingChunks = JSON.parse(fs.readFileSync(processedChunksPath, 'utf-8'));
    
    // Filter out any existing social chunks to avoid duplicates
    const nonSocialChunks = existingChunks.filter((c: ProcessedChunk) => 
      c.metadata.scope !== 'social'
    );
    
    const mergedChunks = [...nonSocialChunks, ...totalChunks];
    fs.writeFileSync(processedChunksPath, JSON.stringify(mergedChunks, null, 2));
    console.log(`   ✅ Mesclado: ${mergedChunks.length} chunks totais`);
  } else {
    // Create new processed-chunks.json
    fs.writeFileSync(processedChunksPath, JSON.stringify(totalChunks, null, 2));
    console.log(`\n✅ Criado: ${processedChunksPath}`);
  }
  
  console.log('\n✨ Ingestão do Social Brain concluída!');
  console.log('   Próximo passo: npx ts-node scripts/upload-via-api.ts');
}

main().catch(console.error);

