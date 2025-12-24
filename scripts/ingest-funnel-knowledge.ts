/**
 * Script de Ingestão da Base de Conhecimento do Funnel Brain
 * 
 * Este script lê os arquivos markdown da pasta templates/funnel_brain/
 * e os processa para armazenamento no Firestore como chunks vetorizados.
 * 
 * Uso: npx ts-node scripts/ingest-funnel-knowledge.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const serviceAccountPath = path.resolve(__dirname, '../service-account.json');

if (getApps().length === 0) {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
    initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    // Try to use default credentials
    initializeApp();
  }
}

const db = getFirestore();

// Types
interface ChunkMetadata {
  counselor?: string;
  docType: string;
  scope: string;
  channel?: string;
  funnelType?: string;
  tags?: string[];
  severity?: string;
  tenantId: string | null;
  status: 'draft' | 'approved';
  version: string;
}

interface ProcessedChunk {
  id?: string;
  content: string;
  metadata: ChunkMetadata;
  source: {
    file: string;
    section: string;
    lineStart: number;
    lineEnd: number;
  };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
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
      let value = line.slice(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
      
      // Handle arrays (simple case)
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        metadata[key] = value;
      } else {
        metadata[key] = value;
      }
    }
  });

  return { metadata, body };
}

// Determine doc type from file path
function getDocType(filePath: string): string {
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  if (normalizedPath.includes('/cases/')) return 'case_library';
  if (normalizedPath.includes('/heuristics/')) return 'heuristics';
  if (normalizedPath.includes('/anti_patterns/')) return 'anti_patterns';
  if (normalizedPath.includes('/mental_models/')) return 'mental_models';
  if (normalizedPath.includes('/playbooks/')) return 'playbooks';
  if (normalizedPath.includes('/scorecards/')) return 'scorecards';
  return 'general';
}

// Split content into chunks by headers
function chunkByHeaders(content: string, maxTokens = 600): { text: string; section: string; lineStart: number; lineEnd: number }[] {
  const lines = content.split('\n');
  const chunks: { text: string; section: string; lineStart: number; lineEnd: number }[] = [];
  
  let currentChunk: string[] = [];
  let currentSection = 'Introduction';
  let chunkStartLine = 0;
  let lineNumber = 0;

  for (const line of lines) {
    lineNumber++;
    
    // Check for headers (## or ###)
    const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);
    
    if (headerMatch) {
      // Save current chunk if not empty
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
      
      // Check if chunk is too large
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

  // Last chunk
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
  
  const docType = metadata.doc_type || getDocType(filePath);
  
  const rawChunks = chunkByHeaders(body);
  
  return rawChunks.map(chunk => ({
    content: chunk.text,
    metadata: {
      counselor: metadata.counselor,
      docType,
      scope: metadata.scope || 'funnel',
      channel: metadata.channel,
      funnelType: metadata.funnel_type,
      tags: metadata.tags || [],
      severity: metadata.severity,
      tenantId: null, // Universal knowledge
      status: 'approved' as const,
      version: metadata.version || new Date().toISOString().split('T')[0],
    },
    source: {
      file: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
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
      } else if (item.endsWith('.md') && !item.startsWith('_') && item !== 'README.md') {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

// Remove undefined values from object
function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore).filter(v => v !== undefined);
  }
  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        result[key] = sanitizeForFirestore(value);
      }
    }
    return result;
  }
  return obj;
}

// Save chunks to Firestore
async function saveToFirestore(chunks: ProcessedChunk[]): Promise<number> {
  const collection = db.collection('knowledge_chunks');
  let count = 0;
  let batch = db.batch();
  
  for (const chunk of chunks) {
    const docRef = collection.doc();
    const sanitizedChunk = sanitizeForFirestore({
      ...chunk,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    batch.set(docRef, sanitizedChunk);
    count++;
    
    // Firestore batch limit is 500
    if (count % 400 === 0) {
      await batch.commit();
      batch = db.batch(); // Create new batch
      console.log(`   💾 ${count} chunks salvos...`);
    }
  }
  
  // Commit remaining
  await batch.commit();
  return count;
}

// Main ingest function
async function ingestFunnelKnowledge() {
  const brainPath = path.resolve(__dirname, '../../templates/funnel_brain');
  
  console.log('🧠 Iniciando ingestão do Funnel Brain...');
  console.log(`📂 Caminho: ${brainPath}\n`);
  
  // Check if path exists
  if (!fs.existsSync(brainPath)) {
    console.error('❌ Pasta não encontrada:', brainPath);
    process.exit(1);
  }
  
  // Find all markdown files
  const files = findMarkdownFiles(brainPath);
  console.log(`📄 ${files.length} arquivos encontrados\n`);
  
  if (files.length === 0) {
    console.log('⚠️ Nenhum arquivo markdown encontrado');
    return;
  }
  
  // Process all files
  const allChunks: ProcessedChunk[] = [];
  
  for (const file of files) {
    try {
      const chunks = processFile(file);
      allChunks.push(...chunks);
      const fileName = path.basename(file);
      const docType = getDocType(file);
      console.log(`  ✓ ${fileName} (${chunks.length} chunks) [${docType}]`);
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
  
  // Save to Firestore
  console.log('\n☁️ Enviando para Firestore...');
  try {
    const savedCount = await saveToFirestore(allChunks);
    console.log(`\n✅ ${savedCount} chunks salvos no Firestore!`);
  } catch (error) {
    console.error('❌ Erro ao salvar no Firestore:', error);
    
    // Save to JSON as fallback
    const outputPath = path.join(__dirname, 'funnel-brain-chunks.json');
    fs.writeFileSync(outputPath, JSON.stringify(allChunks, null, 2));
    console.log(`\n💾 Chunks salvos localmente em: ${outputPath}`);
  }
  
  console.log('\n🎉 Ingestão concluída!');
}

// Run
ingestFunnelKnowledge().catch(console.error);
