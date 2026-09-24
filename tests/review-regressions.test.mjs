import test from 'node:test';
import assert from 'node:assert/strict';
import { Adventure, beats } from './harness.mjs';

test('parser rejects non-text JSON values', () => {
  const a = new Adventure();
  assert.equal(a.evaluate('SAL_extractArcResult("[{}, {}, {}, {}, {}]").numbered'), '');
});
test('disabled SAL cancels pending planning and preserves the arc', () => {
  const a = new Adventure();
  a.turn('/sal redo', beats);
  a.state.SAL.pendingGeneration = a.state.SAL.captureGeneration = true;
  a.state.SAL.turn = 4;
  const arc = a.state.SAL.arc;
  a.settings('enabled = false\nturnsPerElemRemoval = 5');
  const turn = a.turn('', 'A peaceful evening follows.');
  assert.doesNotMatch(turn.context.text, /PRIVATE PLANNING TASK/);
  assert.equal(a.state.SAL.arc, arc);
});
test('zero-width Continue placeholder does not defer pending planning', () => {
  const a = new Adventure();
  a.evaluate('SAL_state().pendingGeneration = true; SAL_state().captureGeneration = true');
  assert.match(a.turn('\u200B', beats).context.text, /PRIVATE PLANNING TASK/);
});
test('failed card write keeps the previous saved arc across hooks', () => {
  const a = new Adventure();
  a.turn('/sal redo', beats);
  a.options.readonly = true;
  const fresh = beats.replaceAll('familiar neighbor', 'traveling merchant');
  a.turn('/sal redo', fresh);
  a.evaluate('SAL_state()');
  assert.match(a.state.SAL.arc, /familiar neighbor/);
});
test('oversized optional guidance does not erase the player action', () => {
  const a = new Adventure('SAL-only', { info: { maxChars: 500 } });
  a.evaluate('SAL_state().arc = "1. " + "possibility ".repeat(500); SAL_saveArc()');
  const r = a.turn('I refuse the invitation.');
  assert.ok(r.context.text.length <= 500);
  assert.match(r.context.text, /I refuse the invitation/);
});
test('a malformed state container is repaired', () => {
  const a = new Adventure();
  a.state.SAL = 'invalid';
  a.evaluate('SAL_state()');
  assert.equal(typeof a.state.SAL, 'object');
});
test('combined NPC thoughts retain arc guidance and count narrative turns', () => {
  const a = new Adventure('src', { setup: 'MainSettings.InnerSelf.IMPORTANT_SCENARIO_CHARACTERS = "Mira";' });
  a.turn('/sal redo', beats);
  a.history = [{type:'story', text:'Mira waits at the bridge.'}];
  const r = a.turn('', '(bridge_plan = `I should inspect the bridge tomorrow.`) Mira waves you over.');
  assert.match(r.context.text, /OPTIONAL GUIDANCE/);
  assert.match(r.output.text, /Mira waves/);
  assert.equal(a.state.SAL.turn, 1);
});
test('combined NPC brain context is retained on explicit player actions', () => {
  const a = new Adventure('src', { setup: 'MainSettings.InnerSelf.IMPORTANT_SCENARIO_CHARACTERS = "Mira";' });
  a.history = [{type:'story', text:'Mira waits at the bridge.'}];
  const r = a.turn('I ask Mira about the bridge.', '(bridge_plan = `I should inspect the bridge tomorrow.`) Mira answers.');
  assert.match(r.context.text, /OPERATING ENVIRONMENT/);
  assert.ok(a.state.InnerSelf.ops > 0);
});

test('queued automatic generation does not capture output before Context runs', () => {
  const a = new Adventure();
  a.evaluate('SAL_state().turn = 10; SAL_state().nextArcTurn = 10; SAL_scheduleIfDue()');
  assert.equal(a.state.SAL.pendingGeneration, true);
  assert.equal(a.state.SAL.captureGeneration, false);
  assert.equal(a.run('output', 'A cached story retry.').text, 'A cached story retry.');
});
test('Auto-Cards keeps valid Memories content during context cleanup', () => {
  const a = new Adventure('src');
  const result = a.run('library', 'Memories:\n- Mira owns the bridge.\nRecent Story:\nMira waits.', 'info.maxChars = 12000; AutoCards(null); text;');
  assert.match(result, /Mira owns the bridge/);
});
test('empty Inner Self thought-only output does not count as narrative', () => {
  const a = new Adventure('src', { setup: 'MainSettings.InnerSelf.IMPORTANT_SCENARIO_CHARACTERS = "Mira";' });
  a.history = [{type:'story', text:'Mira waits at the bridge.'}];
  a.turn('', '(bridge_plan = `I should inspect the bridge tomorrow.`)');
  assert.equal(a.state.SAL.turn, 0);
});

