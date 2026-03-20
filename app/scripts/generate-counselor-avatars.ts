/**
 * Script: Generate cartoon-style avatar images for all 24 counselors
 * Uses Gemini 3.1 Flash Image Preview to generate cartoon portraits
 * Saves PNG + SVG (with embedded raster) to public/counselors/
 *
 * Usage: npx tsx scripts/generate-counselor-avatars.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const IMAGE_MODEL = 'gemini-3.1-flash-image-preview';

// Load env from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

const API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
if (!API_KEY) {
  console.error('❌ No GOOGLE_AI_API_KEY found. Set it in .env.local');
  process.exit(1);
}

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'counselors');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

interface CounselorInfo {
  id: string;
  name: string;
  description: string;
  era: string;
  accentColor: string;
}

const COUNSELORS: CounselorInfo[] = [
  // Funnel Council
  { id: 'russell_brunson', name: 'Russell Brunson', description: 'American entrepreneur, mid-30s, clean-shaven, energetic smile, marketing speaker', era: 'modern', accentColor: '#6366F1' },
  { id: 'dan_kennedy', name: 'Dan Kennedy', description: 'Older American businessman, 60s, glasses, serious expression, direct mail guru', era: 'modern', accentColor: '#6366F1' },
  { id: 'frank_kern', name: 'Frank Kern', description: 'Casual American marketer, 40s, surfer vibe, laid-back smile, behavioral dynamics expert', era: 'modern', accentColor: '#6366F1' },
  { id: 'sam_ovens', name: 'Sam Ovens', description: 'Young New Zealand entrepreneur, 30s, sharp features, minimalist style, consulting expert', era: 'modern', accentColor: '#6366F1' },
  { id: 'ryan_deiss', name: 'Ryan Deiss', description: 'American digital marketer, 40s, friendly smile, professional look, customer journey expert', era: 'modern', accentColor: '#6366F1' },
  { id: 'perry_belcher', name: 'Perry Belcher', description: 'Southern American businessman, 50s, friendly, stocky build, offer expert', era: 'modern', accentColor: '#6366F1' },

  // Copy Council
  { id: 'eugene_schwartz', name: 'Eugene Schwartz', description: 'American copywriter from the 1960s, balding, intellectual look, glasses, advertising legend', era: 'vintage', accentColor: '#F59E0B' },
  { id: 'claude_hopkins', name: 'Claude Hopkins', description: 'Early 1900s American ad man, formal suit, thin mustache, scientific advertising pioneer', era: 'vintage', accentColor: '#F59E0B' },
  { id: 'gary_halbert', name: 'Gary Halbert', description: 'American copywriter, 50s, confident grin, slightly disheveled, direct mail master', era: 'vintage', accentColor: '#F59E0B' },
  { id: 'joseph_sugarman', name: 'Joseph Sugarman', description: 'American direct response marketer, 60s, tinted sunglasses, friendly smile, storytelling master', era: 'vintage', accentColor: '#F59E0B' },
  { id: 'dan_kennedy_copy', name: 'Dan Kennedy (Copy)', description: 'Same Dan Kennedy but in copy mode — older American, 60s, glasses, stern but wise', era: 'vintage', accentColor: '#F59E0B' },
  { id: 'david_ogilvy', name: 'David Ogilvy', description: 'British ad man, 50s, pipe smoker, elegant, sophisticated, father of advertising', era: 'vintage', accentColor: '#F59E0B' },
  { id: 'john_carlton', name: 'John Carlton', description: 'American copywriter, 50s, casual, humorous expression, punchy style', era: 'vintage', accentColor: '#F59E0B' },
  { id: 'drayton_bird', name: 'Drayton Bird', description: 'British direct mail expert, 70s, white hair, kind eyes, simplicity advocate', era: 'vintage', accentColor: '#F59E0B' },
  { id: 'frank_kern_copy', name: 'Frank Kern (Copy)', description: 'Same Frank Kern but in copy mode — casual surfer marketer, 40s, mass control expert', era: 'modern', accentColor: '#F59E0B' },

  // Social Council
  { id: 'lia_haberman', name: 'Lia Haberman', description: 'American social media professor, 40s, professional woman, smart look, creator economy expert', era: 'modern', accentColor: '#F43F5E' },
  { id: 'rachel_karten', name: 'Rachel Karten', description: 'Young American social media strategist, 30s, energetic woman, creative, hook expert', era: 'modern', accentColor: '#F43F5E' },
  { id: 'nikita_beer', name: 'Nikita Beer', description: 'Young social media analyst, 20s, tech-savvy look, modern style, viral content decoder', era: 'modern', accentColor: '#F43F5E' },
  { id: 'justin_welsh', name: 'Justin Welsh', description: 'American solopreneur, 40s, clean-cut, confident, LinkedIn growth expert', era: 'modern', accentColor: '#F43F5E' },

  // Ads Council
  { id: 'justin_brooke', name: 'Justin Brooke', description: 'American media buyer, 40s, analytical look, focused, $100M+ in ad spend', era: 'modern', accentColor: '#3B82F6' },
  { id: 'nicholas_kusmich', name: 'Nicholas Kusmich', description: 'Canadian Facebook ads expert, 40s, friendly, strategic thinker, targeting master', era: 'modern', accentColor: '#3B82F6' },
  { id: 'jon_loomer', name: 'Jon Loomer', description: 'American Meta ads scientist, 40s, thoughtful expression, analytical, testing obsessed', era: 'modern', accentColor: '#3B82F6' },
  { id: 'savannah_sanchez', name: 'Savannah Sanchez', description: 'Young Latina TikTok ads expert, 20s, creative, energetic, UGC queen', era: 'modern', accentColor: '#3B82F6' },

  // Design
  { id: 'design_director', name: 'Design Director', description: 'Abstract art director figure, creative, wearing black turtleneck, artistic tools, design visionary', era: 'modern', accentColor: '#E6B447' },
];

async function generateImage(counselor: CounselorInfo): Promise<Buffer | null> {
  const styleGuide = counselor.era === 'vintage'
    ? 'vintage cartoon illustration style, warm sepia tones, classic advertising era feel'
    : 'modern flat cartoon illustration style, clean lines, contemporary feel';

  const prompt = `Create a cartoon-style portrait avatar of a marketing expert.
Style: ${styleGuide}, bold outlines, slightly exaggerated features, friendly and approachable.
Subject: ${counselor.description}.
Background: solid color ${counselor.accentColor} with subtle gradient.
Format: Square portrait, head and shoulders only, centered composition.
Art style: Similar to Notion avatar illustrations or Slack custom emoji style.
Do NOT include any text, watermarks, or labels in the image.`;

  try {
    const response = await fetch(
      `${GEMINI_BASE_URL}/models/${IMAGE_MODEL}:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ['IMAGE'],
            imageConfig: { aspectRatio: '1:1' },
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error(`  ❌ API error for ${counselor.id}: ${response.status} — ${err.slice(0, 200)}`);
      return null;
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts) {
      console.error(`  ❌ No parts in response for ${counselor.id}`);
      return null;
    }

    for (const part of parts) {
      if (part.inlineData?.data) {
        return Buffer.from(part.inlineData.data, 'base64');
      }
    }

    console.error(`  ❌ No image data in response for ${counselor.id}`);
    return null;
  } catch (err) {
    console.error(`  ❌ Fetch error for ${counselor.id}:`, (err as Error).message);
    return null;
  }
}

function createSvgWrapper(pngBase64: string, counselor: CounselorInfo): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="256" height="256" viewBox="0 0 256 256">
  <title>${counselor.name} — MKTHONEY Counselor Avatar</title>
  <desc>Cartoon-style avatar for ${counselor.name}, ${counselor.description}</desc>
  <defs>
    <clipPath id="circle">
      <circle cx="128" cy="128" r="120"/>
    </clipPath>
  </defs>
  <circle cx="128" cy="128" r="128" fill="${counselor.accentColor}"/>
  <image href="data:image/png;base64,${pngBase64}"
         x="8" y="8" width="240" height="240"
         clip-path="url(#circle)" preserveAspectRatio="xMidYMid slice"/>
  <circle cx="128" cy="128" r="124" fill="none" stroke="${counselor.accentColor}" stroke-width="4" opacity="0.5"/>
</svg>`;
}

async function main() {
  console.log(`🎨 Generating cartoon avatars for ${COUNSELORS.length} counselors...`);
  console.log(`   Model: ${IMAGE_MODEL}`);
  console.log(`   Output: ${OUTPUT_DIR}\n`);

  let success = 0;
  let failed = 0;

  for (const counselor of COUNSELORS) {
    const pngPath = path.join(OUTPUT_DIR, `${counselor.id}.png`);
    const svgPath = path.join(OUTPUT_DIR, `${counselor.id}.svg`);

    // Skip if already generated
    if (fs.existsSync(pngPath)) {
      console.log(`  ⏭️  ${counselor.name} — already exists, skipping`);
      success++;
      continue;
    }

    process.stdout.write(`  🖌️  ${counselor.name}...`);

    const imageBuffer = await generateImage(counselor);
    if (imageBuffer) {
      // Save PNG
      fs.writeFileSync(pngPath, imageBuffer);

      // Save SVG (with embedded PNG)
      const pngBase64 = imageBuffer.toString('base64');
      const svg = createSvgWrapper(pngBase64, counselor);
      fs.writeFileSync(svgPath, svg, 'utf-8');

      console.log(` ✅ (${(imageBuffer.length / 1024).toFixed(0)}KB)`);
      success++;
    } else {
      console.log(` ❌ failed`);
      failed++;
    }

    // Rate limit: 1 req per 2 seconds to avoid quota issues
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n📊 Results: ${success} ✅ / ${failed} ❌ / ${COUNSELORS.length} total`);
  console.log(`📁 Files saved to: ${OUTPUT_DIR}`);
}

main().catch(console.error);
