import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [
  'processed-chunks.json',
  'processed-copy-chunks.json',
  'ads-brain-deep-chunks.json',
  'design-brain-chunks.json'
];

let allChunks: any[] = [];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    allChunks = allChunks.concat(content);
    console.log(`✅ Merged ${content.length} chunks from ${file}`);
  } else {
    console.warn(`⚠️ File not found: ${file}`);
  }
});

// Deduplicate by content + counselor
const uniqueChunks = allChunks.filter((chunk, index, self) =>
  index === self.findIndex(c => c.content === chunk.content && c.metadata.counselor === chunk.metadata.counselor)
);

fs.writeFileSync(path.join(__dirname, 'all-processed-chunks.json'), JSON.stringify(uniqueChunks, null, 2));
console.log(`\n✨ Total unique chunks: ${uniqueChunks.length}`);
console.log(`💾 Saved to all-processed-chunks.json`);
