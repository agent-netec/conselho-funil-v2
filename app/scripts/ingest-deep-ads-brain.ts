/**
 * Script de Ingestão do Ads Brain Completo (ST-12.12 Final)
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
  category?: string;
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
  if (normalizedPath.includes('/identity/')) return 'identity';
  if (normalizedPath.includes('/heuristics/')) return 'heuristics';
  if (normalizedPath.includes('/case-library/')) return 'case-library';
  if (normalizedPath.includes('/frameworks/')) return 'framework';
  if (normalizedPath.includes('/playbooks/')) return 'playbook';
  if (normalizedPath.includes('/decision-trees/')) return 'decision-tree';
  if (normalizedPath.includes('/scorecards/')) return 'scorecard';
  if (normalizedPath.includes('/anti-patterns/')) return 'anti-pattern';
  return 'ads_brain_deep';
}

function getCounselor(filePath: string, metadata: Record<string, any>): string | undefined {
  if (metadata.counselor) return metadata.counselor;
  const fileName = path.basename(filePath, '.md').toLowerCase();
  const counselorMap: Record<string, string> = {
    'justin_brooke': 'justin_brooke',
    'nicholas_kusmich': 'nicholas_kusmich',
    'jon_loomer': 'jon_loomer',
    'savannah_sanchez': 'savannah_sanchez'
  };
  for (const [key, value] of Object.entries(counselorMap)) {
    if (fileName.includes(key)) return value;
  }
  return undefined;
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
  return chunks.filter(c => c.text.length > 40);
}

async function ingestDeepAdsBrain() {
  const deepAdsPath = path.resolve(__dirname, '../../templates/ads_brain/ads_brain_complete_final/ads_brain/council');
  const files: string[] = [];
  
  function walk(dir: string) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(item => {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (item.endsWith('.md') && !item.startsWith('~$')) files.push(full);
    });
  }
  
  walk(deepAdsPath);
  console.log(`🔍 Encontrados ${files.length} arquivos para processamento.`);
  
  const allChunks: ProcessedChunk[] = [];
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const { metadata, body } = parseFrontmatter(content);
    const docType = getDocType(file);
    const counselor = getCounselor(file, metadata);
    const chunks = chunkByHeaders(body);
    
    chunks.forEach(c => {
      allChunks.push({
        content: c.text,
        metadata: {
          counselor,
          docType,
          scope: metadata.scope || 'ads',
          category: metadata.category,
          tenantId: null,
          status: 'approved',
          version: '2.0'
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

  const outputPath = path.join(__dirname, 'ads-brain-deep-chunks.json');
  fs.writeFileSync(outputPath, JSON.stringify(allChunks, null, 2));
  console.log(`✅ Ingestão profunda completa: ${allChunks.length} chunks salvos em ${outputPath}`);
}

ingestDeepAdsBrain().catch(console.error);