test('combined Auto-Cards planning excludes arc guidance and defers for player actions', () => {
  const a = new Adventure('src', { setup: 'MainSettings.InnerSelf.IS_AC_ENABLED_BY_DEFAULT = true;' });
  a.turn('I enter the village.');
  a.evaluate('SAL_state().arc = "1. A quiet village celebration"; SAL_saveArc(); AutoCards().API.generateCard({title:"Mira", entryLimit:200})');
  const privateTurn = a.turn('', 'Mira is a thoughtful bridge keeper. Mira cares about the village and the river.');
  assert.match(privateTurn.context.text, /informational entry for Mira/);
  assert.doesNotMatch(privateTurn.context.text, /OPTIONAL GUIDANCE/);
  assert.equal(a.state.SAL.turn, 1);
  const narrative = a.turn('I ask Mira a question.', 'Mira answers me.');
  assert.doesNotMatch(narrative.context.text, /informational entry for Mira/);
  assert.match(narrative.output.text, /Mira answers me/);
  assert.equal(a.state.SAL.turn, 2);
  assert.match(a.turn('', 'Mira keeps the bridge repaired.').context.text, /informational entry for Mira/);
});

test('malformed imported card fields do not crash synchronization', () => {
  const a = new Adventure();
  a.cards = [
    {keys:{toString:null},entry:'unrelated'},
    {keys:'SAL Settings',entry:{toString:null}},
    {keys:'Current Story Arc',entry:{toString:null}},
  ];
  a.evaluate('SAL_state()');
  assert.equal(a.state.SAL.arc, '');
  assert.equal(a.state.SAL.enabled, true);
});

test('a no-op card helper cannot falsely acknowledge a failed direct write', () => {
  const a = new Adventure();
  a.turn('/sal redo', beats);
  a.options.readonly = true;
  a.options.noopUpdate = true;
  a.turn('/sal redo', beats.replaceAll('familiar neighbor','traveling merchant'));
  a.evaluate('SAL_state()');
  assert.match(a.state.SAL.lastArcGenerationStatus, /save failed/);
  assert.match(a.state.SAL.arc, /familiar neighbor/);
});

test('Auto-Cards postponement preserves longer delays and does not force installation', () => {
  const a = new Adventure('src', {setup:'MainSettings.InnerSelf.IS_AC_ENABLED_BY_DEFAULT = true;'});
  a.turn('I enter the village.');
  const result = a.evaluate(`
    SAL_state().realPlayerInputThisTurn = true;
    state.InnerSelf.AC.forced = false;
    state.AutoCards.chronometer.postpone = 7;
    SAL_postponeAutoCardsForPlayerInput();
    ({forced:state.InnerSelf.AC.forced, delay:state.AutoCards.chronometer.postpone});
  `);
  assert.equal(result.forced, false);
  assert.equal(result.delay, 7);
});
test('explicit /ac command is not postponed as ordinary player prose', () => {
  const a = new Adventure('src', {setup:'MainSettings.InnerSelf.IS_AC_ENABLED_BY_DEFAULT = true;'});
  a.turn('I enter the village.');
  a.run('input', '/ac');
  assert.equal(a.state.SAL.autoCardsCommandThisTurn, true);
  assert.equal(a.evaluate('SAL_postponeAutoCardsForPlayerInput()'), false);
});
test('planning prompt marker alone cannot authorize capture of a clipped prompt', () => {
  const a = new Adventure('SAL-only', {info:{maxChars:500}});
  const result = a.turn('/sal redo', beats);
  assert.equal(a.state.SAL.lastPlanningPromptAttached, false);
  assert.equal(a.state.SAL.captureGeneration, false);
  assert.match(result.output.text, /could not fit/);
  assert.equal(a.state.SAL.arc, '');
});
test('stop supplied by another script does not dereference missing Inner Self state', () => {
  const a = new Adventure();
  assert.doesNotThrow(() => a.evaluate('globalThis.stop = true; SAL_protectPlayerInput("I leave.")'));
});
