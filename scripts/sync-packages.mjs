// Maintainer-only. No runtime/build dependencies for people installing SAL.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const sal = read('SAL-only/1-Library.js');
const combined = read('src/1-Library.js');
const marker = '// ============================================================================\n// SAL — STORY ARC LIGHT — AI DUNGEON LIBRARY';
const start = combined.indexOf(marker);
if (start < 0 || combined.indexOf(marker, start + 1) >= 0) throw Error('Expected exactly one SAL core marker');
const version = sal.match(/const SAL_VERSION = "([^"]+)";/)[1];
const files = new Map([['src/1-Library.js', combined.slice(0, start).replace(/Story Arc Light \(SAL\) v[\d.]+/, `Story Arc Light (SAL) v${version}`) + sal]]);
for (const name of ['2-Input.js', '3-Context.js', '4-Output.js']) files.set(`src/${name}`, read(`SAL-only/${name}`));
let drift = false;
for (const [file, expected] of files) {
  if (read(file) === expected) continue;
  if (check) { console.error(`Out of sync: ${file}`); drift = true; }
  else fs.writeFileSync(path.join(root, file), expected);
}
if (drift) process.exitCode = 1;
else console.log(check ? 'Package copies match.' : 'Package copies synchronized.');
