import test from 'node:test';
import assert from 'node:assert/strict';
import { Adventure, beats } from './harness.mjs';

const countBeats = a => (a.state.SAL.arc.match(/^\d+\./gm) || []).length;
const saveManual = a => a.evaluate('SAL_state().arc = "1. A familiar messenger may visit tomorrow."; SAL_saveArc()');
const npc = { setup: 'MainSettings.InnerSelf.IMPORTANT_SCENARIO_CHARACTERS = "Mira";' };
const thoughtAndStory = '(bridge_plan = `I should inspect the bridge tomorrow.`) Mira answers your question.';

for (const pkg of ['SAL-only', 'src']) {
  test(`${pkg}: guidance stays before Recent Story and the latest action`, () => {
    const a = new Adventure(pkg);
    a.turn('/sal redo', beats);
    const action = 'I refuse the invitation and return home.';
    const r = a.turn(action, 'You leave.', 'World facts:\nMira lives nearby.\nRecent Story:\nAn invitation arrives.');
    assert.ok(r.context.text.indexOf('<<END STORY ARC LIGHT>>') < r.context.text.indexOf('Recent Story:'));
    assert.ok(r.context.text.indexOf('Recent Story:') < r.context.text.indexOf(action));
    assert.equal((r.context.text.match(/Recent Story:/g) || []).length, 1);
    assert.ok(r.context.text.trimEnd().endsWith(action));
  });

  test(`${pkg}: a Recent Story heading at the start is not duplicated`, () => {
    const a = new Adventure(pkg);
    saveManual(a);
    const r = a.turn('I speak now.');
    assert.equal((r.context.text.match(/Recent Story:/g) || []).length, 1);
    assert.ok(r.context.text.indexOf('<<END STORY ARC LIGHT>>') < r.context.text.indexOf('Recent Story:'));
  });

  test(`${pkg}: long context restores the heading after retained memory`, () => {
    const a = new Adventure(pkg, { info: { maxChars: 3000, memoryLength: 2000 } });
    saveManual(a);
    const action = 'I ask the merchant to leave immediately.';
    const base = 'MEMORY_START\n' + 'facts '.repeat(340) + '\nRecent Story:\n' + 'Old encounters. '.repeat(800);
    const r = a.turn(action, 'The merchant leaves.', base);
    assert.ok(r.context.text.length <= 3000);
    assert.ok(r.context.text.startsWith('MEMORY_START'));
    assert.equal((r.context.text.match(/Recent Story:/g) || []).length, 1);
    assert.ok(r.context.text.indexOf('MEMORY_START') < r.context.text.indexOf('<<STORY ARC LIGHT'));
    assert.ok(r.context.text.indexOf('<<END STORY ARC LIGHT>>') < r.context.text.indexOf('Recent Story:'));
    assert.ok(r.context.text.trimEnd().endsWith(action));
  });

  test(`${pkg}: absent headings still leave the player action after guidance`, () => {
    const a = new Adventure(pkg, { info: { maxChars: 2200, memoryLength: 1000 } });
    saveManual(a);
    const action = 'I close the door.';
    const r = a.turn(action, 'The door closes.', 'World facts. '.repeat(200) + 'Old story. '.repeat(200));
    assert.ok(r.context.text.length <= 2200);
    assert.ok(r.context.text.indexOf('<<END STORY ARC LIGHT>>') < r.context.text.indexOf(action));
    assert.ok(r.context.text.trimEnd().endsWith(action));
  });

  test(`${pkg}: overlarge guidance is omitted without damaging the manual arc`, () => {
    const a = new Adventure(pkg, { info: { maxChars: 700 } });
    a.evaluate('SAL_state().arc = "1. " + "future possibility ".repeat(500); SAL_saveArc()');
    const arc = a.state.SAL.arc;
    const r = a.turn('I refuse and leave.');
    assert.ok(r.context.text.length <= 700);
    assert.match(r.context.text, /I refuse and leave\./);
    assert.doesNotMatch(r.context.text, /OPTIONAL GUIDANCE/);
    assert.equal(a.state.SAL.lastGuidanceSkipped, true);
    assert.equal(a.state.SAL.arc, arc);
  });

  test(`${pkg}: ordinary context stays bounded across memory lengths and budgets`, () => {
    const a = new Adventure(pkg);
    saveManual(a);
    const result = a.evaluate(`
      (() => {
        const results = [];
        for (const maxChars of [100, 700, 1500, 2500, 5000]) {
          for (const memoryLength of [0, 500, 5000, 20000]) {
            info.maxChars = maxChars;
            info.memoryLength = memoryLength;
            const raw = 'facts '.repeat(900) + '\\nRecent Story:\\n' + 'history '.repeat(1400) + '\\nLATEST_ACTION';
            const text = SAL_injectArc(raw);
            results.push({maxChars, memoryLength, length:text.length, latest:text.includes('LATEST_ACTION')});
          }
        }
        return results;
      })()
    `);
    for (const r of result) {
      assert.ok(r.length <= r.maxChars, JSON.stringify(r));
      assert.equal(r.latest, true, JSON.stringify(r));
    }
  });

  test(`${pkg}: automatic pacing is measured from the saved arc`, () => {
    const a = new Adventure(pkg);
    a.evaluate('SAL_state().turn = 13');
    a.turn('/sal redo', beats);
    assert.equal(a.state.SAL.arcSavedTurn, 13);
    for (let i = 0; i < 4; i++) a.turn('I tend the garden.');
    assert.equal(countBeats(a), 8);
    a.turn('I tend the garden.');
    assert.equal(countBeats(a), 7);
    assert.equal(a.state.SAL.arcBeatsRemoved, 1);
  });

  test(`${pkg}: five-item arcs last until the normal refresh is due`, () => {
    const a = new Adventure(pkg);
    a.turn('/sal redo', beats.split('\n').slice(0, 5).join('\n'));
    for (let i = 0; i < 34; i++) a.turn('I tend the garden.');
    assert.equal(countBeats(a), 1);
    assert.equal(a.state.SAL.pendingGeneration, false);
    const due = a.turn('I tend the garden.');
    assert.match(due.output.text, /SAL ready/);
    assert.equal(a.state.SAL.pendingGeneration, true);
    const planned = a.turn('', beats);
    assert.match(planned.context.text, /PRIVATE PLANNING TASK/);
    assert.equal(countBeats(a), 8);
    assert.equal(a.state.SAL.turn, 35);
  });

  test(`${pkg}: failed removal retries without advancing its pacing metadata`, () => {
    const a = new Adventure(pkg);
    a.turn('/sal redo', beats.split('\n').slice(0, 5).join('\n'));
    const arc = a.state.SAL.arc;
    a.options.readonlyKeys = ['Current Story Arc'];
    for (let i = 0; i < 7; i++) a.turn('I walk beside the river.');
    assert.equal(a.state.SAL.arc, arc);
    assert.equal(a.state.SAL.arcBeatsRemoved, 0);
    a.options.readonlyKeys = [];
    a.turn('I walk beside the river.');
    assert.equal(countBeats(a), 4);
    assert.equal(a.state.SAL.arcBeatsRemoved, 1);
    for (let i = 0; i < 5; i++) a.turn('I walk beside the river.');
    assert.equal(countBeats(a), 4);
    a.turn('I walk beside the river.');
    assert.equal(countBeats(a), 3);
  });

  test(`${pkg}: failed regeneration preserves the saved arc pacing`, () => {
    const a = new Adventure(pkg);
    a.turn('/sal redo', beats);
    for (let i = 0; i < 6; i++) a.turn('I walk home.');
    const arc = a.state.SAL.arc;
    const metadata = [a.state.SAL.arcSavedTurn, a.state.SAL.arcStartItems, a.state.SAL.arcBeatsRemoved];
    a.options.readonly = true;
    const r = a.turn('/sal redo', beats.replaceAll('neighbor', 'merchant'));
    assert.match(r.output.text, /card could not be saved/);
    assert.equal(a.state.SAL.arc, arc);
    assert.deepEqual([a.state.SAL.arcSavedTurn, a.state.SAL.arcStartItems, a.state.SAL.arcBeatsRemoved], metadata);
  });

  test(`${pkg}: an existing v1.3.10 adventure retains its arc clock and cards`, () => {
    const a = new Adventure(pkg);
    a.state.SAL = {version:'1.3.10', turn:23, timingVersion:2, nextArcTurn:50, arcSavedTurn:15, arcStartItems:5, arcBeatsRemoved:1, arc:'1. An existing possibility'};
    a.cards = [{keys:'Current Story Arc', title:'Current Story Arc', entry:a.state.SAL.arc, type:'SAL System'}];
    a.evaluate('SAL_state()');
    assert.equal(a.state.SAL.version, '1.3.11');
    assert.equal(a.state.SAL.arcSavedTurn, 15);
    assert.equal(a.state.SAL.arcStartItems, 5);
    assert.equal(a.state.SAL.arcBeatsRemoved, 1);
    assert.equal(a.state.SAL.nextArcTurn, 50);
    assert.equal(a.state.SAL.arc, '1. An existing possibility');
  });

  test(`${pkg}: manual arc edits discard prior generated pacing`, () => {
    const a = new Adventure(pkg);
    a.turn('/sal redo', beats);
    a.cards.find(c => c.keys === 'Current Story Arc').entry = '1. A new hand-written option.';
    a.evaluate('SAL_state()');
    assert.equal(a.state.SAL.arcSavedTurn, -1);
    assert.equal(a.state.SAL.arcStartItems, 0);
    assert.equal(a.state.SAL.arcBeatsRemoved, 0);
  });

  test(`${pkg}: compact utility notices are removed from later narrative context`, () => {
    const a = new Adventure(pkg);
    const notice = a.turn('/sal redo', beats).output.text;
    const r = a.turn('I speak now.', 'A reply follows.', 'Recent Story:\n' + notice + '\nMira waits.');
    assert.doesNotMatch(r.context.text, /SAL updated/);
    assert.match(r.context.text, /Mira waits/);
    assert.ok(notice.length < 60);
  });
}

