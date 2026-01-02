/**
 * Script de Ingestão da Base de Conhecimento - Quiz Funnel (E10)
 * 
 * Processa os documentos de Quiz Funnel do brain principal
 * e os prepara para upload via API
 * 
 * Uso: npx ts-node scripts/ingest-quiz-funnel-knowledge.ts
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

// Lista de arquivos do E10 (Quiz Funnel Knowledge)
const QUIZ_FUNNEL_FILES = [
  // Case Library
  'brain/second brain/brain/council/case-library/quiz/madmuscles-quiz-funnel-2025.md',
  
  // Heuristics
  'brain/second brain/brain/council/heuristics/quiz_funnel_scale.md',
  'brain/second brain/brain/council/heuristics/creative_ai_testing.md',
  'brain/second brain/brain/council/heuristics/youtube_traffic_dominance.md',
  
  // Anti-Patterns
  'brain/second brain/brain/council/anti-patterns/single_landing_page.md',
  'brain/second brain/brain/council/anti-patterns/quiz_without_upsell_chain.md',
  
  // Mental Models
  'brain/second brain/brain/council/mental-models/micro_segmentation_framework.md',
  
  // Playbooks
  'brain/second brain/brain/council/playbooks/quiz_funnel_at_scale.md',
  
  // Scorecards
  'brain/second brain/brain/council/scorecards/quiz_funnel_scorecard.md',
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
  
  if (normalized.includes('/case-library/')) return 'case';
  if (normalized.includes('/heuristics/')) return 'heuristics';
  if (normalized.includes('/anti-patterns/')) return 'anti_pattern';
  if (normalized.includes('/mental-models/')) return 'mental_model';
  if (normalized.includes('/playbooks/')) return 'playbook';
  if (normalized.includes('/scorecards/')) return 'scorecard';
  return 'general';
}

// Chunk by headers
function chunkByHeaders(content: string, maxWords = 500): { text: string; section: string; lineStart: number; lineEnd: number }[] {
  const lines = content.split('\n');
  const chunks: { text: string; section: string; lineStart: number; lineEnd: number }[] = [];
  
  let currentChunk: string[] = [];
  let currentSection = 'Introduction';
  let chunkStartLine = 1;
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
      const wordCount = currentText.split(/\s+/).length;
      
      if (wordCount > maxWords) {
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

// Process single file
function processFile(filePath: string): ProcessedChunk[] {
  const fullPath = path.resolve(process.cwd(), '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`  ✗ Arquivo não encontrado: ${filePath}`);
    return [];
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const { metadata, body } = parseFrontmatter(content);
  const docType = metadata.doc_type || getDocType(filePath);
  
  const rawChunks = chunkByHeaders(body);
  
  return rawChunks.map(chunk => ({
    content: chunk.text,
    metadata: {
      counselor: metadata.counselor,
      docType,
      scope: metadata.scope || 'quiz_funnel',
      channel: metadata.channel,
      stage: metadata.stage,
      severity: metadata.severity,
      tenantId: null,
      status: 'approved',
      version: metadata.version || '2024-12-25',
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
async function ingestQuizFunnelKnowledge() {
  console.log('🎯 Ingestão E10 - Quiz Funnel Knowledge Base\n');
  console.log(`📂 ${QUIZ_FUNNEL_FILES.length} arquivos para processar\n`);

  const allChunks: ProcessedChunk[] = [];

  for (const file of QUIZ_FUNNEL_FILES) {
    try {
      const chunks = processFile(file);
      allChunks.push(...chunks);
      const fileName = path.basename(file);
      console.log(`  ✓ ${fileName} → ${chunks.length} chunks`);
    } catch (error) {
      console.error(`  ✗ Erro: ${file}`, error);
    }
  }

  console.log(`\n📊 Total: ${allChunks.length} chunks processados`);

  // Stats
  const byDocType: Record<string, number> = {};
  const byCounselor: Record<string, number> = {};

  for (const chunk of allChunks) {
    byDocType[chunk.metadata.docType] = (byDocType[chunk.metadata.docType] || 0) + 1;
    
    const counselors = Array.isArray(chunk.metadata.counselor) 
      ? chunk.metadata.counselor 
      : chunk.metadata.counselor 
        ? [chunk.metadata.counselor] 
        : [];
    
    counselors.forEach(c => {
      byCounselor[c] = (byCounselor[c] || 0) + 1;
    });
  }

  console.log('\n📈 Por tipo de documento:');
  Object.entries(byDocType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });

  console.log('\n👥 Por conselheiro:');
  Object.entries(byCounselor).forEach(([counselor, count]) => {
    console.log(`   ${counselor}: ${count}`);
  });

  // Save to JSON
  const outputPath = path.resolve(__dirname, 'quiz-funnel-chunks.json');
  fs.writeFileSync(outputPath, JSON.stringify(allChunks, null, 2));
  console.log(`\n💾 Chunks salvos em: ${outputPath}`);

  // Merge with existing processed-chunks.json if it exists
  const existingPath = path.resolve(__dirname, 'processed-chunks.json');
  let totalChunks = allChunks;
  
  if (fs.existsSync(existingPath)) {
    const existingChunks = JSON.parse(fs.readFileSync(existingPath, 'utf-8'));
    
    // Filter out existing quiz funnel chunks to avoid duplicates
    const filteredExisting = existingChunks.filter((c: ProcessedChunk) => 
      !c.source.file.includes('quiz_funnel') && 
      !c.source.file.includes('quiz/') &&
      !c.source.file.includes('madmuscles') &&
      !c.source.file.includes('youtube_traffic') &&
      !c.source.file.includes('creative_ai') &&
      !c.source.file.includes('micro_segmentation') &&
      !c.source.file.includes('single_landing') &&
      !c.source.file.includes('quiz_without')
    );
    
    totalChunks = [...filteredExisting, ...allChunks];
    console.log(`\n🔄 Mesclando com chunks existentes: ${filteredExisting.length} + ${allChunks.length} = ${totalChunks.length}`);
  }
  
  fs.writeFileSync(existingPath, JSON.stringify(totalChunks, null, 2));
  console.log(`✅ processed-chunks.json atualizado com ${totalChunks.length} chunks`);

  console.log('\n🎉 Ingestão concluída!');
  console.log('\n📤 Próximo passo: Execute o upload via API:');
  console.log('   npx ts-node scripts/upload-via-api.ts --clear');
}

// Run
ingestQuizFunnelKnowledge().catch(console.error);

