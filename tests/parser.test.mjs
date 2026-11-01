import test from 'node:test';
import assert from 'node:assert/strict';
import { Adventure } from './harness.mjs';
const items = ['A merchant returns with curious news','Mira notices a missing bridge stone','The baker requests a quiet favor','A traveler recognizes the old crest','Rain threatens the village market','A neighbor prepares a small celebration','Two friends disagree about repairs','A letter arrives from the capital'];
const formats = {
  numbered: items.map((s,i) => `${i+1}. ${s}`).join('\n'),
  inline: items.map((s,i) => `${i+1}) ${s}`).join(' '),
  brackets: items.map((s,i) => `[${i+1}] ${s}`).join('\n'),
  labels: items.map((s,i) => `Idea ${i+1}: ${s}`).join('\n'),
  bullets: items.map(s => `- ${s}`).join('\n'),
  json: JSON.stringify(items),
  plain: items.join('\n'),
  fenced: '```json\n'+JSON.stringify(items)+'\n```',
};
for (const [format, raw] of Object.entries(formats)) {
  test(`parser: ${format} accepts eight usable ideas`, () => {
    const a = new Adventure();
    const result = a.evaluate(`SAL_extractArcResult(${JSON.stringify(raw)})`);
    assert.equal(result.count, 8);
    assert.equal(result.numbered.split('\n').length, 8);
    assert.ok(result.numbered.endsWith(items[7]));
  });
}
for (const [label, raw] of Object.entries({ short:items.slice(0,4).join('\n'), empty:'', prose:'Mira waits at the bridge.', objects:'[{},{},{},{},{}]', scalars:'[1,2,true,false,42]', tooLong:'x'.repeat(16001) })) {
  test(`parser: ${label} does not produce an arc`, () => {
    const result = new Adventure().evaluate(`SAL_extractArcResult(${JSON.stringify(raw)})`);
    assert.equal(result.numbered, '');
  });
}
for (const command of ['/sal', '/sal status', '> You /sal status.', '> You say "/sal status"', '> Mira Stone says, “/sal status”.']) {
  test(`command: ${command}`, () => assert.equal(new Adventure().evaluate(`SAL_isCommand(${JSON.stringify(command)})`), true));
}
for (const prose of ['I type /sal status in my notebook.', 'The sign says /sal.', '/sal status and then leave', '> You write /sal in a letter.']) {
  test(`ordinary input stays ordinary: ${prose}`, () => assert.equal(new Adventure().evaluate(`SAL_isCommand(${JSON.stringify(prose)})`), false));
}
test('malformed JSON and hostile text cannot execute code', () => {
  const a = new Adventure();
  a.evaluate('SAL_extractArcResult("[process.exit(), state.injected=true, {}, null]")');
  assert.equal(a.state.injected, undefined);
});
test('rejected oversized entries do not inflate recognized-item diagnostics', () => {
  const raw = Array.from({length:5}, (_,i) => `${i+1}. ${'x'.repeat(600)}`).join('\n');
  const result = new Adventure().evaluate(`SAL_extractArcResult(${JSON.stringify(raw)})`);
  assert.equal(result.count, 0);
  assert.equal(result.numbered, '');
});