test('combined: typed actions retain NPC thoughts and SAL guidance in the same call', () => {
  const a = new Adventure('src', npc);
  a.turn('/sal redo', beats);
  a.history = [{type:'story',text:'Mira waits at the bridge.'}];
  const r = a.turn('I ask Mira about the bridge.', thoughtAndStory);
  assert.match(r.context.text, /OPERATING ENVIRONMENT/);
  assert.match(r.context.text, /OPTIONAL GUIDANCE/);
  assert.ok(r.context.text.indexOf('<<END STORY ARC LIGHT>>') < r.context.text.indexOf('I ask Mira'));
  assert.match(r.output.text, /Mira answers/);
  assert.doesNotMatch(r.output.text, /bridge_plan =/);
  assert.ok(a.state.InnerSelf.ops > 0);
  assert.equal(a.state.SAL.turn, 1);
});

test('combined: SAL planning and status commands do not update NPC memory', () => {
  const a = new Adventure('src', npc);
  a.history = [{type:'story',text:'Mira waits at the bridge.'}];
  a.turn('I ask Mira about the bridge.', thoughtAndStory);
  const operations = a.state.InnerSelf.ops;
  const brainCards = () => JSON.stringify(a.cards.filter(c => /Mira/.test(c.title)));
  const before = brainCards();
  const planning = a.turn('/sal redo', beats);
  assert.doesNotMatch(planning.context.text, /OPERATING ENVIRONMENT/);
  a.turn('/sal status');
  assert.equal(a.state.InnerSelf.ops, operations);
  assert.equal(brainCards(), before);
  assert.equal(a.state.SAL.turn, 1);
});

