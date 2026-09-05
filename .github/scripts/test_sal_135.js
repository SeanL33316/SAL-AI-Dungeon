const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const library = fs.readFileSync('SAL-only/library.js', 'utf8');

function makeCtx() {
  const ctx = {
    state: {},
    storyCards: [],
    info: { maxChars: 5000, memoryLength: 500 },
    console,
    log: () => {},
    addStoryCard(keys, entry, type) {
      if (ctx.storyCards.some(c => String(c.keys).toLowerCase() === String(keys).toLowerCase())) return false;
      ctx.storyCards.push({ id: ctx.storyCards.length + 1, keys, entry, type });
      return ctx.storyCards.length - 1;
    },
    updateStoryCard(index, keys, entry, type) {
      if (!ctx.storyCards[index]) throw new Error('missing card');
      ctx.storyCards[index] = { ...ctx.storyCards[index], keys, entry, type };
    },
    removeStoryCard(index) { ctx.storyCards.splice(index, 1); },
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(library, ctx);
  return ctx;
}

function eight(prefix='Beat') {
  return Array.from({length: 8}, (_, i) => `${i + 1}. ${prefix} ${i + 1} develops naturally`).join('\n');
}

const ctx = makeCtx();
const s = ctx.state.SAL;
assert.strictEqual(s.version, '1.3.5');
assert.strictEqual(s.promptVersion, 2);
assert.strictEqual(s.nextArcTurn, 10);
assert.ok(s.prompt.includes('4 to 8 words'));
assert.ok(s.prompt.includes('under 80 words'));

const variants = [
  eight('Standard'),
  Array.from({length:8},(_,i)=>`${i+1}) Paren ${i+1} moves forward`).join('\n'),
  Array.from({length:8},(_,i)=>`${i+1}: Colon ${i+1} moves forward`).join('\n'),
  Array.from({length:8},(_,i)=>`${i+1} - Dash ${i+1} moves forward`).join('\n'),
  Array.from({length:8},(_,i)=>`[${i+1}] Bracket ${i+1} moves forward`).join('\n'),
  Array.from({length:8},(_,i)=>`**${i+1}.** Bold ${i+1} moves forward`).join('\n'),
  Array.from({length:8},(_,i)=>`${i+1}. OneLine${i+1} moves forward`).join(' '),
  Array.from({length:8},(_,i)=>`- Bullet ${i+1} moves forward`).join('\n'),
  JSON.stringify(Array.from({length:8},(_,i)=>`JSON ${i+1} moves forward`)),
  Array.from({length:8},(_,i)=>`Plain ${i+1} moves forward`).join('\n'),
];
for (const variant of variants) {
  const parsed = ctx.SAL_extractArcResult(variant);
  assert.strictEqual(parsed.count, 8, variant);
  assert.ok(parsed.numbered.includes('8.'), variant);
}

s.turn = 9;
s.nextArcTurn = 10;
s.pendingGeneration = false;
s.captureGeneration = false;
s.deferred = false;
const turn10 = ctx.SAL_onNormalOutput('Normal story output');
assert.strictEqual(s.turn, 10);
assert.strictEqual(ctx.SAL_isBusy(), true);
assert.ok(turn10.includes('will update next turn'));

const firstSaved = ctx.SAL_processGeneratedOutput(eight('First'));
assert.ok(firstSaved.includes('updated and saved'));
assert.strictEqual(s.nextArcTurn, 45);
assert.strictEqual(s.lastArcGenerationStatus, 'success');

const noisy = '<< ⚠️ Story Arc Light will update next turn. Click Continue. >>';
const base = 'M'.repeat(500) + 'OLD'.repeat(3000) + noisy + 'RECENT_STORY_MARKER';
const planned = ctx.SAL_generationContext(base);
assert.ok(planned.length <= ctx.info.maxChars);
assert.ok(planned.includes('RECENT_STORY_MARKER'));
assert.ok(planned.includes('Output the eight numbered lines only.'));
assert.ok(!planned.includes('Story Arc Light will update next turn'));
assert.strictEqual(s.lastPlanningContextTrimmed, true);

s.turn = 45;
s.captureGeneration = true;
s.pendingGeneration = true;
const oneLine = Array.from({length:8},(_,i)=>`${i+1}. Late${i+1} changes direction`).join(' ');
const lateSaved = ctx.SAL_processGeneratedOutput(oneLine);
assert.ok(lateSaved.includes('updated and saved'));
assert.strictEqual(s.nextArcTurn, 80);

s.turn = 78;
ctx.SAL_protectPlayerInput('/sal redo');
const redoInput = ctx.SAL_inputCommands('/sal redo');
assert.strictEqual(redoInput, '\u200B');
assert.strictEqual(s.captureGeneration, true);
const redoSaved = ctx.SAL_processGeneratedOutput(
  Array.from({length:8},(_,i)=>`${i+1}: Redo${i+1} remains flexible`).join('\n')
);
assert.ok(redoSaved.includes('updated and saved'));
assert.strictEqual(s.nextArcTurn, 113);

const beforeArc = s.arc;
s.captureGeneration = true;
s.pendingGeneration = true;
const failed = ctx.SAL_processGeneratedOutput('1. Only one item\n2. Only two items');
assert.ok(failed.includes('2/8 items recognized'));
assert.strictEqual(s.arc, beforeArc);
assert.strictEqual(s.captureGeneration, false);
assert.strictEqual(s.lastArcGenerationStatus, 'failed (2/8 recognized)');

s.turn = 45;
s.nextArcTurn = 45;
s.pendingGeneration = true;
s.captureGeneration = true;
s.deferred = false;
ctx.SAL_protectPlayerInput('I keep playing normally.');
assert.strictEqual(ctx.SAL_isBusy(), false);
assert.strictEqual(s.deferred, true);
const normal = ctx.SAL_onNormalOutput('The story continues.');
assert.strictEqual(s.turn, 46);
assert.strictEqual(ctx.SAL_isBusy(), false);
assert.strictEqual(s.deferred, true);
assert.ok(!normal.includes('will update next turn'));
ctx.SAL_protectPlayerInput('');
assert.strictEqual(ctx.SAL_isBusy(), true);
assert.strictEqual(s.deferred, false);

s.arc = ctx.SAL_softArcText(eight('Guide'));
const injected = ctx.SAL_injectArc(base);
assert.ok(injected.length <= ctx.info.maxChars);
assert.ok(injected.includes('<<STORY ARC LIGHT — OPTIONAL GUIDANCE>>'));
assert.ok(injected.includes('RECENT_STORY_MARKER'));

ctx.SAL_rememberUtilityOutput('Story Arc Light 1.3.5\nEnabled: yes');
const cleaned = ctx.SAL_cleanContextNoise('Story text\nStory Arc Light 1.3.5\nEnabled: yes\nMore story');
assert.ok(!cleaned.includes('Story Arc Light 1.3.5'));
assert.ok(cleaned.includes('More story'));

console.log('SAL v1.3.5 full lifecycle tests passed');
