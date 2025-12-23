/**
 * Script de Ingestão da Base de Conhecimento - Conselho de Copywriting
 * 
 * Este script lê os arquivos markdown da pasta templates/copy/copywriter_brain/
 * e os processa para armazenamento no Firestore como chunks vetorizados.
 * 
 * Uso: npx ts-node scripts/ingest-copy-knowledge.ts
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
  council: 'funnel' | 'copy'; // Distinguish between councils
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
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  if (normalizedPath.includes('/identity/')) return 'identity';
  if (normalizedPath.includes('/heuristics/')) return 'heuristics';
  if (normalizedPath.includes('/anti-patterns/')) return 'anti-patterns';
  if (normalizedPath.includes('/mental-models/')) return 'mental-models';
  if (normalizedPath.includes('/case-library/')) return 'case-library';
  if (normalizedPath.includes('/scorecards/')) return 'scorecards';
  if (normalizedPath.includes('/playbooks/')) return 'playbooks';
  if (normalizedPath.includes('/meta/')) return 'meta';
  return 'general';
}

// Extract copywriter counselor from file path or content
function getCopyCounselor(filePath: string, metadata: Record<string, any>): string | undefined {
  if (metadata.counselor) return metadata.counselor;
  
  const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();
  const fileName = path.basename(filePath, '.md').toLowerCase();
  
  // Copywriter identity mapping
  const copywriterMap: Record<string, string> = {
    'eugene_schwartz': 'eugene_schwartz',
    'claude_hopkins': 'claude_hopkins',
    'gary_halbert': 'gary_halbert',
    'joseph_sugarman': 'joseph_sugarman',
    'dan_kennedy': 'dan_kennedy',
    'david_ogilvy': 'david_ogilvy',
    'john_carlton': 'john_carlton',
    'drayton_bird': 'drayton_bird',
    'frank_kern': 'frank_kern',
    // Heuristics mapping to copywriters
    'copy_consciencia': 'eugene_schwartz',
    'copy_headline': 'gary_halbert',
    'copy_oferta': 'dan_kennedy',
    'copy_fluxo': 'john_carlton',
    'copy_premium': 'david_ogilvy',
  };

  for (const [key, value] of Object.entries(copywriterMap)) {
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
    
    const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);
    
    if (headerMatch) {
      if (currentChunk.length > 0) {
        const text = currentChunk.join('\n').trim();
        if (text.length > 50) {
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
  const counselor = getCopyCounselor(filePath, metadata);
  
  const rawChunks = chunkByHeaders(body);
  
  return rawChunks.map(chunk => ({
    content: chunk.text,
    metadata: {
      counselor,
      docType,
      scope: metadata.scope || 'general',
      channel: metadata.channel || 'general',
      stage: metadata.stage || 'general',
      tenantId: null,
      status: 'approved' as const,
      version: metadata.version || new Date().toISOString().split('T')[0],
      council: 'copy' as const, // Mark as copy council
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
        if (!item.startsWith('.') && !item.startsWith('_')) {
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
async function ingestCopyKnowledgeBase() {
  const copyBrainPath = path.resolve(__dirname, '../../templates/copy/copywriter_brain');
  
  console.log('✍️  Iniciando ingestão da base de conhecimento - COPYWRITING...');
  console.log(`📂 Caminho: ${copyBrainPath}`);
  
  if (!fs.existsSync(copyBrainPath)) {
    console.error('❌ Pasta não encontrada:', copyBrainPath);
    return [];
  }
  
  const files = findMarkdownFiles(copyBrainPath);
  console.log(`📄 ${files.length} arquivos encontrados`);
  
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
  
  console.log('\n✍️  Por copywriter:');
  Object.entries(byCounselor).forEach(([counselor, count]) => {
    console.log(`   ${counselor}: ${count}`);
  });
  
  // Save to JSON
  const outputPath = path.join(__dirname, 'processed-copy-chunks.json');
  fs.writeFileSync(outputPath, JSON.stringify(allChunks, null, 2));
  console.log(`\n💾 Chunks salvos em: ${outputPath}`);
  
  console.log('\n✅ Ingestão de Copywriting concluída!');
  
  return allChunks;
}

// Run
ingestCopyKnowledgeBase().catch(console.error);