test('combined: SAL, Auto-Cards, and typed NPC actions keep the correct owner', () => {
  const a = new Adventure('src', {setup: npc.setup + ' MainSettings.InnerSelf.IS_AC_ENABLED_BY_DEFAULT = true;'});
  a.turn('I enter the village.');
  a.evaluate('SAL_state().arc="1. A quiet village celebration"; SAL_saveArc(); AutoCards().API.generateCard({title:"Mira",entryLimit:200}); SAL_state().nextArcTurn=SAL_state().turn; SAL_scheduleIfDue()');
  const action = a.turn('I ask Mira a question.', thoughtAndStory);
  assert.doesNotMatch(action.context.text, /PRIVATE PLANNING TASK|informational entry for Mira/);
  assert.match(action.context.text, /I ask Mira a question/);
  assert.equal(a.state.SAL.deferred, true);
  const turn = a.state.SAL.turn;
  const planning = a.turn('', beats);
  assert.match(planning.context.text, /PRIVATE PLANNING TASK/);
  assert.doesNotMatch(planning.context.text, /informational entry for Mira/);
  assert.equal(a.state.SAL.turn, turn);
  const card = a.turn('', 'Mira is a thoughtful bridge keeper. Mira cares about the village.');
  assert.match(card.context.text, /informational entry for Mira/);
  assert.doesNotMatch(card.context.text, /OPTIONAL GUIDANCE|PRIVATE PLANNING TASK/);
  assert.equal(a.state.SAL.turn, turn);
});
