import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ChunkMetadata {
  counselor?: string;
  docType: string;
  scope?: string;
  channel?: string;
  stage?: string;
  tenantId?: string | null;
  status: 'draft' | 'approved';
  isApprovedForAI: boolean;
  version: string;
  council?: string;
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

const COUNSELOR_KEYWORDS: Record<string, string[]> = {
  russell_brunson: ['russell', 'brunson', 'clickfunnels', 'dotcom secrets', 'expert secrets', 'funnel hacking'],
  dan_kennedy: ['kennedy', 'dan kennedy', 'magnetic marketing', 'no b.s.', 'direct response'],
  frank_kern: ['frank kern', 'kern', 'behavioral dynamic', 'intent based branding', 'mass control'],
  sam_ovens: ['sam ovens', 'ovens', 'consulting.com', 'qualification', 'niche', 'consulting'],
  ryan_deiss: ['ryan deiss', 'deiss', 'digitalmarketer', 'customer value journey', 'tripwire', 'ltv'],
  perry_belcher: ['perry belcher', 'belcher', 'monetization', 'backend', 'upsell'],
  eugene_schwartz: ['eugene schwartz', 'schwartz', 'breakthrough advertising', 'awareness levels'],
  claude_hopkins: ['claude hopkins', 'hopkins', 'scientific advertising', 'test and measure'],
  gary_halbert: ['gary halbert', 'halbert', 'boron letters', 'headline', 'curiosity'],
  joseph_sugarman: ['sugarman', 'adweek copywriting', 'storytelling', 'slippery slide'],
  david_ogilvy: ['ogilvy', 'brand', 'confessions of an advertising man'],
  john_carlton: ['john carlton', 'carlton', 'authentic voice', 'kick-ass copy'],
  drayton_bird: ['drayton bird', 'bird', 'common sense direct marketing'],
  lia_haberman: ['lia haberman', 'haberman', 'algorithm', 'social updates'],
  rachel_karten: ['rachel karten', 'karten', 'hooks', 'creatives'],
  nikita_beer: ['nikita beer', 'beer', 'viral', 'growth hacking'],
  justin_welsh: ['justin welsh', 'welsh', 'social funnel', 'solopreneur'],
  justin_brooke: ['justin brooke', 'brooke', 'traffic', 'ads strategy', 'scale'],
  nicholas_kusmich: ['nicholas kusmich', 'kusmich', 'meta ads', 'contextual advertising'],
  jon_loomer: ['jon loomer', 'loomer', 'analytics', 'technical ads'],
  savannah_sanchez: ['savannah sanchez', 'sanchez', 'tiktok ads', 'ugc'],
  design_director: ['design director', 'art direction', 'briefing', 'thumbnail', 'visual']
};

function getCounselorFromContent(content: string, fileName: string): string | undefined {
  const normalized = (content + ' ' + fileName).toLowerCase();
  
  for (const [id, keywords] of Object.entries(COUNSELOR_KEYWORDS)) {
    if (keywords.some(k => normalized.includes(k.toLowerCase()))) {
      return id;
    }
  }
  return undefined;
}

function getDocType(filePath: string, content: string): string {
  const normalized = (filePath + ' ' + content).toLowerCase();
  if (normalized.includes('heuristic') || normalized.includes('regra') || normalized.includes('rule')) return 'heuristics';
  if (normalized.includes('identity') || normalized.includes('identidade') || normalized.includes('quem é')) return 'identity';
  if (normalized.includes('playbook') || normalized.includes('guia passo')) return 'playbooks';
  if (normalized.includes('scorecard') || normalized.includes('checklist')) return 'scorecards';
  if (normalized.includes('anti-pattern')) return 'anti-patterns';
  if (normalized.includes('case') || normalized.includes('estudo de caso')) return 'case-library';
  if (normalized.includes('mental model') || normalized.includes('modelo mental')) return 'mental-models';
  return 'general';
}

function chunkContent(content: string, maxTokens = 250): { text: string; section: string; lineStart: number; lineEnd: number }[] {
  const lines = content.split('\n');
  const chunks: { text: string; section: string; lineStart: number; lineEnd: number }[] = [];
  
  let currentChunk: string[] = [];
  let currentSection = 'Introduction';
  let chunkStartLine = 1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headerMatch = line.match(/^(#{1,4})\s+(.+)$/);
    
    if (headerMatch) {
      if (currentChunk.length > 0) {
        chunks.push({
          text: currentChunk.join('\n').trim(),
          section: currentSection,
          lineStart: chunkStartLine,
          lineEnd: i
        });
      }
      currentSection = headerMatch[2];
      currentChunk = [line];
      chunkStartLine = i + 1;
    } else {
      currentChunk.push(line);
      const estimatedTokens = currentChunk.join('\n').split(/\s+/).length;
      if (estimatedTokens > maxTokens) {
        chunks.push({
          text: currentChunk.join('\n').trim(),
          section: currentSection,
          lineStart: chunkStartLine,
          lineEnd: i + 1
        });
        currentChunk = [];
        chunkStartLine = i + 2;
      }
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push({
      text: currentChunk.join('\n').trim(),
      section: currentSection,
      lineStart: chunkStartLine,
      lineEnd: lines.length
    });
  }
  
  return chunks.filter(c => c.text.length > 40);
}

function findMdFiles(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (!file.startsWith('.') && !file.startsWith('_') && file !== 'node_modules') {
        results = results.concat(findMdFiles(filePath));
      }
    } else if (file.endsWith('.md')) {
      results.push(filePath);
    }
  });
  return results;
}

async function start() {
  console.log('🚀 Iniciando INGESTÃO MASSIVA de conhecimento...');
  
  const searchDirs = [
    path.resolve(__dirname, '../../templates'),
    path.resolve(__dirname, '../../brain'),
    path.resolve(__dirname, '../../_netecmt/brain')
  ];
  
  let allFiles: string[] = [];
  searchDirs.forEach(dir => {
    console.log(`🔍 Buscando em: ${dir}`);
    allFiles = allFiles.concat(findMdFiles(dir));
  });
  
  // Deduplicate files
  allFiles = [...new Set(allFiles)];
  console.log(`📄 Total de arquivos encontrados: ${allFiles.length}`);
  
  const allChunks: ProcessedChunk[] = [];
  const version = new Date().toISOString().split('T')[0] + '.v-massive';
  
  allFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const fileName = path.basename(file);
      const chunks = chunkContent(content);
      
      chunks.forEach(c => {
        const counselor = getCounselorFromContent(c.text, fileName);
        const docType = getDocType(file, c.text);
        
        allChunks.push({
          content: c.text,
          metadata: {
            counselor,
            docType,
            status: 'approved',
            isApprovedForAI: true,
            version,
            tenantId: null
          },
          source: {
            file: path.relative(process.cwd(), file),
            section: c.section,
            lineStart: c.lineStart,
            lineEnd: c.lineEnd
          }
        });
      });
      console.log(`  ✓ ${fileName} (${chunks.length} chunks)`);
    } catch (e) {
      console.error(`  ✗ Erro em ${file}: ${e}`);
    }
  });
  
  console.log(`\n📊 Total Final: ${allChunks.length} chunks processados.`);
  
  // Save
  const outputPath = path.join(__dirname, 'massive-brain-chunks.json');
  fs.writeFileSync(outputPath, JSON.stringify(allChunks, null, 2));
  console.log(`💾 Salvo em: ${outputPath}`);
}

start();
