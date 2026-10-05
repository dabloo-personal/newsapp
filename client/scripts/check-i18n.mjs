// Fails when a translatable literal has no English entry, or Devanagari text sits outside t()/msgid()/translate().
// Intentional exceptions: `// i18n-ignore` on a line, or `// i18n-ignore-file` anywhere in a file.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src', import.meta.url));
const { default: EN } = await import('../src/i18n/en.js');

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(jsx?|mjs)$/.test(name) && !/i18n[\\/]en\.js$/.test(p)) files.push(p);
  }
})(root);

const DEVANAGARI = /[ऀ-ॿ]/;
const CALL = /\b(?:t|msgid|translate)\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g;
const problems = [];
const used = new Set();

for (const file of files) {
  const rel = relative(root, file);
  const source = readFileSync(file, 'utf8');
  if (source.includes('i18n-ignore-file')) continue;

  for (const [, , text] of source.matchAll(CALL)) {
    used.add(text);
    if (DEVANAGARI.test(text) && !(text in EN)) problems.push(`${rel}: no English entry for "${text}"`);
  }

  const stripped = source
    .replace(CALL, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => (line.includes('i18n-ignore') ? '' : line.replace(/\/\/.*$/, '')));
  stripped.forEach((line, i) => {
    if (DEVANAGARI.test(line)) problems.push(`${rel}:${i + 1}: Devanagari outside t(): ${line.trim().slice(0, 70)}`);
  });
}

const unused = Object.keys(EN).filter((k) => !used.has(k) && !['हिंदी'].includes(k));
if (unused.length) console.warn(`(info) ${unused.length} unused dictionary keys:\n  ${unused.join('\n  ')}`);

if (problems.length) {
  console.error(`i18n check failed:\n${problems.map((p) => '  ' + p).join('\n')}`);
  process.exit(1);
}
console.log(`i18n check passed (${files.length} files, ${used.size} strings).`);
