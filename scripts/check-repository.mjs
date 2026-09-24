// Fast, dependency-free maintainer checks. Never pasted into AI Dungeon.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const fail = message => { throw new Error(message); };
const sync = spawnSync(process.execPath, [path.join(root, 'scripts/sync-packages.mjs'), '--check'], { stdio:'inherit' });
if (sync.status !== 0) process.exit(sync.status || 1);
const version = JSON.parse(read('package.json')).version;
for (const pkg of ['SAL-only', 'src']) {
  for (const name of ['1-Library.js','2-Input.js','3-Context.js','4-Output.js']) {
    const source = read(`${pkg}/${name}`);
    new vm.Script(source, {filename:`${pkg}/${name}`});
    if (!source.includes(`v${version}`)) fail(`Version header missing: ${pkg}/${name}`);
  }
  if (!read(`${pkg}/1-Library.js`).includes(`const SAL_VERSION = "${version}";`)) fail(`Version mismatch: ${pkg}`);
}
const combined = read('src/1-Library.js');
const upstreamStart = combined.indexOf('// Your "Library" tab should look like this');
const upstreamEnd = combined.indexOf('// ============================================================================\n// SAL — STORY ARC LIGHT — AI DUNGEON LIBRARY');
const patched = ') + ((right !== "") ? ("\\n\\n" + right) : "")); // SAL patch: preserve valid memories.';
const original = ') + (right !== "") ? ("\\n\\n" + right) : "");';
let upstream = combined.slice(upstreamStart, upstreamEnd).trimEnd();
if (upstream.split(patched).length !== 2) fail('Expected one documented vendor patch');
upstream = upstream.replace(patched, original);
const cleanupPatch = String.raw`.replace(/^\s*(?:(?:memory|memories)(?:\s+summary)?|summary|old\s+memory)\s*:\s*/i, "")`;
if (upstream.split(cleanupPatch).length !== 2) fail('Expected documented compression cleanup patch');
upstream = upstream.replace(cleanupPatch, String.raw`.replace(/^[\s\S]*:/g, "")`);
const digest = crypto.createHash('sha256').update(upstream).digest('hex');
if (digest !== 'c2e2ed8e664ea88ea0e35faa77287a9ad517416dbadbd2f16dc79815b3c70fea') fail('Undocumented change to bundled upstream source');

function files(directory) {
  return fs.readdirSync(directory, {withFileTypes:true}).flatMap(entry => {
    if (entry.name === '.git' || entry.name === 'node_modules') return [];
    const target = path.join(directory,entry.name);
    return entry.isDirectory() ? files(target) : [target];
  });
}
let links = 0;
let snippets = 0;
for (const file of files(root).filter(file => file.endsWith('.md'))) {
  const source = fs.readFileSync(file,'utf8');
  for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const link = match[1];
    if (/^(https?:|mailto:)/.test(link)) continue;
    const [target, fragment] = link.split('#');
    const resolved = target ? path.resolve(path.dirname(file),target) : file;
    if (!fs.existsSync(resolved)) fail(`Broken local link in ${file}: ${link}`);
    if (fragment && resolved.endsWith('.md')) {
      const headings = [...fs.readFileSync(resolved,'utf8').matchAll(/^#+ (.+)$/gm)].map(m => m[1].toLowerCase().replace(/[^\p{L}\p{N}_\- ]/gu,'').replaceAll(' ','-'));
      if (!headings.includes(fragment)) fail(`Missing heading in ${file}: ${link}`);
    }
    links++;
  }
  for (const match of source.matchAll(/```javascript\n([\s\S]*?)```/g)) {
    new vm.Script(read('SAL-only/1-Library.js') + '\n' + match[1], { filename: file });
    snippets++;
  }
}
if (!read('README.md').includes(`v${version}`)) fail('README version mismatch');
console.log(`Repository checks passed: source syntax, version ${version}, pinned upstream, ${links} local links, ${snippets} JS examples.`);
