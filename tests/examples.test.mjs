import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Adventure, root } from './harness.mjs';
for (const file of ['examples/advanced.md']) {
  const snippets = [...fs.readFileSync(path.join(root,file),'utf8').matchAll(/```javascript\n([\s\S]*?)```/g)];
  snippets.forEach((match,index) => test(`${file} JavaScript example ${index+1} executes`, () => {
    const a = new Adventure('src');
    a.evaluate(match[1]);
    assert.ok(a.state.SAL);
    // Re-run Library with the same add-on to check one-time guards where present.
    a.evaluate(match[1]);
    if (match[1].includes('VillageSALExample')) {
      assert.equal(a.state.SAL.turnsPerAICall, 50);
      a.settings('turnsPerAICall = 70');
      a.evaluate(match[1]);
      assert.equal(a.state.SAL.turnsPerAICall, 70);
    }
    if (match[1].includes('MySALPromptRevision1')) {
      assert.equal(a.state.SAL.prompt.match(/Favor ordinary/g).length, 1);
    }
  }));
}
test('generated output bounds also hold with repeated malformed markers', () => {
  const a = new Adventure();
  const result = a.evaluate('SAL_extractArcResult("1. ".repeat(4000))');
  assert.equal(result.numbered, '');
});
test('context helper handles zero body budget and bounded small contexts', () => {
  const a = new Adventure();
  for (const maxChars of [1,2,8,25,200,1000,5000]) {
    const result = a.evaluate(`info.maxChars=${maxChars}; info.memoryLength=2000; SAL_appendContextBlock("memory".repeat(500)+"story".repeat(500), "", false)`);
    assert.ok(result.length <= maxChars);
  }
});
