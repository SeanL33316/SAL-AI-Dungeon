import test from 'node:test';
import assert from 'node:assert/strict';
import { Adventure, beats } from './harness.mjs';

for (const pkg of ['SAL-only', 'src']) {
  test(`${pkg}: fresh install, status/help, manual generation, failed refresh`, () => {
    const a = new Adventure(pkg);
    const first = a.turn('/sal status');
    assert.match(first.output.text, /Story Arc Light 1\.3\.9/);
    assert.match(first.output.text, /Story Arc exists: no/);
    assert.equal(a.state.SAL.turn, 0);
    assert.equal(a.cards.filter(c => ['SAL Settings', 'Current Story Arc'].includes(c.keys)).length, 2);
    a.turn('/sal help');
    assert.equal(a.state.SAL.turn, 0);
    const planned = a.turn('/sal redo', beats);
    assert.match(planned.context.text, /PRIVATE PLANNING TASK/);
    assert.match(planned.output.text, /8 possibilities/);
    assert.equal(a.state.SAL.turn, 0);
    const arc = a.state.SAL.arc;
    assert.equal(a.cards.find(c => c.keys === 'Current Story Arc').entry, arc);
    const failed = a.turn('/sal redo', 'OK');
    assert.match(failed.output.text, /existing arc was kept/);
    assert.equal(a.state.SAL.arc, arc);
    assert.equal(a.state.SAL.nextArcTurn, 35);
    assert.equal(a.state.SAL.captureGeneration, false);
  });
  test(`${pkg}: ten turns, deferral, Continue, no automatic retry loop`, () => {
    const a = new Adventure(pkg);
    for (let i = 0; i < 10; i++) a.turn('I observe the village.');
    assert.equal(a.state.SAL.turn, 10);
    assert.equal(a.state.SAL.pendingGeneration, true);
    assert.doesNotMatch(a.turn('I leave the village.').context.text, /PRIVATE PLANNING TASK/);
    assert.equal(a.state.SAL.deferred, true);
    a.turn('/sal status');
    assert.equal(a.state.SAL.deferred, true);
    const planning = a.turn('', 'unstructured prose');
    assert.match(planning.context.text, /PRIVATE PLANNING TASK/);
    assert.equal(a.state.SAL.turn, 11);
    assert.equal(a.state.SAL.nextArcTurn, 46);
    assert.equal(a.state.SAL.pendingGeneration, false);
    assert.doesNotMatch(a.turn('').context.text, /PRIVATE PLANNING TASK/);
  });
  test(`${pkg}: stop cancels the due refresh for a full interval`, () => {
    const a = new Adventure(pkg);
    a.evaluate('SAL_state().turn = 10; SAL_state().nextArcTurn = 10; SAL_scheduleIfDue()');
    assert.match(a.turn('/sal stop').output.text, /generation stopped/);
    a.turn('I return to work.');
    assert.equal(a.state.SAL.pendingGeneration, false);
    assert.equal(a.state.SAL.nextArcTurn, 45);
  });
  test(`${pkg}: partial results, global removal clock, disable removal`, () => {
    const a = new Adventure(pkg);
    a.turn('/sal redo', beats.split('\n').slice(0, 5).join('\n'));
    assert.match(a.state.SAL.lastArcGenerationStatus, /5 possibilities/);
    a.state.SAL.turn = 4;
    a.turn('I return to work.');
    assert.equal(a.state.SAL.arc.match(/^\d+\./gm).length, 4);
    a.settings('enabled = true\nturnsPerElemRemoval = 0');
    const saved = a.state.SAL.arc;
    a.state.SAL.turn = 9;
    a.turn('I return to work.');
    assert.equal(a.state.SAL.arc, saved);
  });
  test(`${pkg}: settings comments, invalid values, clamping, unchanged card`, () => {
    const a = new Adventure(pkg);
    a.evaluate('SAL_state()');
    const settings = '# enabled = false\nnotenabled = false\nenabled = true // keep on\nturnsPerAICall = 999\nturnsPerElemRemoval = 2.5\ndebug = false\nturnsPerAICall = 12';
    a.settings(settings);
    a.turn('I continue working.');
    assert.equal(a.state.SAL.enabled, true);
    assert.equal(a.state.SAL.turnsPerAICall, 500);
    assert.equal(a.state.SAL.turnsPerElemRemoval, 5);
    assert.match(a.state.SAL.settingsWarning, /clamped.*whole.*Duplicate/);
    assert.equal(a.cards.find(c => c.keys === 'SAL Settings').entry, settings);
  });
  test(`${pkg}: manual card edits, blank repair, legacy key migration`, () => {
    const a = new Adventure(pkg);
    a.cards = [
      { keys: '/SAL Settings', title:'/SAL Settings', entry:'enabled = true', type:'SAL System' },
      { keys: '/Current Story Arc', title:'/Current Story Arc', entry: '1. A hand-authored possibility', type:'SAL System' },
    ];
    a.evaluate('SAL_state()');
    assert.equal(a.state.SAL.arc, '1. A hand-authored possibility');
    assert.equal(a.cards.length, 2);
    const card = a.cards.find(c => c.keys === 'Current Story Arc');
    card.entry = '';
    a.evaluate('SAL_state()');
    assert.equal(a.state.SAL.arc, a.cards.find(c => c.keys === 'Current Story Arc').entry);
    assert.match(a.state.SAL.lastCardSyncStatus, /repaired/);
    a.cards.find(c => c.keys === 'Current Story Arc').entry = '1. A different manual possibility';
    a.evaluate('SAL_state()');
    assert.equal(a.state.SAL.arc, '1. A different manual possibility');
  });
  test(`${pkg}: utility messages are removed without retaining full copies`, () => {
    const a = new Adventure(pkg);
    const status = a.turn('/sal status').output.text;
    const c = a.turn('I refuse.', 'Mira nods.', `Recent Story:\n${status}\nMira waits.`).context.text;
    assert.doesNotMatch(c, /SAL UTILITY RESPONSE|Initial observation period/);
    assert.match(c, /Mira waits/);
    assert.equal(a.state.SAL.utilityOutputs.length, 0);
  });
}
for (const addReturn of ['object', 'undefined', 'wrong-index']) {
  test(`card API ${addReturn}: rediscover by key, preserve unrelated cards`, () => {
    const a = new Adventure('SAL-only', { addReturn });
    a.cards = [{keys:'Other', entry:'do not overwrite', title:'Other', type:'lore'}];
    a.turn('/sal redo', beats);
    assert.equal(a.cards[0].entry, 'do not overwrite');
    assert.match(a.cards.find(c => c.keys === 'Current Story Arc').entry, /1\./);
  });
}
test('unavailable cards report a useful failure without claiming a saved arc', () => {
  const a = new Adventure('SAL-only', { noCards:true });
  const result = a.turn('/sal redo', beats);
  assert.match(result.output.text, /could not be saved/);
  assert.equal(a.state.SAL.arc, '');
  a.options.noCards = false;
  a.turn('/sal redo', beats);
  assert.equal(a.cards.find(c => c.keys === 'Current Story Arc').entry, a.state.SAL.arc);
});
test('failed arc removal preserves the previous saved arc', () => {
  const a = new Adventure();
  a.evaluate('SAL_state().arc = "1. The last possibility"; SAL_saveArc()');
  a.options.readonly = true;
  a.evaluate('SAL_removeFirstArcItem()');
  assert.equal(a.state.SAL.arc, '1. The last possibility');
  a.options.readonly = false;
  a.evaluate('SAL_removeFirstArcItem()');
  assert.equal(a.cards.find(c => c.keys === 'Current Story Arc').entry, '');
});
test('full planning prompt survives long context with memory and newest action', () => {
  const a = new Adventure('SAL-only', { info:{maxChars:5000, memoryLength:2000} });
  const r = a.turn('/sal redo', beats, 'm'.repeat(2000) + 'old '.repeat(4000) + 'LATEST STORY');
  assert.ok(r.context.text.length <= 5000);
  assert.match(r.context.text, /LATEST STORY/);
  assert.ok(r.context.text.endsWith(a.state.SAL.prompt));
  assert.equal(a.state.SAL.lastPlanningContextTrimmed, true);
});
test('too-small planning budget reports failure and preserves existing arc', () => {
  const a = new Adventure('SAL-only', { info:{maxChars:200} });
  a.evaluate('SAL_state().arc = "1. Existing possibility"; SAL_saveArc()');
  const r = a.turn('/sal redo', 'OK');
  assert.ok(r.context.text.length <= 200);
  assert.match(r.output.text, /could not fit/);
  assert.equal(a.state.SAL.arc, '1. Existing possibility');
  assert.equal(a.state.SAL.lastPlanningPromptAttached, false);
  assert.equal(a.state.SAL.captureGeneration, false);
});
test('missing context info degrades without Node or browser APIs', () => {
  const a = new Adventure();
  assert.match(a.evaluate('info = undefined; SAL_state().arc = "1. A possibility"; SAL_injectArc("STORY")'), /STORY/);
});
test('quiet default diagnostics; debug logs only failures and bounded output', () => {
  const a = new Adventure();
  a.turn('/sal redo', 'This is prose.');
  assert.equal(a.logs.length, 0);
  a.settings('debug = true');
  a.turn('/sal redo', 'This is prose.');
  assert.ok(a.logs.some(l => l.includes('Raw model output')));
  assert.ok(a.state.SAL.lastPlanningOutputPreview.length <= 320);
});
test('display command interrupted before Output cannot replace next player response', () => {
  const a = new Adventure();
  a.run('input', '/sal status');
  const r = a.turn('I leave.', 'You leave.');
  assert.equal(r.output.text, 'You leave.');
});
