/**
 * Script de Ingestão da Base de Conhecimento
 * 
 * Este script lê os arquivos markdown da pasta brain/second brain/brain/
 * e os processa para armazenamento no Firestore como chunks vetorizados.
 * 
 * Uso: npx ts-node scripts/ingest-knowledge.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES Module support for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Types
interface ChunkMetadata {
  counselor?: string;
  docType: string;
  scope?: string;
  channel?: string;
  stage?: string;
  tenantId?: string | null;
  status: 'draft' | 'approved';
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

// Parse YAML frontmatter from markdown
function parseFrontmatter(content: string): { metadata: Record<string, any>; body: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { metadata: {}, body: content };
  }

  const yamlContent = match[1];
  const body = match[2];
  
  // Simple YAML parser
  const metadata: Record<string, any> = {};
  yamlContent.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
      metadata[key] = value;
    }
  });

  return { metadata, body };
}

// Determine doc type from file path
function getDocType(filePath: string): string {
  // Normalize path separators for cross-platform
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  if (normalizedPath.includes('/identity/')) return 'identity';
  if (normalizedPath.includes('/heuristics/')) return 'heuristics';
  if (normalizedPath.includes('/anti-patterns/')) return 'anti-patterns';
  if (normalizedPath.includes('/mental-models/')) return 'mental-models';
  if (normalizedPath.includes('/case-library/')) return 'case-library';
  if (normalizedPath.includes('/scorecards/')) return 'scorecards';
  if (normalizedPath.includes('/playbooks/')) return 'playbooks';
  if (normalizedPath.includes('/decisions/')) return 'decisions';
  if (normalizedPath.includes('/business/')) return 'business';
  if (normalizedPath.includes('/council/')) return 'council';
  if (normalizedPath.includes('/meta/')) return 'meta';
  return 'general';
}

// Extract counselor from file path or content
function getCounselor(filePath: string, metadata: Record<string, any>): string | undefined {
  if (metadata.counselor) return metadata.counselor;
  
  // Normalize path separators
  const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();
  const fileName = path.basename(filePath, '.md').toLowerCase();
  
  const counselorMap: Record<string, string> = {
    'russell_brunson': 'russell_brunson',
    'dan_kennedy': 'dan_kennedy',
    'frank_kern': 'frank_kern',
    'sam_ovens': 'sam_ovens',
    'ryan_deiss': 'ryan_deiss',
    'perry_belcher': 'perry_belcher',
    // Heuristics mapping to counselors
    'arquitetura_funil': 'russell_brunson',
    'oferta_copy': 'dan_kennedy',
    'psicologia_comportamento': 'frank_kern',
    'aquisicao_qualificacao': 'sam_ovens',
    'ltv_retencao': 'ryan_deiss',
    'monetizacao_simples': 'perry_belcher',
  };

  // Check filename and path
  for (const [key, value] of Object.entries(counselorMap)) {
    if (fileName.includes(key) || normalizedPath.includes(key)) {
      return value;
    }
  }
  
  return undefined;
}

// Split content into chunks by headers
function chunkByHeaders(content: string, maxTokens = 500): { text: string; section: string; lineStart: number; lineEnd: number }[] {
  const lines = content.split('\n');
  const chunks: { text: string; section: string; lineStart: number; lineEnd: number }[] = [];
  
  let currentChunk: string[] = [];
  let currentSection = 'Introduction';
  let chunkStartLine = 0;
  let lineNumber = 0;

  for (const line of lines) {
    lineNumber++;
    
    // Check for headers
    const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);
    
    if (headerMatch) {
      // Save current chunk if not empty
      if (currentChunk.length > 0) {
        const text = currentChunk.join('\n').trim();
        if (text.length > 50) { // Minimum chunk size
          chunks.push({
            text,
            section: currentSection,
            lineStart: chunkStartLine,
            lineEnd: lineNumber - 1,
          });
        }
      }
      
      currentSection = headerMatch[2];
      currentChunk = [line];
      chunkStartLine = lineNumber;
    } else {
      currentChunk.push(line);
      
      // Check if chunk is too large (rough token estimate)
      const currentText = currentChunk.join('\n');
      const estimatedTokens = currentText.split(/\s+/).length;
      
      if (estimatedTokens > maxTokens) {
        const text = currentChunk.join('\n').trim();
        if (text.length > 50) {
          chunks.push({
            text,
            section: currentSection,
            lineStart: chunkStartLine,
            lineEnd: lineNumber,
          });
        }
        currentChunk = [];
        chunkStartLine = lineNumber + 1;
      }
    }
  }

  // Don't forget the last chunk
  if (currentChunk.length > 0) {
    const text = currentChunk.join('\n').trim();
    if (text.length > 50) {
      chunks.push({
        text,
        section: currentSection,
        lineStart: chunkStartLine,
        lineEnd: lineNumber,
      });
    }
  }

  return chunks;
}

// Process a single markdown file
function processFile(filePath: string): ProcessedChunk[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { metadata, body } = parseFrontmatter(content);
  
  const docType = getDocType(filePath);
  const counselor = getCounselor(filePath, metadata);
  
  const rawChunks = chunkByHeaders(body);
  
  return rawChunks.map(chunk => ({
    content: chunk.text,
    metadata: {
      counselor,
      docType,
      scope: metadata.scope,
      channel: metadata.channel,
      stage: metadata.stage,
      tenantId: null, // Universal knowledge
      status: 'approved' as const,
      version: metadata.version || new Date().toISOString().split('T')[0],
    },
    source: {
      file: path.relative(process.cwd(), filePath),
      section: chunk.section,
      lineStart: chunk.lineStart,
      lineEnd: chunk.lineEnd,
    },
  }));
}

// Find all markdown files in a directory
function findMarkdownFiles(dir: string): string[] {
  const files: string[] = [];
  
  function walk(currentDir: string) {
    if (!fs.existsSync(currentDir)) return;
    
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip templates and hidden directories
        if (!item.startsWith('.') && !item.startsWith('_') && item !== 'templates') {
          walk(fullPath);
        }
      } else if (item.endsWith('.md') && !item.startsWith('_')) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

// Main ingest function
async function ingestKnowledgeBase() {
  const brainPath = path.resolve(__dirname, '../../brain/second brain/brain');
  
  console.log('🧠 Iniciando ingestão da base de conhecimento...');
  console.log(`📂 Caminho: ${brainPath}`);
  
  // Find all markdown files
  const files = findMarkdownFiles(brainPath);
  console.log(`📄 ${files.length} arquivos encontrados`);
  
  // Process all files
  const allChunks: ProcessedChunk[] = [];
  
  for (const file of files) {
    try {
      const chunks = processFile(file);
      allChunks.push(...chunks);
      console.log(`  ✓ ${path.basename(file)} (${chunks.length} chunks)`);
    } catch (error) {
      console.error(`  ✗ Erro ao processar ${file}:`, error);
    }
  }
  
  console.log(`\n📊 Total: ${allChunks.length} chunks processados`);
  
  // Output statistics
  const byDocType: Record<string, number> = {};
  const byCounselor: Record<string, number> = {};
  
  for (const chunk of allChunks) {
    byDocType[chunk.metadata.docType] = (byDocType[chunk.metadata.docType] || 0) + 1;
    if (chunk.metadata.counselor) {
      byCounselor[chunk.metadata.counselor] = (byCounselor[chunk.metadata.counselor] || 0) + 1;
    }
  }
  
  console.log('\n📈 Por tipo de documento:');
  Object.entries(byDocType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });
  
  console.log('\n👥 Por conselheiro:');
  Object.entries(byCounselor).forEach(([counselor, count]) => {
    console.log(`   ${counselor}: ${count}`);
  });
  
  // Save to JSON for review (optional)
  const outputPath = path.join(__dirname, 'processed-chunks.json');
  fs.writeFileSync(outputPath, JSON.stringify(allChunks, null, 2));
  console.log(`\n💾 Chunks salvos em: ${outputPath}`);
  
  console.log('\n✅ Ingestão concluída!');
  console.log('Para enviar ao Firestore, execute o próximo script de upload.');
  
  return allChunks;
}

// Run
ingestKnowledgeBase().catch(console.error);


