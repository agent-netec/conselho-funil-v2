import fs from 'fs';
import path from 'path';
import type { CounselorId } from '@/types';
import type {
  BrainIdentityCard,
  BrainFrontmatter,
  BrainDomain,
  EvaluationFramework,
  RedFlag,
  GoldStandard,
} from './types';

// ============================================
// BrainLoader — Reads and caches identity cards
// ============================================

const IDENTITY_CARDS_DIR = path.join(process.cwd(), 'src', 'data', 'identity-cards');

/** In-memory cache (survives until server restart) */
const cache = new Map<string, BrainIdentityCard>();
let allLoaded = false;

// ---- Parsing helpers ----

function parseFrontmatter(raw: string): { frontmatter: BrainFrontmatter; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('Invalid frontmatter format');

  const yamlBlock = match[1];
  const body = match[2];

  const fm: Record<string, any> = {};
  for (const line of yamlBlock.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value: any = line.slice(colonIdx + 1).trim();
    // Parse numbers
    if (/^\d+$/.test(value)) value = parseInt(value, 10);
    fm[key] = value;
  }

  return {
    frontmatter: fm as BrainFrontmatter,
    body,
  };
}

function extractSection(body: string, heading: string): string {
  const regex = new RegExp(`## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`);
  const match = body.match(regex);
  return match ? match[1].trim() : '';
}

function extractJsonBlock(sectionContent: string): any {
  const match = sectionContent.match(/```json\s*\n([\s\S]*?)\n```/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    console.warn('[BrainLoader] Failed to parse JSON block');
    return null;
  }
}

function extractTitle(body: string): { name: string; subtitle: string } {
  const match = body.match(/^# (.+?)(?:\s*—\s*(.+))?$/m);
  return {
    name: match?.[1]?.trim() ?? '',
    subtitle: match?.[2]?.trim() ?? '',
  };
}

function extractCatchphrases(section: string): string[] {
  return section
    .split('\n')
    .filter(line => line.startsWith('- '))
    .map(line => line.replace(/^- "?|"?$/g, '').trim());
}

function normalizeExpertSays(obj: Record<string, any>): string {
  // Expert-specific field names (halbert_says, kennedy_says, etc.) -> expertSays
  const expertSaysKey = Object.keys(obj).find(k => k.endsWith('_says'));
  return obj.expertSays || (expertSaysKey ? obj[expertSaysKey] : '');
}

function normalizeRedFlags(raw: any[]): RedFlag[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(rf => ({
    id: rf.id,
    label: rf.label,
    penalty: rf.penalty,
    before: rf.before,
    after: rf.after,
    expertSays: normalizeExpertSays(rf),
  }));
}

function normalizeGoldStandards(raw: any[]): GoldStandard[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(gs => ({
    id: gs.id,
    label: gs.label,
    bonus: gs.bonus,
    example: gs.example,
    expertSays: normalizeExpertSays(gs),
  }));
}

function buildRawNarrative(body: string): string {
  // Extract everything BEFORE the first JSON code block (narrative sections only)
  const parts = body.split(/\n## evaluation_frameworks/);
  return parts[0].trim();
}

// ---- Core loader ----

function parseIdentityCard(raw: string): BrainIdentityCard {
  const { frontmatter, body } = parseFrontmatter(raw);
  const { name, subtitle } = extractTitle(body);

  const philosophySection = extractSection(body, 'Filosofia Core');
  const principlesSection = extractSection(body, 'Principios Operacionais');
  const voiceSection = extractSection(body, 'Voz de Analise');
  const catchphrasesSection = extractSection(body, 'Catchphrases');
  const evalSection = extractSection(body, 'evaluation_frameworks');
  const redFlagsSection = extractSection(body, 'red_flags');
  const goldStandardsSection = extractSection(body, 'gold_standards');

  const evaluationFrameworks: Record<string, EvaluationFramework> =
    extractJsonBlock(evalSection) ?? {};
  const redFlagsRaw = extractJsonBlock(redFlagsSection) ?? [];
  const goldStandardsRaw = extractJsonBlock(goldStandardsSection) ?? [];

  return {
    frontmatter,
    name,
    subtitle,
    philosophy: philosophySection,
    principles: principlesSection,
    voice: voiceSection,
    catchphrases: extractCatchphrases(catchphrasesSection),
    evaluationFrameworks,
    redFlags: normalizeRedFlags(redFlagsRaw),
    goldStandards: normalizeGoldStandards(goldStandardsRaw),
    rawNarrative: buildRawNarrative(body),
  };
}

function loadAllCards(): void {
  if (allLoaded) return;

  if (!fs.existsSync(IDENTITY_CARDS_DIR)) {
    console.warn(`[BrainLoader] Identity cards directory not found: ${IDENTITY_CARDS_DIR}`);
    allLoaded = true;
    return;
  }

  const files = fs.readdirSync(IDENTITY_CARDS_DIR).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const filePath = path.join(IDENTITY_CARDS_DIR, file);
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const card = parseIdentityCard(raw);
      cache.set(card.frontmatter.counselor, card);
    } catch (err) {
      console.error(`[BrainLoader] Error loading ${file}:`, err);
    }
  }

  allLoaded = true;
  console.log(`[BrainLoader] Loaded ${cache.size} identity cards`);
}

// ---- Public API ----

/**
 * Load a single brain by counselor ID.
 */
export function loadBrain(counselorId: CounselorId): BrainIdentityCard | null {
  loadAllCards();
  return cache.get(counselorId) ?? null;
}

/**
 * Load all brains for a specific domain.
 */
export function loadBrainsByDomain(domain: BrainDomain): BrainIdentityCard[] {
  loadAllCards();
  return Array.from(cache.values()).filter(c => c.frontmatter.domain === domain);
}

/**
 * Load all brains.
 */
export function getAllBrains(): BrainIdentityCard[] {
  loadAllCards();
  return Array.from(cache.values());
}

/**
 * Get a specific evaluation framework from a brain.
 */
export function getFramework(
  counselorId: CounselorId,
  frameworkId: string
): EvaluationFramework | null {
  const brain = loadBrain(counselorId);
  if (!brain) return null;
  return brain.evaluationFrameworks[frameworkId] ?? null;
}

/**
 * Force reload all cards (useful after updates).
 */
export function reloadBrains(): void {
  cache.clear();
  allLoaded = false;
  loadAllCards();
}
