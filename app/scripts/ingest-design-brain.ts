/**
 * Script de Ingestão do Conselho de Design (ST-20.1)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ChunkMetadata {
  counselor?: string;
  docType: string;
  scope?: string;
  tenantId?: string | null;
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

function getDocType(filePath: string): string {
  const normalizedPath = filePath.replace(/\\/g, '/');
  if (normalizedPath.includes('/frameworks/')) return 'framework';
  if (normalizedPath.includes('/scorecards/')) return 'scorecard';
  if (normalizedPath.includes('/anti-patterns/')) return 'anti_pattern';
  if (normalizedPath.includes('/case-library/')) return 'case_study';
  if (normalizedPath.includes('/playbooks/')) return 'playbook';
  if (normalizedPath.includes('/heuristics/')) return 'heuristics';
  return 'design_brain';
}

function chunkByHeaders(content: string): { text: string; section: string; lineStart: number; lineEnd: number }[] {
  const lines = content.split('\n');
  const chunks: any[] = [];
  let currentChunk: string[] = [];
  let currentSection = 'Introduction';
  let chunkStartLine = 1;
  
  lines.forEach((line, i) => {
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

async function ingestDesignBrain() {
  const designBrainPath = path.resolve(__dirname, '../../templates/designer/design_brain_final_with_example (1)/design_brain/council');
  
  if (!fs.existsSync(designBrainPath)) {
    console.error(`❌ Diretório não encontrado: ${designBrainPath}`);
    process.exit(1);
  }

  const files: string[] = [];
  
  function walk(dir: string) {
    fs.readdirSync(dir).forEach(item => {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (item.endsWith('.md')) files.push(full);
    });
  }
  
  walk(designBrainPath);
  const allChunks: ProcessedChunk[] = [];
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const { metadata, body } = parseFrontmatter(content);
    const docType = getDocType(file);
    const chunks = chunkByHeaders(body);
    
    chunks.forEach(c => {
      allChunks.push({
        content: c.text,
        metadata: {
          counselor: 'design_director',
          docType,
          scope: metadata.scope || 'design',
          tenantId: null,
          status: 'approved',
          version: '1.0'
        },
        source: {
          file: path.relative(path.resolve(__dirname, '../../'), file),
          section: c.section,
          lineStart: c.lineStart,
          lineEnd: c.lineEnd
        }
      });
    });
  });

  const outputPath = path.join(__dirname, 'design-brain-chunks.json');
  fs.writeFileSync(outputPath, JSON.stringify(allChunks, null, 2));
  console.log(`✅ Ingestão completa: ${allChunks.length} chunks salvos em ${outputPath}`);
}

ingestDesignBrain().catch(console.error);



