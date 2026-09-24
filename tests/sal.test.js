const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSal } = require("./helpers");

for (const packageName of ["SAL-only", "combined"]) {
  test(packageName + ": reports SAL v1.3.9", () => {
    const { api } = loadSal(packageName);
    assert.equal(api.SAL_VERSION, "1.3.9");
  });

  test(packageName + ": accepts five numbered arc possibilities", () => {
    const { api } = loadSal(packageName);
    const parsed = api.SAL_extractArcResult("1. First idea\n2. Second idea\n3. Third idea\n4. Fourth idea\n5. Fifth idea");
    assert.equal(parsed.count, 5);
    assert.match(parsed.numbered, /^1\. First idea/m);
  });

  test(packageName + ": ignores non-text JSON arc values", () => {
    const { api } = loadSal(packageName);
    const parsed = api.SAL_extractArcResult(JSON.stringify([
      "First idea", "Second idea", "Third idea", "Fourth idea", { bad: "object" }
    ]));
    assert.equal(parsed.count, 4);
    assert.equal(parsed.numbered, "");
  });

  test(packageName + ": disabling SAL cancels queued planning", () => {
    const { api, sandbox } = loadSal(packageName, {
      state: { SAL: {
        enabled: true,
        pendingGeneration: true,
        captureGeneration: true,
        deferred: true,
        generationReason: "auto",
        attempt: 2,
        pendingMessage: "queued"
      }}
    });
    api.SAL_parseSettings("enabled = false\nturnsPerAICall = 35\nturnsPerElemRemoval = 5");
    const s = sandbox.state.SAL;
    assert.equal(s.enabled, false);
    assert.equal(s.pendingGeneration, false);
    assert.equal(s.captureGeneration, false);
    assert.equal(s.deferred, false);
    assert.equal(s.generationReason, "");
    assert.equal(s.attempt, 0);
    assert.equal(s.pendingMessage, "");
  });

  test(packageName + ": queued planning does not capture output before Context attaches the prompt", () => {
    const { api, sandbox } = loadSal(packageName, {
      state: { SAL: { enabled: true, turn: 10, nextArcTurn: 10 } },
      info: { maxChars: 12000, memoryLength: 0 }
    });
    assert.equal(api.SAL_scheduleIfDue(), true);
    assert.equal(sandbox.state.SAL.pendingGeneration, true);
    assert.equal(sandbox.state.SAL.captureGeneration, false);
    const context = api.SAL_generationContext("Recent Story:\nThe player waits.");
    assert.match(context, /STORY ARC LIGHT — PRIVATE PLANNING TASK/);
    assert.equal(sandbox.state.SAL.pendingGeneration, false);
    assert.equal(sandbox.state.SAL.captureGeneration, true);
  });

  test(packageName + ": oversized guidance preserves the newest player text", () => {
    const { api } = loadSal(packageName, {
      info: { maxChars: 500, memoryLength: 0 }
    });
    const base = "Earlier context ".repeat(60) + "\nPLAYER_ACTION_SENTINEL";
    const result = api.SAL_appendContextBlock(base, "GUIDANCE ".repeat(300), false);
    assert.ok(result.length <= 500);
    assert.match(result, /PLAYER_ACTION_SENTINEL/);
  });

  test(packageName + ": successful arc generation updates state and Story Card together", () => {
    const storyCards = [{ keys: "Current Story Arc", title: "Current Story Arc", entry: "old arc", type: "SAL System" }];
    const { api, sandbox } = loadSal(packageName, {
      storyCards,
      state: { SAL: { arc: "old arc", turn: 12, turnsPerAICall: 35, captureGeneration: true } }
    });
    const message = api.SAL_processGeneratedOutput("1. One path\n2. Two paths\n3. Three paths\n4. Four paths\n5. Five paths");
    assert.match(message, /updated with 5 possibilities/);
    assert.equal(storyCards[0].entry, sandbox.state.SAL.arc);
    assert.match(sandbox.state.SAL.arc, /OPTIONAL STORY ARC LIGHT POSSIBILITIES/);
  });

  test(packageName + ": failed Story Card writes roll state back", () => {
    const frozen = Object.freeze({ keys: "Current Story Arc", title: "Current Story Arc", entry: "old arc", type: "SAL System" });
    const { api, sandbox } = loadSal(packageName, {
      storyCards: [frozen],
      state: { SAL: { arc: "old arc", turn: 12, turnsPerAICall: 35, captureGeneration: true } }
    });
    const message = api.SAL_processGeneratedOutput("1. One path\n2. Two paths\n3. Three paths\n4. Four paths\n5. Five paths");
    assert.match(message, /could not be saved/);
    assert.equal(sandbox.state.SAL.arc, "old arc");
    assert.equal(frozen.entry, "old arc");
  });

  test(packageName + ": Inner Self thought+story activity is not misclassified as private work", () => {
    const { api, sandbox } = loadSal(packageName, {
      state: { InnerSelf: { agent: "Leah", AC: { enabled: true, event: false } } }
    });
    sandbox.stop = false;
    assert.equal(api.SAL_hasInnerSelfTask(), false);
    sandbox.state.InnerSelf.AC.event = true;
    assert.equal(api.SAL_hasInnerSelfTask(), true);
    sandbox.state.InnerSelf.AC.event = false;
    sandbox.stop = true;
    assert.equal(api.SAL_hasInnerSelfTask(), true);
  });

  test(packageName + ": explicit player input can postpone enabled Auto-Cards for one turn", () => {
    let postponed = 0;
    const { api, sandbox } = loadSal(packageName, {
      state: {
        SAL: { realPlayerInputThisTurn: true },
        InnerSelf: { AC: { enabled: true, event: false }, agent: "" }
      }
    });
    sandbox.AutoCards = () => ({ API: { postponeEvents(turns) { postponed = turns; } } });
    assert.equal(api.SAL_postponeAutoCardsForPlayerInput(), true);
    assert.equal(postponed, 1);
  });

  test(packageName + ": normal story output advances the SAL turn and queues later work safely", () => {
    const { api, sandbox } = loadSal(packageName, {
      state: { SAL: { enabled: true, turn: 9, nextArcTurn: 10, turnsPerAICall: 35 } }
    });
    const out = api.SAL_onNormalOutput("Story continues.");
    assert.match(out, /Story Arc Light will update next turn/);
    assert.equal(sandbox.state.SAL.turn, 10);
    assert.equal(sandbox.state.SAL.pendingGeneration, true);
    assert.equal(sandbox.state.SAL.captureGeneration, false);
  });
}
