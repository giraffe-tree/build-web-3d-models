import { access, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const required = [
  'ASSET_BRIEF.md',
  'REVIEW_LEDGER.md',
  'KNOWN_LIMITATIONS.md',
  'quality-evidence.json',
  'screenshots/final/hero.png',
  'screenshots/final/orbit-a.png',
  'screenshots/final/orbit-b.png',
  'screenshots/final/neutral-material.png',
  'screenshots/final/subject-proof.png',
];

for (const relativePath of required) {
  const absolutePath = resolve(root, relativePath);
  await access(absolutePath);
  const file = await stat(absolutePath);
  if (!file.isFile() || file.size === 0) throw new Error(`Missing or empty: ${relativePath}`);
}

const source = await readFile(resolve(root, 'src/main.js'), 'utf8');
for (const marker of ['PrimaryBough_', 'instancePhase', 'short_shoots', '__GINKGO_METRICS__', 'subjectProof']) {
  if (!source.includes(marker)) throw new Error(`Missing source marker: ${marker}`);
}

console.log('Source and evidence presence checks passed.');
