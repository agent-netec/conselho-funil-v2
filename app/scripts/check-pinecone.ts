import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getPineconeIndex } from '../src/lib/ai/pinecone';

function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env.local');
    const content = readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return;
      const [k, ...rest] = trimmed.split('=');
      const v = rest.join('=').trim();
      process.env[k.trim()] = v.replace(/^\"|\"$/g, '');
    });
  } catch (err) {
    console.warn('[Env] Não foi possível carregar .env.local:', err);
  }
}

async function main() {
  loadEnv();
  const names = [
    'jon_loomer.md',
    'justin_brooke.md',
    'nicholas_kusmich.md',
    'savannah_sanchez.md',
    'ads_strategies.md',
    'copy_scorecard.md',
    'eugene_schwartz.md',
    'gary_halbert.md',
  ];

  const index = getPineconeIndex().namespace('knowledge');
  for (const name of names) {
    try {
      const res = await index.query({
        vector: new Array(768).fill(0),
        topK: 1,
        filter: { originalName: name },
        includeMetadata: true,
      });
      const hit = res.matches?.[0];
      console.log(name, hit ? 'FOUND' : 'MISSING', hit?.id ?? '');
    } catch (err) {
      console.error('ERR', name, err);
    }
  }
}

main();
